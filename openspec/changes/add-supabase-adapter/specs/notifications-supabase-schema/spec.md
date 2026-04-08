# Spec: notifications-supabase-schema

## Purpose

Define the Postgres table and index requirements required by the Supabase adapter.

## Requirements

### Requirement: Notifications Table Shape

The Supabase adapter SHALL depend on a `notifications` table that stores the fields required by the core notification model.

#### Notes

- Required columns should include IDs, dedupe metadata, payload data, read state, and creation time.
- `data` should be stored as `jsonb`.
- `created_at` and `read_at` should use timestamp types compatible with conversion to JavaScript `Date`.

### Requirement: Dedupe Constraint

The schema SHALL include a unique partial index on `(user_id, dedupe_key)` where `dedupe_key is not null`.

#### Notes

- This index is required for reliable duplicate detection under concurrent writes.

### Requirement: Listing Support

The schema SHALL include indexing support for newest-first listing by user and stable tie-breaking by ID.

#### Notes

- The baseline listing index should support `(user_id, created_at desc, id desc)`.

### Requirement: Read-State Support

The schema SHALL support unread counting and read mutations efficiently enough for normal application usage.

#### Notes

- A dedicated unread-focused index is recommended in V1 but is not mandatory.

## Open Questions

None.
