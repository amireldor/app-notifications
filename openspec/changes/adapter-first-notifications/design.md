# Design: Adapter-First Notifications

## Overview

The library is structured around a service layer that owns notification behavior and a store interface that owns persistence behavior.

```text
app code
   │
   ▼
NotificationsService
   │
   ▼
NotificationsStore
   │
   ├── database adapter
   ├── ORM adapter
   ├── API-backed adapter
   └── in-memory adapter
```

## Design Principles

- Keep the public service API small.
- Keep storage concerns behind a single adapter interface.
- Make types first-class and explicit.
- Treat deduplication and pagination as separate concerns, not side notes.
- Favor deterministic behavior that is easy to test.

## Planned Modules

- `notifications-payloads`
- `notifications-store-contract`
- `notifications-deduplication`
- `notifications-pagination`
- `notifications-core`
- `notifications-adapter-memory`
- `notifications-errors`

## Recommended Implementation Order

The specs should be implemented in dependency order so each step locks a smaller, stable surface before the next layer is added.

1. `notifications-payloads`
2. `notifications-errors`
3. `notifications-pagination`
4. `notifications-store-contract`
5. `notifications-deduplication`
6. `notifications-core`
7. `notifications-adapter-memory`

### Rationale

- `notifications-payloads` defines the shared type vocabulary used everywhere else.
- `notifications-errors` defines the public failure surface early, which reduces later API churn.
- `notifications-pagination` locks cursor and ordering behavior before store and service methods depend on it.
- `notifications-store-contract` defines the persistence boundary after shared types are stable.
- `notifications-deduplication` refines the most subtle store behavior once the store shape exists.
- `notifications-core` should come after the supporting contracts are clear.
- `notifications-adapter-memory` is best implemented last as the reference adapter that validates the full contract.

## Core Responsibilities

### Service

- normalize inputs
- coordinate deduplication behavior
- expose public methods
- support optional injected default generators while allowing callers to supply IDs and timestamps directly
- enforce domain semantics

### Store

- persist notification records
- retrieve notification records
- support read mutations
- honor deduplication guarantees defined by the contract

## Likely Construction Shape

```ts
createNotificationsService({
  store,
  now,
  generateId,
})
```

In V1, callers are expected to provide IDs and timestamps, while `now` and `generateId` remain optional defaults that projects may opt into.

## Important Decisions To Capture In Specs

- canonical notification and payload types
- exact store interface and return shapes
- duplicate handling and atomicity expectations
- cursor ordering and page boundary semantics
- not-found and invalid-input behavior
- read and unread behavior without archive support in V1
- exported domain error types
- standardized library-owned cursor encoding

## Out of Scope

- concrete SQL schema
- concrete framework hooks
- transport or delivery channels beyond in-app notifications
- archive behavior in V1
