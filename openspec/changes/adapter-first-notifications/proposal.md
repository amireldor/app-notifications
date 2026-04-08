# Proposal: Adapter-First Notifications

## Summary

Create a reusable TypeScript library for in-app notifications with a small public API and a pluggable persistence boundary.

## Goals

- Provide a compact notifications service API for application code.
- Define a storage adapter contract that can be implemented with different databases or ORMs.
- Keep the library focused on in-app notifications only.
- Publish strong, stable TypeScript types for consumers.

## Non-Goals

- Email delivery
- Push notifications
- Workflow orchestration
- Event bus integration
- UI hooks or framework bindings in V1

## Scope

The initial change covers:

- canonical notification types
- a store contract for adapters
- deduplication behavior
- pagination behavior
- a core notifications service
- a reference in-memory adapter
- explicit error and no-op semantics
- read and unread behavior only in V1

## Why Now

The project is at the start of implementation. Locking the package boundaries first will reduce churn and make later implementation easier for both humans and coding agents.

## Success Criteria

- The public API is defined independently from any specific database.
- Adapter responsibilities and guarantees are explicit.
- Core notification behavior is split into small, focused specs.
- A reference adapter can be implemented without ambiguity.
- Pagination is stable for newest-first listing.
- Duplicate creation returns an explicit duplicate result with the existing notification.

## Risks

- Over-specifying persistence details could reduce portability.
- Under-specifying deduplication and pagination could cause incompatible adapter implementations.
- Mixing domain concerns and storage concerns would make the package hard to evolve.
- Requiring `Date` objects in the public API may require adapters to normalize internal timestamp formats carefully.

## Open Questions

- Whether archive should be introduced in a follow-up change after read and unread behavior is stable.
