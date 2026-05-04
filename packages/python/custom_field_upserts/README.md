# Custom Field Upserts

Helpers canonicos para crear o actualizar modelos manuales, campos manuales y selections Odoo desde specs explicitos.

## Contrato publico

El modulo expone:

- `CustomFieldUpsertConnection`
- `ManualModelSpec`
- `SelectionOption`
- `CustomFieldSpec`
- `CustomFieldUpsertResult`
- `build_selection_literal(selection_options)`
- `build_selection_reset_commands(selection_options)`
- `upsert_manual_model(conn, spec)`
- `upsert_custom_field(conn, spec)`
- `sync_selection_options(conn, field_id, selection_options)`

## Connection Contract

El helper espera un objeto `conn` con estas operaciones:

- `search(model, domain, limit=None)`
- `search_read(model, domain, fields, limit=None, **kwargs)`
- `write(model, ids, values)`
- `create(model, values)`
- `unlink(model, ids)`

## Responsabilidad

- upsert exacto de modelos manuales por nombre tecnico
- upsert exacto de campos manuales por `(model, name)`
- validar tipo y relacion de campos existentes
- serializar selections en literal Odoo
- reconciliar filas `ir.model.fields.selection`

## No Incluye

- migracion de valores selection legacy
- skip por modelos faltantes
- cambio silencioso de tipo de campo
- borrado de campos obsoletos
- filtrado de payload por campos disponibles
