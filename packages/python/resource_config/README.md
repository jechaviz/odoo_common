# Resource Config Normalizers

Helpers canonicos para normalizar configuraciones ya cargadas por el adapter del proyecto.

## Contrato publico

El modulo expone:

- `deep_merge_mappings(base, overrides)`
- `read_string_tuple(config, key, default_values=())`
- `read_string_mapping(config, key, default_values)`
- `read_nested_mapping_list(config, *path)`

## Responsabilidad

- fusionar mappings sin compartir referencias mutables
- leer listas de strings como tuplas limpias
- leer mappings de strings con defaults declarados
- leer listas anidadas conservando solo mappings

## No Incluye

- carga YAML/JSON desde disco
- defaults implicitos de proyecto
- tolerancia de rutas alternativas
- validacion semantica de negocio

El caller debe cargar el archivo con la libreria que corresponda a su proyecto y pasar un mapping ya parseado.
