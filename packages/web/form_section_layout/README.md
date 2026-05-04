# Adaptive Form Section Layout

Runtime web para formularios Odoo con colapso de secciones, visibilidad, reordenamiento, settings panel y soporte de labels de statusbar.

Para persistencia compartida de layouts y labels desde servidor, ensamblar junto con `form-layout-state`.

## Arbol

- `manifest.json`
  - clasificacion y orden de publicacion del paquete
- `sources/constants.js`, `sources/state.js`, `sources/drag_drop.js`
  - atomos compartidos del runtime
- `sources/runtime/`
  - modulos JS por responsabilidad
- `sources/styles/`
  - estilos modulares
- `sources/form_section_layout.runtime.js`, `sources/form_section_layout.css`
  - artefactos publicados para consumo directo

## Clasificacion

- `source-derived`
- la base de layout es reusable, pero el editor de subtotales aun conserva presets y campos de negocio que deben salir a adapters antes de volver a `canonical`
- archivo de trazabilidad; no es una capa de soporte legacy

## Uso recomendado

- no ensamblar, publicar ni extender para compatibilidad legacy
- usar los reemplazos canonicos listados abajo

## Reemplazos canonicos

- `form-layout-surface`
- `form-section-headers-surface`
- `form-section-visibility-surface`
- `form-settings-panel-surface`
- `form-chatter-toggle-surface`
- `form-subtotals-surface`
- `form-layout-state`
