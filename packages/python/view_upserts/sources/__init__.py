"""Canonical Odoo view upsert helpers."""

from .view_upserts import (
    ModelViewSpec,
    QWebViewSpec,
    ViewUpsertConnection,
    upsert_model_view,
    upsert_qweb_view,
)

__all__ = [
    "ModelViewSpec",
    "QWebViewSpec",
    "ViewUpsertConnection",
    "upsert_model_view",
    "upsert_qweb_view",
]
