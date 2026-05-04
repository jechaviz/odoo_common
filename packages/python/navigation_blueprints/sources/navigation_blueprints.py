"""Neutral keyed blueprints for Odoo actions and menus."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Mapping, Sequence


def _clean_required_text(value: Any, *, field_name: str) -> str:
    normalized = str(value or "").strip()
    if not normalized:
        raise ValueError(f"Navigation blueprint {field_name} is required")
    return normalized


def _clean_optional_text(value: Any) -> str:
    return str(value or "").strip()


@dataclass(frozen=True)
class WindowActionBlueprint:
    """Declare one keyed `ir.actions.act_window` blueprint."""

    key: str
    name: str
    res_model: str
    view_mode: str = "list,form"
    domain: str = ""
    context: str = ""
    target: str = "current"
    view_id: int = 0
    res_id: int = 0
    extra_values: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        object.__setattr__(self, "key", _clean_required_text(self.key, field_name="key"))
        object.__setattr__(self, "name", _clean_required_text(self.name, field_name="action name"))
        object.__setattr__(self, "res_model", _clean_required_text(self.res_model, field_name="res_model"))
        object.__setattr__(self, "view_mode", _clean_required_text(self.view_mode, field_name="view_mode"))
        object.__setattr__(self, "domain", _clean_optional_text(self.domain))
        object.__setattr__(self, "context", _clean_optional_text(self.context))
        object.__setattr__(self, "target", _clean_required_text(self.target, field_name="target"))
        object.__setattr__(self, "view_id", int(self.view_id or 0))
        object.__setattr__(self, "res_id", int(self.res_id or 0))
        object.__setattr__(self, "extra_values", dict(self.extra_values or {}))

    def as_dict(self) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "key": self.key,
            "name": self.name,
            "type": "ir.actions.act_window",
            "res_model": self.res_model,
            "view_mode": self.view_mode,
            "target": self.target,
            **dict(self.extra_values),
        }
        if self.domain:
            payload["domain"] = self.domain
        if self.context:
            payload["context"] = self.context
        if self.view_id > 0:
            payload["view_id"] = self.view_id
        if self.res_id > 0:
            payload["res_id"] = self.res_id
        return payload


@dataclass(frozen=True)
class ContainerMenuBlueprint:
    """Declare one keyed menu container blueprint."""

    key: str
    name: str
    sequence: int
    parent_key: str = ""
    active: bool = True
    extra_values: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        object.__setattr__(self, "key", _clean_required_text(self.key, field_name="key"))
        object.__setattr__(self, "name", _clean_required_text(self.name, field_name="menu name"))
        object.__setattr__(self, "sequence", int(self.sequence))
        object.__setattr__(self, "parent_key", _clean_optional_text(self.parent_key))
        object.__setattr__(self, "active", bool(self.active))
        object.__setattr__(self, "extra_values", dict(self.extra_values or {}))

    def as_dict(self) -> dict[str, Any]:
        return {
            "key": self.key,
            "name": self.name,
            "parent_key": self.parent_key or None,
            "sequence": self.sequence,
            "active": self.active,
            **dict(self.extra_values),
        }


@dataclass(frozen=True)
class ActionMenuBlueprint:
    """Declare one keyed menu blueprint that points to an action key."""

    key: str
    name: str
    action_key: str
    sequence: int
    parent_key: str
    active: bool = True
    extra_values: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        object.__setattr__(self, "key", _clean_required_text(self.key, field_name="key"))
        object.__setattr__(self, "name", _clean_required_text(self.name, field_name="menu name"))
        object.__setattr__(self, "action_key", _clean_required_text(self.action_key, field_name="action_key"))
        object.__setattr__(self, "sequence", int(self.sequence))
        object.__setattr__(self, "parent_key", _clean_required_text(self.parent_key, field_name="parent_key"))
        object.__setattr__(self, "active", bool(self.active))
        object.__setattr__(self, "extra_values", dict(self.extra_values or {}))

    def as_dict(self) -> dict[str, Any]:
        return {
            "key": self.key,
            "name": self.name,
            "parent_key": self.parent_key,
            "action_key": self.action_key,
            "sequence": self.sequence,
            "active": self.active,
            **dict(self.extra_values),
        }


def build_window_action_blueprint(
    key: str,
    name: str,
    res_model: str,
    **kwargs: Any,
) -> dict[str, Any]:
    """Build a serialized window-action blueprint."""
    return WindowActionBlueprint(key=key, name=name, res_model=res_model, **kwargs).as_dict()


def build_container_menu_blueprint(
    key: str,
    name: str,
    sequence: int,
    parent_key: str = "",
    **kwargs: Any,
) -> dict[str, Any]:
    """Build a serialized container-menu blueprint."""
    return ContainerMenuBlueprint(
        key=key,
        name=name,
        sequence=sequence,
        parent_key=parent_key,
        **kwargs,
    ).as_dict()


def build_action_menu_blueprint(
    key: str,
    name: str,
    action_key: str,
    sequence: int,
    parent_key: str,
    **kwargs: Any,
) -> dict[str, Any]:
    """Build a serialized action-menu blueprint."""
    return ActionMenuBlueprint(
        key=key,
        name=name,
        action_key=action_key,
        sequence=sequence,
        parent_key=parent_key,
        **kwargs,
    ).as_dict()


def index_blueprints_by_key(blueprints: Sequence[Mapping[str, Any]]) -> dict[str, dict[str, Any]]:
    """Index serialized blueprints by exact key and reject duplicates."""
    indexed: dict[str, dict[str, Any]] = {}
    for blueprint in blueprints:
        key = _clean_required_text(blueprint.get("key"), field_name="key")
        if key in indexed:
            raise ValueError(f"Duplicate navigation blueprint key: {key}")
        indexed[key] = dict(blueprint)
    return indexed


__all__ = [
    "ActionMenuBlueprint",
    "ContainerMenuBlueprint",
    "WindowActionBlueprint",
    "build_action_menu_blueprint",
    "build_container_menu_blueprint",
    "build_window_action_blueprint",
    "index_blueprints_by_key",
]
