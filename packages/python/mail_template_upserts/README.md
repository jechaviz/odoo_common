# Odoo Mail Template Upserts

Helpers canonicos para publicar `mail.template` desde specs explicitos.

## Contrato Publico

El modulo expone:

- `MailTemplateUpsertConnection`
- `MailTemplateSpec`
- `normalize_report_action_ids(report_action_ids)`
- `build_report_template_reset_commands(report_action_ids)`
- `upsert_mail_template(conn, spec)`

## Connection Contract

El helper espera un objeto `conn` con estas operaciones:

- `search(model, domain, limit=None)`
- `write(model, ids, values)`
- `create(model, values)`

## Spec

`MailTemplateSpec` escribe `name`, `model_id`, `subject`, `body_html` y campos opcionales declarados.

`report_action_ids=None` omite el enlace de reportes. Una tupla/lista vacia limpia `report_template_ids`.

Los `extra_values` son permitidos, pero no pueden sobrescribir campos reservados del contrato base.

## Responsabilidad

- upsert exacto de templates por `(name, model_id)`
- actualizar subject/body HTML
- escribir `report_template_ids` con comandos `(6, 0, ids)` cuando se declara
- escribir `report_name`, `email_from` y `email_to` solo cuando el caller los declara

## No Incluye

- resolucion por XML ID
- fallback al campo legacy `report_template`
- deteccion de campos por version
- inferencia de modelo por nombre tecnico
- plantillas de contenido especificas de negocio
