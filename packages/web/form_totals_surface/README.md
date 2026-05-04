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
- labels, formatter monetario, payload envelope y reglas de visibilidad entran por config
- no se permite wiring implicito por selectors de proyecto ni helpers globales de negocio
- no hay aliases legacy implicitos: las claves fuera del contrato Odoo deben declararse en `payload`
- no hay label sintetico de impuesto: si el host necesita texto fallback, debe declararlo en `rows.fallbackLabel`

## API publica

- `window.OdooSurfaceLayers.normalizeFormTotalsPayload`
- `window.OdooSurfaceLayers.normalizeFormTotalsRowsSpec`
- `window.OdooSurfaceLayers.normalizeFormTotalsPayloadSpec`
- `window.OdooSurfaceLayers.normalizeFormTotalsPayloadEnvelope`
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
  payload: {
    taxTotalsKey: "tax_totals",
  },
});
```

El payload de `sync(...)` acepta por default:
- el objeto/JSON `tax_totals` directo
- un envelope con la clave Odoo `tax_totals`

Claves no Odoo deben entrar de forma explicita:
- `payload.taxTotalsKey` para envelopes con otro nombre de campo
- `payload.fallbackAmountKey` para mostrar una fila fallback cuando no hay grupos de impuestos

La extraccion de filas tambien es declarativa:
- `rows.subtotalsKey` default `subtotals`
- `rows.taxGroupsKey` default `tax_groups`
- `rows.groupsBySubtotalKey` solo se usa si el host lo declara explicitamente
- `rows.labelKeys` y `rows.amountKeys` definen el contrato de lectura
- `rows.fallbackLabel` es opt-in; si falta label, la fila se omite

Cada adapter debe declarar explicitamente:
- `selector` o `resolveRoot`
- `rowSelector`
- `fallbackSelector` si existe fila fallback
- `labelSelector`
- `amountSelector`
- `money`
- `rows`
- `payload`
- cualquier `beforeSync`, `afterSync` o `visibleWhen`

## Ejemplo de migracion

Ver `examples/canonical_totals_adapter.js` para un adapter minimo que consume `tax_totals` de Odoo sin alias legacy.

Checklist para consumidores:
- declarar slots de fila y fallback en el DOM con atributos estables
- pasar `tax_totals` directo o declarar `payload.taxTotalsKey`
- declarar `rows.fallbackLabel` si se desea mostrar fila fallback sin grupos de impuestos
- no leer labels desde texto visible ni usar selectores de proyecto como contrato compartido
