"""Reusable helpers for persisted `form_section_layout` state."""

from __future__ import annotations

import json
import unicodedata
from typing import Any, Mapping

from odoo_common.default_persistence import DefaultValuePersistenceMixin


FORM_LAYOUT_GLOBAL_PARAM_KEY = "odoo.lib.form_section_layout.v2.global"
_FORM_LAYOUT_TOP_LEVEL_KEYS = (
    "collapsed",
    "order",
    "sectionVisible",
    "fieldVisible",
    "fieldDefaults",
    "layoutItemVisible",
    "layoutDefaults",
    "settingsRoles",
    "statusbarLabels",
    "subtotalLayouts",
)


def normalize_form_layout_key(value: str) -> str:
    """Mirror the runtime key normalization used by `form_section_layout`."""
    raw = str(value or "").strip().lower()
    if not raw:
        return ""
    try:
        raw = unicodedata.normalize("NFD", raw)
        raw = "".join(char for char in raw if unicodedata.category(char) != "Mn")
    except Exception:
        raw = str(value or "").strip().lower()
    normalized_chars: list[str] = []
    previous_was_sep = False
    for char in raw:
        if ("a" <= char <= "z") or ("0" <= char <= "9") or char == "_":
            normalized_chars.append(char)
            previous_was_sep = False
            continue
        if previous_was_sep:
            continue
        normalized_chars.append("_")
        previous_was_sep = True
    normalized = "".join(normalized_chars).strip("_")
    while "__" in normalized:
        normalized = normalized.replace("__", "_")
    return normalized


def empty_form_layout_state() -> dict[str, Any]:
    """Return the persisted-state skeleton expected by the runtime."""
    return {
        "collapsed": {},
        "order": {},
        "sectionVisible": {},
        "fieldVisible": {},
        "fieldDefaults": {},
        "layoutItemVisible": {},
        "layoutDefaults": {},
        "settingsRoles": {},
        "statusbarLabels": {},
        "subtotalLayouts": {},
        "chatterCollapsed": None,
    }


def merge_form_layout_state(
    base_state: Mapping[str, Any] | None,
    patch_state: Mapping[str, Any] | None,
) -> dict[str, Any]:
    """Merge a patch over the persisted state using the runtime's shallow-map semantics."""
    merged = empty_form_layout_state()
    if isinstance(base_state, Mapping):
        for key in _FORM_LAYOUT_TOP_LEVEL_KEYS:
            raw_value = base_state.get(key)
            if isinstance(raw_value, Mapping):
                merged[key].update(dict(raw_value))
        if isinstance(base_state.get("chatterCollapsed"), bool):
            merged["chatterCollapsed"] = bool(base_state["chatterCollapsed"])
    if isinstance(patch_state, Mapping):
        for key in _FORM_LAYOUT_TOP_LEVEL_KEYS:
            raw_value = patch_state.get(key)
            if isinstance(raw_value, Mapping):
                merged[key].update(dict(raw_value))
        if isinstance(patch_state.get("chatterCollapsed"), bool):
            merged["chatterCollapsed"] = bool(patch_state["chatterCollapsed"])
    return merged


def form_layout_statusbar_label_entry_key(
    scope_key: str,
    statusbar_key: str,
    item_key: str,
    locale_code: str = "en_us",
) -> str:
    """Build the persisted key used by runtime statusbar labels."""
    locale = normalize_form_layout_key(locale_code) or "en_us"
    return (
        "statusbar_label|"
        f"{locale}|{str(scope_key or '').strip()}|{normalize_form_layout_key(statusbar_key)}|{normalize_form_layout_key(item_key)}"
    )


def build_statusbar_labels_patch(
    *,
    scope_key: str,
    statusbar_key: str,
    item_labels: Mapping[str, str],
    locale_code: str = "en_us",
) -> dict[str, dict[str, str]]:
    """Build one persisted-state patch for default statusbar labels."""
    statusbar_labels: dict[str, str] = {}
    for item_key, label in item_labels.items():
        normalized_item_key = normalize_form_layout_key(item_key)
        clean_label = str(label or "").strip()
        if not normalized_item_key or not clean_label:
            continue
        entry_key = form_layout_statusbar_label_entry_key(
            scope_key=scope_key,
            statusbar_key=statusbar_key,
            item_key=normalized_item_key,
            locale_code=locale_code,
        )
        statusbar_labels[entry_key] = clean_label
    return {"statusbarLabels": statusbar_labels}


class FormLayoutStatePersistenceMixin(DefaultValuePersistenceMixin):
    """Persist reusable `form_section_layout` defaults through `ir.config_parameter`."""

    def read_global_form_layout_state(self) -> dict[str, Any]:
        """Read the shared global runtime state used as the first fallback for all users."""
        raw = self.read_config_param(FORM_LAYOUT_GLOBAL_PARAM_KEY, "")
        if not raw:
            return empty_form_layout_state()
        try:
            parsed = json.loads(raw)
        except Exception:
            return empty_form_layout_state()
        if not isinstance(parsed, Mapping):
            return empty_form_layout_state()
        return merge_form_layout_state(empty_form_layout_state(), parsed)

    def write_global_form_layout_state(self, state: Mapping[str, Any]) -> dict[str, Any]:
        """Write the shared global runtime state and return the normalized payload."""
        normalized = merge_form_layout_state(empty_form_layout_state(), state)
        self.write_config_param(
            FORM_LAYOUT_GLOBAL_PARAM_KEY,
            json.dumps(normalized, ensure_ascii=True, sort_keys=True),
        )
        return normalized

    def merge_global_form_layout_state(self, patch_state: Mapping[str, Any]) -> dict[str, Any]:
        """Merge one patch into the shared global runtime state and persist it."""
        merged = merge_form_layout_state(self.read_global_form_layout_state(), patch_state)
        return self.write_global_form_layout_state(merged)

    def upsert_global_statusbar_labels(
        self,
        *,
        scope_key: str,
        statusbar_key: str,
        item_labels: Mapping[str, str],
        locale_code: str = "en_us",
    ) -> dict[str, Any]:
        """Merge default statusbar labels into the shared global runtime state."""
        patch = build_statusbar_labels_patch(
            scope_key=scope_key,
            statusbar_key=statusbar_key,
            item_labels=item_labels,
            locale_code=locale_code,
        )
        return self.merge_global_form_layout_state(patch)
