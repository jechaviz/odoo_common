"""Canonical Odoo tax upsert helpers."""

from .tax_upserts import (
    TaxGroupSpec,
    TaxSpec,
    TaxUpsertConnection,
    upsert_tax,
    upsert_tax_group,
)

__all__ = [
    "TaxGroupSpec",
    "TaxSpec",
    "TaxUpsertConnection",
    "upsert_tax",
    "upsert_tax_group",
]
