"""Canonical Odoo view upsert helpers."""

from .view_upserts import (
    ModelViewSpec,
    QWebTemplateSpec,
    QWebViewSpec,
    ViewUpsertConnection,
    upsert_model_view,
    upsert_qweb_template,
    upsert_qweb_view,
)

__all__ = [
    "ModelViewSpec",
    "QWebTemplateSpec",
    "QWebViewSpec",
    "ViewUpsertConnection",
    "upsert_model_view",
    "upsert_qweb_template",
    "upsert_qweb_view",
]
