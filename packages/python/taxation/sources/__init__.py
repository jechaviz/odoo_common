"""Canonical taxation helpers."""

from .taxation import (
    CFDI40_MEXICO_DYNAMIC_RULES,
    CFDI40_MEXICO_VIEW_LABELS,
    DEFAULT_SALES_TAX_SPEC,
    SalesTaxSpec,
    TaxationConnection,
    TaxationMixin,
    build_cfdi40_mexico_view_label_substitutions,
    cfdi40_mexico_view_label,
)

__all__ = [
    "CFDI40_MEXICO_DYNAMIC_RULES",
    "CFDI40_MEXICO_VIEW_LABELS",
    "DEFAULT_SALES_TAX_SPEC",
    "SalesTaxSpec",
    "TaxationConnection",
    "TaxationMixin",
    "build_cfdi40_mexico_view_label_substitutions",
    "cfdi40_mexico_view_label",
]
