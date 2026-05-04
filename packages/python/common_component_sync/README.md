# Common Component Sync

Helpers canonicos para sincronizar componentes de `odoo_common` hacia un repo consumidor desde un manifest declarativo.

## Contrato Publico

El modulo expone:

- `CommonSyncEntry`
- `CommonComponentPackage`
- `CommonSyncFileBinding`
- `load_common_sync_entries(manifest_path)`
- `load_common_component_catalog(common_root)`
- `resolve_common_component_package(common_root, component_key)`
- `resolve_common_component_source_root(common_root, component_key)`
- `build_common_sync_file_bindings(project_root, common_root, entries)`
- `sync_common_packages(project_root, common_root, entries)`
- `resolve_default_common_root()`

## Responsabilidad

- leer manifests de consumidor con `component_key`, `target_relative`, `mode` y `prune`
- resolver componentes contra `catalog/components.json` y `manifest.json`
- respetar dependencias declaradas por paquete
- preservar `publish_order` de assets web
- detectar colisiones de targets entre paquetes
- copiar exports canonicos y podar archivos generados obsoletos solo dentro del target declarado

## No Incluye

- imports ad hoc por `sys.path`
- aliases de componentes
- source-derived como target valido de sync
- fallbacks a rutas historicas
- decisiones de negocio del consumidor
- limpieza fuera del target declarado

Los consumidores deben pasar `common_root` explicitamente o definir `ODOO_COMMON_ROOT`. Cuando se ejecuta dentro del checkout de `common`, el root se infiere por `catalog/components.json`.
