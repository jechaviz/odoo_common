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

Servicios Odoo resueltos en runtime:
- `action`
- `orm`

Fallback opcional:
- si el caller no pasa `runtimeContext.controller`, el runtime puede inspeccionar `window.odoo.__WOWL_DEBUG__` para ubicar el `FormController` vivo cuando Odoo lo expone; los adapters deben preferir controller/actionService explicitos.

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

`key` no es alias canonico de `bridgeKey`; los adapters nuevos deben declarar `bridgeKey` si necesitan separar multiples bridges.

### Persistencia

- `persistBeforeAction`
- `waitForPersistMs`
- `shouldPersistBeforeAction(button, actionRequest, meta, runtimeContext, adapter)`

La persistencia intenta, en este orden:
- `modelRoot.save()`
- `controller.save()`
- click al boton nativo de guardar y espera del record id

### Resolucion de accion

- `actionRequest`
- `actionId`
- `allowButtonNameFallback`
- `resolveActionRequest(button, runtimeContext, meta, adapter)`
- `runServerActions`
- `contextAttribute`
- `parseButtonContext`
- `resolveAdditionalContext(button, runtimeContext, meta, adapter)`

Orden canonico:
- `resolveActionRequest(...)` si existe
- `actionRequest`/`actionId` declarativo
- `button.getAttribute("name")` solo si `allowButtonNameFallback !== false`

Si la accion es numerica y `runServerActions !== false`, el runtime ejecuta:

- `orm.call("ir.actions.server", "run", [[actionId]], { context })`

Si esa llamada devuelve una accion, el runtime la ejecuta.

El parser de contexto del boton solo lee `active_model`, `active_id` y `active_ids` desde el atributo declarado por `contextAttribute` (default `context`). Desactivar con `parseButtonContext: false` cuando el contexto de negocio venga completo desde `resolveAdditionalContext`.

### Hooks opcionales

- `onBeforeRun(payload)`
- `onAfterRun(payload)`
- `onError(payload)`

## Ejemplo minimo

```js
window.OdooSurfaceLayers.buildFormActionBridgeConfig({
  enhancerKey: "formActionBridge",
  bridgeKey: "server-action-bridge",
  buttonSelector: ".o_form_view button[type='action']",
  actionId: 123,
  allowButtonNameFallback: false,
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
