# Proposal: Add Supabase Adapter

## Summary

Add a Supabase-backed adapter for the notifications library, along with a migration and integration story that can be adopted by downstream projects without copying implementation details by hand.

## Goals

- Implement a `NotificationsStore` adapter that works with Supabase-backed Postgres.
- Define the database schema and migration requirements needed by the adapter.
- Make migration adoption straightforward for projects consuming the package.
- Keep the adapter aligned with the core library contract, including deduplication, pagination, and read behavior.

## Non-Goals

- Supporting every SQL client or ORM in the same change
- Introducing archive behavior
- Adding UI hooks or Supabase realtime subscriptions
- Solving every possible migration toolchain automatically

## Scope

This change covers:

- a concrete Supabase adapter for the existing notifications core
- the database table and index requirements for deduplication and listing
- packaging guidance for how projects import or apply the migration
- tests or verification that the adapter matches the core contract

## Why Now

The core library contract exists, but it is not yet useful in a real project without at least one production-oriented adapter. Supabase is a natural first target because it provides Postgres storage with a predictable migration model.

## Success Criteria

- A project using Supabase can wire the adapter into `createNotificationsService`.
- The adapter preserves the library’s deduplication and pagination semantics.
- The required table and index definitions are documented and shippable.
- Consumers have a clear path to applying the migration in their own projects.

## Risks

- Migration packaging may be awkward if downstream projects use different migration tools.
- Supabase row shapes and timestamp handling may not align perfectly with the core `Date`-based API.
- The adapter could become too Supabase-client-specific instead of staying aligned with the generic store contract.

## Open Questions

- Should the package ship raw SQL migration files, generated helper functions, or only schema documentation?
- Should the adapter target the plain `@supabase/supabase-js` client only, or also define expectations for service-role usage?
- How much of the migration story should be automated versus documented?
