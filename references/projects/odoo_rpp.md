# Source Project: odoo_rpp

Workspace actual:

- `C:\git\customers\yo\odoo_rpp`

Rol principal en `common`:

- runtime modular de layout de secciones
- chatter collapse
- visibilidad de secciones y settings panel
- defaults y autofill del lado servidor

Origen principal:

- `lib/odoo/web/form_section_layout`
- `lib/python/odoo_reusable`

Nivel actual:

- trazabilidad/archivo source-derived para `packages/web/form_section_layout`; no es ruta recomendada de ensamblaje
- base canonica para `packages/web/form_layout_surface`
- base canonica para `packages/web/form_section_headers_surface`
- base canonica para `packages/web/form_section_visibility_surface`
- base canonica para `packages/web/form_settings_panel_surface`
- base canonica para `packages/web/form_chatter_toggle_surface`
- base canonica para `packages/web/form_subtotals_surface`
- base canonica para `packages/web/many2x_parent_form_autosave`
- base canonica para `packages/python/form_layout_state`
- base canonica para `packages/python/default_persistence`
- base canonica para `packages/python/many2x_parent_form_autosave`
- base canonica para `packages/python/partner_defaults`
- base canonica para `packages/python/taxation`
- base canonica para `packages/python/odoo_runtime_primitives`
- base canonica para `packages/python/tax_upserts`
- base canonica para `packages/python/binary_attachment_upserts`
- base canonica para `packages/python/backend_web_assets`
- base canonica para `packages/python/automation_upserts`
- base canonica para `packages/python/cron_upserts`
- base canonica para `packages/python/registry_lookup`
- base canonica para `packages/python/product_catalog_upserts`
- base canonica para `packages/python/sequence_upserts`
- base canonica para `packages/python/survey_upserts`
- base canonica para `packages/python/action_menu_upserts`
- base canonica para `packages/python/view_upserts`
- base canonica para `packages/python/custom_field_upserts`
- base canonica para `packages/python/security_upserts`

Regla de consumo:

- nuevas integraciones deben usar las superficies canonicas listadas arriba y no el monolito source-derived archivado
