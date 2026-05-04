# Form Capture Shell Contract

Paquete canonico de schema para formularios que necesitan una franja superior operativa antes de sus lineas, con composicion `capture shell` de dos columnas y controles de identidad en el header.

No incluye renderer JS, estilos locales de negocio ni campos `x_*`. Define solo el contrato portable de markup/attrs para que cualquier proyecto Odoo monte el patron de forma consistente sobre la capa shared ya existente.

## Origen De Extraccion

Este contrato se extrajo de formularios Odoo reales con captura superior, controles compactos de identidad y tabs nativos. Esas referencias validan el patron, pero sus modelos, campos y nombres de negocio no son parte del contrato canonico.

## Lo Que Este Paquete Si Define

- attrs y semantica base para `data-surface-form-shell="capture"`
- layouts canonicos para shell superior antes de lineas
- attrs y slots canonicos para `data-surface-header-identity`
- fixtures XML de referencia para captura documental

## Lo Que Este Paquete No Define

- modelos Odoo concretos
- campos o labels de negocio
- defaults, previews, record context o line pickers
- comportamiento JS; eso sigue en `surface-workspace-shell`, `record-context-surface`, `line-picker-surface` y compania

## Contrato Canonico

- `form_capture_shell.schema.json`
- `header_identity_controls.schema.json`
- `capture_shell_contract.md`
- `header_identity_contract.md`

## Fixtures De Ejemplo

- `examples/invoice_capture_shell.xml`
- `examples/invoice_header_identity_controls.xml`

Los nombres `invoice_*`, labels y campos dentro de `examples/` documentan una implementacion concreta. El adapter debe reemplazarlos por sus propios modelos, campos, dominios y copy.

## Modelo Mental

1. El form declara un shell superior antes de sus lineas con `data-surface-form-shell="capture"`.
2. El shell compone columnas declarativas (`primary`, `secondary`, etc.) y roles (`party`, `document`, ...).
3. El header puede exponer controles de identidad compactos con `data-surface-header-identity`.
4. Los demas paquetes shared montan dentro de ese shell su propia logica: defaults, previews, contexto comercial, line pickers y totales.
