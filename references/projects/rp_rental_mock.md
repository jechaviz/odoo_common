# Source Project: rp-rental-mock

Workspace actual:

- `C:\git\customers\yo\rp-rental-mock`

Rol principal en `common`:

- defaults de formulario
- previews de branch/series/document type
- tax breakdown de forms
- descuento comercial por cliente
- puente web de politica comercial

Origen principal:

- `odoo_migration/web_assets/rental_native_tabs`

Nivel actual:

- trazabilidad/archivo source-derived para `form-defaults`, `form-totals` y `customer-defaults-web`; no son rutas recomendadas de ensamblaje
- base canonica para `packages/web/form_defaults_surface`
- base canonica para `packages/web/form_preview_surface`
- base canonica para `packages/web/form_header_identity_surface`
- base canonica para `packages/web/form_action_bridge_surface`
- base canonica para `packages/web/commercial_policy_surface`
- base canonica para `packages/web/form_totals_surface`
- base canonica para `packages/python/partner_language_defaults`
- base canonica para `packages/python/tax_upserts`
- base canonica para `packages/python/binary_attachment_upserts`
- base canonica para `packages/python/backend_web_assets`
- base canonica para `packages/python/automation_upserts`
- base canonica para `packages/python/cron_upserts`
- base canonica para `packages/python/registry_lookup`
- base canonica para `packages/python/xmlid_upserts`
- base canonica para `packages/python/data_exchange_upserts`
- base canonica para `packages/python/product_catalog_upserts`
- base canonica para `packages/python/action_menu_upserts`
- base canonica para `packages/python/view_upserts`
- base canonica para `packages/python/report_upserts`
- base canonica para `packages/python/mail_template_upserts`
- base canonica para `packages/python/custom_field_upserts`
- base canonica para `packages/python/security_upserts`
- base canonica para `packages/schema/terms_conditions`

Regla de consumo:

- nuevas integraciones deben usar las superficies canonicas listadas arriba y no los paquetes source-derived archivados
