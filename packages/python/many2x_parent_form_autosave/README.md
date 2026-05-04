# Many2X Parent Form Autosave Builder

Python builder for producing a project-specific copy of the canonical Many2X parent-form autosave web patch.

Use this package when a consumer must declare different selectors, module names, guard properties, or parent save method names without adding runtime fallbacks to `packages/web/many2x_parent_form_autosave`.

## Contract

- `module_name` must be explicit and must not use the legacy `rp.*` namespace.
- selector and property fields must be non-empty strings.
- `max_owner_depth` and `debug_event_limit` must be positive integers.
- the output is generated from `sources/templates/many2x_parent_form_autosave.js.tmpl`.

## Example

```python
from many2x_parent_form_autosave_patch import (
    Many2XParentFormAutosaveSpec,
    build_many2x_parent_form_autosave_patch,
)

source = build_many2x_parent_form_autosave_patch(
    Many2XParentFormAutosaveSpec(
        module_name="my_module.many2x_parent_form_autosave",
        parent_form_selector=".o_form_view",
        x2many_field_selector=".o_field_x2many",
        parent_save_method_name="saveButtonClicked",
    )
)
```
