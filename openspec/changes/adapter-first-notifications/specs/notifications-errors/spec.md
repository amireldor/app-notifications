# Spec: notifications-errors

## Purpose

Define error, no-op, and invalid-input behavior for the notifications library.

## Requirements

### Requirement: Missing Target Behavior

The library SHALL define how read operations behave when the target notification does not exist or does not belong to the provided user.

#### Notes

- Missing-target operations SHALL throw typed domain errors.
- Ownership mismatches SHALL be treated the same as not-found cases in the public API.

### Requirement: Invalid Input Behavior

The library SHALL define how invalid inputs such as malformed cursors are handled.

#### Notes

- Invalid cursors SHALL throw typed domain errors.
- Keep consumer-facing behavior consistent across adapters.

### Requirement: Error Surface

The library SHALL document whether it exposes domain-specific error types or relies on return values for expected failure cases.

#### Notes

- Distinguish expected control-flow outcomes from exceptional failures.
- Duplicate create results SHALL remain return-value based rather than exception-based.
- The public API SHALL export a base `NotificationsError`.
- The public API SHALL export `NotificationNotFoundError`.
- The public API SHALL export `InvalidCursorError`.

## Open Questions

- Whether any additional typed errors are needed in V1 beyond the base, not-found, and invalid-cursor errors.
