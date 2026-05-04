"""Helpers for normalizing common Odoo RPC payload shapes."""

from __future__ import annotations

from typing import Any


def _is_record_id(value: Any) -> bool:
    return isinstance(value, int) and not isinstance(value, bool)


def extract_many2one_id(value: Any) -> int | None:
    """Extract the integer ID from a standard Odoo many2one payload."""
    if _is_record_id(value):
        return value
    if isinstance(value, (list, tuple)) and value and _is_record_id(value[0]):
        return value[0]
    return None


__all__ = ["extract_many2one_id"]
