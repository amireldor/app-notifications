import type { CreateNotificationResult } from "./deduplication.js";
import type {
  Notification,
  NotificationData,
  NormalizedCreateNotificationInput,
} from "./payloads.js";
import {
  compareNotificationOrder,
  isAfterCursor,
  type NormalizedListNotificationsQuery,
} from "./pagination.js";
import type {
  ListNotificationsStoreResult,
  MarkAllReadResult,
  NotificationsStore,
} from "./store-contract.js";

export class InMemoryNotificationsStore<
  TType extends string = string,
  TData extends NotificationData = NotificationData,
> implements NotificationsStore<TType, TData>
{
  readonly #notifications: Notification<TType, TData>[];

  constructor(seed: Notification<TType, TData>[] = []) {
    this.#notifications = seed.map(cloneNotification);
  }

  async createDeduped(
    input: NormalizedCreateNotificationInput<TType, TData>,
  ): Promise<CreateNotificationResult<TType, TData>> {
    const existing =
      input.dedupeKey === null
        ? undefined
        : this.#notifications.find(
            (notification) =>
              notification.userId === input.userId &&
              notification.dedupeKey === input.dedupeKey,
          );

    if (existing) {
      return {
        kind: "duplicate",
        notification: cloneNotification(existing),
      };
    }

    const notification: Notification<TType, TData> = {
      ...input,
      isRead: false,
      readAt: null,
    };

    this.#notifications.push(cloneNotification(notification));

    return {
      kind: "inserted",
      notification: cloneNotification(notification),
    };
  }

  async listByUser(
    userId: string,
    query: NormalizedListNotificationsQuery,
  ): Promise<ListNotificationsStoreResult<TType, TData>> {
    const filtered = this.#notifications
      .filter((notification) => notification.userId === userId)
      .filter((notification) => !query.unreadOnly || !notification.isRead)
      .sort(compareNotificationOrder)
      .filter(
        (notification) =>
          query.cursor === null || isAfterCursor(notification, query.cursor),
      );

    const page = filtered
      .slice(0, query.limit + 1)
      .map((notification) => cloneNotification(notification));

    return {
      items: page.slice(0, query.limit),
      hasMore: page.length > query.limit,
    };
  }

  async countUnread(userId: string): Promise<number> {
    return this.#notifications.filter(
      (notification) => notification.userId === userId && !notification.isRead,
    ).length;
  }

  async markRead(
    userId: string,
    notificationId: string,
    readAt: Date,
  ): Promise<Notification<TType, TData> | null> {
    const notification = this.#notifications.find(
      (entry) => entry.userId === userId && entry.id === notificationId,
    );

    if (!notification) {
      return null;
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date(readAt);
    }

    return cloneNotification(notification);
  }

  async markAllRead(userId: string, readAt: Date): Promise<MarkAllReadResult> {
    let updatedCount = 0;

    for (const notification of this.#notifications) {
      if (notification.userId !== userId || notification.isRead) {
        continue;
      }

      notification.isRead = true;
      notification.readAt = new Date(readAt);
      updatedCount += 1;
    }

    return {
      updatedCount,
    };
  }
}

function cloneNotification<TType extends string, TData extends NotificationData>(
  notification: Notification<TType, TData>,
): Notification<TType, TData> {
  return structuredClone(notification);
}
