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

4. `record-context-layout-contract`
   - usar cuando el proyecto necesita un contrato declarativo de markup para paneles `record-context` con cards y slot markers
   - no agrega runtime; formaliza el layout que hidrata `record-context-surface`

5. `commercial-capture-context-surface`
   - usar cuando el formulario necesita un panel comercial de captura encima de `record-context-surface`
   - compone slots canonicos, enrichment de referencia comercial, resumen de condicion y layout/copy de captura sin reintroducir wiring legacy
   - depende semanticamente de `commercial-policy-surface` para copy canonico de politica comercial y render de notas
   - no absorbe policy sync, preview hydration ni server-action dispatch; esas capacidades se ensamblan aparte cuando hacen falta

6. `form-defaults-surface`
   - usar cuando el formulario necesita resolver, cachear y enriquecer `default_get`
   - separa carga de defaults del wiring visual del formulario

7. `form-preview-surface`
   - usar cuando el formulario necesita hidratar previews visibles o espejos readonly dentro del DOM
   - es una superficie consumible real en documentos transaccionales: resumenes comerciales, espejos de condiciones, referencias visibles y bloques de totales que dependen del estado vivo del browser
   - concentra lectura/escritura de field previews y visibilidad de nodos
   - el runtime canonico debe consumirse via `buildFormPreviewSurfaceAdapter(spec)` cuando el proyecto necesite un controller reusable y no solo helpers sueltos
   - no debe quedar implicita dentro de `commercial-policy-surface` ni de `form-totals-surface`; se ensambla explicita cuando el formulario necesita mirrors visibles

8. `form-header-identity-surface`
   - usar cuando el formulario necesita mantener sincronizados los controles de identidad del header, su referencia visible y el ultimo segmento navegable del breadcrumb
   - separa la logica viva de serie/sucursal/titulo del contrato de markup del shell de captura

9. `form-capture-shell-contract`
   - usar cuando el formulario necesita una composicion superior antes de sus lineas con `data-surface-form-shell="capture"` y controles de identidad en header
   - define el contrato canonico de markup/attrs; no agrega runtime ni copy de negocio
   - cuando esos controles deban vivir de forma interactiva, ensamblar tambien `form-header-identity-surface`

10. `form-action-bridge-surface`
   - usar cuando el formulario necesita despachar acciones server-side desde el browser sin acoplarse a wiring de negocio
   - concentra el handoff de payload, contexto y callbacks de accion; no absorbe sync comercial ni hydration de previews

11. `commercial-policy-surface`
   - usar cuando el browser debe sincronizar politica comercial, assignment ids o hydration de previews
   - tambien es la fuente canonica de copy y nota compartida para superficies comerciales de captura
   - si esa superficie necesita disparar acciones server-side, ensamblar tambien `form-action-bridge-surface`
   - es la base canonica para nuevas integraciones; no volver a usar `customer-defaults-web`

12. `form-layout-surface`
   - usar cuando el formulario necesita runtime base de layout, coleccion de items, persistencia de orden y alcance compartido
   - es el core canonico sobre el que cuelgan headers, visibility, settings, chatter y subtotals

13. `form-section-headers-surface`
   - usar cuando el formulario necesita headers decorados y resumen colapsado de secciones

14. `form-section-visibility-surface`
   - usar cuando el formulario necesita mostrar/ocultar controles de seccion por hover, estado o contexto

15. `form-settings-panel-surface`
    - usar cuando el formulario necesita editor lateral de settings de seccion, layout o statusbar

16. `form-chatter-toggle-surface`
    - usar cuando el formulario necesita colapsar/expandir chatter sin acoplar ese comportamiento al layout shell

17. `form-subtotals-surface`
    - usar cuando el formulario necesita editor/layout de subtotales desacoplado del resto del section-layout legacy
    - el consumo canonico debe entrar por `buildFormSubtotalsSurfaceAdapter(spec)` cuando el proyecto necesite orchestration reusable y no solo acceso directo al runtime interno del layout
    - si se consume el adapter canonico, debe cargarse tambien `surface-workspace-shell` porque la API shared vive en `window.OdooSurfaceLayers`

18. `form-totals-surface`
    - usar cuando el formulario necesita normalizar `tax_totals`, derivar filas visibles de impuestos y sincronizar un bloque DOM de totales
    - el consumo canonico debe entrar por `buildFormTotalsSurfaceAdapter(spec)` cuando el proyecto necesite un controller reusable y no solo un renderer con `root` ya resuelto
    - es la superficie canonica para breakdown fiscal; no volver a ensamblar `form-totals`

19. `form-layout-state`
    - usar cuando el proyecto necesita sembrar o persistir desde servidor el estado compartido de layout
    - cubre labels de statusbar, layouts globales y normalizacion del payload persistido
    - al venderizar paquetes Python, este componente espera el namespace canonico `odoo_common`

20. `partner-defaults` + `commercial-policy-surface`
    - usar cuando el documento hereda defaults server-side desde el cliente y ademas necesita sync o hydration comercial en el browser
    - si ademas se quiere exponer ese contexto en un panel declarativo, agregar `record-context-surface` y `commercial-capture-context-surface`
    - si ademas se quieren disparar acciones server-side desde esa capa, agregar `form-action-bridge-surface`

21. `partner-language-defaults`
    - usar cuando el proyecto necesita gobernar el idioma canonico de nuevos partners y sembrar `res.partner.lang` por `ir.default`

22. `terms-and-conditions`
   - usar cuando el proyecto necesita un contrato comun para payload fuente y payload resuelto de terminos/condiciones
   - no es runtime JS; es un paquete `schema`

## Combinaciones recomendadas

### Documento transaccional

- `surface-workspace-shell`
- `line-picker-surface`
- `record-context-surface`
- `record-context-layout-contract`
- `commercial-capture-context-surface`
- `form-defaults-surface`
- `form-preview-surface`
- `form-header-identity-surface`
- `form-capture-shell-contract`
- `form-action-bridge-surface`
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

Regla adicional:
- si el documento expone mirrors readonly de condiciones, referencias comerciales, totales o bloques previos/posteriores a lineas, `form-preview-surface` no es opcional cosmetica; es la superficie canonica que debe ensamblarse explicitamente

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

### Captura comercial contextual

- `surface-workspace-shell`
- `record-context-surface`
- `record-context-layout-contract`
- `commercial-policy-surface`
- `commercial-capture-context-surface`

### Panel de contexto relacional/comercial

- `record-context-surface`
- `record-context-layout-contract`
- `commercial-policy-surface` para copy, nota y semantica canonica de politica comercial
- `commercial-capture-context-surface` para componer el panel comercial de captura con referencia, condiciones y slots reutilizables
- `form-preview-surface`
- `partner-defaults` si el panel depende de defaults server-side por cliente
- `commercial-policy-surface` si el panel ademas expone policy sync o hydration de browser
- `form-action-bridge-surface` si el panel tambien dispara acciones server-side desde el browser

### Preview transaccional puro

- `form-preview-surface`
- `commercial-policy-surface` si el preview depende de politica comercial o defaults vivos del browser
- `form-totals-surface` si el preview necesita breakdown fiscal o totales visibles sincronizados

Usar esta combinacion cuando el formulario no necesita todo el shell de captura, pero si necesita espejos readonly consistentes durante la edicion de un documento transaccional.

### Catalogo maestro

- `surface-workspace-shell`
- `partner-defaults` solo si el catalogo influye defaults de clientes

### Documentos guiados por terminos

- `terms-and-conditions`
- `partner-defaults` si la resolucion depende del cliente
- `commercial-policy-surface` si el payload resuelto tambien afecta previews o condiciones vivas del browser
- `form-action-bridge-surface` si el flujo tambien necesita despachar acciones server-side desde el formulario

## Trazas source-derived

Estas piezas siguen existiendo solo como traza de origen y no deben ser el camino preferente de nuevas integraciones:

- `form-section-layout` -> `form-layout-surface`, `form-section-headers-surface`, `form-section-visibility-surface`, `form-settings-panel-surface`, `form-chatter-toggle-surface`, `form-subtotals-surface`, `form-layout-state`
- `form-defaults` -> `form-defaults-surface`, `form-preview-surface`, `form-header-identity-surface`
- `form-totals` -> `form-totals-surface`
- `customer-defaults-web` -> `commercial-policy-surface`, `form-action-bridge-surface`, `record-context-surface`, `form-preview-surface`, `partner-defaults`

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
- para `commercial-capture-context-surface`, los adapters deben declarar `panelSelector`, `recordModel`, `recordFieldMap`, `partnerFieldMap`, `formFieldMap`, `referenceMeta` y cualquier `slotOverrides` de forma explicita; el copy/noise compartido de politica comercial vive en `commercial-policy-surface`, no en presets inline del proyecto
- para `form-defaults-surface` y `form-preview-surface`, los adapters deben declarar loaders, enrichers, field maps, preview targets y cualquier formatter/writer explicitamente; no debe revivirse `form_context.js` ni wiring local ad hoc
- para `form-preview-surface`, los adapters de documentos transaccionales deben declarar que bloques readonly consumen el estado vivo del formulario y que targets son responsabilidad del preview layer; no debe esconderse esa sincronizacion en renderers locales de invoice, quotation, rental o similares
- para `form-subtotals-surface`, los adapters deben declarar `root`/`selector`/`resolveRoot`, `scopeKey` o `resolveScopeKey`, cualquier `fieldDisplayNormalizers` y cualquier hook de proceso explicitamente; no debe revivirse wiring local alrededor de `processFormSubtotals(...)` ni normalizadores de display atados a campos `x_*`
- para `form-totals-surface`, los adapters deben declarar `selector` o `resolveRoot`, `rowSelector`, `fallbackSelector` y cualquier formatter monetario o hook de visibilidad explicitamente; no debe revivirse el wiring inline de `form_totals.js`
- para `form-header-identity-surface`, los adapters deben declarar `fieldMap`, `displayRefBuilder`, `documentSeriesNormalizer`, `breadcrumbRoot`, `titleSync` y cualquier hook opcional de persistencia de forma explicita; no debe revivirse la heuristica Rental del header ni wiring por labels del breadcrumb
- para `form-action-bridge-surface`, los adapters deben declarar `actionId`, `payloadBuilder`, `contextBuilder`, `successHandler` y cualquier gating o confirmacion de forma explicita; no debe esconderse dentro de `commercial-policy-surface` ni revivir puentes implicitos por nombre de boton o callback legacy
- para `form-layout-surface` y sus paquetes hermanos, el host debe declarar access rules, persistence, settings metadata y editores por contratos explicitos; no debe reconstruirse el monolito de `form_section_layout`
- los modos de route presentation (`query`, `hash`, `path-tail`) permanecen solo porque son parte del contrato publico canonico del shell; no deben reinterpretarse como compatibilidad legacy del proyecto
