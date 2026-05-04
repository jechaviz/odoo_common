# Form Preview Surface

Shared DOM-side preview helpers for managed Odoo form preview runtimes.

This package owns:
- managed form root and field resolution
- field text readback for preview consumers
- preview value hydration and node visibility sync

This package must stay generic:
- no project route naming
- no business-specific copy or field semantics
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
    primaryPreview: {
      fieldName: "adapter_primary_field",
      targetSelector: "[data-surface-preview='primary']",
    },
    secondaryPreview: {
      fieldName: "adapter_secondary_field",
      targetSelector: "[data-surface-preview='secondary']",
      hideWhenEmpty: true,
    },
  },
});
```

The sample field names and selectors are placeholders. Concrete model fields,
business labels, and target selectors must be declared by the consumer adapter or
view spec.

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

The only built-in selector fallback is the generic Odoo form root `.o_form_view`;
all project DOM targets must enter through `spec` or runtime `options`.
