# Form Chatter Toggle Surface

Canonical web surface for collapsing and restoring Odoo form chatter.

This package owns:
- chatter container discovery
- global toggle button lifecycle
- collapsed state application across forms
- optional persistence hooks supplied by the host

This package stays generic:
- no project routes
- no shell wiring
- no inferred business labels
- no global host aliases or auto-install fallback
- no legacy chatter selector aliases

## Host Contract

Install with:

```js
window.OdooCommonFormChatterToggleSurface.install({
  getCollapsed: function () {},
  setCollapsed: function (collapsed) {},
  onCollapsedChange: function (collapsed) {},
  chatterSelectors: [".o-mail-ChatterContainer"],
});
```

`getCollapsed` and `setCollapsed` are required and must exchange booleans. `onCollapsedChange` is an optional observer only; it is not used as persistence fallback.

Technical Odoo defaults retained:

- default chatter host selectors are `.o-mail-ChatterContainer`, `.o-mail-Form-chatterContainer`, and `.o-mail-Form-chatter`
- default form/layout selectors are Odoo chrome classes `.o_form_view` and `.o_form_sheet_bg`

Removed legacy aliases:

- `.oe_chatter`
- `.o_FormRenderer_chatterContainer`
- `.o_ChatterContainer`
- `.o-mail-Chatter` as a host container

If a consumer needs non-standard or older markup, it must pass explicit `chatterSelectors`; the runtime does not infer chatter hosts from labels or broad legacy selector chains.
