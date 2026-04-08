# Spec: notifications-pagination

## Purpose

Define how notification listing is ordered, filtered, and paginated.

## Requirements

### Requirement: Stable Ordering

The library SHALL define a stable default ordering for listed notifications.

#### Notes

- Listing SHALL be newest-first.
- Tie-breaking SHALL use notification ID in addition to `createdAt`.
- Archive is out of scope for V1.

### Requirement: Cursor-Based Pagination

The library SHALL support cursor-based pagination for notification listing.

#### Notes

- Cursors SHALL be opaque strings in the public API.
- Cursor state SHALL represent both `createdAt` and notification ID.
- `nextCursor` SHALL be derived from the final item in the current page.
- Cursor encoding SHALL be standardized by the library so compliant adapters interoperate with the same cursor format.

### Requirement: Filter Interaction

The library SHALL define how pagination interacts with list filters such as unread-only queries.

#### Notes

- Unread-only filtering SHALL be compatible with the same cursor contract and ordering rules as unfiltered listing.

### Requirement: Invalid Cursor Behavior

The library SHALL document how invalid or expired cursors are handled.

#### Notes

- Invalid cursors SHALL produce a typed domain error.

## Open Questions

- Whether the standardized cursor format should be documented as versioned for future evolution.
