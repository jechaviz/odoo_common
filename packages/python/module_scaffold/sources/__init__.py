"""Canonical Odoo module scaffold contracts."""

from .module_scaffold import (
    FieldScaffoldSpec,
    ModelAccessScaffoldSpec,
    ModelScaffoldSpec,
    ModuleScaffoldFile,
    ModuleScaffoldSpec,
    build_module_scaffold_files,
    normalize_model_name,
    normalize_module_name,
    write_module_scaffold,
)

__all__ = [
    "FieldScaffoldSpec",
    "ModelAccessScaffoldSpec",
    "ModelScaffoldSpec",
    "ModuleScaffoldFile",
    "ModuleScaffoldSpec",
    "build_module_scaffold_files",
    "normalize_model_name",
    "normalize_module_name",
    "write_module_scaffold",
]
