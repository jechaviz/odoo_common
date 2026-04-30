# Assembly Guide

## Regla base

No ensamblar por proyecto fuente. Ensamblar por capacidad.

## Capas

1. `surface-workspace-shell`
   - usar cuando el modulo necesita shell lateral, breadcrumb, toolbar nativa y workspaces

2. `form-section-layout`
   - usar cuando el formulario necesita colapsar secciones, controlar visibilidad, mover layouts o colapsar chatter

3. `form-defaults`
   - usar cuando el formulario necesita hidratar defaults de `default_get`, sucursal, serie o tipo documental

4. `customer-defaults-web` + `partner-defaults`
   - usar cuando el documento hereda defaults y politica comercial desde el cliente

5. `form-totals` + `taxation-helpers`
   - usar cuando el documento necesita una capa nativa de totales e impuestos

6. `many2x-parent-form-autosave` + `many2x-parent-form-autosave-python`
   - usar cuando el form tiene lineas editables y conviene proteger la consistencia del parent
   - el componente `web` protege la UX inline
   - el componente `python` construye el patch/template reutilizable cuando el proyecto necesita publicarlo desde servidor

## Combinaciones recomendadas

### Documento transaccional

- `surface-workspace-shell`
- `form-defaults`
- `customer-defaults-web`
- `partner-defaults`
- `form-totals`
- `many2x-parent-form-autosave`
- `many2x-parent-form-autosave-python`

### Formulario operativo editable

- `form-section-layout`
- `many2x-parent-form-autosave`

### Catalogo maestro

- `surface-workspace-shell`
- `partner-defaults` solo si el catalogo influye defaults de clientes

## Regla de adaptadores

- la capa `common` no debe conocer nombres de negocio como `cfdi`, `rental`, `invoice`, `quotation`
- cada proyecto debe crear su adapter delgado y declarativo
- si una pieza necesita labels, modelos, campos o copy, eso entra por config
