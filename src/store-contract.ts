import type { CreateNotificationResult } from "./deduplication.js";
import type {
  Notification,
  NotificationData,
  NormalizedCreateNotificationInput,
} from "./payloads.js";
import type { NormalizedListNotificationsQuery } from "./pagination.js";

export interface MarkAllReadResult {
  updatedCount: number;
}

export interface ListNotificationsStoreResult<
  TType extends string = string,
  TData extends NotificationData = NotificationData,
> {
  items: Notification<TType, TData>[];
  hasMore: boolean;
}

export interface NotificationsStore<
  TType extends string = string,
  TData extends NotificationData = NotificationData,
> {
  createDeduped(
    input: NormalizedCreateNotificationInput<TType, TData>,
  ): Promise<CreateNotificationResult<TType, TData>>;
  listByUser(
    userId: string,
    query: NormalizedListNotificationsQuery,
  ): Promise<ListNotificationsStoreResult<TType, TData>>;
  countUnread(userId: string): Promise<number>;
  markRead(
    userId: string,
    notificationId: string,
    readAt: Date,
  ): Promise<Notification<TType, TData> | null>;
  markAllRead(userId: string, readAt: Date): Promise<MarkAllReadResult>;
}
