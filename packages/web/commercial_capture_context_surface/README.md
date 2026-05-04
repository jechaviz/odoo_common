# Commercial Capture Context Surface

Superficie canonica para especializar `record-context-surface` en formularios de captura con contexto comercial.

Esta capa resuelve tres cosas del panel:

- slots canonicos para referencia/condicion/nota
- enrichment generico de metadata de la referencia comercial
- comparacion entre condicion actual y default del contacto

## Contrato

Publica `window.OdooSurfaceLayers` con:

- `buildCommercialCaptureContextSlots(spec)`
- `buildCommercialCaptureContextEnricher(spec)`
- `buildCommercialCaptureContextAdapter(spec)`

## Dependencias

Este paquete requiere:

- `surface-workspace-shell`
- `record-context-surface`

## Spec canonico

El adapter compartido debe declarar de forma explicita la base de `record-context-surface`:

- `cacheScopeKey`
- `panelSelector`
- `recordModel`
- `recordFieldMap`
- `recordFields`
- `partnerFieldMap`
- `partnerFields`
- `formFieldMap`
- `watchFieldNames`
- `watch`

Y ademas los bloques propios de esta superficie:

- `referenceMeta`
- `copy`
- `slotOverrides`
- `noteRenderer`

`referenceMeta` gobierna el lookup y el resumen de la referencia comercial:

- `model`
- `nameField`
- `currencyField`
- `itemIdsField`
- `fields`
- `includeCurrencyInSummary`
- `includeItemCountInSummary`
- `summarySeparator`
- `itemCountSingularLabel`
- `itemCountPluralTemplate`

Para adapters nuevos, declara `nameField`, `currencyField` e `itemIdsField` aunque coincidan con los defaults historicos de Odoo (`name`, `currency_id`, `item_ids`). Si la referencia comercial no expone moneda o lista de items, pasa esa clave como string vacio para desactivar su lookup y evitar que el fallback vuelva a entrar.

`copy` fija el texto del panel de captura y compone la semantica canonica de politica comercial:

- `primaryNameFallback`
- `primaryDetailsFallback`
- `secondaryNameFallback`
- `secondaryDetailsFallback`
- `identifierFallback`
- `referenceFallback`
- `referenceMetaFallback`
- `conditionFallback`
- `conditionMetaFallback`
- `noteWithReferenceAndItems`
- `noteWithReferenceNoItems`
- `noteWithoutReference`
- `changedConditionLabel`
- `inheritedConditionLabel`
- `explicitConditionLabel`

## Auditoria de neutralidad

La auditoria de copy, campos y modelos queda asi:

- `recordModel`, `recordFieldMap`, `partnerFieldMap`, `formFieldMap`, `watchFieldNames` y `referenceMeta.model` entran por spec
- los campos de metadata de referencia entran por `referenceMeta.nameField`, `referenceMeta.currencyField`, `referenceMeta.itemIdsField` y `referenceMeta.fields`
- el resumen visual de metadata entra por `referenceMeta.includeCurrencyInSummary`, `referenceMeta.includeItemCountInSummary`, `referenceMeta.summarySeparator`, `referenceMeta.itemCountSingularLabel` y `referenceMeta.itemCountPluralTemplate`
- el copy del panel entra por `copy`; si una clave existe en `copy`, el runtime respeta su valor normalizado aunque sea vacio
- el copy y note renderer de politica comercial se componen desde `commercial-policy-surface`; no hay fallback chain local duplicada para esos textos

Los ejemplos de `account.move`, `product.pricelist`, `invoice_payment_term_id` y similares son solo muestra de adapter. El runtime canonico no debe asumir esos modelos ni campos.

## Spec minimo

```js
window.OdooSurfaceLayers.buildCommercialCaptureContextAdapter({
  cacheScopeKey: "invoice.customerContext",
  panelSelector: "[data-surface-record-context-panel='1']",
  recordModel: "account.move",
  recordFieldMap: {
    reference: "pricelist_id",
    defaultCondition: "partner_id.property_payment_term_id",
    currentCondition: "invoice_payment_term_id",
  },
  partnerFieldMap: {
    primaryName: "commercial_partner_id.display_name",
  },
  formFieldMap: {
    currentCondition: "invoice_payment_term_id",
  },
  watchFieldNames: ["partner_id", "invoice_payment_term_id", "pricelist_id"],
  referenceMeta: {
    model: "product.pricelist",
    nameField: "name",
    currencyField: "currency_id",
    itemIdsField: "item_ids",
    itemCountSingularLabel: "1 regla",
    itemCountPluralTemplate: "{count} reglas",
  },
  copy: {
    primaryNameFallback: "Cliente sin seleccionar",
  },
});
```

## Nota

Los labels, copy, modelos, field maps y texto de ayuda entran por `spec`; el paquete canonico no debe codificar nombres de negocio del proyecto.

## Limites

- no debe inferir selectors, labels ni ownership del panel desde markup legacy
- no absorbe policy-assignment sync ni preview hydration browser-side
- compone el copy y note renderer canonicos de `commercial-policy-surface`; si el proyecto necesita policy sync o preview hydration browser-side, debe ensamblar esas superficies aparte
