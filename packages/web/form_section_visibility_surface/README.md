# Form Section Visibility Surface

Runtime canonico para visibilidad hover de controles de seccion en formularios Odoo.

## Contrato

Publica `window.OdooFormSectionSurfaces` con:

- `clearVisibleSectionControls(exceptGroup)`
- `setVisibleSectionControls(groupNode)`
- `resolveSectionGroupFromNode(target)`
- `resolveSectionGroupFromPoint(clientX, clientY)`
- `syncHoveredSectionControlVisibility()`
- `bindSectionHoverState(groupNode)`
- `bindGlobalSectionControlVisibility()`

## Alcance

Este paquete solo contiene la sincronizacion visual de hover y el estado compartido minimo para:

- recordar el grupo actualmente hovered
- limpiar controles visibles cuando el puntero sale
- rehidratar visibilidad al redecorar una seccion
