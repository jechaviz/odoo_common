# Assembly Guide

## Regla base

No ensamblar por proyecto fuente. Ensamblar por capacidad canónica.

## Capas canónicas

1. `surface-workspace-shell`
   - usar cuando el modulo necesita shell lateral, breadcrumb, toolbar nativa y workspaces
   - no asume ownership de panels de contexto, line picking ni defaults documentales

2. `line-picker-surface`
   - usar cuando el formulario necesita abrir y enfocar pickers de lineas editables dentro de un `x2many`
   - consume el runtime de `surface-workspace-shell`, pero no se ensambla implicito dentro de el
   - la configuracion debe entrar por `managedFormEnhancers` con claves explicitas de campo y picker

3. `record-context-surface`
   - usar cuando el formulario necesita un panel lateral o superior de contexto relacional/comercial
   - el panel debe declararse por schema de `slots`; no se ensambla implicito dentro del shell

4. `form-defaults-surface`
   - usar cuando el formulario necesita resolver, cachear y enriquecer `default_get`
   - separa carga de defaults del wiring visual del formulario

5. `form-preview-surface`
   - usar cuando el formulario necesita hidratar previews visibles o espejos readonly dentro del DOM
   - concentra lectura/escritura de field previews y visibilidad de nodos

6. `form-capture-shell-contract`
   - usar cuando el formulario necesita una composicion superior antes de sus lineas con `data-surface-form-shell="capture"` y controles de identidad en header
   - define el contrato canonico de markup/attrs; no agrega runtime ni copy de negocio

7. `commercial-policy-surface`
   - usar cuando el browser debe sincronizar politica comercial, assignment ids o hydration de previews desde acciones server-side
   - es la base canonica para nuevas integraciones; no volver a usar `customer-defaults-web`

8. `form-layout-surface`
   - usar cuando el formulario necesita runtime base de layout, coleccion de items, persistencia de orden y alcance compartido
   - es el core canonico sobre el que cuelgan headers, visibility, settings, chatter y subtotals

9. `form-section-headers-surface`
   - usar cuando el formulario necesita headers decorados y resumen colapsado de secciones

10. `form-section-visibility-surface`
   - usar cuando el formulario necesita mostrar/ocultar controles de seccion por hover, estado o contexto

11. `form-settings-panel-surface`
    - usar cuando el formulario necesita editor lateral de settings de seccion, layout o statusbar

12. `form-chatter-toggle-surface`
    - usar cuando el formulario necesita colapsar/expandir chatter sin acoplar ese comportamiento al layout shell

13. `form-subtotals-surface`
    - usar cuando el formulario necesita editor/layout de subtotales desacoplado del resto del section-layout legacy

14. `form-totals-surface`
    - usar cuando el formulario necesita normalizar `tax_totals`, derivar filas visibles de impuestos y sincronizar un bloque DOM de totales
    - es la superficie canonica para breakdown fiscal; no volver a ensamblar `form-totals`

15. `form-layout-state`
    - usar cuando el proyecto necesita sembrar o persistir desde servidor el estado compartido de layout
    - cubre labels de statusbar, layouts globales y normalizacion del payload persistido
    - al venderizar paquetes Python, este componente espera el namespace canonico `odoo_common`

16. `partner-defaults` + `commercial-policy-surface`
    - usar cuando el documento hereda defaults server-side desde el cliente y ademas necesita sync o hydration comercial en el browser
    - si ademas se quiere exponer ese contexto en un panel declarativo, agregar `record-context-surface`

17. `partner-language-defaults`
    - usar cuando el proyecto necesita gobernar el idioma canonico de nuevos partners y sembrar `res.partner.lang` por `ir.default`

18. `terms-and-conditions`
    - usar cuando el proyecto necesita un contrato comun para payload fuente y payload resuelto de terminos/condiciones
    - no es runtime JS; es un paquete `schema`

## Combinaciones recomendadas

### Documento transaccional

- `surface-workspace-shell`
- `line-picker-surface`
- `record-context-surface`
- `form-defaults-surface`
- `form-preview-surface`
- `form-capture-shell-contract`
- `commercial-policy-surface`
- `form-layout-surface`
- `form-section-headers-surface`
- `form-section-visibility-surface`
- `form-settings-panel-surface`
- `form-chatter-toggle-surface`
- `form-subtotals-surface`
- `form-totals-surface`
- `form-layout-state`
- `many2x-parent-form-autosave`
- `many2x-parent-form-autosave-python`
- `partner-defaults`
- `partner-language-defaults`
- `default-persistence`
- `terms-and-conditions`

### Formulario operativo editable

- `form-layout-surface`
- `form-section-headers-surface`
- `form-section-visibility-surface`
- `form-settings-panel-surface`
- `form-chatter-toggle-surface`
- `form-subtotals-surface`
- `form-totals-surface` si el formulario necesita breakdown de impuestos/totales fuera del renderer nativo
- `form-layout-state` si el proyecto necesita sembrar labels/layouts desde servidor
- `line-picker-surface` si el formulario tiene pickers inline dentro de lineas editables
- `many2x-parent-form-autosave`

### Panel de contexto relacional/comercial

- `record-context-surface`
- `form-preview-surface`
- `partner-defaults` si el panel depende de defaults server-side por cliente
- `commercial-policy-surface` si el panel expone politica comercial o hydration de browser

### Catalogo maestro

- `surface-workspace-shell`
- `partner-defaults` solo si el catalogo influye defaults de clientes

### Documentos guiados por terminos

- `terms-and-conditions`
- `partner-defaults` si la resolucion depende del cliente
- `commercial-policy-surface` si el payload resuelto tambien afecta previews o condiciones vivas del browser

## Trazas source-derived

Estas piezas siguen existiendo solo como traza de origen y no deben ser el camino preferente de nuevas integraciones:

- `form-section-layout` -> `form-layout-surface`, `form-section-headers-surface`, `form-section-visibility-surface`, `form-settings-panel-surface`, `form-chatter-toggle-surface`, `form-subtotals-surface`, `form-layout-state`
- `form-defaults` -> `form-defaults-surface`, `form-preview-surface`
- `form-totals` -> `form-totals-surface`
- `customer-defaults-web` -> `commercial-policy-surface`, `record-context-surface`, `form-preview-surface`, `partner-defaults`

Regla: si una integracion nueva necesita esas capacidades, debe ensamblar las superficies canonicas nuevas y no revivir la pieza source-derived. En particular, `form-totals` queda reemplazado por `form-totals-surface`.

## Regla de adaptadores

- la capa `common` no debe conocer nombres de negocio como `cfdi`, `rental`, `invoice`, `quotation`
- presets de subtotales, campos `x_*` y copy comercial deben quedarse en adapters del proyecto
- cada proyecto debe crear su adapter delgado y declarativo
- si una pieza necesita labels, modelos, campos o copy, eso entra por config
- para `surface-workspace-shell`, los adapters deben suministrar `workspaceKey`, breadcrumb keys y action/model state canonicos; no deben depender de `workspaceHint`, action ids alternos ni selectors fallback
- para `surface-workspace-shell`, la seccion activa del sidebar debe llegar por claves explicitas (`data-surface-sidebar-section-key`, `data-section`, breadcrumb section key o resolver explicito); no se debe ensamblar por labels del navbar ni por estado `active/show/aria-*`
- los popovers del sidebar deben tener owner trigger canonico y vivo; si un proyecto necesita rescatar owners desde otro estado, eso pertenece al adapter, no a `common`
- para `line-picker-surface`, los adapters deben declarar `managedFormEnhancers`, `x2manyField`, `itemField` y cualquier selector excepcional de forma explicita; no debe reabsorberse en wiring implicito del shell
- para `record-context-surface`, los adapters deben declarar `slots`, `valueKey`, readers relacionales y renderers explicitamente; no debe reabsorberse en presets del shell ni en wiring implicito por formulario
- para `form-defaults-surface` y `form-preview-surface`, los adapters deben declarar loaders, enrichers, field maps y preview targets explicitamente; no debe revivirse `form_context.js` ni wiring local ad hoc
- para `form-layout-surface` y sus paquetes hermanos, el host debe declarar access rules, persistence, settings metadata y editores por contratos explicitos; no debe reconstruirse el monolito de `form_section_layout`
- los modos de route presentation (`query`, `hash`, `path-tail`) permanecen solo porque son parte del contrato publico canonico del shell; no deben reinterpretarse como compatibilidad legacy del proyecto
