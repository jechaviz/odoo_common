# Capture Shell Contract

## Root

El root canonico debe declararse sobre un contenedor de formulario superior con:

- `data-surface-form-shell="capture"`
- `data-surface-form-shell-layout`
- `data-surface-form-shell-anchor`

## Layouts Canonicos

- `two-column`

## Anchors Canonicos

- `before-lines`

## Columnas

Cada columna del shell debe declarar:

- `data-surface-form-column`
- `data-surface-form-column-role`

Valores canonicos observados hoy:

- slots:
  - `primary`
  - `secondary`
- roles:
  - `party`
  - `document`

Los proyectos pueden agregar roles/slots propios, pero no deben romper los nombres canonicos existentes.

## Section Titles

Los titulos de subseccion dentro del shell deben usar:

- `data-surface-form-section-title="1"`

Eso permite que la capa shared de CSS trate esos encabezados de manera uniforme, sin depender de `o_horizontal_separator` u otros separadores legacy del renderer nativo.

## Regla

El shell no debe cargar copy, defaults, queries ORM ni wiring de negocio. Solo define estructura y attrs para que las otras superficies shared se monten encima.
