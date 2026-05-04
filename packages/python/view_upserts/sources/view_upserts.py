"""Canonical helpers for strict Odoo view upserts."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Mapping, Protocol, Sequence, runtime_checkable


MODEL_VIEW_RESERVED_KEYS = frozenset(
    {"name", "model", "type", "arch", "active", "mode", "inherit_id"}
)
QWEB_VIEW_RESERVED_KEYS = frozenset(
    {"name", "type", "arch_db", "active", "mode", "inherit_id", "model"}
)


@runtime_checkable
class ViewUpsertConnection(Protocol):
    """Minimal Odoo RPC contract required by view upserts."""

    def search(
        self,
        model_name: str,
        domain: Sequence[tuple[str, str, Any]],
        limit: int | None = None,
    ) -> list[int]:
        """Return matching record ids."""

    def write(self, model_name: str, ids: Sequence[int], values: Mapping[str, Any]) -> Any:
        """Update one or more records."""

    def create(self, model_name: str, values: Mapping[str, Any]) -> Any:
        """Create one record."""


def _clean_required_text(value: Any, *, field_name: str) -> str:
    clean_value = str(value or "").strip()
    if not clean_value:
        raise ValueError(f"Odoo view {field_name} is required")
    return clean_value


def _clean_extra_values(
    values: Mapping[str, Any],
    *,
    reserved_keys: frozenset[str],
) -> dict[str, Any]:
    normalized = dict(values or {})
    reserved_used = sorted(key for key in normalized if key in reserved_keys)
    if reserved_used:
        raise ValueError(f"Odoo view extra_values cannot override reserved keys: {', '.join(reserved_used)}")
    return normalized


@dataclass(frozen=True)
class ModelViewSpec:
    """Declare one non-QWeb `ir.ui.view` record."""

    name: str
    model_name: str
    view_type: str
    arch: str
    inherit_id: int = 0
    mode: str = "primary"
    active: bool = True
    extra_values: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        object.__setattr__(self, "name", _clean_required_text(self.name, field_name="name"))
        object.__setattr__(self, "model_name", _clean_required_text(self.model_name, field_name="model_name"))
        object.__setattr__(self, "view_type", _clean_required_text(self.view_type, field_name="view_type"))
        object.__setattr__(self, "arch", _clean_required_text(self.arch, field_name="arch"))
        object.__setattr__(self, "inherit_id", _record_id(self.inherit_id))
        object.__setattr__(self, "mode", _clean_required_text(self.mode, field_name="mode"))
        object.__setattr__(self, "active", bool(self.active))
        object.__setattr__(
            self,
            "extra_values",
            _clean_extra_values(self.extra_values, reserved_keys=MODEL_VIEW_RESERVED_KEYS),
        )


@dataclass(frozen=True)
class QWebViewSpec:
    """Declare one QWeb `ir.ui.view` record."""

    name: str
    arch_db: str
    inherit_id: int = 0
    mode: str = "extension"
    active: bool = True
    key: str = ""
    extra_values: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        object.__setattr__(self, "name", _clean_required_text(self.name, field_name="name"))
        object.__setattr__(self, "arch_db", _clean_required_text(self.arch_db, field_name="arch_db"))
        object.__setattr__(self, "inherit_id", _record_id(self.inherit_id))
        object.__setattr__(self, "mode", _clean_required_text(self.mode, field_name="mode"))
        object.__setattr__(self, "active", bool(self.active))
        object.__setattr__(self, "key", str(self.key or "").strip())
        object.__setattr__(
            self,
            "extra_values",
            _clean_extra_values(self.extra_values, reserved_keys=QWEB_VIEW_RESERVED_KEYS),
        )


def upsert_model_view(conn: ViewUpsertConnection, spec: ModelViewSpec) -> int:
    """Create or update one model view by exact `(name, model, type)`."""
    normalized = spec if isinstance(spec, ModelViewSpec) else ModelViewSpec(**dict(spec))
    values = {
        "name": normalized.name,
        "model": normalized.model_name,
        "type": normalized.view_type,
        "arch": normalized.arch,
        "active": normalized.active,
        "mode": normalized.mode,
        "inherit_id": normalized.inherit_id or False,
        **dict(normalized.extra_values),
    }
    existing_ids = conn.search(
        "ir.ui.view",
        [
            ("name", "=", normalized.name),
            ("model", "=", normalized.model_name),
            ("type", "=", normalized.view_type),
        ],
        limit=1,
    )
    if existing_ids:
        view_id = _required_record_id(existing_ids[0], context=f"ir.ui.view {normalized.name}")
        conn.write("ir.ui.view", [view_id], values)
        return view_id
    return _required_record_id(conn.create("ir.ui.view", values), context=f"created ir.ui.view {normalized.name}")


def upsert_qweb_view(conn: ViewUpsertConnection, spec: QWebViewSpec) -> int:
    """Create or update one QWeb view by exact `(name, type=qweb)`."""
    normalized = spec if isinstance(spec, QWebViewSpec) else QWebViewSpec(**dict(spec))
    values = {
        "name": normalized.name,
        "type": "qweb",
        "arch_db": normalized.arch_db,
        "active": normalized.active,
        "mode": normalized.mode,
        "inherit_id": normalized.inherit_id or False,
        "model": False,
        **dict(normalized.extra_values),
    }
    if normalized.key:
        values["key"] = normalized.key
    existing_ids = conn.search(
        "ir.ui.view",
        [
            ("name", "=", normalized.name),
            ("type", "=", "qweb"),
        ],
        limit=1,
    )
    if existing_ids:
        view_id = _required_record_id(existing_ids[0], context=f"ir.ui.view {normalized.name}")
        conn.write("ir.ui.view", [view_id], values)
        return view_id
    return _required_record_id(conn.create("ir.ui.view", values), context=f"created ir.ui.view {normalized.name}")


def _record_id(value: Any) -> int:
    if isinstance(value, Mapping):
        return _record_id(value.get("id"))
    if isinstance(value, (list, tuple)) and value:
        return _record_id(value[0])
    return int(value or 0)


def _required_record_id(value: Any, *, context: str) -> int:
    record_id = _record_id(value)
    if record_id <= 0:
        raise RuntimeError(f"Odoo view upsert did not receive a valid ID for {context}")
    return record_id
