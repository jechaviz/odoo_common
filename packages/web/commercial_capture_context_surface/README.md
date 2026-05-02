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
