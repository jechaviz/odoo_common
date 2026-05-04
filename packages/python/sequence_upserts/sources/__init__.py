"""Canonical Odoo sequence upsert helpers."""

from .sequence_upserts import (
    SequenceSpec,
    SequenceUpsertConnection,
    upsert_sequence,
)

__all__ = [
    "SequenceSpec",
    "SequenceUpsertConnection",
    "upsert_sequence",
]
