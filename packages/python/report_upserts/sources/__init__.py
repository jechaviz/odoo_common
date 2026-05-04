"""Canonical Odoo report upsert helpers."""

from .report_upserts import (
    PaperformatSpec,
    ReportActionSpec,
    ReportLayoutSpec,
    ReportUpsertConnection,
    upsert_paperformat,
    upsert_report_action,
    upsert_report_layout,
)

__all__ = [
    "PaperformatSpec",
    "ReportActionSpec",
    "ReportLayoutSpec",
    "ReportUpsertConnection",
    "upsert_paperformat",
    "upsert_report_action",
    "upsert_report_layout",
]
