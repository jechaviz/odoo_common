# Form Layout Surface Core

Shared layout-shell runtime extracted from `form_section_layout`.

This package owns the generic core only:
- shared form scope/session helpers
- layout item collection and visibility state
- section ordering persistence
- runtime refresh and drag/drop orchestration

This package stays business-neutral:
- no project model fallbacks
- no report/profile naming
- no subtotal-specific labels or commercial defaults

Integration points are explicit:
- `window.__o_lib_form_section_v2.processFormSubtotals(formNode, scopeKey)` is optional
- `window.__o_lib_form_section_v2.bindSubtotalSurfaceRuntime()` is optional
- consumers should expose stable `data-model`, `data-res-model`, `data-view-id`, and section/layout markers instead of relying on legacy inference
