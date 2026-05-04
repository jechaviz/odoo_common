# View Fragment Assembly

Helpers canonicos para ensamblar `arch` de vistas Odoo desde fragmentos XML declarados por el consumidor.

## Contrato Publico

El modulo expone:

- `ViewAssemblyBlueprint`
- `ViewFragmentRegistry`
- `read_view_fragment(registry, fragment_key)`
- `build_view_arch(registry, fragment_keys, substitutions=None, wrapper_tag="data")`
- `validate_registered_fragment_files(registry)`

## Responsabilidad

- declarar un registry estricto de `fragment_key -> archivo`
- leer solo fragmentos registrados
- componer fragments dentro de un wrapper XML explicito
- aplicar substituciones declaradas por el caller
- serializar blueprints de vistas sin conocer nombres de negocio

## No Incluye

- fragments FIAX/Rental/RPP
- busqueda por nombre aproximado
- fallback a carpetas alternativas
- upsert de `ir.ui.view`
- inferencia de modelos, vistas base o campos

Combinar con `view-upserts` cuando el consumidor quiera publicar el `arch` ensamblado en Odoo.
