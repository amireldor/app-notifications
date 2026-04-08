import test from "node:test";
import assert from "node:assert/strict";

import {
  createNotificationsService,
  InMemoryNotificationsStore,
  InvalidCursorError,
  NotificationNotFoundError,
} from "../dist/index.js";

function buildService() {
  const store = new InMemoryNotificationsStore();
  const service = createNotificationsService({ store });
  return { service, store };
}

test("create returns duplicate result with the existing notification", async () => {
  const { service } = buildService();
  const createdAt = new Date("2026-04-08T10:00:00.000Z");

  const first = await service.create({
    id: "n-1",
    userId: "user-1",
    type: "credit_awarded",
    title: "+5 credits",
    dedupeKey: "award:1",
    data: { amount: 5 },
    createdAt,
  });

  const duplicate = await service.create({
    id: "n-2",
    userId: "user-1",
    type: "credit_awarded",
    title: "+5 credits",
    dedupeKey: "award:1",
    data: { amount: 5 },
    createdAt: new Date("2026-04-08T10:05:00.000Z"),
  });

  assert.equal(first.kind, "inserted");
  assert.equal(duplicate.kind, "duplicate");
  assert.equal(duplicate.notification.id, "n-1");
  assert.equal(await service.getUnreadCount("user-1"), 1);
});

test("list paginates newest-first with createdAt plus id cursor ordering", async () => {
  const { service } = buildService();
  const sharedTime = new Date("2026-04-08T10:00:00.000Z");

  await service.create({
    id: "n-1",
    userId: "user-1",
    type: "comment",
    title: "oldest",
    data: {},
    createdAt: new Date("2026-04-08T09:59:59.000Z"),
  });

  await service.create({
    id: "n-2",
    userId: "user-1",
    type: "comment",
    title: "middle",
    data: {},
    createdAt: sharedTime,
  });

  await service.create({
    id: "n-3",
    userId: "user-1",
    type: "comment",
    title: "newest",
    data: {},
    createdAt: sharedTime,
  });

  const firstPage = await service.list("user-1", { limit: 2 });
  assert.deepEqual(
    firstPage.items.map((notification) => notification.id),
    ["n-3", "n-2"],
  );
  assert.ok(firstPage.nextCursor);

  const secondPage = await service.list("user-1", {
    limit: 2,
    cursor: firstPage.nextCursor,
  });
  assert.deepEqual(
    secondPage.items.map((notification) => notification.id),
    ["n-1"],
  );
  assert.equal(secondPage.nextCursor, null);
});

test("invalid cursors throw InvalidCursorError", async () => {
  const { service } = buildService();

  await assert.rejects(
    service.list("user-1", { cursor: "not-a-real-cursor" }),
    InvalidCursorError,
  );
});

test("markRead throws NotificationNotFoundError when notification is missing", async () => {
  const { service } = buildService();

  await assert.rejects(
    service.markRead("user-1", "missing", {
      readAt: new Date("2026-04-08T10:00:00.000Z"),
    }),
    NotificationNotFoundError,
  );
});

test("markAllRead returns updatedCount and updates unread state", async () => {
  const { service } = buildService();

  await service.create({
    id: "n-1",
    userId: "user-1",
    type: "comment",
    title: "a",
    data: {},
    createdAt: new Date("2026-04-08T10:00:00.000Z"),
  });
  await service.create({
    id: "n-2",
    userId: "user-1",
    type: "comment",
    title: "b",
    data: {},
    createdAt: new Date("2026-04-08T11:00:00.000Z"),
  });

  const result = await service.markAllRead("user-1", {
    readAt: new Date("2026-04-08T12:00:00.000Z"),
  });

  assert.deepEqual(result, { updatedCount: 2 });
  assert.equal(await service.getUnreadCount("user-1"), 0);

  const unreadOnly = await service.list("user-1", { unreadOnly: true });
  assert.equal(unreadOnly.items.length, 0);
});
