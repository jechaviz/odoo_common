# Workflow Config Helpers

Helpers canonicos para declarar pasos de workflow y construir expresiones XML de visibilidad.

## Contrato publico

El modulo expone:

- `WorkflowStepSpec`
- `index_workflow_steps(steps)`
- `workflow_step_selection_options(steps)`
- `workflow_step_field_label(steps, key, default="")`
- `workflow_step_action_label(steps, key, default="")`
- `workflow_step_menu_label(steps, key, default="")`
- `selection_field_invisible_when_not_in(field_name, allowed_values, enabled=True)`
- `xml_invisible_attr(expression)`

## Responsabilidad

- normalizar specs de pasos con key estable
- rechazar keys duplicadas
- derivar opciones de campos selection
- resolver labels por uso
- construir expresiones `invisible` para selection-like fields

## No Incluye

- estados de negocio predefinidos
- inferencia desde labels visibles
- dominios complejos
- fallback a workflow legacy
- side effects sobre vistas o acciones
