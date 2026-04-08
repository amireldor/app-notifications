# Design: Add Supabase Adapter

## Overview

This change adds a concrete Supabase adapter that implements the existing `NotificationsStore` contract and a migration packaging story that downstream projects can adopt without reverse-engineering the table shape from the adapter code.

The adapter should stay aligned with the core library boundary:

```text
application
   │
   ▼
createNotificationsService(...)
   │
   ▼
SupabaseNotificationsStore
   │
   ▼
Supabase Postgres table + index contract
```

## Goals

- Provide a production-oriented `NotificationsStore` implementation backed by Supabase Postgres.
- Preserve the core library's semantics for deduplicated create, newest-first pagination, unread counting, and read mutations.
- Ship the required SQL schema in a way that downstream projects can use with their own migration workflow.

## Non-Goals

- Archive support
- Realtime subscriptions
- Frontend bindings
- Automatic installation of migrations into a consuming project's Supabase folder
- Separate adapters for every Postgres client

## Adapter Target

The adapter should target the plain `@supabase/supabase-js` client and assume server-side usage.

Implications:

- The adapter should work with a Supabase client configured with sufficient table access.
- The package should not depend on browser-only behavior.
- Service-role usage may be recommended in documentation, but the adapter contract should stay focused on data operations, not auth policy design.

## Data Model

The adapter should persist rows in a single `notifications` table with fields corresponding to the core notification model:

- `id`
- `user_id`
- `type`
- `title`
- `body`
- `dedupe_key`
- `actor_user_id`
- `related_entity_type`
- `related_entity_id`
- `data`
- `is_read`
- `read_at`
- `created_at`

Recommended SQL types:

- `id text primary key`
- `user_id text not null`
- `type text not null`
- `title text not null`
- `body text null`
- `dedupe_key text null`
- `actor_user_id text null`
- `related_entity_type text null`
- `related_entity_id text null`
- `data jsonb not null default '{}'::jsonb`
- `is_read boolean not null default false`
- `read_at timestamptz null`
- `created_at timestamptz not null`

Required index strategy:

- unique partial index on `(user_id, dedupe_key)` where `dedupe_key is not null`
- read/listing index on `(user_id, created_at desc, id desc)`
- unread count/read mutation index support can be satisfied by either the above index plus filtering or a dedicated `(user_id, is_read)` index

In V1, a dedicated unread-focused index is recommended but not required.

## Row Mapping

The adapter should map database rows to core notifications with these rules:

- `created_at` maps to `createdAt: Date`
- `read_at` maps to `readAt: Date | null`
- nullable text columns map to `string | null`
- `data` maps to the library payload object, preserving JSON-compatible structure

The adapter should treat `undefined` values as persistence-unsafe and normalize them out before writing to `jsonb`.

## Store Method Design

### `createDeduped`

Preferred behavior:

1. Attempt insert.
2. If the unique dedupe constraint is not violated, return `kind: "inserted"`.
3. If the unique dedupe constraint is violated, fetch the existing row for `(user_id, dedupe_key)` and return `kind: "duplicate"` with that notification.

This keeps dedupe as an adapter-owned behavior and uses the database uniqueness guarantee for correctness under concurrency.

### `listByUser`

The adapter should:

- sort by `created_at desc, id desc`
- decode the library cursor into `createdAt + id`
- apply cursor filtering in SQL
- fetch `limit + 1` rows to detect `hasMore`
- support `unreadOnly`

Cursor semantics should remain library-owned, not adapter-owned. The adapter consumes the normalized cursor from the core package rather than inventing its own cursor format.

### `countUnread`

Count rows by `user_id` with `is_read = false`.

### `markRead`

Update the row only when it belongs to the provided user. Return the updated row or `null` if no row matched.

### `markAllRead`

Update all unread rows for the user and return `{ updatedCount }`.

## Migration Packaging Strategy

The package should ship the required schema in two forms:

1. Raw SQL files in a package-visible directory such as `sql/`
2. A TypeScript export that exposes the same SQL as a string constant for custom tooling

Rationale:

- raw SQL is the most universal artifact for Supabase migrations
- a string export makes it easier for projects with custom migration runners or setup scripts
- the package should not attempt to mutate a consumer's `supabase/migrations` folder automatically
- V1 should ship a single SQL migration file that contains the base table and required indexes.

## Expected Consumer Workflow

The package should document a workflow like:

1. Install the package and Supabase client dependency
2. Copy or reference the shipped SQL migration into the consuming project's migration system
3. Apply the migration to the target Supabase project
4. Create a Supabase client with sufficient access
5. Construct `new SupabaseNotificationsStore({ supabase, tableName? })`
6. Pass the store into `createNotificationsService`

In V1, `tableName` should be optional and default to `"notifications"`.

## Package Surface

The implementation should likely add:

- `SupabaseNotificationsStore`
- supporting adapter option types
- migration SQL export(s)
- documentation for migration usage

The adapter should remain optional. Consumers who do not use Supabase should not need to install Supabase-specific runtime dependencies unless they import the adapter entrypoint.

## Entry Point Strategy

To avoid forcing Supabase dependencies on all consumers, prefer a subpath export such as:

- `app-notifications/supabase`

That entrypoint can export:

- `SupabaseNotificationsStore`
- `supabaseNotificationsSchemaSql`
- any adapter-specific types

## Testing Strategy

Implementation should include:

- unit tests for row-to-notification mapping
- tests for deduplicated create result semantics
- tests for newest-first pagination with cursor filtering
- tests for `markRead` and `markAllRead`
- tests that the exported migration SQL contains the required table and indexes

## Open Questions

None.
