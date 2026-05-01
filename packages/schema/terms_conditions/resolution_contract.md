# Resolution Contract

Este paquete recomienda separar dos conceptos:

- `source payload`: la definicion editable de terminos en un scope concreto
- `resolved payload`: el resultado final que un documento ya puede imprimir o exponer

## Scope Precedence

El orden exacto lo decide cada adapter, pero el contrato canonico recomienda documentar una precedencia explicita. Un orden comun es:

1. global
2. template o profile
3. serie, branch o document class
4. customer o commercial profile
5. document override

## Resolution Path

El payload resuelto debe incluir `resolution_path`, una lista ordenada de pasos que explique:

- `scope`
- `record_model`
- `record_id`
- `record_key`
- `matched_on`
- `applied`

Esto permite auditoria, debugging y reproduccion de PDFs.

## Source Of Truth

- `body_markdown` es la fuente editable recomendada cuando el proyecto nace desde texto legal tipo Markdown.
- `rendered_html` es opcional y derivado.
- `source_url` puede apuntar a un doc controlado por Legal o Compliance.
- `revision_label` y `effective_from` ayudan a congelar el texto usado por cada documento.

## Adapter Responsibilities

Los adapters del proyecto deben definir:

- donde se almacena cada payload
- que scopes existen
- como se calcula precedencia
- como se renderiza `body_markdown`
- como se persiste el payload resuelto en el documento final
