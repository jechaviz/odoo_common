# Odoo Survey Upserts

Helpers canonicos para publicar paginas, preguntas y respuestas de Survey desde specs explicitos.

## Contrato Publico

El modulo expone:

- `SurveyUpsertConnection`
- `SurveyPageSpec`
- `SurveyAnswerOption`
- `SurveyQuestionSpec`
- `upsert_survey_page(conn, spec)`
- `upsert_survey_question(conn, spec)`
- `sync_survey_answer_options(conn, question_id, answer_options)`

## Connection Contract

El helper espera un objeto `conn` con estas operaciones:

- `search(model, domain, limit=None)`
- `search_read(model, domain, fields=None, limit=None, **kwargs)`
- `write(model, ids, values)`
- `create(model, values)`
- `unlink(model, ids)`

## Spec

`SurveyPageSpec` y `SurveyQuestionSpec` escriben `survey.question`.

`SurveyAnswerOption` escribe `survey.question.answer` y se reconcilia por valor.

Los `extra_values` son permitidos, pero no pueden sobrescribir campos reservados del contrato base.

## Responsabilidad

- upsert exacto de paginas por `(survey_id, title, is_page=True)`
- upsert exacto de preguntas por `(survey_id, title, is_page=False)`
- reemplazo exacto de opciones por `value`, con secuencia declarada
- eliminar respuestas stale solo dentro de la reconciliacion explicita de opciones

## No Incluye

- generar preguntas desde settings
- detectar modelos survey instalados
- dry-run
- borrar paginas o preguntas stale
- inferir claves desde descripciones
