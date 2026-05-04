# Odoo Tax Upserts

Helpers canonicos para publicar `account.tax.group` y `account.tax` desde specs explicitos.

## Contrato Publico

El modulo expone:

- `TaxUpsertConnection`
- `TaxGroupSpec`
- `TaxSpec`
- `upsert_tax_group(conn, spec)`
- `upsert_tax(conn, spec)`

## Connection Contract

El helper espera un objeto `conn` con estas operaciones:

- `search(model, domain, limit=None)`
- `write(model, ids, values)`
- `create(model, values)`

## Spec

`TaxGroupSpec` declara grupo fiscal por nombre, compania y pais.

`TaxSpec` declara impuesto por nombre, uso, compania y pais, con grupo fiscal explicito.

Los `extra_values` son permitidos, pero no pueden sobrescribir campos reservados del contrato base.

## Responsabilidad

- upsert exacto de grupos por `(name, company_id, country_id)`
- upsert exacto de impuestos por `(name, type_tax_use, company_id, country_id)`
- escribir `amount`, `amount_type`, `type_tax_use`, `tax_group_id` y flags declarados
- permitir cuentas/labels opcionales solo cuando el caller las declara

## No Incluye

- canon fiscal de pais/estado
- busqueda por XML ID
- deteccion de campos por version
- creacion por fallback de grupos fiscales
- copia de cuentas desde grupos referencia
- soporte de `state_id` opcional por localizacion
