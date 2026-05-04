"""Canonical helpers for Odoo cron upserts."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Mapping, Protocol, Sequence, runtime_checkable


CRON_RESERVED_EXTRA_KEYS = frozenset(
    {
        "name",
        "model_id",
        "state",
        "code",
        "user_id",
        "interval_number",
        "interval_type",
        "numbercall",
        "active",
        "doall",
    }
)


@runtime_checkable
class CronUpsertConnection(Protocol):
    """Minimal Odoo RPC contract required by cron upserts."""

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
        raise ValueError(f"Cron {field_name} is required")
    return clean_value


def _clean_extra_values(values: Mapping[str, Any]) -> dict[str, Any]:
    normalized = dict(values or {})
    reserved_used = sorted(key for key in normalized if key in CRON_RESERVED_EXTRA_KEYS)
    if reserved_used:
        raise ValueError(f"Cron extra_values cannot override reserved keys: {', '.join(reserved_used)}")
    return normalized


@dataclass(frozen=True)
class CodeCronSpec:
    """Declare one code-based `ir.cron` row."""

    name: str
    model_name: str
    code: str
    user_id: int
    interval_number: int = 1
    interval_type: str = "days"
    numbercall: int = -1
    active: bool = True
    doall: bool = False
    extra_values: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        object.__setattr__(self, "name", _clean_required_text(self.name, field_name="name"))
        object.__setattr__(self, "model_name", _clean_required_text(self.model_name, field_name="model_name"))
        object.__setattr__(self, "code", _clean_required_text(self.code, field_name="code"))
        object.__setattr__(self, "user_id", _required_record_id(self.user_id, context=f"{self.name} user_id"))
        object.__setattr__(self, "interval_number", int(self.interval_number))
        if self.interval_number <= 0:
            raise ValueError(f"Cron interval_number must be positive for {self.name}")
        object.__setattr__(self, "interval_type", _clean_required_text(self.interval_type, field_name="interval_type"))
        object.__setattr__(self, "numbercall", int(self.numbercall))
        object.__setattr__(self, "active", bool(self.active))
        object.__setattr__(self, "doall", bool(self.doall))
        object.__setattr__(self, "extra_values", _clean_extra_values(self.extra_values))


def resolve_model_id(conn: CronUpsertConnection, model_name: str) -> int:
    """Resolve an Odoo technical model name to its `ir.model` ID."""
    clean_model_name = _clean_required_text(model_name, field_name="model_name")
    rows = conn.search_read("ir.model", [("model", "=", clean_model_name)], ["id"], limit=1)
    if not rows:
        raise LookupError(f"Odoo model not found: {clean_model_name}")
    return _required_record_id(rows[0].get("id"), context=f"ir.model {clean_model_name}")


def upsert_code_cron(conn: CronUpsertConnection, spec: CodeCronSpec) -> int:
    """Create or update one modern code-based `ir.cron` by exact name/model."""
    normalized = spec if isinstance(spec, CodeCronSpec) else CodeCronSpec(**dict(spec))
    model_id = resolve_model_id(conn, normalized.model_name)
    values = {
        "name": normalized.name,
        "model_id": model_id,
        "state": "code",
        "code": normalized.code,
        "user_id": normalized.user_id,
        "interval_number": normalized.interval_number,
        "interval_type": normalized.interval_type,
        "numbercall": normalized.numbercall,
        "active": normalized.active,
        "doall": normalized.doall,
        **dict(normalized.extra_values),
    }
    existing_ids = conn.search(
        "ir.cron",
        [
            ("name", "=", normalized.name),
            ("model_id", "=", model_id),
        ],
        limit=1,
    )
    if existing_ids:
        cron_id = _required_record_id(existing_ids[0], context=f"ir.cron {normalized.name}")
        conn.write("ir.cron", [cron_id], values)
        return cron_id
    return _required_record_id(conn.create("ir.cron", values), context=f"created ir.cron {normalized.name}")


def _record_id(value: Any) -> int:
    if isinstance(value, Mapping):
        return _record_id(value.get("id"))
    if isinstance(value, (list, tuple)) and value:
        return _record_id(value[0])
    return int(value or 0)


def _required_record_id(value: Any, *, context: str) -> int:
    record_id = _record_id(value)
    if record_id <= 0:
        raise RuntimeError(f"Cron upsert did not receive a valid ID for {context}")
    return record_id
