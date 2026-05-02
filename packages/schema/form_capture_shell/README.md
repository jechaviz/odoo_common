# Form Capture Shell Contract

Paquete canonico de schema para formularios que necesitan una franja superior operativa antes de sus lineas, con composicion `capture shell` de dos columnas y controles de identidad en el header.

No incluye renderer JS, estilos locales de negocio ni campos `x_*`. Define solo el contrato portable de markup/attrs para que cualquier proyecto Odoo monte el patron de forma consistente sobre la capa shared ya existente.

## Fuente de referencia

- `C:\git\customers\yo\odoo_fiax\src\odoo_fiax_migration\templates\view_fragments\invoice_form_capture_shell.xml.tmpl`
- `C:\git\customers\yo\odoo_fiax\src\odoo_fiax_migration\templates\view_fragments\invoice_form_identity_controls.xml.tmpl`
- `C:\git\customers\yo\rp-rental-mock\odoo_migration\web_assets\rental_native_tabs`

## Lo Que Este Paquete Si Define

- attrs y semantica base para `data-surface-form-shell="capture"`
- layouts canonicos para shell superior antes de lineas
- attrs y slots canonicos para `data-surface-header-identity`
- ejemplos XML de referencia para captura documental con cliente/emision

## Lo Que Este Paquete No Define

- modelos Odoo concretos (`account.move`, `sale.order`, etc.)
- campos o labels de negocio
- defaults, previews, record context o line pickers
- comportamiento JS; eso sigue en `surface-workspace-shell`, `record-context-surface`, `line-picker-surface` y compania

## Archivos Canonicos

- `form_capture_shell.schema.json`
- `header_identity_controls.schema.json`
- `capture_shell_contract.md`
- `header_identity_contract.md`
- `examples/invoice_capture_shell.xml`
- `examples/invoice_header_identity_controls.xml`

## Modelo Mental

1. El form declara un shell superior antes de sus lineas con `data-surface-form-shell="capture"`.
2. El shell compone columnas declarativas (`primary`, `secondary`, etc.) y roles (`party`, `document`, ...).
3. El header puede exponer controles de identidad compactos (`serie`, `sucursal`, etc.) con `data-surface-header-identity`.
4. Los demas paquetes shared montan dentro de ese shell su propia logica: defaults, previews, contexto comercial, line pickers y totales.
