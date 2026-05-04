# Many2X Parent Form Autosave

Canonical web patch that commits an inline x2many editor after a Many2X autocomplete selection and then persists the owning parent form through Odoo's form controller.

This package owns:
- Many2X autocomplete selection interception
- inline list edit commit orchestration
- parent form save dispatch through a declared controller method
- bounded debug events for integration diagnosis

This package stays generic:
- no project namespace aliases
- no modal-parent autosave fallback
- no legacy controller method probing
- no broad owner traversal beyond the declared depth

## Contract

- Odoo's module loader must be available before this asset runs.
- `@web/core/utils/patch` and `@web/views/fields/relational_utils` must be resolvable by the host Odoo build.
- Parent forms must use the declared `parentFormSelector`, default `.o_form_view`.
- Inline x2many fields must use the declared `x2manyFieldSelector`, default `.o_field_x2many`.
- Parent persistence uses exactly `parentSaveMethodName`, default `saveButtonClicked`.
- Forms inside `modalSelector`, default `.modal`, are intentionally ignored.

If a project needs different selectors or a different parent save method, generate a project-specific copy with the python builder instead of adding fallbacks to this web source.

## Migration Example

See `examples/asset_manifest_snippet.xml` for a minimal Odoo asset inclusion.
