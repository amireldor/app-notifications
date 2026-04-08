# Spec: notifications-supabase-packaging

## Purpose

Define how the Supabase adapter and its migration artifacts are distributed to downstream projects.

## Requirements

### Requirement: Adapter-Specific Entry Point

The package SHALL expose the Supabase adapter through an adapter-specific entrypoint that does not force Supabase runtime dependencies on consumers who only use the core library.

#### Notes

- A subpath export such as `app-notifications/supabase` is preferred.

### Requirement: Shipped Migration SQL

The package SHALL ship the required notifications table SQL in a package-visible location.

#### Notes

- Raw SQL should be consumable by projects using Supabase migrations or custom migration tooling.
- V1 SHALL ship a single SQL migration file containing the base table and required indexes.

### Requirement: Programmatic SQL Export

The package SHALL export the migration SQL as a TypeScript value so that consumers with custom tooling can apply or inspect the schema without reading package files directly.

#### Notes

- The SQL export should match the shipped migration contents.

### Requirement: Consumer Documentation

The package SHALL document how a downstream project applies the migration and constructs the Supabase adapter.

#### Notes

- The package should not attempt to mutate a consumer project's migration directory automatically.

## Open Questions

None.
