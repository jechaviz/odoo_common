# Record Context Layout Contract

Paquete canonico de schema para paneles declarativos de contexto relacional/comercial que viven dentro de un formulario y son hidratados por `record-context-surface`.

No define modelos Odoo, labels de negocio, ni wiring ORM. Solo formaliza el markup/attrs del panel, los cards y los slot markers que el runtime shared ya sabe sincronizar.

## Fuente de referencia

- `C:\git\customers\yo\odoo_fiax\src\odoo_fiax_migration\templates\view_fragments\invoice_form_capture_shell.xml.tmpl`
- `C:\git\customers\yo\odoo_fiax\src\odoo_fiax_migration\web_assets\odoo_surface_layers\record_context.js`
- `C:\git\customers\yo\odoo_fiax\src\odoo_fiax_migration\web_assets\odoo_surface_layers\surface_layers.css`

## Lo Que Este Paquete Si Define

- root canonico del panel `data-surface-record-context-panel`
- layouts canonicos del stack (`detail-list`)
- cards declarativos por `data-surface-record-context-card`
- slot markers que el runtime shared hidrata (`primary-name`, `secondary-details`, `identifier`, etc.)

## Lo Que Este Paquete No Define

- campos o modelos concretos
- readers ORM o cache
- labels de negocio (`RFC`, `Tarifa`, `Envio`, ...)
- estilos concretos por vertical

## Archivos Canonicos

- `record_context_layout.schema.json`
- `record_context_slot_markers.schema.json`
- `record_context_layout_contract.md`
- `examples/invoice_record_context_layout.xml`

## Modelo Mental

1. Un formulario declara un panel `record-context`.
2. El panel usa un layout canonico como `detail-list`.
3. Dentro del panel, cards y slot markers se hidratan desde `record-context-surface`.
4. El adapter del proyecto solo define labels, field maps, enrichers y copy.
