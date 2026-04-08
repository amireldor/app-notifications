import type { Notification, NotificationData } from "./payloads.js";

export interface InsertedNotificationResult<
  TType extends string = string,
  TData extends NotificationData = NotificationData,
> {
  kind: "inserted";
  notification: Notification<TType, TData>;
}

export interface DuplicateNotificationResult<
  TType extends string = string,
  TData extends NotificationData = NotificationData,
> {
  kind: "duplicate";
  notification: Notification<TType, TData>;
}

export type CreateNotificationResult<
  TType extends string = string,
  TData extends NotificationData = NotificationData,
> =
  | InsertedNotificationResult<TType, TData>
  | DuplicateNotificationResult<TType, TData>;
