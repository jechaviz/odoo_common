# Odoo Binary Attachment Upserts

Helpers canonicos para publicar attachments binarios desde specs explicitos.

## Contrato Publico

El modulo expone:

- `BinaryAttachmentUpsertConnection`
- `BinaryAttachmentSpec`
- `compute_binary_attachment_checksum(content)`
- `encode_binary_attachment_content(content)`
- `upsert_binary_attachment(conn, spec)`

## Connection Contract

El helper espera un objeto `conn` con estas operaciones:

- `search_read(model, domain, fields=None, limit=None, **kwargs)`
- `write(model, ids, values)`
- `create(model, values)`

## Spec

`BinaryAttachmentSpec` escribe `ir.attachment` con `type="binary"`, `datas`, `mimetype`, `datas_fname`, `public`, `res_model` y `res_id`.

Los `extra_values` son permitidos, pero no pueden sobrescribir campos reservados del contrato base.

## Responsabilidad

- upsert exacto por `(name, type=binary)`
- codificar contenido en base64 ASCII
- calcular checksum SHA1 para trazabilidad del caller
- escribir metadata declarada sin detectar campos por version

## No Incluye

- limpieza de attachments obsoletos
- publicacion de `ir.asset`
- deteccion de `datas_fname`, `public`, `res_model` o `res_id`
- retorno temprano por checksum sin escribir metadata
