# Odoo Security Upserts

Helpers canonicos para publicar seguridad Odoo desde specs explicitos.

## Contrato publico

El modulo expone:

- `SecurityUpsertConnection`
- `ModuleCategorySpec`
- `SecurityGroupSpec`
- `ModelAccessSpec`
- `RecordRuleSpec`
- `normalize_record_ids(ids)`
- `resolve_model_id(conn, model_name)`
- `upsert_module_category(conn, spec)`
- `upsert_security_group(conn, spec)`
- `upsert_model_access(conn, spec)`
- `upsert_record_rule(conn, spec)`

## Connection Contract

El helper espera un objeto `conn` con estas operaciones:

- `search(model, domain, limit=None)`
- `search_read(model, domain, fields=None, limit=None, **kwargs)`
- `write(model, ids, values)`
- `create(model, values)`

## Spec

Las specs escriben exactamente las filas de `ir.module.category`, `res.groups`, `ir.model.access` e `ir.rule`.

Los `extra_values` son permitidos, pero no pueden sobrescribir campos reservados del contrato base.

## Responsabilidad

- upsert exacto de categorias por `name`
- upsert exacto de grupos por `name` y categoria declarada
- upsert exacto de accesos por `(name, model_id)`
- upsert exacto de reglas por `(name, model_id)`
- resolucion estricta de `ir.model`
- reemplazo exacto de grupos/implied groups con comandos `(6, 0, ids)`

## No Incluye

- asignacion de usuarios
- absorcion de usuarios/grupos historicos
- deteccion de campos por version
- ignorar XML IDs o modelos faltantes
- busquedas por nombres legacy
- limpieza de reglas, grupos o accesos obsoletos
