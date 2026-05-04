# Odoo View Upserts

Helpers canonicos para crear o actualizar vistas Odoo desde specs explicitos.

## Contrato publico

El modulo expone:

- `ViewUpsertConnection`
- `ModelViewSpec`
- `QWebViewSpec`
- `upsert_model_view(conn, spec)`
- `upsert_qweb_view(conn, spec)`

## Connection Contract

El helper espera un objeto `conn` con estas operaciones:

- `search(model, domain, limit=None)`
- `write(model, ids, values)`
- `create(model, values)`

## Spec

`ModelViewSpec` usa el contrato de vistas de modelo con `arch`. `QWebViewSpec` usa el contrato QWeb con `arch_db` y `model=False`.

Los `extra_values` son permitidos, pero no pueden sobrescribir campos reservados del contrato base.

## Responsabilidad

- upsert exacto de vistas por `(name, model, type)`
- upsert exacto de vistas QWeb por `(name, type=qweb)`
- preservar `inherit_id`, `mode`, `active` y valores adicionales declarados

## No Incluye

- busqueda por `arch_db`
- limpieza de vistas legacy
- reuso por nombres historicos
- escritura con ID escalar alternativo
- deteccion de campos por version
