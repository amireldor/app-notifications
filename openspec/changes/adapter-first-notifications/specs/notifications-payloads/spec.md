# Spec: notifications-payloads

## Purpose

Define the canonical TypeScript shapes used by the notifications library.

## Requirements

### Requirement: Canonical Notification Shapes

The library SHALL define stable public types for notification inputs, stored notifications, and returned notifications.

#### Notes

- Document which fields are optional at input time.
- Separate normalized records from public return values if needed.
- Public timestamps SHALL use `Date`.
- V1 SHALL model read and unread state only and SHALL NOT include archive fields.

### Requirement: JSON-Safe Payload Data

The library SHALL restrict notification payload data to JSON-compatible values.

#### Notes

- Arrays and nested objects SHALL be supported.
- `undefined` MAY be permitted in payload shapes at the TypeScript level.
- Adapters MAY normalize or omit `undefined` values when persisting data.

### Requirement: Generic Type Support

The library SHALL allow consumers to specialize notification `type` and payload `data` through TypeScript generics while preserving sensible defaults.

#### Notes

- Default behavior should remain easy for consumers who do not specialize types.
- The default notification type SHALL be `string`.

## Open Questions

- Whether the stored record type should remain public or be treated as an internal implementation detail.
