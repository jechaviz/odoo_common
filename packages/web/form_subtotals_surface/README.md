# Form Subtotals Surface

Shared subtotals runtime and styles extracted from `form_section_layout`.

This package owns:
- subtotal line storage and ordering
- formula validation and rendering
- edit mode, persistence, and toggle-menu runtime
- subtotal-specific CSS
- canonical root resolution and adapter facade for subtotals processing
- optional field display normalizers declared by the host adapter

This package stays business-neutral:
- no invoice/rental model fallbacks
- no hard-coded TERP/LDW defaults
- no hard-coded asset fields or project display formatters
- no action-label discovery heuristics

## Explicit contracts

- requires the canonical `surface-workspace-shell` bootstrap before publishing adapter APIs on `window.OdooSurfaceLayers`
- depends on `form-layout-surface` and shares `window.__o_lib_form_section_v2`
- optional toggle menu hosts must be declared with `data-lib-subtotal-toggle-host="1"` or `data-lib-subtotal-toggle-host-selector`
- extra toggle-backed source fields must be declared through `SUBTOTAL_TOGGLE_BY_SOURCE`, `SUBTOTAL_TOGGLE_FIELDS`, `SUBTOTAL_REFRESH_FIELDS`, and `SUBTOTAL_TOGGLE_MENU_ITEMS`

## Public API

- `window.__o_lib_form_section_v2.processFormSubtotals(formNode, scopeKey)`
- `window.__o_lib_form_section_v2.bindSubtotalSurfaceRuntime()`
- `window.__o_lib_form_section_v2.normalizeFieldDisplayValues(formNode, specs)`
- `window.OdooSurfaceLayers.resolveFormSubtotalsRoot(options)`
- `window.OdooSurfaceLayers.normalizeFormSubtotalsSurfaceSpec(spec)`
- `window.OdooSurfaceLayers.buildFormSubtotalsSurfaceAdapter(spec)`

## Canonical adapter

`form-subtotals-surface` now exposes a canonical shared adapter so consumers do not need to recreate local wiring around the internal runtime namespace.

Use `buildFormSubtotalsSurfaceAdapter(spec)` when the project or another shared package needs:
- lazy form-root resolution
- one-time runtime installation
- explicit scope-key orchestration
- before/after processing hooks

The adapter exposes:
- `install()`
- `process(options)`
- `readState()`

### Minimal spec

```js
window.OdooSurfaceLayers.buildFormSubtotalsSurfaceAdapter({
  selector: ".o_form_view",
  resolveScopeKey: function (formNode) {
    return formNode.getAttribute("data-surface-scope") || "default";
  },
  fieldDisplayNormalizers: [
    {
      fieldName: "project_identifier_field",
      normalize: function (value) {
        return window.__project_display_utils.normalizeIdentifier(value);
      },
    },
  ],
});
```

Each adapter must declare explicitly:
- `root`, `selector`, or `resolveRoot`
- `scopeKey` or `resolveScopeKey`
- any `fieldDisplayNormalizers`
- any `beforeProcess` / `afterProcess` hook

The adapter contract is validated at build time:
- `buildFormSubtotalsSurfaceAdapter(spec)` throws if the spec omits both root resolution and scope-key resolution

The canonical rule is:
- if the consumer already owns the concrete form node and scope key, it may call `processFormSubtotals(...)` directly
- if the consumer wants reusable orchestration, it must consume `buildFormSubtotalsSurfaceAdapter(spec)` instead of recreating local bootstrap code
