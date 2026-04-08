import { InvalidCursorError, NotificationsError } from "./errors.js";
import type { Notification, NotificationData } from "./payloads.js";

const CURSOR_VERSION = 1;
const DEFAULT_LIMIT = 50;

export interface PaginationCursor {
  createdAt: Date;
  id: string;
}

export interface ListNotificationsOptions {
  limit?: number;
  cursor?: string | null;
  unreadOnly?: boolean;
}

export interface NormalizedListNotificationsQuery {
  limit: number;
  cursor: PaginationCursor | null;
  unreadOnly: boolean;
}

export interface NotificationPage<
  TType extends string = string,
  TData extends NotificationData = NotificationData,
> {
  items: Notification<TType, TData>[];
  nextCursor: string | null;
}

export function encodeCursor(cursor: PaginationCursor): string {
  const payload = JSON.stringify({
    v: CURSOR_VERSION,
    createdAt: cursor.createdAt.toISOString(),
    id: cursor.id,
  });

  return Buffer.from(payload, "utf8").toString("base64url");
}

export function decodeCursor(cursor: string): PaginationCursor {
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded) as {
      createdAt?: unknown;
      id?: unknown;
      v?: unknown;
    };

    if (parsed.v !== CURSOR_VERSION) {
      throw new InvalidCursorError(cursor);
    }

    if (typeof parsed.id !== "string" || typeof parsed.createdAt !== "string") {
      throw new InvalidCursorError(cursor);
    }

    const createdAt = new Date(parsed.createdAt);
    if (Number.isNaN(createdAt.valueOf())) {
      throw new InvalidCursorError(cursor);
    }

    return {
      createdAt,
      id: parsed.id,
    };
  } catch (error) {
    if (error instanceof InvalidCursorError) {
      throw error;
    }
    throw new InvalidCursorError(cursor);
  }
}

export function normalizeListNotificationsQuery(
  options: ListNotificationsOptions | undefined,
): NormalizedListNotificationsQuery {
  const limit = options?.limit ?? DEFAULT_LIMIT;

  if (!Number.isInteger(limit) || limit <= 0) {
    throw new NotificationsError(
      `Notification list limit must be a positive integer. Received: ${String(limit)}.`,
      "INVALID_LIMIT",
    );
  }

  return {
    limit,
    cursor: options?.cursor ? decodeCursor(options.cursor) : null,
    unreadOnly: options?.unreadOnly ?? false,
  };
}

export function compareNotificationOrder(
  a: Pick<Notification, "createdAt" | "id">,
  b: Pick<Notification, "createdAt" | "id">,
): number {
  const createdAtDifference = b.createdAt.getTime() - a.createdAt.getTime();
  if (createdAtDifference !== 0) {
    return createdAtDifference;
  }

  if (a.id === b.id) {
    return 0;
  }

  return a.id > b.id ? -1 : 1;
}

export function isAfterCursor(
  notification: Pick<Notification, "createdAt" | "id">,
  cursor: PaginationCursor,
): boolean {
  return compareNotificationOrder(notification, cursor) > 0;
}

export function pageFromItems<
  TType extends string,
  TData extends NotificationData,
>(
  items: Notification<TType, TData>[],
  hasMore: boolean,
): NotificationPage<TType, TData> {
  if (!hasMore || items.length === 0) {
    return {
      items,
      nextCursor: null,
    };
  }

  const tail = items.at(-1);
  if (!tail) {
    return {
      items,
      nextCursor: null,
    };
  }

  return {
    items,
    nextCursor: encodeCursor({
      createdAt: tail.createdAt,
      id: tail.id,
    }),
  };
}
