"""Canonical generic Odoo record upsert helpers."""

from .record_upserts import (
    RecordUpsertConnection,
    RecordUpsertSpec,
    upsert_record,
    upsert_records,
)

__all__ = [
    "RecordUpsertConnection",
    "RecordUpsertSpec",
    "upsert_record",
    "upsert_records",
]
