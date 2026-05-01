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

## Host Contract

Install with:

```js
window.OdooCommonFormChatterToggleSurface.install({
  getCollapsed: function () {},
  setCollapsed: function (collapsed) {},
  onCollapsedChange: function (collapsed) {},
});
```

All hooks are optional. Without hooks, the package still manages DOM behavior with in-memory state.
