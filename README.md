# Odoo Common Surface Kit

Kit comun para ensamblar superficies nativas de Odoo desde contratos canonicos reutilizables. Los paths fuente quedan como trazabilidad de extraccion, no como rutas de soporte ni como receta recomendada de ensamblaje:

- `C:\git\customers\yo\fiax`
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
  - trazabilidad de origen y rol historico de cada proyecto fuente; no define rutas de ensamblaje

## Regla de gobierno

- `canonical`: paquete listo para reutilizar como base comun
- `source-derived`: artefacto de trazabilidad/archivo derivado de un proyecto fuente; no es ruta recomendada ni soporte de compatibilidad
- `planned`: componente detectado, pero aun no extraido a una API comun estable
- las integraciones nuevas deben ensamblarse desde paquetes `canonical` y perfiles del catalogo; cuando una capacidad aparezca en un `source-derived`, usar sus `replacement_components`
- los paquetes canonicos no deben sostener compatibilidad por `workspaceHint`, action ids alternos, selectors fallback, ni feature guards opcionales una vez fijado el contrato shared
- `surface-workspace-shell` debe resolver navegacion y activacion por action/model/state canonicos, `workspaceKey`/`breadcrumb key`, y hosts explicitos del DOM
- `surface-workspace-shell` no debe inferir ownership de sidebar por labels, `active/show/aria-*` del navbar ni route hints shared; la identidad de seccion debe llegar por `data-surface-sidebar-section-key`, `data-section`, breadcrumb section key o resolver explicito
- los popovers del sidebar deben posicionarse contra un owner trigger vivo; el shell shared no debe rescatar owners alternos ni reconstruir ownership desde estado zombi
- en route presentation, `query`, `hash` y `path-tail` permanecen porque son modos publicos canonicos del componente, no compatibilidad de proyecto

## Siguiente criterio de trabajo

1. promover a `canonical` solo contratos estables con API comun verificable
2. adelgazar adapters de proyecto
3. prohibir aliases historicos y rescates fallback innecesarios
4. mantener manifiestos y perfiles como fuente de verdad
