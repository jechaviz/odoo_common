"""Canonical server automation upsert helpers."""

from .automation_upserts import (
    AutomationBundleResult,
    AutomationBundleSpec,
    AutomationUpsertConnection,
    BaseAutomationSpec,
    ServerActionSpec,
    resolve_model_field_ids,
    resolve_model_id,
    sync_automation_bundle,
    upsert_base_automation,
    upsert_server_action,
)

__all__ = [
    "AutomationBundleResult",
    "AutomationBundleSpec",
    "AutomationUpsertConnection",
    "BaseAutomationSpec",
    "ServerActionSpec",
    "resolve_model_field_ids",
    "resolve_model_id",
    "sync_automation_bundle",
    "upsert_base_automation",
    "upsert_server_action",
]
