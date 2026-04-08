import type { SupabaseClient } from "@supabase/supabase-js";

import type { CreateNotificationResult } from "./deduplication.js";
import { NotificationsError } from "./errors.js";
import type {
  Notification,
  NotificationData,
  NotificationDataValue,
  NormalizedCreateNotificationInput,
} from "./payloads.js";
import type { NormalizedListNotificationsQuery } from "./pagination.js";
import type {
  ListNotificationsStoreResult,
  MarkAllReadResult,
  NotificationsStore,
} from "./store-contract.js";
import { supabaseNotificationsSchemaSql } from "./supabase-schema.js";

export interface SupabaseNotificationsStoreOptions {
  supabase: SupabaseClientLike;
  tableName?: string;
}

export interface SupabaseNotificationRow<
  TType extends string = string,
  TData extends NotificationData = NotificationData,
> {
  id: string;
  user_id: string;
  type: TType;
  title: string;
  body: string | null;
  dedupe_key: string | null;
  actor_user_id: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  data: TData;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export type SupabaseClientLike = Pick<SupabaseClient<any, any, any>, "from">;

type SupabaseErrorLike = {
  code?: string;
  details?: string;
  hint?: string;
  message: string;
};

type SupabaseQueryResponse<T> = {
  data: T | null;
  error: SupabaseErrorLike | null;
  count?: number | null;
};

type QueryBuilder<T> = PromiseLike<SupabaseQueryResponse<T[]>> & {
  select(columns?: string, options?: { count?: "exact"; head?: boolean }): QueryBuilder<T>;
  insert(values: object | object[]): QueryBuilder<T>;
  update(values: object): QueryBuilder<T>;
  eq(column: string, value: unknown): QueryBuilder<T>;
  or(filters: string): QueryBuilder<T>;
  order(column: string, options?: { ascending?: boolean }): QueryBuilder<T>;
  limit(count: number): QueryBuilder<T>;
  single(): Promise<SupabaseQueryResponse<T>>;
  maybeSingle(): Promise<SupabaseQueryResponse<T>>;
};

const DUPLICATE_VIOLATION_CODE = "23505";

export class SupabaseNotificationsStore<
  TType extends string = string,
  TData extends NotificationData = NotificationData,
> implements NotificationsStore<TType, TData>
{
  readonly #supabase: SupabaseClientLike;
  readonly #tableName: string;

  constructor(options: SupabaseNotificationsStoreOptions) {
    this.#supabase = options.supabase;
    this.#tableName = options.tableName ?? "notifications";
  }

  async createDeduped(
    input: NormalizedCreateNotificationInput<TType, TData>,
  ): Promise<CreateNotificationResult<TType, TData>> {
    const inserted = await this.#table()
      .insert(toInsertRow(input))
      .select("*")
      .single();

    if (!inserted.error && inserted.data) {
      return {
        kind: "inserted",
        notification: fromRow(inserted.data),
      };
    }

    if (
      inserted.error?.code === DUPLICATE_VIOLATION_CODE &&
      input.dedupeKey !== null
    ) {
      const existing = await this.#table()
        .select("*")
        .eq("user_id", input.userId)
        .eq("dedupe_key", input.dedupeKey)
        .maybeSingle();

      const existingRow = unwrapSingle(
        existing,
        "Supabase duplicate lookup failed.",
      );

      if (!existingRow) {
        throw new NotificationsError(
          "Supabase reported a duplicate notification, but the existing row could not be loaded.",
          "SUPABASE_DUPLICATE_LOOKUP_FAILED",
        );
      }

      return {
        kind: "duplicate",
        notification: fromRow(existingRow),
      };
    }

    throw toNotificationsError("Supabase insert failed.", inserted.error);
  }

  async listByUser(
    userId: string,
    query: NormalizedListNotificationsQuery,
  ): Promise<ListNotificationsStoreResult<TType, TData>> {
    let builder = this.#table()
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });

    if (query.unreadOnly) {
      builder = builder.eq("is_read", false);
    }

    if (query.cursor) {
      const cursorCreatedAt = query.cursor.createdAt.toISOString();
      builder = builder.or(
        `created_at.lt.${cursorCreatedAt},and(created_at.eq.${cursorCreatedAt},id.lt.${escapeFilterValue(
          query.cursor.id,
        )})`,
      );
    }

    const response = await builder.limit(query.limit + 1);
    const rows = unwrapList(response, "Supabase list query failed.");

    return {
      items: rows.slice(0, query.limit).map(fromRow),
      hasMore: rows.length > query.limit,
    };
  }

  async countUnread(userId: string): Promise<number> {
    const response = await this.#table()
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (response.error) {
      throw toNotificationsError(
        "Supabase unread count query failed.",
        response.error,
      );
    }

    return response.count ?? 0;
  }

  async markRead(
    userId: string,
    notificationId: string,
    readAt: Date,
  ): Promise<Notification<TType, TData> | null> {
    const response = await this.#table()
      .update({
        is_read: true,
        read_at: readAt.toISOString(),
      })
      .eq("user_id", userId)
      .eq("id", notificationId)
      .select("*")
      .maybeSingle();

    const row = unwrapSingle(response, "Supabase markRead query failed.");
    return row ? fromRow(row) : null;
  }

  async markAllRead(userId: string, readAt: Date): Promise<MarkAllReadResult> {
    const response = await this.#table()
      .update({
        is_read: true,
        read_at: readAt.toISOString(),
      })
      .eq("user_id", userId)
      .eq("is_read", false)
      .select("id");

    const rows = unwrapList<{ id: string }>(
      response,
      "Supabase markAllRead query failed.",
    );

    return {
      updatedCount: rows.length,
    };
  }

  #table<T = SupabaseNotificationRow<TType, TData>>(): QueryBuilder<T> {
    return this.#supabase.from(this.#tableName) as unknown as QueryBuilder<T>;
  }
}

function toInsertRow<TType extends string, TData extends NotificationData>(
  input: NormalizedCreateNotificationInput<TType, TData>,
): SupabaseNotificationRow<TType, TData> {
  return {
    id: input.id,
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    dedupe_key: input.dedupeKey,
    actor_user_id: input.actorUserId,
    related_entity_type: input.relatedEntityType,
    related_entity_id: input.relatedEntityId,
    data: sanitizePayload(input.data),
    is_read: false,
    read_at: null,
    created_at: input.createdAt.toISOString(),
  };
}

function fromRow<TType extends string, TData extends NotificationData>(
  row: SupabaseNotificationRow<TType, TData>,
): Notification<TType, TData> {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body,
    dedupeKey: row.dedupe_key,
    actorUserId: row.actor_user_id,
    relatedEntityType: row.related_entity_type,
    relatedEntityId: row.related_entity_id,
    data: sanitizePayload(row.data),
    isRead: row.is_read,
    readAt: row.read_at ? new Date(row.read_at) : null,
    createdAt: new Date(row.created_at),
  };
}

function sanitizePayload<TData extends NotificationData>(payload: TData): TData {
  return stripUndefined(payload) as TData;
}

function stripUndefined(value: NotificationDataValue): NotificationDataValue {
  if (Array.isArray(value)) {
    return value
      .filter((entry) => entry !== undefined)
      .map(stripUndefined);
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .map(([key, entry]) => [
        key,
        stripUndefined(entry as NotificationDataValue),
      ]);

    return Object.fromEntries(entries);
  }

  return value;
}

function unwrapSingle<T>(
  response: SupabaseQueryResponse<T>,
  message: string,
): T | null {
  if (response.error) {
    throw toNotificationsError(message, response.error);
  }

  return response.data ?? null;
}

function unwrapList<T>(
  response: SupabaseQueryResponse<T[]>,
  message: string,
): T[] {
  if (response.error) {
    throw toNotificationsError(message, response.error);
  }

  return response.data ?? [];
}

function toNotificationsError(
  prefix: string,
  error: SupabaseErrorLike | null,
): NotificationsError {
  if (!error) {
    return new NotificationsError(prefix, "SUPABASE_ERROR");
  }

  return new NotificationsError(
    `${prefix} ${error.message}`,
    error.code ? `SUPABASE_${error.code}` : "SUPABASE_ERROR",
  );
}

function escapeFilterValue(value: string): string {
  return `"${value.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"")}"`;
}

export { supabaseNotificationsSchemaSql };
