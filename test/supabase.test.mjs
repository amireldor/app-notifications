import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { NotificationsError } from "../dist/index.js";
import {
  SupabaseNotificationsStore,
  supabaseNotificationsSchemaSql,
} from "../dist/supabase.js";

test("createDeduped returns duplicate with the existing notification on unique conflict", async () => {
  const existingRow = makeRow({
    id: "n-1",
    dedupe_key: "award:1",
  });
  const client = new FakeSupabaseClient({
    onInsert() {
      return {
        data: null,
        error: {
          code: "23505",
          message: "duplicate key value violates unique constraint",
        },
      };
    },
    onSelect(state) {
      if (
        state.filters.some(
          (filter) =>
            filter.column === "dedupe_key" && filter.value === "award:1",
        )
      ) {
        return { data: existingRow, error: null };
      }
      return { data: null, error: null };
    },
  });

  const store = new SupabaseNotificationsStore({ supabase: client });
  const result = await store.createDeduped(makeInput({ dedupeKey: "award:1" }));

  assert.equal(result.kind, "duplicate");
  assert.equal(result.notification.id, "n-1");
});

test("listByUser preserves newest-first ordering and cursor filtering", async () => {
  const rows = [
    makeRow({ id: "n-3", created_at: "2026-04-09T10:00:00.000Z" }),
    makeRow({ id: "n-2", created_at: "2026-04-09T10:00:00.000Z" }),
    makeRow({ id: "n-1", created_at: "2026-04-09T09:00:00.000Z" }),
  ];
  const client = new FakeSupabaseClient({
    onSelect(state) {
      return {
        data: applyQueryState(rows, state),
        error: null,
      };
    },
  });

  const store = new SupabaseNotificationsStore({ supabase: client });
  const firstPage = await store.listByUser("user-1", {
    limit: 2,
    unreadOnly: false,
    cursor: null,
  });

  assert.deepEqual(
    firstPage.items.map((notification) => notification.id),
    ["n-3", "n-2"],
  );
  assert.equal(firstPage.hasMore, true);

  const secondPage = await store.listByUser("user-1", {
    limit: 2,
    unreadOnly: false,
    cursor: {
      createdAt: new Date("2026-04-09T10:00:00.000Z"),
      id: "n-2",
    },
  });

  assert.deepEqual(
    secondPage.items.map((notification) => notification.id),
    ["n-1"],
  );
  assert.equal(secondPage.hasMore, false);
});

test("markRead returns null when no notification matches the user and id", async () => {
  const client = new FakeSupabaseClient({
    onUpdate() {
      return { data: null, error: null };
    },
  });
  const store = new SupabaseNotificationsStore({ supabase: client });

  const result = await store.markRead(
    "user-1",
    "missing",
    new Date("2026-04-09T10:00:00.000Z"),
  );
  assert.equal(result, null);
});

test("markAllRead returns updatedCount", async () => {
  const client = new FakeSupabaseClient({
    onUpdate() {
      return {
        data: [{ id: "n-1" }, { id: "n-2" }],
        error: null,
      };
    },
  });
  const store = new SupabaseNotificationsStore({ supabase: client });

  const result = await store.markAllRead(
    "user-1",
    new Date("2026-04-09T10:00:00.000Z"),
  );
  assert.deepEqual(result, { updatedCount: 2 });
});

test("countUnread uses exact count from Supabase", async () => {
  const client = new FakeSupabaseClient({
    onSelect() {
      return {
        data: null,
        error: null,
        count: 4,
      };
    },
  });
  const store = new SupabaseNotificationsStore({ supabase: client });

  const count = await store.countUnread("user-1");
  assert.equal(count, 4);
});

test("adapter wraps Supabase failures in NotificationsError", async () => {
  const client = new FakeSupabaseClient({
    onSelect() {
      return {
        data: null,
        error: { code: "PGRST116", message: "query failed" },
      };
    },
  });
  const store = new SupabaseNotificationsStore({ supabase: client });

  await assert.rejects(
    store.listByUser("user-1", {
      limit: 10,
      unreadOnly: false,
      cursor: null,
    }),
    NotificationsError,
  );
});

test("exported migration SQL matches the shipped SQL file", async () => {
  const sqlFile = await readFile(
    new URL("../sql/supabase-notifications.sql", import.meta.url),
    "utf8",
  );

  assert.equal(supabaseNotificationsSchemaSql.trim(), sqlFile.trim());
  assert.match(sqlFile, /create table if not exists notifications/i);
  assert.match(
    sqlFile,
    /create unique index if not exists notifications_user_dedupe_key_idx/i,
  );
  assert.match(
    sqlFile,
    /create index if not exists notifications_user_created_at_id_idx/i,
  );
});

function makeInput(overrides = {}) {
  return {
    id: "n-1",
    userId: "user-1",
    type: "comment",
    title: "Hello",
    body: null,
    dedupeKey: null,
    actorUserId: null,
    relatedEntityType: null,
    relatedEntityId: null,
    data: { nested: { keep: true, drop: undefined } },
    createdAt: new Date("2026-04-09T10:00:00.000Z"),
    ...overrides,
  };
}

function makeRow(overrides = {}) {
  return {
    id: "n-default",
    user_id: "user-1",
    type: "comment",
    title: "Hello",
    body: null,
    dedupe_key: null,
    actor_user_id: null,
    related_entity_type: null,
    related_entity_id: null,
    data: { nested: { keep: true } },
    is_read: false,
    read_at: null,
    created_at: "2026-04-09T10:00:00.000Z",
    ...overrides,
  };
}

class FakeSupabaseClient {
  #handlers;

  constructor(handlers) {
    this.#handlers = handlers;
  }

  from(tableName) {
    return new FakeQueryBuilder(tableName, this.#handlers);
  }
}

class FakeQueryBuilder {
  #tableName;
  #handlers;
  #mode = "select";
  #insertValues = null;
  #updateValues = null;
  #singleMode = "many";
  #state = {
    filters: [],
    orders: [],
    limit: null,
    select: "*",
    selectOptions: undefined,
    or: null,
  };

  constructor(tableName, handlers) {
    this.#tableName = tableName;
    this.#handlers = handlers;
  }

  insert(values) {
    this.#mode = "insert";
    this.#insertValues = values;
    return this;
  }

  update(values) {
    this.#mode = "update";
    this.#updateValues = values;
    return this;
  }

  select(columns = "*", options) {
    this.#state.select = columns;
    this.#state.selectOptions = options;
    return this;
  }

  eq(column, value) {
    this.#state.filters.push({ type: "eq", column, value });
    return this;
  }

  or(filters) {
    this.#state.or = filters;
    return this;
  }

  order(column, options = {}) {
    this.#state.orders.push({ column, ascending: options.ascending ?? true });
    return this;
  }

  limit(count) {
    this.#state.limit = count;
    return this;
  }

  single() {
    this.#singleMode = "single";
    return Promise.resolve(this.#resolve());
  }

  maybeSingle() {
    this.#singleMode = "maybeSingle";
    return Promise.resolve(this.#resolve());
  }

  then(resolve, reject) {
    return Promise.resolve(this.#resolve()).then(resolve, reject);
  }

  #resolve() {
    const payload = {
      tableName: this.#tableName,
      filters: this.#state.filters,
      orders: this.#state.orders,
      limit: this.#state.limit,
      or: this.#state.or,
      select: this.#state.select,
      selectOptions: this.#state.selectOptions,
      values: this.#mode === "insert" ? this.#insertValues : this.#updateValues,
      singleMode: this.#singleMode,
    };

    if (this.#mode === "insert" && this.#handlers.onInsert) {
      return this.#handlers.onInsert(payload);
    }

    if (this.#mode === "update" && this.#handlers.onUpdate) {
      return this.#handlers.onUpdate(payload);
    }

    if (this.#handlers.onSelect) {
      return this.#handlers.onSelect(payload);
    }

    return { data: null, error: null };
  }
}

function applyQueryState(rows, state) {
  let filtered = rows.slice();

  for (const filter of state.filters) {
    if (filter.type === "eq") {
      filtered = filtered.filter((row) => row[filter.column] === filter.value);
    }
  }

  if (state.or) {
    const match = state.or.match(
      /^created_at\.lt\.(.+),and\(created_at\.eq\.\1,id\.lt\."(.+)"\)$/,
    );

    if (match) {
      const createdAt = match[1];
      const id = match[2].replaceAll('\\"', '"').replaceAll("\\\\", "\\");

      filtered = filtered.filter(
        (row) =>
          row.created_at < createdAt ||
          (row.created_at === createdAt && row.id < id),
      );
    }
  }

  filtered.sort((left, right) => {
    if (left.created_at !== right.created_at) {
      return right.created_at.localeCompare(left.created_at);
    }

    return right.id.localeCompare(left.id);
  });

  if (state.limit !== null) {
    filtered = filtered.slice(0, state.limit);
  }

  return filtered;
}
