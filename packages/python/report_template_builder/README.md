# Report Template Builder

Helpers canonicos para construir planes neutrales de plantillas de reportes Odoo.

## Contrato Publico

- `ReportTemplateSourceSpec`
- `ReportTemplatePublicationSpec`
- `ReportTemplateBandSpec`
- `PreviewToolbarSpec`
- `TermsDocumentSpec`
- `ReservedPdfLayoutSpec`
- `build_report_template_plan(...)`
- `build_qweb_template_specs(...)`
- `build_report_action_specs(...)`
- `build_design_record_specs(...)`

## Responsabilidad

- componer fuentes JRXML/XML importadas por `report-template-designer`
- declarar bandas visuales ordenadas para QWeb y preview
- renderizar toolbar web generico y terminos/notas escapados
- construir specs de QWeb, paperformat y report action sin side effects
- capturar lecciones de `rp-rental-mock` sin nombres, campos o reglas Rental

## No Incluye

- conexion XML-RPC
- upserts live
- resolucion de IDs de modelos/vistas/paperformats
- ejecucion de expresiones JRXML, Python o JavaScript
- reglas fiscales o de negocio de un vertical especifico

## Dependencias

Este paquete solo compone contratos canonicos existentes:

- `report-template-designer`
- `text-templates`
- `view-upserts`
- `report-upserts`
- `record-upserts`
