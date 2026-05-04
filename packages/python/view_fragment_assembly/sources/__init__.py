"""Canonical Odoo view fragment assembly helpers."""

from .view_fragment_assembly import (
    ViewAssemblyBlueprint,
    ViewFragmentRegistry,
    build_view_arch,
    read_view_fragment,
    validate_registered_fragment_files,
)

__all__ = [
    "ViewAssemblyBlueprint",
    "ViewFragmentRegistry",
    "build_view_arch",
    "read_view_fragment",
    "validate_registered_fragment_files",
]
