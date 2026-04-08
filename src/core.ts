import {
  NotificationNotFoundError,
  NotificationsError,
} from "./errors.js";
import type { CreateNotificationResult } from "./deduplication.js";
import {
  normalizeListNotificationsQuery,
  pageFromItems,
  type ListNotificationsOptions,
  type NotificationPage,
} from "./pagination.js";
import type {
  CreateNotificationInput,
  Notification,
  NotificationData,
  NormalizedCreateNotificationInput,
} from "./payloads.js";
import type {
  MarkAllReadResult,
  NotificationsStore,
} from "./store-contract.js";

export interface MarkReadOptions {
  readAt?: Date;
}

export interface MarkAllReadOptions {
  readAt?: Date;
}

export interface CreateNotificationsServiceOptions<
  TType extends string = string,
  TData extends NotificationData = NotificationData,
> {
  store: NotificationsStore<TType, TData>;
  now?: () => Date;
  generateId?: () => string;
}

export interface NotificationsService<
  TType extends string = string,
  TData extends NotificationData = NotificationData,
> {
  create(
    input: CreateNotificationInput<TType, TData>,
  ): Promise<CreateNotificationResult<TType, TData>>;
  list(
    userId: string,
    options?: ListNotificationsOptions,
  ): Promise<NotificationPage<TType, TData>>;
  getUnreadCount(userId: string): Promise<number>;
  markRead(
    userId: string,
    notificationId: string,
    options?: MarkReadOptions,
  ): Promise<Notification<TType, TData>>;
  markAllRead(
    userId: string,
    options?: MarkAllReadOptions,
  ): Promise<MarkAllReadResult>;
}

export function createNotificationsService<
  TType extends string = string,
  TData extends NotificationData = NotificationData,
>(
  options: CreateNotificationsServiceOptions<TType, TData>,
): NotificationsService<TType, TData> {
  return {
    async create(input) {
      return options.store.createDeduped(
        normalizeCreateInput(input, options.generateId, options.now),
      );
    },

    async list(userId, listOptions) {
      const query = normalizeListNotificationsQuery(listOptions);
      const result = await options.store.listByUser(userId, query);
      return pageFromItems(result.items, result.hasMore);
    },

    async getUnreadCount(userId) {
      return options.store.countUnread(userId);
    },

    async markRead(userId, notificationId, markReadOptions) {
      const readAt = resolveDate(
        markReadOptions?.readAt,
        options.now,
        "readAt",
      );
      const notification = await options.store.markRead(
        userId,
        notificationId,
        readAt,
      );

      if (!notification) {
        throw new NotificationNotFoundError(notificationId, userId);
      }

      return notification;
    },

    async markAllRead(userId, markAllReadOptions) {
      const readAt = resolveDate(
        markAllReadOptions?.readAt,
        options.now,
        "readAt",
      );
      return options.store.markAllRead(userId, readAt);
    },
  };
}

function normalizeCreateInput<
  TType extends string,
  TData extends NotificationData,
>(
  input: CreateNotificationInput<TType, TData>,
  generateId: (() => string) | undefined,
  now: (() => Date) | undefined,
): NormalizedCreateNotificationInput<TType, TData> {
  const id = resolveId(input.id, generateId);
  const createdAt = resolveDate(input.createdAt, now, "createdAt");

  return {
    id,
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    dedupeKey: input.dedupeKey ?? null,
    actorUserId: input.actorUserId ?? null,
    relatedEntityType: input.relatedEntityType ?? null,
    relatedEntityId: input.relatedEntityId ?? null,
    data: (input.data ?? {}) as TData,
    createdAt,
  };
}

function resolveId(
  providedId: string | undefined,
  generateId: (() => string) | undefined,
): string {
  if (providedId) {
    return providedId;
  }

  const generated = generateId?.();
  if (generated) {
    return generated;
  }

  throw new NotificationsError(
    "Notification creation requires an id when no default id generator is configured.",
    "MISSING_ID",
  );
}

function resolveDate(
  providedDate: Date | undefined,
  now: (() => Date) | undefined,
  fieldName: string,
): Date {
  const candidate = providedDate ?? now?.();

  if (!(candidate instanceof Date) || Number.isNaN(candidate.valueOf())) {
    throw new NotificationsError(
      `Notification operation requires a valid ${fieldName} when no default clock is configured.`,
      "MISSING_DATE",
    );
  }

  return new Date(candidate);
}
