# Form Action Bridge Surface

Runtime canonico para interceptar y ejecutar acciones de formulario sobre Odoo forms managed.

Este paquete extrae solo comportamiento reusable:
- deteccion declarativa de botones de accion en forms
- resolucion de controller/modelo/record actual
- persistencia opcional antes de disparar la accion
- handoff de server actions numericas via `ir.actions.server`
- ejecucion final de acciones Odoo o URLs

No incluye:
- nombres de proyecto
- heuristicas de negocio
- aliases legacy
- wiring de botones especificos por modulo
- rutas o labels hardcodeados de un dominio

## Dependencias

Requiere `surface-workspace-shell` y consume APIs canonicas de `window.OdooSurfaceLayers`:
- `registerManagedFormEnhancer`
- `resolveOdooService`
- `findVisibleForm`

## API exportada

- `buildFormActionBridgeConfig(rawSpec)`
- `normalizeFormActionBridgeSpec(rawSpec)`
- `readFormActionBridgeState(formRoot)`
- `resolveManagedFormActionMeta(button, runtimeContext)`
- `resolveManagedFormActionRequest(button, adapter, runtimeContext, meta)`
- `runManagedFormAction(button, rawSpec, runtimeContext)`
- `syncManagedFormActionBridges(config, state)`

## Enhancer canonico

El enhancer registrado es `formActionBridge`.

Cada entrada declarativa en `managedFormEnhancers` debe usar:

- `enhancerKey: "formActionBridge"`

## Contrato de adapter

### Seleccion y gating

- `bridgeKey`
- `formSelector`
- `buttonSelector`
- `saveButtonSelector`
- `busyAttr`
- `acceptButton(button, runtimeContext, meta, adapter)`

### Persistencia

- `persistBeforeAction`
- `waitForPersistMs`
- `shouldPersistBeforeAction(button, actionRequest, meta, runtimeContext, adapter)`

La persistencia intenta, en este orden:
- `modelRoot.save()`
- `controller.save()`
- click al boton nativo de guardar y espera del record id

### Resolucion de accion

- `resolveActionRequest(button, runtimeContext, meta, adapter)`
- `runServerActions`
- `resolveAdditionalContext(button, runtimeContext, meta, adapter)`

Si la accion es numerica y `runServerActions !== false`, el runtime ejecuta:

- `orm.call("ir.actions.server", "run", [[actionId]], { context })`

Si esa llamada devuelve una accion, el runtime la ejecuta.

### Hooks opcionales

- `onBeforeRun(payload)`
- `onAfterRun(payload)`
- `onError(payload)`

## Ejemplo minimo

```js
window.OdooSurfaceLayers.buildFormActionBridgeConfig({
  enhancerKey: "formActionBridge",
  buttonSelector: ".o_form_view button[type='action']",
  persistBeforeAction: true,
  resolveAdditionalContext: function (_button, _runtimeContext, meta) {
    return {
      active_model: meta.modelName,
      active_id: meta.recordId,
      active_ids: meta.recordId > 0 ? [meta.recordId] : [],
    };
  },
});
```
