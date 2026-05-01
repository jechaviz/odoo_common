# Odoo Common Surface Kit

Kit comun para ensamblar superficies nativas de Odoo a partir de piezas reutilizables extraidas de:

- `C:\git\customers\yo\odoo_fiax`
- `C:\git\customers\yo\odoo_rpp`
- `C:\git\customers\yo\rp-rental-mock`

## Objetivo

Separar la capa reutilizable de la capa de negocio para poder armar otros proyectos Odoo con piezas elegibles:

- shell lateral y breadcrumb
- workspaces y tablas nativas
- formularios de captura de dos columnas
- record context comercial
- line pickers
- defaults por modelo y por cliente
- totales e impuestos
- layout de secciones, visibilidad y chatter collapse

## Estructura

- `catalog/`
  - indice global de componentes
  - perfiles de ensamblaje
- `packages/web/`
  - runtimes JS/CSS reutilizables para cliente web de Odoo
- `packages/python/`
  - helpers server-side y mixins reutilizables
- `packages/schema/`
  - patrones de campos, herencia y configuracion que no son runtime
- `references/projects/`
  - resumen de origen y rol de cada proyecto fuente

## Regla de gobierno

- `canonical`: paquete listo para reutilizar como base comun
- `source-derived`: pieza reusable, pero todavia derivada de un proyecto fuente
- `planned`: componente detectado, pero aun no extraido a una API comun estable
- los paquetes canonicos no deben sostener compatibilidad por `workspaceHint`, action ids alternos, selectors fallback, ni feature guards opcionales una vez fijado el contrato shared
- `surface-workspace-shell` debe resolver navegacion y activacion por action/model/state canonicos, `workspaceKey`/`breadcrumb key`, y hosts explicitos del DOM
- `surface-workspace-shell` no debe inferir ownership de sidebar por labels, `active/show/aria-*` del navbar ni route hints shared; la identidad de seccion debe llegar por `data-surface-sidebar-section-key`, `data-section`, breadcrumb section key o resolver explicito
- los popovers del sidebar deben posicionarse contra un owner trigger vivo; el shell shared no debe rescatar owners alternos ni reconstruir ownership desde estado zombi
- en route presentation, `query`, `hash` y `path-tail` permanecen porque son modos publicos canonicos del componente, no compatibilidad de proyecto

## Siguiente criterio de trabajo

1. mover a `canonical` lo que ya tenga contrato estable
2. adelgazar adapters de proyecto
3. prohibir aliases legacy y fallbacks innecesarios
4. mantener manifiestos y perfiles como fuente de verdad
