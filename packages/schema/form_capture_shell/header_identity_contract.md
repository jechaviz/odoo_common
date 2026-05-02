# Header Identity Controls Contract

## Root

El grupo de identidad del header debe declarar:

- `data-surface-header-identity="1"`
- `data-surface-header-identity-layout`

Layout canonico actual:

- `pills`

## Slots

Cada control debe declarar:

- `data-surface-header-identity-slot`

Slots canonicos actuales:

- `primary`
- `secondary`

## Variants y Tone

Opcionalmente cada control puede declarar:

- `data-surface-header-identity-variant`
- `data-surface-header-identity-tone`

Valores canonicos actuales:

- variants:
  - `wide`
- tones:
  - `document`
  - `branch`

## Regla

Estos attrs describen jerarquia visual y composicion, no negocio. Labels, campos concretos y dominios pertenecen al adapter del proyecto.
