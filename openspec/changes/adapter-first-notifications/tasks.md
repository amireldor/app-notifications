# Tasks: Adapter-First Notifications

## Artifact Tasks

- [x] Finalize proposal scope and unresolved decisions
- [x] Finalize design for service and store boundaries
- [x] Fill in requirement details for `notifications-payloads`
- [x] Fill in requirement details for `notifications-store-contract`
- [x] Fill in requirement details for `notifications-deduplication`
- [x] Fill in requirement details for `notifications-pagination`
- [x] Fill in requirement details for `notifications-core`
- [x] Fill in requirement details for `notifications-adapter-memory`
- [x] Fill in requirement details for `notifications-errors`

## Implementation Tasks

### Recommended Order

1. [ ] Scaffold the TypeScript package layout
2. [ ] Implement `notifications-payloads`
3. [ ] Implement `notifications-errors`
4. [ ] Implement `notifications-pagination`
5. [ ] Implement `notifications-store-contract`
6. [ ] Implement `notifications-deduplication`
7. [ ] Implement `notifications-core`
8. [ ] Implement `notifications-adapter-memory`
9. [ ] Add tests for deduplication semantics
10. [ ] Add tests for pagination semantics
11. [ ] Add tests for read operations and missing-target errors
12. [ ] Prepare package exports and type declarations

### Why This Order

- shared types and errors should stabilize first
- pagination rules should be fixed before store and service implementations depend on them
- the store contract should exist before service logic is implemented
- deduplication should be formalized before create behavior is wired through the service
- the in-memory adapter should validate the contract after the core service exists
