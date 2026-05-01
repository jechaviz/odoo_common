# Form Subtotals Surface

Shared subtotals runtime and styles extracted from `form_section_layout`.

This package owns:
- subtotal line storage and ordering
- formula validation and rendering
- edit mode, persistence, and toggle-menu runtime
- subtotal-specific CSS

This package stays business-neutral:
- no invoice/rental model fallbacks
- no hard-coded TERP/LDW defaults
- no action-label discovery heuristics

Explicit contracts:
- depends on `form-layout-surface` and shares `window.__o_lib_form_section_v2`
- optional toggle menu hosts must be declared with `data-lib-subtotal-toggle-host="1"` or `data-lib-subtotal-toggle-host-selector`
- extra toggle-backed source fields must be declared through `SUBTOTAL_TOGGLE_BY_SOURCE`, `SUBTOTAL_TOGGLE_FIELDS`, `SUBTOTAL_REFRESH_FIELDS`, and `SUBTOTAL_TOGGLE_MENU_ITEMS`
