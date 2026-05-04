# Form Layout Surface Sources

Source of truth for the shared layout-shell core extracted from `form_section_layout`.

Included here:
- `constants.js`, `state.js`, `drag_drop.js`
- `runtime/api/session_scope.js`
- `runtime/ui/action_helpers.js`, `entry_keys.js`, `state_storage.js`, `layouts.js`, `process_persistence.js`
- `runtime/process_form.js`, `runtime/process_runtime.js`, `runtime/bootstrap.js`

Explicit DOM contract:
- form roots declare `data-lib-scope-key` or `data-res-model`/`data-model` plus `data-view-id`
- runtime discovery uses only `FORM_ROOT_SELECTOR`; it does not listen to URL/hash changes or infer forms from shell classes
- sections declare `data-lib-section-key`; headers declare `data-lib-section-header`
- layouts declare `data-lib-layout-key`, `data-lib-layout-type`, and optional `data-lib-layout-label`
- layout items declare `data-lib-layout-item-key` and optional `data-lib-layout-item-label`

Not included here:
- subtotal row rendering/editing
- statusbar editors
- chatter helpers
- business adapters or view-specific wrappers
