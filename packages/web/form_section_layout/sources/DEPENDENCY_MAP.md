# Form Section Layout Runtime Dependency Map

## Scope
- Runtime root: `window.__o_lib_form_section_v2`
- Primary publication graph: `lib/manifest.json`
- Runtime module manifest: `lib/odoo/web/form_section_layout/runtime/manifest.json`
- Generated JS fallback artifact: `lib/odoo/web/form_section_layout.runtime.js`
- Stable published CSS today: `lib/odoo/web/form_section_layout.css`
- Refactor source root: `lib/odoo/web/form_section_layout/runtime/`

## Current publication rule
- Production publishes the split runtime through attachment-backed atomic assets resolved from `lib/manifest.json`.
- The assembled runtime stays as parity/fallback output only.
- No dual-load is allowed.
- The split runtime is the source of truth for publication and refactor work.
- Legacy aggregate source files (`api.js`, `ui_builder.js`, `subtotals.js`) are retired and must not be resurrected.

## Contract constraints
- Preserve the `window.__o_lib_form_section_v2` namespace.
- Preserve Odoo bootstrap behavior: explicit `boot()` plus mutation-driven hydration.
- Preserve current public behavior for:
  - section collapse/reorder
  - layout visibility/settings
  - statusbar labels/settings
  - chatter collapse
  - subtotal layout/edit/render
  - boolean/numeric widget sync

## Runtime topology

### Shared roots
- `constants.js`
  - static class names
  - toggle/source catalogs
  - asset/runtime constants
- `lib/odoo/web/shared/asset_number_utils.js`
  - shared asset-number extraction, observer binding, and passive text normalization
- `state.js`
  - `_state` container
  - mutable runtime stores only
- `drag_drop.js`
  - global drag handlers for sections

### API bridge
- `runtime/api/session_scope.js`
  - session/user/context access
  - scope/model inference
- `runtime/api/relation_options.js`
  - relation option loading/search

### UI runtime
- `runtime/ui/state_storage.js`
  - local/db state parsing/merge/write helpers
- `runtime/ui/field_loading.js`
  - field metadata loading and select option normalization
- `runtime/ui/entry_keys.js`
  - layout state entry keys and scope helpers
- `runtime/ui/action_helpers.js`
  - generic text, icon, and section helper utilities
- `runtime/ui/visibility_access.js`
  - visibility and role/access lookups
- `runtime/ui/field_targets.js`
  - field discovery and target resolution
- `runtime/ui/field_editor_meta.js`
  - default-editor metadata inference
- `runtime/ui/field_editor_runtime.js`
  - default-editor runtime and field application
- `runtime/ui/layouts.js`
  - tabs/buttons layout item collection and visibility
- `runtime/ui/statusbar.js`
  - statusbar collection, relabeling, settings trigger
- `runtime/ui/settings_panel_shell.js`
  - settings modal shell and display-label helpers
- `runtime/ui/settings_panel_context.js`
  - panel focus resolution, title resolution, scroll/rerender helpers
- `runtime/ui/settings_panel_roles.js`
  - reusable role-selector renderer for settings surfaces
- `runtime/ui/settings_panel_sections.js`
  - section/field settings rows
- `runtime/ui/settings_panel_layouts.js`
  - layout/tab settings rows
- `runtime/ui/settings_panel_statusbars.js`
  - statusbar label settings rows
- `runtime/ui/settings_panel_render.js`
  - settings panel orchestration and composition root
- `runtime/ui/settings_panel_open.js`
  - panel opening and focus state handoff
- `runtime/ui/chatter.js`
  - chatter collapse runtime
- `runtime/ui/section_control_visibility.js`
  - global hover/pointer runtime for section control visibility
- `runtime/ui/section_headers.js`
  - section header collapse/toolbar behavior
- `runtime/ui/field_values.js`
  - numeric/boolean reads, caches, asset-number normalization
- `runtime/ui/field_widget_sync.js`
  - numeric/boolean widget synchronization against native Odoo controls
- `runtime/ui/process_persistence.js`
  - section reorder persistence, delayed state saves, and header click actions
- `runtime/ui/process_form.js`
  - per-form orchestration across sections, layouts, statusbars, and subtotals
- `runtime/ui/process_runtime.js`
  - state bootstrap, refresh loop, MutationObserver wiring, and boot

### Subtotal runtime
- `runtime/subtotals/state_keys.js`
  - layout keys, report keys, persist target collection
- `runtime/subtotals/line_rules.js`
  - line types, signs, managed-line detection, sanitization
- `runtime/subtotals/storage.js`
  - subtotal state read/write, edit contexts, toggle metadata, formatting
- `runtime/subtotals/layout_mutations.js`
  - normalized layout mutation and custom line operations
- `runtime/subtotals/layout_labels_defaults.js`
  - label/source normalization and default seeding
- `runtime/subtotals/native_rows.js`
  - native subtotal row discovery, extraction, default seeding, formula validation
- `runtime/subtotals/formulas.js`
  - subtotal formula evaluation helpers
- `runtime/subtotals/persist.js`
  - active subtotal edit persistence
- `runtime/subtotals/report_persistence.js`
  - report/preview subtotal persistence bridge and config-param writer
- `runtime/subtotals/render_state.js`
  - layout preparation, native-row sync, and render context building
- `runtime/subtotals/render_rows.js`
  - row builders, editors, and row-level drag/drop bindings
- `runtime/subtotals/render.js`
  - subtotal render orchestration
- `runtime/subtotals/toggle_menu.js`
  - charge-toggle menu anchoring, host resolution, and TERP/LDW toggle panel runtime
- `runtime/subtotals/edit_mode.js`
  - subtotal edit-mode toggling, restore flow, and container decoration

## Load order
1. `constants.js`
2. `lib/odoo/web/shared/asset_number_utils.js`
3. `runtime/api/*.js`
4. `runtime/ui/state_storage.js`
5. `state.js`
6. `runtime/ui/field_loading.js`
7. `runtime/ui/entry_keys.js`
8. `runtime/ui/action_helpers.js`
9. `runtime/ui/visibility_access.js`
10. `runtime/ui/field_targets.js`
11. `runtime/ui/field_editor_meta.js`
12. `runtime/ui/field_editor_runtime.js`
13. `runtime/ui/layouts.js`
14. `runtime/ui/statusbar.js`
15. `runtime/ui/settings_panel_shell.js`
16. `runtime/ui/settings_panel_context.js`
17. `runtime/ui/settings_panel_roles.js`
18. `runtime/ui/settings_panel_sections.js`
19. `runtime/ui/settings_panel_layouts.js`
20. `runtime/ui/settings_panel_statusbars.js`
21. `runtime/ui/settings_panel_render.js`
22. `runtime/ui/settings_panel_open.js`
23. `runtime/ui/chatter.js`
24. `runtime/ui/section_control_visibility.js`
25. `runtime/ui/section_headers.js`
26. `runtime/ui/field_values.js`
27. `runtime/ui/field_widget_sync.js`
28. `runtime/ui/process_persistence.js`
29. `runtime/subtotals/*.js`
  - specifically: `state_keys`, `line_rules`, `storage`, `layout_mutations`, `layout_labels_defaults`, `native_rows`, `formulas`, `persist`, `report_persistence`, `render_state`, `render_rows`, `render`, `toggle_menu`, `edit_mode`
30. `drag_drop.js`
31. `runtime/ui/process_form.js`
32. `runtime/ui/process_runtime.js`

## Refactor sequence
1. Edit only the source split files under `runtime/`.
2. Assemble the modular runtime with `scripts/build_form_section_layout_runtime.py`.
3. Validate source-vs-assembled parity with `scripts/check_form_section_layout_runtime_parity.py`.
4. Run the real preview audit with `scripts/audit_form_section_layout_preview.py`.
5. Publish only the modular runtime contract through the bundle graph in `lib/manifest.json`.

## Risks to control
- MutationObserver loops from mixed bundles.
- Duplicate `boot()` execution.
- Partial namespace definition before `process_runtime.js`.
- Split subtotal runtime loaded before field widget helpers.
- Odoo asset cache serving mixed old/new runtime slices.
- Incorrect `before/after/replace` targeting creating bundle order regressions.
