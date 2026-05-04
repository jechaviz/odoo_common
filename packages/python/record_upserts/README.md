# Generic Odoo Record Upserts

Helpers canonicos para crear o actualizar registros Odoo desde un modelo, dominio exacto y payload explicito.

## Contrato publico

El modulo expone:

- `RecordUpsertConnection`
- `RecordUpsertSpec`
- `upsert_record(conn, spec)`
- `upsert_records(conn, specs)`

## Connection Contract

El helper espera un objeto `conn` con estas operaciones:

- `search(model, domain, limit=None)`
- `write(model, ids, values)`
- `create(model, values)`

## Spec

`RecordUpsertSpec` declara `model_name`, `domain` y `values`. El dominio debe contener tripletas explicitas, porque este helper no interpreta dominios complejos ni decide identidad por el caller.

## Responsabilidad

- buscar un registro por dominio exacto
- crear si no existe
- actualizar si existe exactamente uno
- fallar si el dominio resuelve multiples registros

## No Incluye

- dry-run
- filtrado de campos por version
- dominios con operadores `|`, `&` o `!`
- resolucion de XML IDs
- limpieza de registros obsoletos
- defaults o transformaciones de negocio
