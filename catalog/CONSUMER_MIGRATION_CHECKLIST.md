# Consumer Migration Checklist

Objetivo: mover consumidores existentes hacia superficies canonicas de `common` sin sostener codigo legacy, aliases historicos ni fallbacks operativos.

Esta checklist convierte las auditorias por proyecto en pasos de migracion. Aplica a consumers que hoy vienen de `fiax`, `odoo_rpp`, `rp-rental-mock` o nuevos proyectos que copian alguno de esos patrones.

## Regla Dura

- No cargar paquetes `source-derived` en consumidores nuevos o migrados.
- No agregar fallback en `common` para mantener wiring historico vivo.
- No venderizar archivos fuente de proyecto si ya existe componente canonico equivalente.
- No resolver comportamiento por labels, action ids historicos, `workspaceHint`, selectors alternos ni nombres de negocio.
- Si falta un dato de negocio, declararlo en el adapter del proyecto; no inferirlo dentro de `common`.

## 1. Inventario Del Consumer

Registrar antes de tocar codigo:

- proyecto y modulo consumidor
- assets JS/CSS cargados
- helpers Python importados
- XML/schema fragments usados
- action/model/state que activan la pantalla
- campos `x_*`, copy comercial, labels, formatos monetarios y selectors DOM propios del proyecto
- evidencia base: flujo manual, screenshot o test que demuestre comportamiento actual

Salida esperada:

- lista de capacidades, no lista de archivos legacy
- componentes canonicos candidatos por capacidad
- campos/copy/selectors que deben vivir en adapter local

## 2. Reemplazar Source-Derived Por Canonical

Usar esta tabla como corte obligatorio:

| Si el consumer usa | Migrar a |
| --- | --- |
| `form-section-layout` | `form-layout-surface`, `form-section-headers-surface`, `form-section-visibility-surface`, `form-settings-panel-surface`, `form-chatter-toggle-surface`, `form-subtotals-surface`, `form-layout-state` |
| `form-defaults` | `form-defaults-surface`, `form-preview-surface`, `form-header-identity-surface` |
| `form-totals` | `form-totals-surface` |
| `customer-defaults-web` | `commercial-policy-surface`, `form-action-bridge-surface`, `record-context-surface`, `form-preview-surface`, `partner-defaults` |

Regla de aceptacion:

- el diff elimina la dependencia `source-derived`
- el adapter declara explicitamente la configuracion que antes estaba implicita
- no aparece un fallback nuevo en `common` ni en el consumer

## 3. Ensamblar Por Capacidad

Elegir el perfil desde `assembly_profiles.json` o la combinacion documentada en `ASSEMBLY_GUIDE.md`.

Checklist minima por capa:

- workspace: declarar `workspaceKey`, breadcrumb keys, action/model state y hosts DOM explicitos
- sidebar: declarar seccion activa por `data-surface-sidebar-section-key`, `data-section`, breadcrumb section key o resolver explicito
- line picker: declarar `managedFormEnhancers`, `x2manyField`, `itemField` y selectors excepcionales
- record context: declarar `slots`, `valueKey`, readers relacionales y renderers
- commercial capture: declarar `panelSelector`, `recordModel`, field maps, `referenceMeta` y `slotOverrides`
- defaults/preview: declarar loaders, enrichers, field maps, preview targets, formatters y writers
- subtotals: declarar `root`/`selector`/`resolveRoot`, `scopeKey`/`resolveScopeKey`, `fieldDisplayNormalizers` y hooks de proceso
- totals: declarar `selector`/`resolveRoot`, `rowSelector`, `fallbackSelector`, formatter monetario y hooks de visibilidad
- header identity: declarar `fieldMap`, `displayRefBuilder`, `documentSeriesNormalizer`, `breadcrumbRoot` y `titleSync`
- action bridge: declarar `actionId`, `payloadBuilder`, `contextBuilder`, `successHandler`, gating y confirmaciones
- layout: declarar access rules, persistence, settings metadata y editores por contrato

## 4. Extraer Adapter Delgado

El adapter del proyecto es el unico lugar permitido para:

- nombres de modelos como invoice, quotation, rental o equivalentes
- campos `x_*`
- copy comercial
- selectors DOM no canonicos
- normalizadores de display por negocio
- politica de confirmacion o gating de acciones
- mapeos de branch, serie, partner, moneda, totales o impuestos

El adapter no debe:

- importar paquetes `source-derived`
- reimplementar runtimes canonicos
- tener rutas paralelas legacy/canonical
- esconder sincronizacion de previews, totals o politica comercial en callbacks anonimos dificiles de auditar

## 5. Validar Paridad Del Consumer

Antes de considerar terminada la migracion:

- probar apertura de pantalla y activacion de workspace/breadcrumb/sidebar
- probar edicion de formulario y persistencia esperada
- probar line picker si existe `x2many`
- probar previews readonly si el documento los expone
- probar subtotales/totales si el formulario los usa
- probar acciones server-side si hay bridge
- comparar evidencia contra la base capturada en el inventario
- ejecutar validacion propia del proyecto consumidor
- ejecutar `powershell -ExecutionPolicy Bypass -File catalog/validate_catalog.ps1` si se cambio catalogo
- ejecutar `git diff --check`

## 6. Criterios De Rechazo

Rechazar o revertir si el cambio:

- conserva una dependencia `source-derived`
- agrega fallback a aliases historicos
- mueve campos/copy de negocio a `common`
- depende de labels visuales para identidad de seccion o accion
- reconstruye ownership de sidebar desde estado zombi
- oculta preview/totals/commercial sync fuera de las superficies canonicas
- pasa el flujo manual pero degrada el contrato compartido

## 7. Evidencia Minima Para Cerrar

Cada migracion debe dejar:

- paths modificados
- componentes canonicos ensamblados
- adapters nuevos o actualizados
- source-derived removidos
- pruebas o pasos manuales ejecutados
- riesgos residuales, si existen
