# Odoo Report Upserts

Helpers canonicos para publicar formatos, layouts y acciones de reporte Odoo desde specs explicitos.

## Contrato publico

El modulo expone:

- `ReportUpsertConnection`
- `PaperformatSpec`
- `ReportLayoutSpec`
- `ReportActionSpec`
- `upsert_paperformat(conn, spec)`
- `upsert_report_layout(conn, spec)`
- `upsert_report_action(conn, spec)`

## Connection Contract

El helper espera un objeto `conn` con estas operaciones:

- `search(model, domain, limit=None)`
- `write(model, ids, values)`
- `create(model, values)`

## Spec

Las specs escriben `report.paperformat`, `report.layout` e `ir.actions.report`.

Los `extra_values` son permitidos, pero no pueden sobrescribir campos reservados del contrato base.

## Responsabilidad

- upsert exacto de paperformat por `name`
- upsert exacto de report layout por `name`
- upsert exacto de report action por `(report_name, model)`
- escribir binding y paperformat declarados
- preservar contratos QWeb modernos

## No Incluye

- mail templates
- fallback entre `report_template_ids` y `report_template`
- deteccion de campos por version
- busqueda por nombres legacy
- limpieza de reportes obsoletos
