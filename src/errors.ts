export class NotificationsError extends Error {
  readonly code: string;

  constructor(message: string, code = "NOTIFICATIONS_ERROR") {
    super(message);
    this.name = "NotificationsError";
    this.code = code;
  }
}

export class NotificationNotFoundError extends NotificationsError {
  constructor(notificationId: string, userId: string) {
    super(
      `Notification "${notificationId}" was not found for user "${userId}".`,
      "NOTIFICATION_NOT_FOUND",
    );
    this.name = "NotificationNotFoundError";
  }
}

export class InvalidCursorError extends NotificationsError {
  constructor(cursor: string) {
    super(`Invalid notification cursor: "${cursor}".`, "INVALID_CURSOR");
    this.name = "InvalidCursorError";
  }
}
