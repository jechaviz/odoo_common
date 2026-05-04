# Line Picker Surface

Runtime canonico para autoabrir y sincronizar line pickers dentro de formularios managed.

## Dependencias

Este paquete requiere `surface-workspace-shell` porque consume el bootstrap compartido en `window.OdooSurfaceLayers`:

- `registerManagedFormEnhancer`

## Contrato

Publica helpers sobre `window.OdooSurfaceLayers`:

- `buildLinePickerConfig(rawConfig)`
- `syncManagedLinePickers(config, state)`

El enhancer registrado es `entryPicker` y solo recibe configuracion declarativa:

- `x2manyField`
- `itemField`
- `fieldSelector`
- `addLineSelector`
- `editableRowSelector`
- `itemInputSelector`
- `autoOpenOnAdd`
- `autoOpenOnFocus`

El runtime no selecciona botones por label ni cae a cualquier `.o_field_x2many` o combobox generico. Si el x2many tiene varios botones de alta o markup excepcional, el adapter debe declarar `addLineSelector`, `fieldSelector`, `editableRowSelector` o `itemInputSelector` explicitamente.
