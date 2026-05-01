# Form Section Headers Surface

Runtime canonico para decoracion de headers de seccion, colapso visual y resumen colapsado.

## Contrato

Publica `window.OdooFormSectionSurfaces` con:

- `configureSectionHeadersSurface(config)`
- `decorateSectionHeader(groupNode, headerNode, sectionKey, scopeKey, options)`
- `setGroupCollapsed(groupNode, headerNode, collapsed)`
- `bindSectionButtonActivation(buttonNode, handler)`
- `updateCollapsedSectionSummary(groupNode, headerNode, collapsed)`

## Hooks

El runtime evita acoplarse a persistencia o settings panels. Los consumidores pueden inyectar:

- `onToggleSectionClick(event, detail)`
- `onSectionSettingsClick(event, detail)`
- `canAccessSectionSettings(scopeKey, sectionKey, detail)`
- `bindSectionHoverState(groupNode)`
- `settingsIconClass`

Si no se inyecta handler de toggle, el paquete hace solo el colapso visual y emite `odoo:form-section-toggle`.

Si no se inyecta handler de settings, emite `odoo:form-section-settings`.

## Dependencias

No tiene dependencias estrictas. Si `form-section-visibility-surface` esta cargado, `decorateSectionHeader()` reaprovecha su hook de hover automaticamente.
