# Form Totals Surface

Superficie canonica para normalizar `tax_totals`, derivar filas visibles de impuestos y sincronizar un bloque DOM de totales sin acoplarlo a un proyecto concreto.

## Capacidades

- parseo robusto de `tax_totals` desde objeto o JSON string
- normalizacion de filas de impuestos por label/monto
- formatter monetario configurable
- renderer DOM declarativo para slots de desglose y fila fallback
- resolucion canonica del root para bloques de totales
- adapter reusable para formularios transaccionales

## Contrato

- el host debe declarar el `root` o su resolver, los selectores de slots/fallback y, si hace falta, su `replaceText`
- labels, formatter monetario y reglas de visibilidad entran por config
- no se permite wiring implicito por selectors de Rental ni helpers globales de negocio

## API publica

- `window.OdooSurfaceLayers.normalizeFormTotalsPayload`
- `window.OdooSurfaceLayers.collectFormTotalsTaxRows`
- `window.OdooSurfaceLayers.formatFormTotalsMonetaryValue`
- `window.OdooSurfaceLayers.resolveFormTotalsRoot`
- `window.OdooSurfaceLayers.normalizeFormTotalsSurfaceSpec`
- `window.OdooSurfaceLayers.buildFormTotalsSurface`
- `window.OdooSurfaceLayers.buildFormTotalsSurfaceAdapter`

## Runtime canonico

`form-totals-surface` ya no es solo un helper de parsing/render. El consumo canonico puede entrar por:

- `buildFormTotalsSurface(spec)`
  - cuando el host ya tiene `root` resuelto y solo necesita el renderer directo
- `buildFormTotalsSurfaceAdapter(spec)`
  - cuando el proyecto o una superficie shared necesita un controller reusable que resuelva el root en runtime

El adapter compartido expone:
- `sync(payload, options)`
- `clear(options)`
- `readState()`

### Spec minimo del adapter

```js
window.OdooSurfaceLayers.buildFormTotalsSurfaceAdapter({
  selector: ".o_form_view .o_tax_totals_surface",
  rowSelector: "tr[data-surface-tax-row='1']",
  fallbackSelector: "tr[data-surface-tax-fallback='1']",
});
```

El payload de `sync(...)` puede llegar como:
- `taxTotals`
- `tax_totals`
- `fallbackAmount`
- `amountTax`

Cada adapter debe declarar explicitamente:
- `selector` o `resolveRoot`
- `rowSelector`
- `fallbackSelector` si existe fila fallback
- `labelSelector`
- `amountSelector`
- `money`
- `rows`
- cualquier `beforeSync`, `afterSync` o `visibleWhen`
