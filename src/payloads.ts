export type NotificationDataPrimitive =
  | string
  | number
  | boolean
  | null
  | undefined;

export type NotificationDataValue =
  | NotificationDataPrimitive
  | NotificationDataValue[]
  | NotificationData;

export interface NotificationData {
  [key: string]: NotificationDataValue;
}

export interface Notification<
  TType extends string = string,
  TData extends NotificationData = NotificationData,
> {
  id: string;
  userId: string;
  type: TType;
  title: string;
  body: string | null;
  dedupeKey: string | null;
  actorUserId: string | null;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  data: TData;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}

export interface CreateNotificationInput<
  TType extends string = string,
  TData extends NotificationData = NotificationData,
> {
  id?: string;
  userId: string;
  type: TType;
  title: string;
  body?: string | null;
  dedupeKey?: string | null;
  actorUserId?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  data?: TData;
  createdAt?: Date;
}

export interface NormalizedCreateNotificationInput<
  TType extends string = string,
  TData extends NotificationData = NotificationData,
> {
  id: string;
  userId: string;
  type: TType;
  title: string;
  body: string | null;
  dedupeKey: string | null;
  actorUserId: string | null;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  data: TData;
  createdAt: Date;
}
