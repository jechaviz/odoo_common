# Odoo Product Catalog Upserts

Helpers canonicos para publicar categorias, listas de precio y reglas de precio desde specs explicitos.

## Contrato publico

El modulo expone:

- `ProductCatalogUpsertConnection`
- `ProductCategorySpec`
- `PricelistSpec`
- `PricelistItemSpec`
- `upsert_product_category(conn, spec)`
- `upsert_pricelist(conn, spec)`
- `upsert_pricelist_item(conn, spec)`

## Connection Contract

El helper espera un objeto `conn` con estas operaciones:

- `search(model, domain, limit=None)`
- `write(model, ids, values)`
- `create(model, values)`

## Spec

Las specs escriben `product.category`, `product.pricelist` y `product.pricelist.item`.

Los `extra_values` son permitidos, pero no pueden sobrescribir campos reservados del contrato base.

## Responsabilidad

- upsert exacto de categorias por `(name, parent_id)`
- upsert exacto de listas de precio por `(name, company_id)`
- upsert exacto de reglas por `(pricelist_id, product_tmpl_id)`
- publicar reglas modernas de precio fijo por producto

## No Incluye

- desactivar listas o reglas legacy
- detectar campos por version
- inferir moneda o compania
- normalizar periodos rental-specific
- migrar reglas `product.pricing`
