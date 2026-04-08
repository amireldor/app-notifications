# Spec: notifications-adapter-memory

## Purpose

Define a reference in-memory adapter for testing and examples.

## Requirements

### Requirement: Contract Compliance

The in-memory adapter SHALL implement the `NotificationsStore` contract without changing service behavior.

#### Notes

- The adapter should behave as a reference implementation for tests.
- The adapter SHALL support the same deduplication and cursor semantics as the core contract.

### Requirement: Deterministic Test Behavior

The in-memory adapter SHALL support deterministic behavior suitable for automated tests.

#### Notes

- Ordering SHALL follow newest-first sorting with `createdAt` and ID tie-breaking.
- Invalid cursors and missing-target mutations SHALL behave consistently with the service contract.

### Requirement: Limited Scope

The in-memory adapter SHALL remain a lightweight reference adapter and SHALL NOT define the persistence contract for other adapters.

#### Notes

- Avoid adapter-specific features that are unavailable in the general contract.

### Requirement: Public Export Availability

The in-memory adapter SHALL be available through the package's public exports.

#### Notes

- It may be documented primarily for testing and examples.

## Open Questions

- Whether the adapter should favor a simpler internal representation or stricter simulation of contract edge cases.
