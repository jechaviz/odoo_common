# Odoo XML ID Upserts

Helpers canonicos para crear o actualizar registros `ir.model.data` desde specs explicitos.

## Contrato publico

El modulo expone:

- `XmlIdUpsertConnection`
- `XmlIdRef`
- `XmlIdSpec`
- `split_xml_id(xml_id)`
- `upsert_xml_id(conn, spec)`
- `upsert_xml_id_value(conn, xml_id, model_name, res_id, noupdate=True)`

## Connection Contract

El helper espera un objeto `conn` con estas operaciones:

- `search_read(model, domain, fields=None, limit=None, **kwargs)`
- `write(model, ids, values)`
- `create(model, values)`

## Spec

`XmlIdSpec` declara `module`, `name`, `model_name`, `res_id` y `noupdate`.

Los `extra_values` son permitidos, pero no pueden sobrescribir campos reservados del contrato base.

## Responsabilidad

- validar XML IDs en formato `module.name`
- upsert exacto de `ir.model.data` por `(module, name)`
- escribir `model`, `res_id` y `noupdate` desde el spec
- rechazar `res_id` vacio
- rechazar cambios silenciosos de modelo en XML IDs existentes

## No Incluye

- dry-run
- alias de XML IDs
- busqueda por `complete_name`
- rebind silencioso entre modelos
- resolucion del registro destino
- limpieza de XML IDs obsoletos
