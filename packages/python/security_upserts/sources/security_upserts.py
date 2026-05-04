"""Canonical helpers for Odoo security upserts."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Mapping, Protocol, Sequence, runtime_checkable


CATEGORY_RESERVED_EXTRA_KEYS = frozenset({"name", "description", "sequence"})
GROUP_RESERVED_EXTRA_KEYS = frozenset({"name", "comment", "category_id", "implied_ids"})
ACCESS_RESERVED_EXTRA_KEYS = frozenset(
    {
        "name",
        "model_id",
        "group_id",
        "perm_read",
        "perm_write",
        "perm_create",
        "perm_unlink",
        "active",
    }
)
RULE_RESERVED_EXTRA_KEYS = frozenset(
    {
        "name",
        "model_id",
        "domain_force",
        "groups",
        "perm_read",
        "perm_write",
        "perm_create",
        "perm_unlink",
        "active",
    }
)


@runtime_checkable
class SecurityUpsertConnection(Protocol):
    """Minimal Odoo RPC contract required by security upserts."""

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
        raise ValueError(f"Security {field_name} is required")
    return clean_value


def _clean_extra_values(
    values: Mapping[str, Any],
    *,
    reserved_keys: frozenset[str],
) -> dict[str, Any]:
    normalized = dict(values or {})
    reserved_used = sorted(key for key in normalized if key in reserved_keys)
    if reserved_used:
        raise ValueError(f"Security extra_values cannot override reserved keys: {', '.join(reserved_used)}")
    return normalized


@dataclass(frozen=True)
class ModuleCategorySpec:
    """Declare one `ir.module.category` row."""

    name: str
    description: str = ""
    sequence: int = 0
    extra_values: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        object.__setattr__(self, "name", _clean_required_text(self.name, field_name="category name"))
        object.__setattr__(self, "description", str(self.description or "").strip())
        object.__setattr__(self, "sequence", int(self.sequence))
        object.__setattr__(
            self,
            "extra_values",
            _clean_extra_values(self.extra_values, reserved_keys=CATEGORY_RESERVED_EXTRA_KEYS),
        )


@dataclass(frozen=True)
class SecurityGroupSpec:
    """Declare one `res.groups` row."""

    name: str
    category_id: int = 0
    comment: str = ""
    implied_group_ids: tuple[int, ...] = field(default_factory=tuple)
    extra_values: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        object.__setattr__(self, "name", _clean_required_text(self.name, field_name="group name"))
        object.__setattr__(self, "category_id", _record_id(self.category_id))
        object.__setattr__(self, "comment", str(self.comment or "").strip())
        object.__setattr__(self, "implied_group_ids", tuple(normalize_record_ids(self.implied_group_ids)))
        object.__setattr__(
            self,
            "extra_values",
            _clean_extra_values(self.extra_values, reserved_keys=GROUP_RESERVED_EXTRA_KEYS),
        )


@dataclass(frozen=True)
class ModelAccessSpec:
    """Declare one `ir.model.access` row."""

    name: str
    model_name: str
    group_id: int = 0
    perm_read: bool = True
    perm_write: bool = False
    perm_create: bool = False
    perm_unlink: bool = False
    active: bool = True
    extra_values: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        object.__setattr__(self, "name", _clean_required_text(self.name, field_name="access name"))
        object.__setattr__(self, "model_name", _clean_required_text(self.model_name, field_name="model_name"))
        object.__setattr__(self, "group_id", _record_id(self.group_id))
        object.__setattr__(self, "perm_read", bool(self.perm_read))
        object.__setattr__(self, "perm_write", bool(self.perm_write))
        object.__setattr__(self, "perm_create", bool(self.perm_create))
        object.__setattr__(self, "perm_unlink", bool(self.perm_unlink))
        object.__setattr__(self, "active", bool(self.active))
        object.__setattr__(
            self,
            "extra_values",
            _clean_extra_values(self.extra_values, reserved_keys=ACCESS_RESERVED_EXTRA_KEYS),
        )


@dataclass(frozen=True)
class RecordRuleSpec:
    """Declare one `ir.rule` row."""

    name: str
    model_name: str
    domain_force: str
    group_ids: tuple[int, ...] = field(default_factory=tuple)
    perm_read: bool = True
    perm_write: bool = True
    perm_create: bool = True
    perm_unlink: bool = True
    active: bool = True
    extra_values: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        object.__setattr__(self, "name", _clean_required_text(self.name, field_name="record rule name"))
        object.__setattr__(self, "model_name", _clean_required_text(self.model_name, field_name="model_name"))
        object.__setattr__(self, "domain_force", _clean_required_text(self.domain_force, field_name="domain_force"))
        object.__setattr__(self, "group_ids", tuple(normalize_record_ids(self.group_ids)))
        object.__setattr__(self, "perm_read", bool(self.perm_read))
        object.__setattr__(self, "perm_write", bool(self.perm_write))
        object.__setattr__(self, "perm_create", bool(self.perm_create))
        object.__setattr__(self, "perm_unlink", bool(self.perm_unlink))
        object.__setattr__(self, "active", bool(self.active))
        object.__setattr__(
            self,
            "extra_values",
            _clean_extra_values(self.extra_values, reserved_keys=RULE_RESERVED_EXTRA_KEYS),
        )


def normalize_record_ids(record_ids: Sequence[int]) -> list[int]:
    """Normalize Odoo record IDs for exact M2M writes."""
    normalized: list[int] = []
    seen: set[int] = set()
    for record_id in record_ids:
        numeric = _record_id(record_id)
        if numeric <= 0 or numeric in seen:
            continue
        seen.add(numeric)
        normalized.append(numeric)
    return normalized


def resolve_model_id(conn: SecurityUpsertConnection, model_name: str) -> int:
    """Resolve an Odoo technical model name to its `ir.model` ID."""
    clean_model_name = _clean_required_text(model_name, field_name="model_name")
    rows = conn.search_read("ir.model", [("model", "=", clean_model_name)], ["id"], limit=1)
    if not rows:
        raise LookupError(f"Odoo model not found: {clean_model_name}")
    return _required_record_id(rows[0].get("id"), context=f"ir.model {clean_model_name}")


def upsert_module_category(conn: SecurityUpsertConnection, spec: ModuleCategorySpec) -> int:
    """Create or update one `ir.module.category` row by exact name."""
    normalized = spec if isinstance(spec, ModuleCategorySpec) else ModuleCategorySpec(**dict(spec))
    values = {
        "name": normalized.name,
        "description": normalized.description,
        "sequence": normalized.sequence,
        **dict(normalized.extra_values),
    }
    existing_ids = conn.search("ir.module.category", [("name", "=", normalized.name)], limit=1)
    if existing_ids:
        category_id = _required_record_id(existing_ids[0], context=f"ir.module.category {normalized.name}")
        conn.write("ir.module.category", [category_id], values)
        return category_id
    return _required_record_id(conn.create("ir.module.category", values), context=f"created ir.module.category {normalized.name}")


def upsert_security_group(conn: SecurityUpsertConnection, spec: SecurityGroupSpec) -> int:
    """Create or update one `res.groups` row by exact name/category."""
    normalized = spec if isinstance(spec, SecurityGroupSpec) else SecurityGroupSpec(**dict(spec))
    category_value: int | bool = normalized.category_id or False
    values = {
        "name": normalized.name,
        "category_id": category_value,
        "comment": normalized.comment,
        "implied_ids": [(6, 0, list(normalized.implied_group_ids))],
        **dict(normalized.extra_values),
    }
    existing_ids = conn.search(
        "res.groups",
        [
            ("name", "=", normalized.name),
            ("category_id", "=", category_value),
        ],
        limit=1,
    )
    if existing_ids:
        group_id = _required_record_id(existing_ids[0], context=f"res.groups {normalized.name}")
        conn.write("res.groups", [group_id], values)
        return group_id
    return _required_record_id(conn.create("res.groups", values), context=f"created res.groups {normalized.name}")


def upsert_model_access(conn: SecurityUpsertConnection, spec: ModelAccessSpec) -> int:
    """Create or update one `ir.model.access` row by exact name/model."""
    normalized = spec if isinstance(spec, ModelAccessSpec) else ModelAccessSpec(**dict(spec))
    model_id = resolve_model_id(conn, normalized.model_name)
    group_value: int | bool = normalized.group_id or False
    values = {
        "name": normalized.name,
        "model_id": model_id,
        "group_id": group_value,
        "perm_read": normalized.perm_read,
        "perm_write": normalized.perm_write,
        "perm_create": normalized.perm_create,
        "perm_unlink": normalized.perm_unlink,
        "active": normalized.active,
        **dict(normalized.extra_values),
    }
    existing_ids = conn.search(
        "ir.model.access",
        [
            ("name", "=", normalized.name),
            ("model_id", "=", model_id),
        ],
        limit=1,
    )
    if existing_ids:
        access_id = _required_record_id(existing_ids[0], context=f"ir.model.access {normalized.name}")
        conn.write("ir.model.access", [access_id], values)
        return access_id
    return _required_record_id(conn.create("ir.model.access", values), context=f"created ir.model.access {normalized.name}")


def upsert_record_rule(conn: SecurityUpsertConnection, spec: RecordRuleSpec) -> int:
    """Create or update one `ir.rule` row by exact name/model."""
    normalized = spec if isinstance(spec, RecordRuleSpec) else RecordRuleSpec(**dict(spec))
    model_id = resolve_model_id(conn, normalized.model_name)
    values = {
        "name": normalized.name,
        "model_id": model_id,
        "domain_force": normalized.domain_force,
        "groups": [(6, 0, list(normalized.group_ids))],
        "perm_read": normalized.perm_read,
        "perm_write": normalized.perm_write,
        "perm_create": normalized.perm_create,
        "perm_unlink": normalized.perm_unlink,
        "active": normalized.active,
        **dict(normalized.extra_values),
    }
    existing_ids = conn.search(
        "ir.rule",
        [
            ("name", "=", normalized.name),
            ("model_id", "=", model_id),
        ],
        limit=1,
    )
    if existing_ids:
        rule_id = _required_record_id(existing_ids[0], context=f"ir.rule {normalized.name}")
        conn.write("ir.rule", [rule_id], values)
        return rule_id
    return _required_record_id(conn.create("ir.rule", values), context=f"created ir.rule {normalized.name}")


def _record_id(value: Any) -> int:
    if isinstance(value, Mapping):
        return _record_id(value.get("id"))
    if isinstance(value, (list, tuple)) and value:
        return _record_id(value[0])
    return int(value or 0)


def _required_record_id(value: Any, *, context: str) -> int:
    record_id = _record_id(value)
    if record_id <= 0:
        raise RuntimeError(f"Security upsert did not receive a valid ID for {context}")
    return record_id
