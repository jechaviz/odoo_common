# Odoo Registry Lookup

Helpers canonicos para resolver metadata tecnica de Odoo de forma explicita.

## Contrato publico

El modulo expone:

- `RegistryLookupConnection`
- `XmlIdRef`
- `XmlIdMetadata`
- `split_xml_id(xml_id)`
- `resolve_xml_id_metadata(conn, xml_id, model_name=None)`
- `resolve_xml_id(conn, xml_id, model_name=None)`
- `resolve_model_id(conn, model_name)`
- `resolve_exact_window_action_id(conn, res_model=..., name=...)`
- `resolve_exact_server_action_id(conn, name=..., model_name=None)`
- `resolve_exact_base_view_id(conn, model_name=..., view_name=..., view_type=...)`
- `resolve_exact_base_form_view_id(conn, model_name=..., view_name=...)`
- `resolve_model_field_ids(conn, model_name, field_names, require_all=True)`
- `resolve_model_field_names(conn, model_name, field_names, require_all=True)`
- `fields_get(conn, model_name, attributes=("type",))`
- `selection_values(field_meta)`

## Connection Contract

El helper espera un objeto `conn` con estas operaciones:

- `search_read(model, domain, fields, limit=None)`
- `execute(model, method, args, **kwargs)` para `fields_get`

## Responsabilidad

- validar XML IDs en formato `module.name`
- resolver filas de `ir.model.data`
- resolver IDs de `ir.model`
- resolver acciones y vistas base exactas, fallando si faltan o son ambiguas
- resolver IDs/nombres de `ir.model.fields`
- leer `fields_get` con atributos declarados
- extraer valores tecnicos de selections

## No Incluye

- XML IDs sin modulo
- busqueda por alias o primer candidato disponible
- cache compartido
- deteccion de fallbacks de version
- decisiones de negocio cuando falta metadata
