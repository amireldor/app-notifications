# Spec: notifications-deduplication

## Purpose

Define how duplicate notification creation is detected and reported.

## Requirements

### Requirement: Optional Dedupe Key

The library SHALL support optional deduplication keys on notification creation inputs.

#### Notes

- When no dedupe key is provided, creation SHALL behave as a normal insert attempt.

### Requirement: User-Scoped Deduplication

If deduplication is enabled for a notification, duplicates SHALL be determined within the scope of a single target user.

#### Notes

- Cross-user deduplication SHALL NOT be part of V1.

### Requirement: Duplicate Result Semantics

The library SHALL define an explicit result shape for notification creation when a duplicate is detected.

#### Notes

- Duplicate creation SHALL return a duplicate result containing the existing notification.
- The store contract SHALL expose a dedicated `createDeduped`-style operation that returns inserted and duplicate outcomes explicitly.

### Requirement: Concurrency Expectations

The store contract and core service SHALL document the expected behavior of deduplication under concurrent creation attempts.

#### Notes

- All adapters SHALL support deduplication.
- Non-transactional adapters MAY provide best-effort behavior under concurrency.
- Adapters with transactional guarantees SHOULD prevent duplicate creation atomically.

## Open Questions

- Whether dedupe key comparison rules should be defined as byte-for-byte exact matching or delegated to adapter storage rules.
