"""Canonical Odoo security upsert helpers."""

from .security_upserts import (
    ModelAccessSpec,
    ModuleCategorySpec,
    RecordRuleSpec,
    SecurityGroupSpec,
    SecurityUpsertConnection,
    normalize_record_ids,
    resolve_model_id,
    upsert_model_access,
    upsert_module_category,
    upsert_record_rule,
    upsert_security_group,
)

__all__ = [
    "ModelAccessSpec",
    "ModuleCategorySpec",
    "RecordRuleSpec",
    "SecurityGroupSpec",
    "SecurityUpsertConnection",
    "normalize_record_ids",
    "resolve_model_id",
    "upsert_model_access",
    "upsert_module_category",
    "upsert_record_rule",
    "upsert_security_group",
]
