# Report Template Designer

Helpers canonicos para importar disenos de reportes ricos a un contrato neutral que Odoo pueda almacenar, previsualizar y migrar.

## Contrato Publico

El modulo expone:

- `parse_jrxml_file(path)`
- `parse_jrxml_document(source, source_name="")`
- `flatten_xml_sample_file(path)`
- `flatten_xml_sample(source, source_name="")`
- `build_preview_html(blueprint)`
- `build_design_record_values(jrxml_path, sample_xml_paths=(), ...)`
- specs Odoo: `REPORT_DESIGNER_MODELS`, `REPORT_DESIGNER_FIELDS`, `REPORT_DESIGNER_VIEW_BLUEPRINTS`

## Responsabilidad

- convertir JRXML/JasperReports a una estructura neutral de pagina, bandas, elementos, subdatasets, campos y variables
- indexar expresiones `$F{}`, `$P{}` y `$V{}` sin ejecutarlas
- aplanar XMLs de prueba a rutas repetibles/atributos para mapeo de datos
- generar un preview HTML seguro de canvas fijo para inspeccion inicial
- declarar un modelo Odoo reusable `x_odoo_report_design` independiente de facturacion

## No Incluye

- ejecucion de Groovy/Java/Jasper expressions
- compilacion `.jasper`
- conversion completa a QWeb productivo
- instalacion de un addon fisico en Odoo.sh/on-prem
- reglas fiscales o de negocio de un vertical especifico

## Origenes Considerados

- `rp-rental-mock` aporta lecciones de paperformat, layout externo y bandas reservadas de PDF, ya cubiertas por `report-upserts`
- `odoo-template` aporta convenciones de addon clasico, pero se mantiene fuera del contrato porque Odoo SaaS 19 trabaja mejor con modelos/vistas publicados por RPC
- iReport/JRXML aporta la semantica de canvas, bandas, subdatasets y expresiones que este paquete normaliza
