# Backend Web Asset Publisher

Helpers canonicos para publicar assets JS/CSS del backend Odoo desde specs explicitos.

## Contrato publico

El modulo expone:

- `BackendWebAssetSpec`
- `BackendWebAssetPublisherSpec`
- `BackendWebAssetPublishResult`
- `BackendWebAssetPublication`
- `BackendWebAssetConnection`
- `DEFAULT_BACKEND_WEB_ASSET_PUBLISHER_SPEC`
- `build_backend_web_asset_attachment_name(spec, checksum, publisher_spec=...)`
- `build_backend_web_asset_content_path(attachment_id, checksum, publisher_spec=...)`
- `guess_backend_web_asset_mimetype(relative_path)`
- `dedupe_backend_web_asset_specs(specs)`
- `compute_backend_web_asset_fingerprint(asset_root, specs, content_transform=None)`
- `replace_backend_web_asset_tokens(content, replacements, require_all=True)`
- `publish_backend_web_assets(conn, asset_root, specs, ...)`
- `upsert_backend_web_asset_attachment(conn, spec, ...)`
- `upsert_backend_ir_asset(conn, spec, web_path=..., publisher_spec=...)`
- `cleanup_stale_backend_ir_assets(conn, active_asset_names, managed_name_prefixes, ...)`
- `cleanup_stale_backend_asset_attachments(conn, active_attachment_names, ...)`

## Connection Contract

El helper espera un objeto `conn` con estas operaciones:

- `search_read(model, domain, fields, limit=None)`
- `write(model, ids, values)`
- `create(model, values)`
- `unlink(model, ids)`

No depende de mixins externos, introspeccion de campos ni wrappers de compatibilidad por version.

## Spec

`BackendWebAssetSpec` declara nombre, path relativo, mimetype, secuencia, bundle, directiva y target. El helper valida que el path sea relativo, que `before`/`after`/`replace` tengan `target`, y que no existan specs duplicados conflictivos para el mismo bundle/path.

`BackendWebAssetPublisherSpec` declara los modelos y valores modernos usados para `ir.attachment` e `ir.asset`. Si un tenant usa otro contrato, el adapter de proyecto debe pasar un spec propio.

## Responsabilidad

- leer assets desde un root explicito
- calcular checksum/fingerprint de contenido
- crear attachments con nombre estable por path + checksum
- publicar cada attachment como `ir.asset`
- limpiar assets/attachments stale solo cuando el caller declara prefijos gestionados
- aplicar transformaciones de contenido declaradas por el caller

## No Incluye

- inyeccion directa en `web.webclient_bootstrap`
- deteccion de variantes de templates
- fallback a campos antiguos de `ir.attachment`
- manifest builders acoplados a proyectos
- resolucion de action ids o tokens de negocio
