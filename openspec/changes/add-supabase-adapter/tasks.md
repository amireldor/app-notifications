# Tasks: Add Supabase Adapter

## Artifact Tasks

- [x] Draft proposal
- [x] Draft design
- [x] Define tasks

## Specs

- [x] Define `notifications-supabase-adapter`
- [x] Define `notifications-supabase-schema`
- [x] Define `notifications-supabase-packaging`

## Implementation Tasks

### Recommended Order

1. [x] Add a Supabase adapter entrypoint and package export strategy
2. [x] Add adapter option types and row-shape types
3. [x] Implement row normalization helpers for `Date`, nullable fields, and JSON payloads
4. [x] Implement `SupabaseNotificationsStore.createDeduped`
5. [x] Implement `SupabaseNotificationsStore.listByUser`
6. [x] Implement `SupabaseNotificationsStore.countUnread`
7. [x] Implement `SupabaseNotificationsStore.markRead`
8. [x] Implement `SupabaseNotificationsStore.markAllRead`
9. [x] Add shipped SQL migration file(s) for the notifications table and indexes
10. [x] Export migration SQL for programmatic consumption
11. [x] Add tests for deduplicated create behavior
12. [x] Add tests for pagination and cursor filtering behavior
13. [x] Add tests for read mutation behavior
14. [x] Add tests or assertions for shipped migration contents
15. [x] Document how consuming projects apply the migration and construct the adapter

### Notes

- Keep the Supabase dependency isolated to a subpath export if possible.
- Use database uniqueness for dedupe correctness, then fetch the existing row on conflict.
- Do not invent Supabase-specific cursor semantics; consume the core library cursor model.
