# Terms And Conditions Schema Pattern

Paquete canonico de schema para almacenar, resolver y publicar payloads de terminos y condiciones. No incluye renderer ni wiring ORM; solo define el contrato portable.

## Fuente de referencia

- `C:\git\customers\yo\rp-rental-mock\odoo_migration\docs\tnc.md`
- `C:\git\customers\yo\rp-rental-mock\odoo_migration\report_templates.py`
- `C:\git\customers\yo\rp-rental-mock\odoo_migration\templates\view_fragments\rental_order_form_terms_conditions_source.xml.tmpl`

## Lo Que Este Paquete Si Define

- payload autoritativo de origen para una politica o plantilla de terminos
- payload resuelto que consumen PDF, portal o vistas web
- contrato de trazabilidad para saber de donde salieron los terminos efectivos
- recomendaciones de precedencia para herencia por scope

## Lo Que Este Paquete No Define

- modelos Odoo concretos
- campos `x_*`
- renderer HTML o Markdown
- reglas de negocio acopladas a rental, CFDI o cualquier vertical

## Archivos Canonicos

- `source_terms_conditions.schema.json`
- `resolved_terms_conditions.schema.json`
- `resolution_contract.md`
- `examples/source_terms_conditions_payload.json`
- `examples/resolved_terms_conditions_payload.json`

## Modelo Mental

1. Un scope de configuracion guarda un payload de origen con texto, locale, revision y metadata.
2. El adapter del proyecto resuelve precedencia entre scopes.
3. El documento final publica un payload resuelto con `resolution_path` y, si aplica, una variante renderizada (`rendered_html`).

## Render Contract

La referencia de `rp-rental-mock` usa Markdown fuente (`tnc.md`) y un renderer externo que produce HTML para reportes y portal. Ese renderer queda fuera de este paquete; el contrato canonico solo exige que el payload resuelto conserve:

- el texto fuente (`body_markdown` o equivalente futuro)
- la revision aplicada
- la traza de resolucion
- cualquier salida renderizada derivada como cache opcional, nunca como unica fuente de verdad
