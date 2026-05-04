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
- no global host aliases or auto-install fallback
- no copy inferred from visible DOM text

## Host Contract

The host runtime installs this package by calling:

```js
window.OdooCommonFormSettingsPanelSurface.install(hostApi);
```

`hostApi` supplies form-specific state access and metadata readers. Installation now validates the adapter up front; missing hooks throw instead of hiding editors or falling back to legacy behavior.

Required hook groups:

- state and persistence: `getState`, `queueStatePersist`, `processFormNode`
- scope and access: `computeScopeKey`, `canAccessSectionSettings`, `canAccessLayoutSettings`
- section metadata: `getSectionGroups`, `findSectionHeader`, `collectSectionFieldMeta`
- section state: `sectionVisibilityEntryKey`, `sectionSettingsRoleEntryKey`, `sectionIsVisible`, `sectionSettingsRoleIds`
- field state/defaults: `fieldVisibilityEntryKey`, `fieldDefaultEntryKey`, `fieldIsVisible`, `fieldDefaultValue`, `fieldAllowsDefaultEditor`, `createFieldDefaultEditor`, `updateFieldDefaultExpandedState`
- field backend loading: `backendFieldMetaFor`, `computeModelName`, `ensureFieldDefinitionsLoadedForForm`, `ensureRelationFieldOptionsLoaded`
- layout metadata/state: `collectLayoutContainers`, `layoutDefaultEntryKey`, `layoutDefaultItemKey`, `layoutItemVisibilityEntryKey`, `layoutItemIsVisible`, `layoutSettingsRoleEntryKey`, `layoutSettingsRoleIds`
- statusbar metadata/state: `collectStatusbarMetas`, `currentLocaleCode`, `statusbarLabelEntryKey`, `statusbarLabelValue`, `applyStatusbarMetaLabels`

Explicit metadata contract:

- section labels must come from `data-lib-section-label` on the section header returned by `findSectionHeader`; the surface does not read `textContent`
- field, layout, layout item, role, statusbar, and statusbar item labels must be provided by adapter metadata (`label`, role `name`, or statusbar `baseLabel`)
- state entry keys returned by the adapter must be non-empty

Technical defaults retained:

- panel chrome copy such as `Section Settings`, `Layout Settings`, and empty-state notes is owned by this UI surface
- an empty field/statusbar/default value means "no configured override"; it is not used as a missing-hook fallback

## Migration Example

See `examples/strict_host_adapter.js` for the smallest shape of an explicit adapter. It intentionally returns empty collections instead of hiding missing hooks behind fallbacks.

Consumer readiness checklist:
- call `install(hostApi)` once after loading the runtime and styles
- provide every required hook up front; missing hooks should fail during integration
- source labels from server/view metadata and explicit `data-lib-*` attributes
- keep project roles, model-specific fields, and translated DOM text outside this package
