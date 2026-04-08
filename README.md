# app-notifications

Adapter-first TypeScript library for in-app notifications.

This package is currently experimental and is being evaluated in a real project.

Repository: [github.com/amireldor/app-notifications](https://github.com/amireldor/app-notifications)

License: MIT

## What It Does

The package provides a small notifications service API and a pluggable persistence boundary:

- create notifications
- prevent duplicates with `dedupeKey`
- list notifications with cursor pagination
- get unread count
- mark one notification as read
- mark all notifications as read

The package is intentionally scoped to in-app notifications. It does not handle email, push, workflows, or archive behavior in V1.

## Install

```bash
npm install app-notifications
```

If you use the optional Supabase adapter:

```bash
npm install app-notifications @supabase/supabase-js
```

## Core Usage

Construct the service with any implementation of `NotificationsStore`:

```ts
import { createNotificationsService } from "app-notifications";
import { InMemoryNotificationsStore } from "app-notifications";

const notifications = createNotificationsService({
  store: new InMemoryNotificationsStore(),
});
```

Example:

```ts
await notifications.create({
  id: crypto.randomUUID(),
  userId: "user-123",
  type: "review_helpful",
  title: "+5 credits earned",
  body: "Your review was marked helpful.",
  dedupeKey: "review_helpful:feedback-456",
  data: {
    feedbackId: "feedback-456",
    amount: 5,
  },
  createdAt: new Date(),
});

const page = await notifications.list("user-123", { limit: 20 });
const unread = await notifications.getUnreadCount("user-123");

await notifications.markRead("user-123", page.items[0].id, {
  readAt: new Date(),
});
```

## Public Surface

Core exports include:

- `createNotificationsService`
- `InMemoryNotificationsStore`
- `NotificationsError`
- `NotificationNotFoundError`
- `InvalidCursorError`
- notification and store contract types

Important behaviors:

- `create()` returns `{ kind: "inserted" | "duplicate", notification }`
- list ordering is newest-first
- pagination uses an opaque cursor backed by `createdAt + id`
- timestamps use `Date`

## Adapters

The package is adapter-first. The core library does not require any specific database or ORM.

Current adapter entrypoints:

- `app-notifications`
  Core package and in-memory reference adapter
- `app-notifications/supabase`
  Supabase-backed `NotificationsStore` plus migration SQL export

## Supabase

For Supabase projects, use the dedicated guide:

- [supabase/README.md](/Users/amir/dev/crititune/app-notifications/supabase/README.md)

That guide covers:

- installing the Supabase adapter dependency
- copying the shipped SQL migration into `supabase/migrations`
- applying the migration with your normal Supabase workflow
- constructing `SupabaseNotificationsStore`

## Development

Build:

```bash
npm run build
```

Test:

```bash
npm test
```

## Publishing

This package is intended to be published publicly on npm.

Before publishing:

```bash
npm test
npm pack --dry-run
```

Then publish:

```bash
npm publish
```

The package is configured to:

- build on `prepack`
- publish as a public package
- include built output from `dist/`
- include the shipped SQL migration and Supabase adapter docs
