# Odoo Data Exchange Upserts

Helpers canonicos para publicar plantillas de exportacion e import mappings desde specs explicitos.

## Contrato publico

El modulo expone:

- `DataExchangeUpsertConnection`
- `ExportTemplateSpec`
- `ImportMappingSpec`
- `normalize_field_names(field_names)`
- `build_export_field_commands(field_names)`
- `upsert_export_template(conn, spec)`
- `upsert_import_mapping(conn, spec)`

## Connection Contract

El helper espera un objeto `conn` con estas operaciones:

- `search(model, domain, limit=None)`
- `write(model, ids, values)`
- `create(model, values)`

## Spec

`ExportTemplateSpec` escribe `ir.exports` y reemplaza exactamente sus `export_fields`.

`ImportMappingSpec` escribe `base_import.mapping` por modelo/columna.

Los `extra_values` son permitidos, pero no pueden sobrescribir campos reservados del contrato base.

## Responsabilidad

- upsert exacto de export templates por `(name, resource)`
- reset exacto de campos exportables con comandos `(5, 0, 0)` y `(0, 0, values)`
- upsert exacto de import mappings por `(res_model, column_name)`

## No Incluye

- dry-run
- alias de columnas
- inferencia de campos
- limpieza de mappings obsoletos
- tolerancia a campos vacios
