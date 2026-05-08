"""Canonical Odoo module scaffold contracts."""

from .module_scaffold import (
    FieldScaffoldSpec,
    ModelAccessScaffoldSpec,
    ModelScaffoldSpec,
    ModuleScaffoldFile,
    ModuleScaffoldSpec,
    ModuleScaffoldWritePlanEntry,
    build_module_scaffold_files,
    load_module_scaffold_spec,
    normalize_model_name,
    normalize_module_name,
    plan_module_scaffold_write,
    write_module_scaffold,
)

__all__ = [
    "FieldScaffoldSpec",
    "ModelAccessScaffoldSpec",
    "ModelScaffoldSpec",
    "ModuleScaffoldFile",
    "ModuleScaffoldSpec",
    "ModuleScaffoldWritePlanEntry",
    "build_module_scaffold_files",
    "load_module_scaffold_spec",
    "normalize_model_name",
    "normalize_module_name",
    "plan_module_scaffold_write",
    "write_module_scaffold",
]
