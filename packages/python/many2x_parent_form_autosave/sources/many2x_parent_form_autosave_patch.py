"""Reusable builder for the Many2X parent-form autosave web patch."""

from __future__ import annotations

from dataclasses import dataclass
import json
from pathlib import Path

from .text_templates import (
    load_template_from_dir,
    render_template,
)


_TEMPLATES_DIR = Path(__file__).resolve().parent / "templates"


def _js_literal(value: str) -> str:
    return json.dumps(value, ensure_ascii=True)


def _require_text(value: str, field_name: str) -> str:
    normalized = str(value or "").strip()
    if not normalized:
        raise ValueError(f"{field_name} must be a non-empty string")
    return normalized


@dataclass(frozen=True)
class Many2XParentFormAutosaveSpec:
    """Explicit project wiring for the Many2X parent-form autosave bridge."""

    module_name: str = "many2x_parent_form_autosave.bridge"
    guard_property_name: str = "__many2xParentFormAutosaveDefined"
    debug_property_name: str = "__many2xParentFormAutosaveDebug"
    log_prefix: str = "many2x_parent_form_autosave"
    parent_form_selector: str = ".o_form_view"
    x2many_field_selector: str = ".o_field_x2many"
    modal_selector: str = ".modal"
    parent_save_method_name: str = "saveButtonClicked"
    max_owner_depth: int = 12
    debug_event_limit: int = 40

    def __post_init__(self) -> None:
        module_name = _require_text(self.module_name, "module_name")
        if module_name == "rp" or module_name.startswith("rp."):
            raise ValueError("module_name must not use the legacy rp.* namespace")
        for field_name in (
            "guard_property_name",
            "debug_property_name",
            "log_prefix",
            "parent_form_selector",
            "x2many_field_selector",
            "modal_selector",
            "parent_save_method_name",
        ):
            _require_text(getattr(self, field_name), field_name)
        if self.max_owner_depth < 1:
            raise ValueError("max_owner_depth must be >= 1")
        if self.debug_event_limit < 1:
            raise ValueError("debug_event_limit must be >= 1")

    def template_context(self) -> dict[str, str]:
        """Render context consumed by the reusable web-patch template."""
        return {
            "__MODULE_NAME_LITERAL__": _js_literal(self.module_name),
            "__GUARD_PROPERTY_LITERAL__": _js_literal(self.guard_property_name),
            "__DEBUG_PROPERTY_LITERAL__": _js_literal(self.debug_property_name),
            "__LOG_PREFIX_LITERAL__": _js_literal(self.log_prefix),
            "__PARENT_FORM_SELECTOR_LITERAL__": _js_literal(self.parent_form_selector),
            "__X2MANY_FIELD_SELECTOR_LITERAL__": _js_literal(self.x2many_field_selector),
            "__MODAL_SELECTOR_LITERAL__": _js_literal(self.modal_selector),
            "__PARENT_SAVE_METHOD_LITERAL__": _js_literal(self.parent_save_method_name),
            "__MAX_OWNER_DEPTH__": str(self.max_owner_depth),
            "__DEBUG_EVENT_LIMIT__": str(self.debug_event_limit),
        }


def build_many2x_parent_form_autosave_patch(spec: Many2XParentFormAutosaveSpec) -> str:
    """Return the reusable Many2X parent-form autosave patch source."""
    return render_template(
        load_template_from_dir(_TEMPLATES_DIR, "many2x_parent_form_autosave.js.tmpl"),
        spec.template_context(),
    )
