# Odoo Cron Upserts

Helpers canonicos para publicar scheduled actions `ir.cron` basadas en codigo.

## Contrato publico

El modulo expone:

- `CronUpsertConnection`
- `CodeCronSpec`
- `resolve_model_id(conn, model_name)`
- `upsert_code_cron(conn, spec)`

## Connection Contract

El helper espera un objeto `conn` con estas operaciones:

- `search(model, domain, limit=None)`
- `search_read(model, domain, fields=None, limit=None, **kwargs)`
- `write(model, ids, values)`
- `create(model, values)`

## Spec

`CodeCronSpec` declara el nombre, modelo destino, codigo Python, usuario de ejecucion, intervalo, `numbercall`, `active` y `doall`.

Los `extra_values` son permitidos, pero no pueden sobrescribir campos reservados del contrato base.

## Responsabilidad

- resolver `ir.model` de forma estricta
- upsert exacto de `ir.cron` por `(name, model_id)`
- escribir crons modernos con `state="code"`
- exigir `user_id` explicito
- preservar intervalo y flags declarados

## No Incluye

- resolucion de usuario por XML ID
- fallback al primer usuario activo
- deteccion de campos por version
- retorno `0` cuando falta el modelo
- dry-run
- cron legacy con metodos/funciones antiguas
