"""Canonical Odoo product catalog upsert helpers."""

from .product_catalog_upserts import (
    PricelistItemSpec,
    PricelistSpec,
    ProductCatalogUpsertConnection,
    ProductCategorySpec,
    upsert_pricelist,
    upsert_pricelist_item,
    upsert_product_category,
)

__all__ = [
    "PricelistItemSpec",
    "PricelistSpec",
    "ProductCatalogUpsertConnection",
    "ProductCategorySpec",
    "upsert_pricelist",
    "upsert_pricelist_item",
    "upsert_product_category",
]
