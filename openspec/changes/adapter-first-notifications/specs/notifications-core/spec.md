# Spec: notifications-core

## Purpose

Define the public notifications service and its domain behavior.

## Requirements

### Requirement: Service Construction

The library SHALL expose a service construction API that accepts a store implementation and optional injected utilities such as clock and ID generation functions.

#### Notes

- Callers SHALL be able to provide IDs and timestamps directly.
- Projects MAY opt into default generators through injected utilities.

### Requirement: Public Service API

The library SHALL expose methods for creating notifications, listing notifications, retrieving unread counts, marking notifications as read, and marking all notifications as read.

#### Notes

- The service API should remain independent from any concrete persistence technology.
- Archive SHALL NOT be part of V1.
- `markAllRead` SHALL return a structured result containing `updatedCount`.

### Requirement: Domain-Owned Behavior

The service SHALL own notification domain rules that are not purely persistence concerns.

#### Notes

- The service SHALL enforce the public result semantics for duplicate creation.
- The service SHALL surface typed domain errors for missing-target and invalid-cursor cases.

### Requirement: Explicit Return Shapes

The service SHALL use explicit result shapes for operations whose outcomes are ambiguous without metadata, especially notification creation with deduplication.

#### Notes

- Keep return values stable for library consumers.
- Duplicate creation SHALL produce an explicit duplicate result containing the existing notification.

## Open Questions

- Whether additional structured mutation results should be used in V1 beyond `markAllRead`.
