"""Canonical helpers for declarative Odoo server automations."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Mapping, Protocol, Sequence, runtime_checkable


@runtime_checkable
class AutomationUpsertConnection(Protocol):
    """Minimal Odoo RPC contract required by automation upserts."""

    def search(
        self,
        model_name: str,
        domain: Sequence[tuple[str, str, Any]],
        limit: int | None = None,
    ) -> list[int]:
        """Return matching record ids."""

    def search_read(
        self,
        model_name: str,
        domain: Sequence[tuple[str, str, Any]],
        fields: Sequence[str] | None = None,
        limit: int | None = None,
        **kwargs: Any,
    ) -> list[Mapping[str, Any]]:
        """Return matching rows with requested fields."""

    def write(self, model_name: str, ids: Sequence[int], values: Mapping[str, Any]) -> Any:
        """Update one or more records."""

    def create(self, model_name: str, values: Mapping[str, Any]) -> Any:
        """Create one record."""


def _clean_required_text(value: Any, *, field_name: str) -> str:
    clean_value = str(value or "").strip()
    if not clean_value:
        raise ValueError(f"Automation {field_name} is required")
    return clean_value


def _clean_domain_literal(value: Any) -> str:
    clean_value = str(value or "").strip()
    return clean_value or "[]"


@dataclass(frozen=True)
class ServerActionSpec:
    """Declare one code-based `ir.actions.server` record."""

    name: str
    model_name: str
    code: str
    usage: str = "base_automation"
    state: str = "code"
    bind_to_model: bool = False
    binding_type: str = "action"
    binding_view_types: str = "list,form"

    def __post_init__(self) -> None:
        object.__setattr__(self, "name", _clean_required_text(self.name, field_name="server action name"))
        object.__setattr__(self, "model_name", _clean_required_text(self.model_name, field_name="model_name"))
        object.__setattr__(self, "code", _clean_required_text(self.code, field_name="server action code"))
        object.__setattr__(self, "usage", _clean_required_text(self.usage, field_name="server action usage"))
        object.__setattr__(self, "state", _clean_required_text(self.state, field_name="server action state"))
        object.__setattr__(self, "bind_to_model", bool(self.bind_to_model))
        object.__setattr__(
            self,
            "binding_type",
            _clean_required_text(self.binding_type, field_name="server action binding_type"),
        )
        object.__setattr__(
            self,
            "binding_view_types",
            _clean_required_text(self.binding_view_types, field_name="server action binding_view_types"),
        )


@dataclass(frozen=True)
class BaseAutomationSpec:
    """Declare one `base.automation` record linked to server action ids."""

    name: str
    model_name: str
    trigger: str
    filter_domain: str = "[]"
    trigger_field_names: tuple[str, ...] = field(default_factory=tuple)
    active: bool = True

    def __post_init__(self) -> None:
        object.__setattr__(self, "name", _clean_required_text(self.name, field_name="automation name"))
        object.__setattr__(self, "model_name", _clean_required_text(self.model_name, field_name="model_name"))
        object.__setattr__(self, "trigger", _clean_required_text(self.trigger, field_name="automation trigger"))
        object.__setattr__(self, "filter_domain", _clean_domain_literal(self.filter_domain))
        trigger_fields = tuple(
            _clean_required_text(field_name, field_name="trigger field name")
            for field_name in self.trigger_field_names
        )
        object.__setattr__(self, "trigger_field_names", trigger_fields)
        object.__setattr__(self, "active", bool(self.active))


@dataclass(frozen=True)
class AutomationBundleSpec:
    """Declare one server action plus every automation that should execute it."""

    server_action: ServerActionSpec
    automations: tuple[BaseAutomationSpec, ...] = field(default_factory=tuple)

    def __post_init__(self) -> None:
        if not isinstance(self.server_action, ServerActionSpec):
            object.__setattr__(self, "server_action", ServerActionSpec(**dict(self.server_action)))
        normalized_automations: list[BaseAutomationSpec] = []
        for automation in self.automations:
            normalized_automations.append(
                automation if isinstance(automation, BaseAutomationSpec) else BaseAutomationSpec(**dict(automation))
            )
        object.__setattr__(self, "automations", tuple(normalized_automations))


@dataclass(frozen=True)
class AutomationBundleResult:
    """Return ids created or updated by one bundle sync."""

    server_action_id: int
    automation_ids_by_name: Mapping[str, int]


def resolve_model_id(conn: AutomationUpsertConnection, model_name: str) -> int:
    """Resolve one Odoo model registry id or fail loudly."""
    clean_model_name = _clean_required_text(model_name, field_name="model_name")
    rows = conn.search_read("ir.model", [("model", "=", clean_model_name)], ["id"], limit=1)
    if not rows:
        raise LookupError(f"Odoo model not found: {clean_model_name}")
    return _required_record_id(rows[0].get("id"), context=f"ir.model {clean_model_name}")


def resolve_model_field_ids(
    conn: AutomationUpsertConnection,
    model_name: str,
    field_names: Sequence[str],
    *,
    require_all: bool = True,
) -> list[int]:
    """Resolve field ids for one model, preserving the caller-declared order."""
    clean_model_name = _clean_required_text(model_name, field_name="model_name")
    clean_field_names = [_clean_required_text(field_name, field_name="field_name") for field_name in field_names]
    if not clean_field_names:
        return []
    rows = conn.search_read(
        "ir.model.fields",
        [("model", "=", clean_model_name), ("name", "in", clean_field_names)],
        ["id", "name"],
        limit=len(clean_field_names),
    )
    ids_by_name: dict[str, int] = {}
    for row in rows:
        field_name = str(row.get("name") or "").strip()
        if field_name:
            ids_by_name[field_name] = _required_record_id(
                row.get("id"),
                context=f"ir.model.fields {clean_model_name}.{field_name}",
            )
    missing = [field_name for field_name in clean_field_names if field_name not in ids_by_name]
    if require_all and missing:
        raise LookupError(f"Odoo model fields not found for {clean_model_name}: {', '.join(missing)}")
    return [ids_by_name[field_name] for field_name in clean_field_names if field_name in ids_by_name]


def upsert_server_action(conn: AutomationUpsertConnection, spec: ServerActionSpec) -> int:
    """Create or update one code-based `ir.actions.server` record."""
    normalized = spec if isinstance(spec, ServerActionSpec) else ServerActionSpec(**dict(spec))
    model_id = resolve_model_id(conn, normalized.model_name)
    existing_ids = conn.search(
        "ir.actions.server",
        [
            ("name", "=", normalized.name),
            ("model_id", "=", model_id),
            ("usage", "=", normalized.usage),
        ],
        limit=1,
    )
    values: dict[str, Any] = {
        "name": normalized.name,
        "type": "ir.actions.server",
        "usage": normalized.usage,
        "model_id": model_id,
        "state": normalized.state,
        "code": normalized.code,
        "binding_model_id": model_id if normalized.bind_to_model else False,
        "binding_type": normalized.binding_type,
        "binding_view_types": normalized.binding_view_types,
    }
    if existing_ids:
        action_id = _required_record_id(existing_ids[0], context=f"ir.actions.server {normalized.name}")
        conn.write("ir.actions.server", [action_id], values)
        return action_id
    return _required_record_id(conn.create("ir.actions.server", values), context=f"created ir.actions.server {normalized.name}")


def upsert_base_automation(
    conn: AutomationUpsertConnection,
    spec: BaseAutomationSpec,
    action_ids: Sequence[int],
) -> int:
    """Create or update one `base.automation` record."""
    normalized = spec if isinstance(spec, BaseAutomationSpec) else BaseAutomationSpec(**dict(spec))
    clean_action_ids = [_required_record_id(action_id, context=f"automation action for {normalized.name}") for action_id in action_ids]
    if not clean_action_ids:
        raise ValueError(f"Automation {normalized.name} requires at least one server action id")

    model_id = resolve_model_id(conn, normalized.model_name)
    trigger_field_ids = resolve_model_field_ids(
        conn,
        normalized.model_name,
        normalized.trigger_field_names,
        require_all=True,
    )
    existing_ids = conn.search(
        "base.automation",
        [
            ("name", "=", normalized.name),
            ("model_id", "=", model_id),
        ],
        limit=1,
    )
    values = {
        "name": normalized.name,
        "model_id": model_id,
        "trigger": normalized.trigger,
        "active": normalized.active,
        "filter_domain": normalized.filter_domain,
        "action_server_ids": [(6, 0, clean_action_ids)],
        "trigger_field_ids": [(6, 0, trigger_field_ids)],
    }
    if existing_ids:
        automation_id = _required_record_id(existing_ids[0], context=f"base.automation {normalized.name}")
        conn.write("base.automation", [automation_id], values)
        return automation_id
    return _required_record_id(conn.create("base.automation", values), context=f"created base.automation {normalized.name}")


def sync_automation_bundle(
    conn: AutomationUpsertConnection,
    spec: AutomationBundleSpec,
) -> AutomationBundleResult:
    """Create/update a server action and every automation declared for it."""
    normalized = spec if isinstance(spec, AutomationBundleSpec) else AutomationBundleSpec(**dict(spec))
    server_action_id = upsert_server_action(conn, normalized.server_action)
    automation_ids_by_name: dict[str, int] = {}
    for automation_spec in normalized.automations:
        automation_ids_by_name[automation_spec.name] = upsert_base_automation(
            conn,
            automation_spec,
            [server_action_id],
        )
    return AutomationBundleResult(
        server_action_id=server_action_id,
        automation_ids_by_name=automation_ids_by_name,
    )


def _record_id(value: Any) -> int:
    if isinstance(value, Mapping):
        return _record_id(value.get("id"))
    if isinstance(value, (list, tuple)) and value:
        return _record_id(value[0])
    return int(value or 0)


def _required_record_id(value: Any, *, context: str) -> int:
    record_id = _record_id(value)
    if record_id <= 0:
        raise RuntimeError(f"Automation upsert did not receive a valid ID for {context}")
    return record_id
