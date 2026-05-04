# Source Project: odoo_fiax

Workspace actual:

- `C:\git\customers\yo\odoo_fiax`

Rol principal en `common`:

- shell nativo de workspace
- breadcrumb y sidebar shell
- record context
- line picker
- forms de captura antes de lineas

Origen principal:

- `src/odoo_fiax_migration/web_assets/odoo_surface_layers`

Nivel actual:

- base canonica para `packages/web/surface_workspace_shell`
- base canonica para `packages/web/line_picker_surface`
- base canonica para `packages/web/record_context_surface`
- base canonica para `packages/web/commercial_capture_context_surface`
- base canonica para `packages/schema/form_capture_shell`
- base canonica para `packages/schema/record_context_layout`
- base canonica para `packages/python/common_component_sync`
- base canonica para `packages/python/view_fragment_assembly`
- base canonica para `packages/python/navigation_blueprints`
- mejora canonica en `packages/python/backend_web_assets`: derivar specs publicables desde bindings comunes sin bootstrap directo
- mejora canonica en `packages/python/registry_lookup`: resolver acciones/vistas exactas sin ids FIAX ni fallback
- mejora canonica en `packages/python/view_upserts`: publicar templates QWeb por `key` obligatorio

Definicion de consumo:

- `catalog/consumer_definitions/odoo_fiax.json`
- usa `common-component-sync` para traer snapshots generados desde `common`
- mantiene business/bridge assets en `src/odoo_fiax_migration/web_assets/*_native`
- prohibe sync de paquetes `source-derived` y copias manuales fuera del manifest
