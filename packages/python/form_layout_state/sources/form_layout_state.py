"""Reusable helpers for persisted `form_section_layout` state."""

from __future__ import annotations

import json
import unicodedata
from dataclasses import dataclass
from typing import Any, Mapping

from odoo_common.default_persistence import DefaultValuePersistenceMixin


@dataclass(frozen=True)
class FormLayoutStateSpec:
    """Declare the persisted-state contract shared with the web runtime."""

    global_param_key: str = "odoo.lib.form_section_layout.v2.global"
    top_level_mapping_keys: tuple[str, ...] = (
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
    chatter_collapsed_key: str = "chatterCollapsed"
    statusbar_labels_key: str = "statusbarLabels"
    statusbar_label_prefix: str = "statusbar_label"
    default_locale_code: str = "en_us"


DEFAULT_FORM_LAYOUT_STATE_SPEC = FormLayoutStateSpec()
FORM_LAYOUT_GLOBAL_PARAM_KEY = DEFAULT_FORM_LAYOUT_STATE_SPEC.global_param_key
DEFAULT_FORM_LAYOUT_LOCALE_CODE = DEFAULT_FORM_LAYOUT_STATE_SPEC.default_locale_code
_FORM_LAYOUT_TOP_LEVEL_KEYS = DEFAULT_FORM_LAYOUT_STATE_SPEC.top_level_mapping_keys


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


def empty_form_layout_state(
    spec: FormLayoutStateSpec = DEFAULT_FORM_LAYOUT_STATE_SPEC,
) -> dict[str, Any]:
    """Return the persisted-state skeleton expected by the runtime."""
    state: dict[str, Any] = {key: {} for key in spec.top_level_mapping_keys}
    state[spec.chatter_collapsed_key] = None
    return state


def merge_form_layout_state(
    base_state: Mapping[str, Any] | None,
    patch_state: Mapping[str, Any] | None,
    spec: FormLayoutStateSpec = DEFAULT_FORM_LAYOUT_STATE_SPEC,
) -> dict[str, Any]:
    """Merge a patch over the persisted state using the runtime's shallow-map semantics."""
    merged = empty_form_layout_state(spec)
    if isinstance(base_state, Mapping):
        for key in spec.top_level_mapping_keys:
            raw_value = base_state.get(key)
            if isinstance(raw_value, Mapping):
                merged[key].update(dict(raw_value))
        if isinstance(base_state.get(spec.chatter_collapsed_key), bool):
            merged[spec.chatter_collapsed_key] = bool(base_state[spec.chatter_collapsed_key])
    if isinstance(patch_state, Mapping):
        for key in spec.top_level_mapping_keys:
            raw_value = patch_state.get(key)
            if isinstance(raw_value, Mapping):
                merged[key].update(dict(raw_value))
        if isinstance(patch_state.get(spec.chatter_collapsed_key), bool):
            merged[spec.chatter_collapsed_key] = bool(patch_state[spec.chatter_collapsed_key])
    return merged


def form_layout_statusbar_label_entry_key(
    scope_key: str,
    statusbar_key: str,
    item_key: str,
    locale_code: str = DEFAULT_FORM_LAYOUT_LOCALE_CODE,
    spec: FormLayoutStateSpec = DEFAULT_FORM_LAYOUT_STATE_SPEC,
) -> str:
    """Build the persisted key used by runtime statusbar labels."""
    locale = normalize_form_layout_key(locale_code) or spec.default_locale_code
    return (
        f"{spec.statusbar_label_prefix}|"
        f"{locale}|{str(scope_key or '').strip()}|{normalize_form_layout_key(statusbar_key)}|{normalize_form_layout_key(item_key)}"
    )


def build_statusbar_labels_patch(
    *,
    scope_key: str,
    statusbar_key: str,
    item_labels: Mapping[str, str],
    locale_code: str = DEFAULT_FORM_LAYOUT_LOCALE_CODE,
    spec: FormLayoutStateSpec = DEFAULT_FORM_LAYOUT_STATE_SPEC,
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
            spec=spec,
        )
        statusbar_labels[entry_key] = clean_label
    return {spec.statusbar_labels_key: statusbar_labels}


class FormLayoutStatePersistenceMixin(DefaultValuePersistenceMixin):
    """Persist reusable `form_section_layout` defaults through `ir.config_parameter`."""

    form_layout_state_spec: FormLayoutStateSpec = DEFAULT_FORM_LAYOUT_STATE_SPEC

    def read_global_form_layout_state(self) -> dict[str, Any]:
        """Read the shared global runtime state used as the base state for all users."""
        spec = self.form_layout_state_spec
        raw = self.read_config_param(spec.global_param_key, "")
        if not raw:
            return empty_form_layout_state(spec)
        try:
            parsed = json.loads(raw)
        except Exception:
            return empty_form_layout_state(spec)
        if not isinstance(parsed, Mapping):
            return empty_form_layout_state(spec)
        return merge_form_layout_state(empty_form_layout_state(spec), parsed, spec)

    def write_global_form_layout_state(self, state: Mapping[str, Any]) -> dict[str, Any]:
        """Write the shared global runtime state and return the normalized payload."""
        spec = self.form_layout_state_spec
        normalized = merge_form_layout_state(empty_form_layout_state(spec), state, spec)
        self.write_config_param(
            spec.global_param_key,
            json.dumps(normalized, ensure_ascii=True, sort_keys=True),
        )
        return normalized

    def merge_global_form_layout_state(self, patch_state: Mapping[str, Any]) -> dict[str, Any]:
        """Merge one patch into the shared global runtime state and persist it."""
        merged = merge_form_layout_state(
            self.read_global_form_layout_state(),
            patch_state,
            self.form_layout_state_spec,
        )
        return self.write_global_form_layout_state(merged)

    def upsert_global_statusbar_labels(
        self,
        *,
        scope_key: str,
        statusbar_key: str,
        item_labels: Mapping[str, str],
        locale_code: str = DEFAULT_FORM_LAYOUT_LOCALE_CODE,
    ) -> dict[str, Any]:
        """Merge default statusbar labels into the shared global runtime state."""
        patch = build_statusbar_labels_patch(
            scope_key=scope_key,
            statusbar_key=statusbar_key,
            item_labels=item_labels,
            locale_code=locale_code,
            spec=self.form_layout_state_spec,
        )
        return self.merge_global_form_layout_state(patch)
