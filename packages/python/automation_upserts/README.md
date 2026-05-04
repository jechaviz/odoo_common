# Server Automation Upserts

Helpers canonicos para crear o actualizar acciones servidor y automatizaciones Odoo desde specs explicitos.

## Contrato publico

El modulo expone:

- `ServerActionSpec`
- `BaseAutomationSpec`
- `AutomationBundleSpec`
- `AutomationBundleResult`
- `AutomationUpsertConnection`
- `resolve_model_id(conn, model_name)`
- `resolve_model_field_ids(conn, model_name, field_names, require_all=True)`
- `upsert_server_action(conn, spec)`
- `upsert_base_automation(conn, spec, action_ids)`
- `sync_automation_bundle(conn, spec)`

## Connection Contract

El helper espera un objeto `conn` con estas operaciones:

- `search(model, domain, limit=None)`
- `search_read(model, domain, fields, limit=None)`
- `write(model, ids, values)`
- `create(model, values)`

## Spec

`ServerActionSpec` declara nombre, modelo, codigo, `usage`, binding y estado. El default de `usage` es `base_automation`; callers que necesitan acciones visibles en menu deben declarar `usage="ir_actions_server"` y `bind_to_model=True`.

`BaseAutomationSpec` declara nombre, modelo, trigger, dominio y campos de trigger. El helper usa el contrato moderno `trigger_field_ids`; no intenta mapear campos antiguos.

## Responsabilidad

- resolver `ir.model` por nombre tecnico
- resolver `ir.model.fields` declarados por nombre
- upsert de `ir.actions.server`
- upsert de `base.automation`
- sincronizar bundles de una accion servidor con una o mas automatizaciones

## No Incluye

- alias legacy de `usage`
- deteccion dinamica de variantes de campos de `base.automation`
- dry-run
- limpieza de acciones no declaradas
- builders de codigo de negocio
