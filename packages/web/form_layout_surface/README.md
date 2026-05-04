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
- form roots must expose either `data-lib-scope-key` or a stable model/view pair with `data-res-model`/`data-model` plus `data-view-id`
- section groups must expose `data-lib-section-key`; section headers must expose `data-lib-section-header`
- layout containers must expose `data-lib-layout-key` and `data-lib-layout-type`; layout items must expose `data-lib-layout-item-key`
- layout container labels are read from optional `data-lib-layout-label`; if omitted, the explicit layout key is displayed
- layout item labels are read only from `data-lib-layout-item-label`; if omitted, the explicit item key is displayed
- subtotal refresh fields default to an empty list; adapters that need subtotal field reads must declare them explicitly

Non-goals:
- no URL, query, hash, path, ancestor, or descendant inference for scope identity
- no class-prefix section key aliases
- no section or layout keys generated from visible labels
