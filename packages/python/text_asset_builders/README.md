# Manifest Text Asset Builders

Helpers canonicos para ensamblar assets de texto desde un manifest JSON con orden explicito.

## Contrato publico

El modulo expone:

- `load_text_asset_module_order(manifest_path, key="modules")`
- `assemble_text_modules(source_root, module_order, separator="", strip_trailing=False, append_final_newline=True)`
- `build_text_asset_manifest_payload(repo_root, target_path, assembled_text, module_details)`
- `write_text_asset_build_manifest(repo_root, target_path, build_manifest_path, assembled_text, module_details)`

## Responsabilidad

- leer un orden de modulos desde JSON
- rechazar manifests sin modulos validos
- concatenar modulos de texto en orden declarado
- devolver metadata de lineas/bytes por modulo
- calcular `sha1` del asset ensamblado

## No Incluye

- globbing de archivos
- ordenamiento inferido por nombre
- transformaciones JS/CSS
- publicacion en Odoo
- fallbacks a manifests historicos
