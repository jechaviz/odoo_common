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
- no project model fallbacks
- no hard-coded surcharge defaults
- no hard-coded asset fields or project display formatters
- no action-label discovery heuristics

## Explicit contracts

- requires the canonical `surface-workspace-shell` bootstrap before publishing adapter APIs on `window.OdooSurfaceLayers`
- depends on `form-layout-surface` and shares `window.__o_lib_form_section_v2`
- optional toggle menu hosts must be declared with `data-lib-subtotal-toggle-host="1"` or `data-lib-subtotal-toggle-host-selector`
- extra toggle-backed source fields must be declared through `SUBTOTAL_TOGGLE_BY_SOURCE`, `SUBTOTAL_TOGGLE_FIELDS`, `SUBTOTAL_REFRESH_FIELDS`, and `SUBTOTAL_TOGGLE_MENU_ITEMS`
- subtotal rows must be declared through DOM markers instead of label heuristics:
- subtotal containers must declare `data-lib-subtotal-container="1"`
- `data-lib-subtotal-anchor="1"` or container `data-lib-subtotal-anchor-selector` to place the rendered subtotal wrap
- `data-lib-record-id` on the form root can supply record binding; URL, hash, ancestor, and descendant inference are intentionally not used
- `data-lib-currency-symbol` on the form root controls rendered currency text
- `data-lib-subtotal-source-field` to bind a custom source field
- `data-lib-subtotal-seed="1"` to seed a native row into the editable layout
- `data-lib-subtotal-label` and optional `data-lib-subtotal-value` provide seed-row metadata without reading visible labels
- `data-lib-subtotal-line-type="charge|tax|special"` to classify custom seeded rows
- `data-lib-subtotal-toggle-proxy="1"` marks native toggle wrappers that should be hidden when the surface owns the toggle
- core amount line labels are read from loaded Odoo field definitions, falling back only to the technical field name
- admin checks use the Odoo `base.group_system` contract only; role names and user-function text are not inspected
- many2one option loading uses the Odoo `name_search` contract only; adapters that need another lookup shape must provide it outside this surface

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
      fieldName: "external_reference",
      normalize: function (value) {
        return String(value || "").trim();
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

## Migration Examples

Examples live in `examples/`:
- `minimal_subtotals_dom.html` shows the required row/container markers without label inference.
- `canonical_subtotals_adapter.js` shows reusable adapter installation through `window.OdooSurfaceLayers`.

Consumer readiness checklist:
- include `surface-workspace-shell` and `form-layout-surface` before this package
- declare subtotal containers, anchors, labels, values, source fields, and toggle hosts through `data-lib-*` markers
- pass field display normalizers explicitly when a field needs non-standard display cleanup
- do not port project-specific amount labels, surcharge defaults, action labels, or broad selector chains into the shared package
