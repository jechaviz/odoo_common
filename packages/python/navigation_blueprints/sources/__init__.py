"""Canonical Odoo navigation blueprint helpers."""

from .navigation_blueprints import (
    ActionMenuBlueprint,
    ContainerMenuBlueprint,
    WindowActionBlueprint,
    build_action_menu_blueprint,
    build_container_menu_blueprint,
    build_window_action_blueprint,
    index_blueprints_by_key,
)

__all__ = [
    "ActionMenuBlueprint",
    "ContainerMenuBlueprint",
    "WindowActionBlueprint",
    "build_action_menu_blueprint",
    "build_container_menu_blueprint",
    "build_window_action_blueprint",
    "index_blueprints_by_key",
]
