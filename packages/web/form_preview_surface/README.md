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
- `resolvePreviewTarget(target, options)`
- `resolveFormFieldRoot(fieldName, options)`
- `readFormFieldText(fieldName, options)`
- `setFormFieldPreviewValue(fieldName, value, options)`
- `replaceTextContent(node, text)`
- `setPreviewNodeVisibility(node, visible)`
- `normalizeFormPreviewSurfaceSpec(spec)`
- `buildFormPreviewSurfaceAdapter(spec)`

## Canonical adapter contract

`form-preview-surface` is consumable as a real shared runtime, not only as loose DOM helpers.

Use `buildFormPreviewSurfaceAdapter(spec)` when a project or another shared package needs a canonical preview controller with:
- `sync(payload, options)`
- `clear(options)`
- `readState()`

### Minimal spec

```js
window.OdooSurfaceLayers.buildFormPreviewSurfaceAdapter({
  selector: ".o_form_view",
  previewFields: {
    displayReference: {
      fieldName: "x_document_display_ref",
      targetSelector: ".o_rp_document_display_ref",
    },
    branchLabel: {
      fieldName: "x_origin_branch_id",
      targetSelector: "[data-surface-preview='branch']",
      hideWhenEmpty: true,
    },
  },
});
```

Each preview binding may declare:
- `fieldName`
- `targetSelector`
- `resolveTarget`
- `targetNode`
- `format(value, payload, options)`
- `write(node, value, payload, options)`
- `hideWhenEmpty`
- `writeField`
- `writeTarget`

The canonical rule is:
- if the consumer only needs field/value hydration or DOM mirrors, use this package directly
- if the consumer needs business meaning, labels, or source-model wiring, keep that in the adapter package above it

Consumers should provide only:
- optional form root selectors/resolvers
- field names or preview targets to read/hydrate
- optional formatting/writing behavior through `spec`
- optional focus/empty-write behavior through `options`
