# Odoo Sequence Upserts

Helpers canonicos para publicar secuencias `ir.sequence` desde specs explicitos.

## Contrato publico

El modulo expone:

- `SequenceUpsertConnection`
- `SequenceSpec`
- `upsert_sequence(conn, spec)`

## Connection Contract

El helper espera un objeto `conn` con estas operaciones:

- `search(model, domain, limit=None)`
- `write(model, ids, values)`
- `create(model, values)`

## Spec

`SequenceSpec` escribe `name`, `code`, `prefix`, `suffix`, `padding`, `number_next`, `number_increment`, `implementation` y `company_id`.

Los `extra_values` son permitidos, pero no pueden sobrescribir campos reservados del contrato base.

## Responsabilidad

- upsert exacto de secuencias por `(code, company_id)`
- normalizar numeros de secuencia a enteros positivos
- publicar contrato moderno de `ir.sequence`

## No Incluye

- asignar secuencias a modelos negocio
- calcular el siguiente numero escaneando registros
- slugify de codigos de proyecto
- deteccion de campos por version
- compatibilidad con `number_next_actual`
