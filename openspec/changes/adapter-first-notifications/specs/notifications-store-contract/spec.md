# Spec: notifications-store-contract

## Purpose

Define the adapter interface that persistence implementations must satisfy.

## Requirements

### Requirement: Store Interface

The library SHALL define a `NotificationsStore` contract that abstracts persistence operations required by the core service.

#### Notes

- Enumerate required methods explicitly.
- Avoid leaking ORM-specific or SQL-specific abstractions into the contract.
- The contract SHALL include deduplicated creation support as a hard requirement.
- The contract SHALL support read-state mutations and unread counting.
- The contract SHALL expose a dedicated deduplicated creation method rather than requiring the service to compose lower-level insert and lookup operations.

### Requirement: Store Method Guarantees

Each store method SHALL document its expected inputs, outputs, and side-effect guarantees.

#### Notes

- Missing-target mutations SHALL support typed domain error behavior through the service contract.
- Methods involved in deduplicated creation SHALL return enough information to distinguish inserted and duplicate outcomes.

### Requirement: Portability Boundary

The store contract SHALL be defined so that different database and ORM adapters can implement it without changing the public service API.

#### Notes

- The core service should not need database-specific conditionals.

### Requirement: Best-Effort Concurrency for Non-Transactional Adapters

The store contract SHALL require deduplication support from every adapter, but non-transactional adapters MAY satisfy concurrent duplicate prevention on a best-effort basis.

#### Notes

- Adapters with stronger transactional guarantees MAY provide stronger duplicate prevention.

## Open Questions

- Whether any additional optional adapter methods are needed beyond the minimum contract for V1.
