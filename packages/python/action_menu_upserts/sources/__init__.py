"""Canonical action and menu upsert helpers."""

from .action_menu_upserts import (
    ActionMenuUpsertConnection,
    ActionWindowSpec,
    MenuSpec,
    UrlActionSpec,
    build_action_reference,
    normalize_menu_group_ids,
    resolve_menu_path,
    set_menu_action,
    upsert_action_window,
    upsert_menu,
    upsert_url_action,
)

__all__ = [
    "ActionMenuUpsertConnection",
    "ActionWindowSpec",
    "MenuSpec",
    "UrlActionSpec",
    "build_action_reference",
    "normalize_menu_group_ids",
    "resolve_menu_path",
    "set_menu_action",
    "upsert_action_window",
    "upsert_menu",
    "upsert_url_action",
]
