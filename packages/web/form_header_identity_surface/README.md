# Form Header Identity Surface

Runtime canonico para sincronizar identidad de formulario desde controles de header declarativos.

Este paquete extrae solo comportamiento reusable:
- estilos del bloque `data-surface-header-identity`
- lectura de slots `data-surface-header-identity`
- bridge de eventos para campos observados
- sincronizacion opcional de titulo del documento
- sincronizacion opcional del breadcrumb actual

No incluye:
- defaults
- generacion de series o referencias
- heuristicas de negocio
- logica server-side
- globals legacy o aliases

## Dependencias

Requiere `surface-workspace-shell` y consume unicamente APIs canonicas de `window.OdooSurfaceLayers`:
- `registerManagedFormEnhancer`
- `readFieldText`
- `resolveScopedControlPanel`
- `syncCanonicalBreadcrumb`

## API exportada

- `buildFormHeaderIdentityAdapter(rawSpec)`
- `buildFormHeaderIdentityConfig(rawSpec)`
- `readFormHeaderIdentityState(adapter, runtimeContext)`
- `syncFormHeaderIdentitySurface(rawSpec, runtimeContext)`
- `syncManagedFormHeaderIdentities(config, state)`

## Estilos canonicos

El paquete publica `form_header_identity.css` y es el unico owner permitido de:

- `o_surface_header_identity_controls`
- `o_surface_header_identity_control`
- `o_surface_header_identity_control_label`
- `data-surface-header-identity*`

`surface-workspace-shell` no debe volver a cargar estos selectores.

## Enhancer canonico

El enhancer registrado es `headerIdentity`.

Cada entrada declarativa en `managedFormEnhancers` debe usar:

- `enhancerKey: "headerIdentity"`

## Contrato de adapter

### Slots

`slots` acepta entradas por slot canonico, por ejemplo:

- `primary`
- `secondary`

Cada slot puede declarar:

- `fieldNames`
- `read`
- `formatValue`
- `fallback`

### Titulo

`title` puede declarar:

- `fieldNames`
- `read`
- `formatValue`
- `fallback`
- `targetSelector`
- `applyToDocumentTitle`

### Breadcrumb

`breadcrumb` puede declarar:

- `enabled`
- `items`
- `resolveItems`
- `current`
- `controlPanelSelector`

### Watch

`watchFieldNames` permite endurecer que campos disparan resincronizacion local.
Si no se declara, el runtime deriva el watch set desde `slots`, `title` y `breadcrumb.current`.

## Ejemplo minimo

```js
window.OdooSurfaceLayers.buildFormHeaderIdentityConfig({
  enhancerKey: "headerIdentity",
  watchFieldNames: ["x_series_id", "x_branch_id", "x_document_display_ref"],
  slots: {
    primary: {
      fieldNames: ["x_series_id"],
    },
    secondary: {
      fieldNames: ["x_branch_id"],
    },
  },
  title: {
    fieldNames: ["x_document_display_ref", "name"],
    fallback: "New",
    applyToDocumentTitle: true,
    targetSelector: ".o_surface_document_display_ref",
  },
  breadcrumb: {
    enabled: true,
    items: [
      { label: "Home", href: "/odoo", home: true },
      { label: "Orders", href: "/odoo/orders" },
    ],
    current: {
      fieldNames: ["x_document_display_ref", "name"],
      fallback: "New",
    },
  },
});
```
