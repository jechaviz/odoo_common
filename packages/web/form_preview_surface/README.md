# Form Preview Surface

Shared DOM-side preview helpers extracted from the source-derived Rental form preview runtime.

This package owns:
- managed form root and field resolution
- field text readback for preview consumers
- preview value hydration and node visibility sync

This package must stay generic:
- no rental routes
- no customer-contact copy
- no project-specific selectors beyond caller-provided nodes and field names

Public API on `window.OdooSurfaceLayers`:
- `resolveManagedFormRoot(options)`
- `resolveFormFieldRoot(fieldName, options)`
- `readFormFieldText(fieldName, options)`
- `setFormFieldPreviewValue(fieldName, value, options)`
- `replaceTextContent(node, text)`
- `setPreviewNodeVisibility(node, visible)`

Consumers should provide only:
- optional form root selectors/resolvers
- field names to read or hydrate
- optional focus/empty-write behavior through `options`
