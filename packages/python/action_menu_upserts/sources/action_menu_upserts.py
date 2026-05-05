"""Canonical helpers for Odoo action and menu upserts."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Mapping, Protocol, Sequence, runtime_checkable


@runtime_checkable
class ActionMenuUpsertConnection(Protocol):
    """Minimal Odoo RPC contract required by action/menu upserts."""

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
        raise ValueError(f"Action/menu {field_name} is required")
    return clean_value


def _clean_literal(value: Any, *, default: str) -> str:
    clean_value = str(value or "").strip()
    return clean_value or default


@dataclass(frozen=True)
class ActionWindowSpec:
    """Declare one `ir.actions.act_window` record."""

    name: str
    res_model: str
    view_mode: str
    target: str = "current"
    domain: str = "[]"
    context: str = "{}"
    legacy_names: Sequence[str] = ()
    extra_values: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        object.__setattr__(self, "name", _clean_required_text(self.name, field_name="action name"))
        object.__setattr__(self, "res_model", _clean_required_text(self.res_model, field_name="res_model"))
        object.__setattr__(self, "view_mode", _clean_required_text(self.view_mode, field_name="view_mode"))
        object.__setattr__(self, "target", _clean_required_text(self.target, field_name="target"))
        object.__setattr__(self, "domain", _clean_literal(self.domain, default="[]"))
        object.__setattr__(self, "context", _clean_literal(self.context, default="{}"))
        object.__setattr__(
            self,
            "legacy_names",
            tuple(
                legacy_name
                for legacy_name in (_clean_literal(value, default="") for value in self.legacy_names or ())
                if legacy_name and legacy_name != self.name
            ),
        )
        object.__setattr__(self, "extra_values", dict(self.extra_values or {}))


@dataclass(frozen=True)
class UrlActionSpec:
    """Declare one `ir.actions.act_url` record."""

    name: str
    url: str
    target: str = "self"
    extra_values: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        object.__setattr__(self, "name", _clean_required_text(self.name, field_name="URL action name"))
        object.__setattr__(self, "url", _clean_required_text(self.url, field_name="url"))
        object.__setattr__(self, "target", _clean_required_text(self.target, field_name="target"))
        object.__setattr__(self, "extra_values", dict(self.extra_values or {}))


@dataclass(frozen=True)
class MenuSpec:
    """Declare one `ir.ui.menu` record."""

    name: str
    sequence: int
    parent_id: int = 0
    action_model_name: str = ""
    action_id: int = 0
    active: bool = True
    group_ids: tuple[int, ...] | None = None
    extra_values: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        object.__setattr__(self, "name", _clean_required_text(self.name, field_name="menu name"))
        object.__setattr__(self, "sequence", int(self.sequence))
        object.__setattr__(self, "parent_id", _record_id(self.parent_id))
        action_model_name = str(self.action_model_name or "").strip()
        action_id = _record_id(self.action_id)
        if bool(action_model_name) != bool(action_id):
            raise ValueError("Menu action_model_name and action_id must be declared together")
        object.__setattr__(self, "action_model_name", action_model_name)
        object.__setattr__(self, "action_id", action_id)
        object.__setattr__(self, "active", bool(self.active))
        object.__setattr__(
            self,
            "group_ids",
            None if self.group_ids is None else tuple(normalize_menu_group_ids(self.group_ids)),
        )
        object.__setattr__(self, "extra_values", dict(self.extra_values or {}))


def normalize_menu_group_ids(group_ids: Sequence[int]) -> list[int]:
    """Normalize menu group ids for exact M2M writes."""
    normalized: list[int] = []
    seen: set[int] = set()
    for group_id in group_ids:
        numeric = _record_id(group_id)
        if numeric <= 0 or numeric in seen:
            continue
        seen.add(numeric)
        normalized.append(numeric)
    return normalized


def build_action_reference(action_model_name: str, action_id: int) -> str:
    """Build an Odoo menu action reference in `model,id` format."""
    clean_model_name = _clean_required_text(action_model_name, field_name="action_model_name")
    clean_action_id = _required_record_id(action_id, context=f"{clean_model_name} action")
    return f"{clean_model_name},{clean_action_id}"


def upsert_action_window(conn: ActionMenuUpsertConnection, spec: ActionWindowSpec) -> int:
    """Create or update one `ir.actions.act_window` record by exact name/model/type."""
    normalized = spec if isinstance(spec, ActionWindowSpec) else ActionWindowSpec(**dict(spec))
    values = {
        "name": normalized.name,
        "type": "ir.actions.act_window",
        "res_model": normalized.res_model,
        "view_mode": normalized.view_mode,
        "target": normalized.target,
        "domain": normalized.domain,
        "context": normalized.context,
        **dict(normalized.extra_values),
    }
    search_names = (normalized.name, *normalized.legacy_names)
    existing_ids: list[int] = []
    for action_name in search_names:
        existing_ids = conn.search(
            "ir.actions.act_window",
            [
                ("name", "=", action_name),
                ("res_model", "=", normalized.res_model),
                ("type", "=", "ir.actions.act_window"),
            ],
            limit=1,
        )
        if existing_ids:
            break
    if existing_ids:
        action_id = _required_record_id(existing_ids[0], context=f"ir.actions.act_window {normalized.name}")
        conn.write("ir.actions.act_window", [action_id], values)
        return action_id
    return _required_record_id(conn.create("ir.actions.act_window", values), context=f"created ir.actions.act_window {normalized.name}")


def upsert_url_action(conn: ActionMenuUpsertConnection, spec: UrlActionSpec) -> int:
    """Create or update one `ir.actions.act_url` record by exact name/type."""
    normalized = spec if isinstance(spec, UrlActionSpec) else UrlActionSpec(**dict(spec))
    values = {
        "name": normalized.name,
        "type": "ir.actions.act_url",
        "url": normalized.url,
        "target": normalized.target,
        **dict(normalized.extra_values),
    }
    existing_ids = conn.search(
        "ir.actions.act_url",
        [
            ("name", "=", normalized.name),
            ("type", "=", "ir.actions.act_url"),
        ],
        limit=1,
    )
    if existing_ids:
        action_id = _required_record_id(existing_ids[0], context=f"ir.actions.act_url {normalized.name}")
        conn.write("ir.actions.act_url", [action_id], values)
        return action_id
    return _required_record_id(conn.create("ir.actions.act_url", values), context=f"created ir.actions.act_url {normalized.name}")


def upsert_menu(conn: ActionMenuUpsertConnection, spec: MenuSpec) -> int:
    """Create or update one `ir.ui.menu` record by exact name/parent."""
    normalized = spec if isinstance(spec, MenuSpec) else MenuSpec(**dict(spec))
    parent_value: int | bool = normalized.parent_id or False
    values: dict[str, Any] = {
        "name": normalized.name,
        "parent_id": parent_value,
        "sequence": normalized.sequence,
        "active": normalized.active,
        **dict(normalized.extra_values),
    }
    if normalized.action_model_name and normalized.action_id:
        values["action"] = build_action_reference(normalized.action_model_name, normalized.action_id)
    if normalized.group_ids is not None:
        values["group_ids"] = [(6, 0, list(normalized.group_ids))]

    existing_ids = conn.search(
        "ir.ui.menu",
        [
            ("name", "=", normalized.name),
            ("parent_id", "=", parent_value),
        ],
        limit=1,
    )
    if existing_ids:
        menu_id = _required_record_id(existing_ids[0], context=f"ir.ui.menu {normalized.name}")
        conn.write("ir.ui.menu", [menu_id], values)
        return menu_id
    return _required_record_id(conn.create("ir.ui.menu", values), context=f"created ir.ui.menu {normalized.name}")


def set_menu_action(
    conn: ActionMenuUpsertConnection,
    menu_id: int,
    action_model_name: str,
    action_id: int,
) -> int:
    """Set one menu action reference exactly."""
    clean_menu_id = _required_record_id(menu_id, context="ir.ui.menu")
    conn.write(
        "ir.ui.menu",
        [clean_menu_id],
        {"action": build_action_reference(action_model_name, action_id)},
    )
    return clean_menu_id


def resolve_menu_path(conn: ActionMenuUpsertConnection, path: Sequence[str]) -> int:
    """Resolve a menu path by exact parent/name chain."""
    if not path:
        raise ValueError("Menu path must contain at least one segment")
    parent_id = 0
    current_id = 0
    for raw_segment in path:
        segment = _clean_required_text(raw_segment, field_name="menu path segment")
        parent_value: int | bool = parent_id or False
        ids = conn.search(
            "ir.ui.menu",
            [
                ("name", "=", segment),
                ("parent_id", "=", parent_value),
            ],
            limit=1,
        )
        if not ids:
            raise LookupError(f"Menu path segment not found: {' / '.join(path)}")
        current_id = _required_record_id(ids[0], context=f"ir.ui.menu {segment}")
        parent_id = current_id
    return current_id


def _record_id(value: Any) -> int:
    if isinstance(value, Mapping):
        return _record_id(value.get("id"))
    if isinstance(value, (list, tuple)) and value:
        return _record_id(value[0])
    return int(value or 0)


def _required_record_id(value: Any, *, context: str) -> int:
    record_id = _record_id(value)
    if record_id <= 0:
        raise RuntimeError(f"Action/menu upsert did not receive a valid ID for {context}")
    return record_id
