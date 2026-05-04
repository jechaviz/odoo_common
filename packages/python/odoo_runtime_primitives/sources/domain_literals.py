"""Reusable builders for Odoo domain literals represented as strings."""

from __future__ import annotations

from typing import Iterable


def _normalize_domain_parts(parts: Iterable[str]) -> list[str]:
    """Return sanitized non-empty domain tuple literals preserving order."""
    active_parts: list[str] = []
    for part in parts:
        if not isinstance(part, str):
            raise TypeError("domain parts must be strings")
        text = part.strip()
        if text:
            active_parts.append(text)
    return active_parts


def build_domain_literal(parts: Iterable[str]) -> str:
    """Build an Odoo domain list literal joined with implicit AND semantics."""
    active_parts = _normalize_domain_parts(parts)
    if not active_parts:
        return "[]"
    return f"[{', '.join(active_parts)}]"


def build_or_domain_literal(parts: Iterable[str]) -> str:
    """Build an Odoo prefix-OR domain list literal."""
    active_parts = _normalize_domain_parts(parts)
    if not active_parts:
        return "[]"
    if len(active_parts) == 1:
        return f"[{active_parts[0]}]"
    operators = ["'|'"] * (len(active_parts) - 1)
    return f"[{', '.join([*operators, *active_parts])}]"


__all__ = ["build_domain_literal", "build_or_domain_literal"]
