# Odoo Runtime Primitives

Helpers canonicos pequenos para construir literales de dominio, extraer snippets Python y normalizar shapes basicos de payloads RPC de Odoo.

## Contrato Publico

El modulo expone:

- `build_domain_literal(parts)`
- `build_or_domain_literal(parts)`
- `source_from_function(func)`
- `definition_from_function(func)`
- `extract_many2one_id(value)`

## Responsabilidad

- construir literales de dominio Odoo desde partes ya declaradas por el caller
- construir literales OR en formato prefix de Odoo
- extraer cuerpo o definicion completa de funciones Python para acciones servidor
- leer IDs desde payloads many2one RPC modernos (`id` o `[id, display_name]`)

## No Incluye

- conexion JSON-RPC
- dry-run
- busqueda de XML IDs
- introspeccion de modelos o campos
- aliases historicos
- inferencia de partes faltantes
- tolerancia a formatos legacy de acciones servidor
