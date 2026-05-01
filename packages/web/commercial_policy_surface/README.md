# Commercial Policy Surface Bridge

Puente web canonico para sincronizar una asignacion de politica comercial entre:

- un registro fuente que puede requerir un server action previo
- un formulario destino que necesita write-back o hydration visual

## Contrato

Publica `window.OdooSurfaceLayers` con:

- `buildCommercialPolicySurfaceBridge(spec)`
- `installCommercialPolicySurfaceBridge(spec)`

## Dependencias

Este paquete requiere el bootstrap canonico de `surface-workspace-shell`, porque consume helpers de `window.OdooSurfaceLayers`:

- `normalizeMany2oneValue`
- `resolveOdooService`

## Server Action Injection

La inyeccion del `ir.actions.server` es opcional y entra por `spec.actions` de una de estas dos formas:

- `sourceActionId`
  - ID numerico ya resuelto
- `resolveSourceActionId()`
  - resolver lazy para cuando el adapter obtiene el ID en runtime

Si el bridge recibe un action ID valido, ejecuta:

- modelo: `ir.actions.server`
- metodo: `run`
- contexto inyectado:
  - `active_model = source.model`
  - `active_id = sourceId`
  - `active_ids = [sourceId]`

Si no se inyecta action ID, el bridge degrada a read/write e hydration visual sin correr server action.

## Spec minimo

```js
window.OdooSurfaceLayers.installCommercialPolicySurfaceBridge({
  record: {
    resolveRoot: function () {
      return document.querySelector(".o_form_view .o_form_sheet_bg");
    },
    resolveManagedId: function () {
      return 0;
    },
  },
  source: {
    model: "x_customer_policy_assignment",
    fields: ["id", "display_name", "x_percent", "x_program_id"],
    labelFields: ["display_name", "name"],
    policyFieldMap: {
      program: "x_program_id",
      percent: "x_percent",
    },
  },
  target: {
    model: "sale.order",
    sourceFieldName: "x_policy_assignment_id",
    writeBackFieldMap: {
      source: "x_policy_assignment_id",
      program: "x_policy_program_id",
      percent: "x_policy_percent",
    },
  },
  actions: {
    resolveSourceActionId: function () {
      return window.CUSTOMER_POLICY_ACTION_ID || 0;
    },
  },
  preview: {
    setValue: function (fieldName, value, options) {
      return window.setFormFieldPreviewValue(fieldName, value, options);
    },
    sourceMappings: [],
    targetMappings: [],
  },
  behavior: {
    watchedFieldNames: ["x_policy_assignment_id", "partner_id"],
    isManagedRoute: function () {
      return true;
    },
    buildWritePayload: function () {
      return {};
    },
  },
});
```

## Nota

Los nombres de modelo, campos, labels y hooks de UX entran por `spec`; el paquete canonico no debe codificar copy ni nombres de negocio del proyecto.

## Relacion con el legado

`commercial-policy-surface` reemplaza para integraciones nuevas al runtime derivado `customer-defaults-web`.
