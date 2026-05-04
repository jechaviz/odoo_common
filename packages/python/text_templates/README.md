# Strict Text Template Helpers

Helpers canonicos para cargar y renderizar plantillas de texto desde rutas declaradas.

## Contrato Publico

El modulo expone:

- `load_template_from_dir(templates_dir, filename, strip_result=True)`
- `render_template(template, replacements, require_all_tokens=True, strip_result=True)`
- `render_template_file(templates_dir, filename, replacements, require_all_tokens=True, strip_result=True)`

## Responsabilidad

- cargar plantillas UTF-8 desde un directorio conocido
- rechazar nombres absolutos, rutas con `..`, separadores Windows y prefijos de drive
- aplicar reemplazos de tokens en orden deterministico
- fallar si un token declarado no aparece en la plantilla

## No Incluye

- globbing de plantillas
- resolucion alternativa de rutas
- reemplazos silenciosos de tokens faltantes
- renderizado Jinja/QWeb
- contenido de negocio del proyecto
