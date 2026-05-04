# Record Context Layout Contract

## Panel Root

El panel debe declarar:

- `data-surface-record-context-panel="1"`
- `data-surface-record-context-layout`

Layout canonico actual:

- `detail-list`

## Cards

Los cards dentro del stack deben declarar:

- `data-surface-record-context-card`

El key del card es libre y pertenece al adapter del proyecto. Ejemplos de fixture, no enum canonico:

- `billing`
- `shipping`
- `commercial`

## Slot Markers

El runtime shared hidrata slots por attrs canonicos. Los proyectos pueden usar solo los que necesiten:

- `data-surface-record-context-primary-name`
- `data-surface-record-context-primary-details`
- `data-surface-record-context-secondary-name`
- `data-surface-record-context-secondary-details`
- `data-surface-record-context-identifier`
- `data-surface-record-context-reference`
- `data-surface-record-context-reference-meta`
- `data-surface-record-context-condition`
- `data-surface-record-context-condition-meta`
- `data-surface-record-context-note`

## Regla

Los attrs canonicos describen estructura y puntos de hidratacion. El runtime shared no debe depender de labels, copy, orden o keys de card especificos de negocio.
