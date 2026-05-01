# Form Settings Panel Surface

Canonical web surface for section, layout, and statusbar settings inside Odoo forms.

This package owns:
- settings panel shell and open/close lifecycle
- section visibility and field default editors
- layout item visibility and default-tab controls
- statusbar label editing

This package stays generic:
- no project naming
- no business field presets
- no shell-specific compatibility wiring

## Host Contract

The host runtime installs this package by calling:

```js
window.OdooCommonFormSettingsPanelSurface.install(hostApi);
```

`hostApi` supplies form-specific state access and metadata readers. The package expects host-owned hooks for:

- form state persistence and reprocessing
- section, layout, and statusbar metadata collection
- role access checks
- field default editors and relation option loading

If a hook is missing, the panel degrades by hiding that editor rather than inventing fallback business behavior.
