# Form Subtotals Surface Sources

Source of truth for the shared subtotals runtime extracted from `form_section_layout`.

Included here:
- subtotal runtime modules from `runtime/subtotals/`
- subtotal field RPC/value sync helpers
- subtotal CSS from `styles/subtotals.css`
- integration hook `runtime/subtotals_surface_integration.js`
- canonical adapter facade exported through `window.OdooSurfaceLayers`
- optional host-declared display normalizers for fields that need project-specific passive formatting

This package assumes:
- `form-layout-surface` is loaded first and exposes the shared namespace/state helpers
- `surface-workspace-shell` is loaded before the integration hook publishes adapter APIs on `window.OdooSurfaceLayers`
