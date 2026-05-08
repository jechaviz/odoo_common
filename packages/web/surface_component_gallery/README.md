# Common Component Gallery Surface

Surface web reusable para explorar componentes `odoo_common` como una galeria tipo Storybook y ejecutar un wizard de instalacion sin meter reglas de negocio en common.

## Contrato Publico

El paquete expone en `window.odooCommonComponentGallery`:

- `renderCommonComponentGalleryMarkup(model, state)`
- `mountCommonComponentGallery(root, config)`
- `normalizeCommonComponentGalleryModel(model)`

## Responsabilidad

- renderizar secciones por runtime
- mostrar componentes, features y origenes
- mantener seleccion de componente
- capturar target del wizard
- renderizar plan de instalacion y pasos
- invocar callbacks de host para plan, revision IA y ejecucion de pasos

## No Incluye

- RPC
- publicacion de assets
- instalacion real
- defaults FIAX/rental/verticales
- soporte legacy o aliases historicos

El host debe proveer callbacks como `onBuildPlan`, `onAiReview` y `onStepAction`. Eso mantiene `common` reutilizable y deja el negocio en el consumidor.

## App De Producto

El paquete Python `common-component-gallery` puede empaquetar este surface como addon Odoo base-only (`x_odoo_common_gallery`) usando `odoo-app-bridge`. El surface no ejecuta instalaciones; publica eventos y deja que adapters externos conecten Codex Goal, Kilo u otro orquestador.
