# Form Totals Surface

Superficie canonica para normalizar `tax_totals`, derivar filas visibles de impuestos y sincronizar un bloque DOM de totales sin acoplarlo a un proyecto concreto.

## Capacidades

- parseo robusto de `tax_totals` desde objeto o JSON string
- normalizacion de filas de impuestos por label/monto
- formatter monetario configurable
- renderer DOM declarativo para slots de desglose y fila fallback

## Contrato

- el host debe declarar el `root`, los selectores de slots/fallback y, si hace falta, su `replaceText`
- labels, formatter monetario y reglas de visibilidad entran por config
- no se permite wiring implícito por selectors de Rental ni helpers globales de negocio

## API publica

- `window.OdooSurfaceLayers.normalizeFormTotalsPayload`
- `window.OdooSurfaceLayers.collectFormTotalsTaxRows`
- `window.OdooSurfaceLayers.formatFormTotalsMonetaryValue`
- `window.OdooSurfaceLayers.buildFormTotalsSurface`
