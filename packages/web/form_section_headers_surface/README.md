# Form Section Headers Surface

Runtime canonico para decoracion de headers de seccion, colapso visual y resumen colapsado.

## Contrato

Publica `window.OdooFormSectionSurfaces` con:

- `configureSectionHeadersSurface(config)`
- `decorateSectionHeader(groupNode, headerNode, sectionKey, scopeKey, options)`
- `setGroupCollapsed(groupNode, headerNode, collapsed, options)`
- `bindSectionButtonActivation(buttonNode, handler)`
- `updateCollapsedSectionSummary(groupNode, headerNode, collapsed, options)`

## Hooks

El runtime evita acoplarse a persistencia o settings panels. Los consumidores pueden inyectar:

- `onToggleSectionClick(event, detail)`
- `onSectionSettingsClick(event, detail)`
- `canAccessSectionSettings(scopeKey, sectionKey, detail)`
- `bindSectionHoverState(groupNode)`
- `settingsIconClass`
- `label`
- `summaryFields`

Si no se inyecta handler de toggle, el paquete hace solo el colapso visual y emite `odoo:form-section-toggle`.

Si no se inyecta handler de settings, emite `odoo:form-section-settings`.

## Contrato explicito

- El label del header se lee solo de `options.label` o `data-lib-section-label`; no se infiere desde texto visible previo del header.
- El resumen colapsado se construye solo desde `summaryFields`.
- Cada entrada de `summaryFields` debe declarar `key` y `label`, mas `selector`, `resolveWidgets(groupNode, spec)` o `readValue(groupNode, fieldMeta)`.
- No hay autodeteccion por `.o_field_widget[name]`, `data-name`, labels `for`, ni nombres de campos prettificados.

## Dependencias

No tiene dependencias estrictas. Si `form-section-visibility-surface` esta cargado, `decorateSectionHeader()` reaprovecha su hook de hover automaticamente.
