"""Canonical Odoo runtime primitives."""

from .code_source import definition_from_function, source_from_function
from .domain_literals import build_domain_literal, build_or_domain_literal
from .rpc_values import extract_many2one_id

__all__ = [
    "build_domain_literal",
    "build_or_domain_literal",
    "definition_from_function",
    "extract_many2one_id",
    "source_from_function",
]
