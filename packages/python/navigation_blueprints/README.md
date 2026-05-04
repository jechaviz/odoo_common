# Navigation Blueprints

Helpers canonicos para declarar acciones y menus Odoo como blueprints keyed antes de resolver IDs o publicar registros.

## Contrato Publico

El modulo expone:

- `WindowActionBlueprint`
- `ContainerMenuBlueprint`
- `ActionMenuBlueprint`
- `build_window_action_blueprint(...)`
- `build_container_menu_blueprint(...)`
- `build_action_menu_blueprint(...)`
- `index_blueprints_by_key(blueprints)`

## Responsabilidad

- normalizar blueprints con `key` estable
- declarar acciones `ir.actions.act_window` sin tocar Odoo
- declarar menus contenedores
- declarar menus que apuntan a una action por `action_key`
- detectar keys duplicadas antes de publicar

## No Incluye

- arboles de menu de negocio
- resolucion de IDs
- upserts de `ir.actions.*` o `ir.ui.menu`
- aliases de keys
- fallback por nombres historicos

Combinar con `action-menu-upserts` en el adapter del proyecto cuando ya existan IDs resueltos.
