# Line Picker Surface

Runtime canonico para autoabrir y sincronizar line pickers dentro de formularios managed.

## Dependencias

Este paquete requiere `surface-workspace-shell` porque consume el bootstrap compartido en `window.OdooSurfaceLayers`:

- `normalizeLabel`
- `registerManagedFormEnhancer`

## Contrato

Publica helpers sobre `window.OdooSurfaceLayers`:

- `buildLinePickerConfig(rawConfig)`
- `syncManagedLinePickers(config, state)`

El enhancer registrado es `entryPicker` y solo recibe configuracion declarativa:

- `x2manyField`
- `itemField`
- `addLineLabels`
- `fieldSelector`
- `autoOpenOnAdd`
- `autoOpenOnFocus`
