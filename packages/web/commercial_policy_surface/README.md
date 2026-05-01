# Commercial Policy Surface Bridge

Puente web canonico para sincronizar una asignacion de politica comercial entre:

- un registro fuente que puede requerir un server action previo
- un formulario destino que necesita write-back o hydration visual

## Contrato

Publica `window.OdooSurfaceLayers` con:

- `buildCommercialPolicySurfaceBridge(spec)`
- `installCommercialPolicySurfaceBridge(spec)`

## Server Action Injection

La inyeccion del `ir.actions.server` es opcional y entra por `spec` de una de estas dos formas:

- `sourceActionId`
  - ID numerico ya resuelto
- `resolveSourceActionId()`
  - resolver lazy para cuando el adapter obtiene el ID en runtime

Si el bridge recibe un action ID valido, ejecuta:

- modelo: `ir.actions.server`
- metodo: `run`
- contexto inyectado:
  - `active_model = sourceModel`
  - `active_id = sourceId`
  - `active_ids = [sourceId]`

Si no se inyecta action ID, el bridge degrada a read/write e hydration visual sin correr server action.

## Spec minimo

```js
window.OdooSurfaceLayers.installCommercialPolicySurfaceBridge({
  sourceModel: "x_customer_policy_assignment",
  targetModel: "sale.order",
  resolveSourceActionId: function () {
    return window.CUSTOMER_POLICY_ACTION_ID || 0;
  },
  sourceFields: ["id", "display_name", "x_percent", "x_program_id"],
  sourceProgramFieldName: "x_program_id",
  sourcePercentFieldName: "x_percent",
  targetAssignmentFieldName: "x_policy_assignment_id",
  targetWriteBackFields: {
    assignment: "x_policy_assignment_id",
    program: "x_policy_program_id",
    percent: "x_policy_percent",
  },
  watchedFieldNames: ["x_policy_assignment_id", "partner_id"],
  isManagedRoute: function () {
    return true;
  },
  resolveManagedRecordId: function () {
    return 0;
  },
  resolveOrmService: function () {
    return window.resolveOrmService();
  },
  resolveRecordRoot: function () {
    return window.resolveVisibleFormController().model.root;
  },
  setPreviewValue: function (fieldName, value, options) {
    return window.setFormFieldPreviewValue(fieldName, value, options);
  },
});
```

## Nota

Los nombres de modelo, campos, labels y hooks de UX entran por `spec`; el paquete canonico no debe codificar copy ni nombres de negocio del proyecto.

## Relacion con el legado

`commercial-policy-surface` reemplaza para integraciones nuevas al runtime derivado `customer-defaults-web`.
