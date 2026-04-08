# Spec: notifications-supabase-adapter

## Purpose

Define the Supabase-backed implementation of the `NotificationsStore` contract.

## Requirements

### Requirement: Supabase Store Implementation

The package SHALL provide a `SupabaseNotificationsStore` that implements the `NotificationsStore` contract using `@supabase/supabase-js`.

#### Notes

- The adapter should target server-side usage with a configured Supabase client.
- The adapter should remain aligned with the existing core store semantics.

### Requirement: Deduplicated Create Semantics

The Supabase adapter SHALL implement `createDeduped` using the database schema and SHALL return explicit `inserted` and `duplicate` outcomes consistent with the core library.

#### Notes

- Duplicate outcomes SHALL return the existing notification.
- The adapter should rely on the unique database constraint for dedupe correctness where possible.

### Requirement: Stable Listing Semantics

The Supabase adapter SHALL implement newest-first listing using `created_at desc, id desc` and SHALL honor the normalized cursor semantics provided by the core library.

#### Notes

- The adapter should fetch `limit + 1` rows to detect whether more items exist.
- Unread-only filtering must preserve the same ordering and cursor contract.

### Requirement: Read Mutation Semantics

The Supabase adapter SHALL support unread counting, single-item read mutation, and bulk mark-all-read behavior consistent with the core library.

#### Notes

- `markRead` should return `null` when no row matched the given `userId` and `notificationId`.
- `markAllRead` should return `{ updatedCount }`.

## Open Questions

None.

## Decisions

- The adapter MAY accept `tableName`, but it SHALL default to `"notifications"` in V1.
