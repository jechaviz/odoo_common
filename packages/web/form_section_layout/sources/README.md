# Form Section Layout Sources

Implementacion modular del runtime `form_section_layout` dentro de `common`.

La persistencia server-side complementaria vive en el paquete Python `form-layout-state`.

## Source Of Truth

- `constants.js`, `state.js`, `drag_drop.js`
- `runtime/**/*.js`
- `styles/**/*.css`

## Arbol

- `runtime/`
  - `api/`: accesos a sesion y opciones relacionales
  - `ui/`: secciones, layouts, settings panel, statusbar y chatter
  - `subtotals/`: editor de subtotales y persistencia asociada
- `styles/`
  - hojas CSS por responsabilidad
- `preview/`
  - sandbox HTML de verificacion manual

## Nota de clasificacion

- la capa de secciones, visibilidad, settings panel y statusbar es reusable
- `runtime/subtotals/` todavia conserva presets de negocio y debe pasar por adapters o una extraccion adicional antes de tratarse como `canonical`
