# Assembly Guide

## Regla base

No ensamblar por proyecto fuente. Ensamblar por capacidad.

## Capas

1. `surface-workspace-shell`
   - usar cuando el modulo necesita shell lateral, breadcrumb, toolbar nativa y workspaces
   - no asume ownership de panels de contexto de registro
   - no absorbe line picking ni enhancers de lineas editables

2. `line-picker-surface`
   - usar cuando el formulario necesita abrir y enfocar pickers de lineas editables dentro de un `x2many`
   - es un paquete web canonico separado del shell; consume el runtime de `surface-workspace-shell`, pero no se ensambla implicito dentro de el
   - la configuracion debe entrar por `managedFormEnhancers` con claves explicitas de campo y picker

3. `record-context-surface`
   - usar cuando el formulario necesita un panel lateral o superior de contexto relacional/comercial
   - el panel debe declararse por schema de `slots`; no se ensambla implicito dentro del shell
   - separa lectura relacional, render de slots y contexto comercial del workspace shell

4. `form-section-layout`
   - usar cuando el formulario necesita colapsar secciones, controlar visibilidad, mover layouts o colapsar chatter
   - hoy esta en `source-derived` porque el editor de subtotales aun conserva presets de negocio

5. `form-layout-state`
   - usar cuando el proyecto necesita sembrar o persistir desde servidor el estado compartido de `form-section-layout`
   - cubre labels de statusbar, layouts globales y normalizacion del payload persistido
   - al venderizar paquetes Python, este componente espera el namespace canonico `odoo_common`

6. `form-defaults`
   - usar cuando el formulario necesita hidratar defaults de `default_get`, sucursal, serie o tipo documental

7. `partner-defaults` + `commercial-policy-surface`
   - usar cuando el documento hereda defaults server-side desde el cliente y ademas necesita sync o hydration comercial en el browser
   - si ademas se quiere exponer ese contexto en un panel declarativo, agregar `record-context-surface`

8. `form-totals` + `taxation-helpers`
   - usar cuando el documento necesita una capa nativa de totales e impuestos

9. `many2x-parent-form-autosave` + `many2x-parent-form-autosave-python`
   - usar cuando el form tiene lineas editables y conviene proteger la consistencia del parent
   - el componente `web` protege la UX inline
   - el componente `python` construye el patch/template reutilizable cuando el proyecto necesita publicarlo desde servidor

## Combinaciones recomendadas

### Documento transaccional

- `surface-workspace-shell`
- `line-picker-surface`
- `record-context-surface`
- `form-section-layout`
- `form-layout-state`
- `form-defaults`
- `commercial-policy-surface`
- `partner-defaults`
- `form-totals`
- `many2x-parent-form-autosave`
- `many2x-parent-form-autosave-python`

### Formulario operativo editable

- `form-section-layout`
- `form-layout-state` si el proyecto necesita sembrar labels/layouts desde servidor
- `line-picker-surface` si el formulario tiene pickers inline dentro de lineas editables
- `many2x-parent-form-autosave`

### Panel de contexto relacional/comercial

- `record-context-surface`
- `partner-defaults` si el panel depende de defaults server-side por cliente
- `commercial-policy-surface` si el panel expone politica comercial o hydration de browser

### Catalogo maestro

- `surface-workspace-shell`
- `partner-defaults` solo si el catalogo influye defaults de clientes

## Nota de legado

- `customer-defaults-web` queda como traza source-derived del runtime original de Rental.
- `commercial-policy-surface` es la base canonica para adapters web nuevos.
- `line-picker-surface` es la base canonica para line picking administrado; no debe volver a quedar subsumido dentro de `surface-workspace-shell`.
- `record-context-surface` es la base canonica para panels de contexto relacional/comercial; no debe volver a quedar subsumido dentro de `surface-workspace-shell`.

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
- los modos de route presentation (`query`, `hash`, `path-tail`) permanecen solo porque son parte del contrato publico canonico del shell; no deben reinterpretarse como compatibilidad legacy del proyecto
