# Action And Menu Upserts

Helpers canonicos para crear o actualizar acciones y menus Odoo desde specs explicitos.

## Contrato publico

El modulo expone:

- `ActionMenuUpsertConnection`
- `ActionWindowSpec`
- `UrlActionSpec`
- `MenuSpec`
- `normalize_menu_group_ids(group_ids)`
- `build_action_reference(action_model_name, action_id)`
- `upsert_action_window(conn, spec)`
- `upsert_url_action(conn, spec)`
- `upsert_menu(conn, spec)`
- `set_menu_action(conn, menu_id, action_model_name, action_id)`
- `resolve_menu_path(conn, path)`

## Connection Contract

El helper espera un objeto `conn` con estas operaciones:

- `search(model, domain, limit=None)`
- `write(model, ids, values)`
- `create(model, values)`

## Responsabilidad

- upsert exacto de `ir.actions.act_window`
- upsert exacto de `ir.actions.act_url`
- upsert exacto de `ir.ui.menu`
- construir referencias `model,id` para acciones de menu
- escribir `group_ids` cuando el caller declara visibilidad por grupos
- resolver rutas de menus por nombres y padres exactos

## No Incluye

- nombres historicos alternos
- deteccion de `groups_id`
- limpieza/desactivacion de menus duplicados
- inferencia de parent por labels fuera de la ruta declarada
