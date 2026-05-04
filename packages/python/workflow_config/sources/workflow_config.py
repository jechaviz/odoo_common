"""Canonical helpers for workflow labels and XML visibility expressions."""

from __future__ import annotations

from dataclasses import dataclass
from html import escape
from typing import Any, Iterable


@dataclass(frozen=True)
class WorkflowStepSpec:
    """Declare labels for one workflow step exposed in fields, actions, and menus."""

    key: str
    field_label: str
    action_label: str = ""
    menu_label: str = ""
    description: str = ""

    def __post_init__(self) -> None:
        object.__setattr__(self, "key", _clean_required_text(self.key, field_name="step key"))
        object.__setattr__(self, "field_label", _clean_required_text(self.field_label, field_name="field label"))
        object.__setattr__(self, "action_label", str(self.action_label or "").strip())
        object.__setattr__(self, "menu_label", str(self.menu_label or "").strip())
        object.__setattr__(self, "description", str(self.description or "").strip())


def index_workflow_steps(steps: Iterable[WorkflowStepSpec]) -> dict[str, WorkflowStepSpec]:
    """Index workflow steps by key and reject duplicates early."""
    indexed: dict[str, WorkflowStepSpec] = {}
    for raw_step in steps:
        step = raw_step if isinstance(raw_step, WorkflowStepSpec) else WorkflowStepSpec(**dict(raw_step))
        if step.key in indexed:
            raise ValueError(f"Duplicate workflow step key: {step.key}")
        indexed[step.key] = step
    return indexed


def workflow_step_selection_options(steps: Iterable[WorkflowStepSpec]) -> tuple[tuple[str, str], ...]:
    """Build selection tuples for a workflow-step selection field."""
    return tuple((step.key, step.field_label) for step in index_workflow_steps(steps).values())


def workflow_step_field_label(
    steps: Iterable[WorkflowStepSpec],
    key: str,
    default: str = "",
) -> str:
    """Resolve the field/selection label for one workflow step."""
    return _workflow_step_label(steps, key, "field_label", default)


def workflow_step_action_label(
    steps: Iterable[WorkflowStepSpec],
    key: str,
    default: str = "",
) -> str:
    """Resolve the action/window label for one workflow step."""
    return _workflow_step_label(steps, key, "action_label", default)


def workflow_step_menu_label(
    steps: Iterable[WorkflowStepSpec],
    key: str,
    default: str = "",
) -> str:
    """Resolve the menu label for one workflow step."""
    return _workflow_step_label(steps, key, "menu_label", default)


def selection_field_invisible_when_not_in(
    field_name: str,
    allowed_values: Iterable[Any],
    *,
    enabled: bool = True,
) -> str:
    """Build an Odoo invisible expression for one selection-like field."""
    if not enabled:
        return ""
    clean_field_name = _clean_required_text(field_name, field_name="field_name")
    normalized_values = tuple(
        _clean_required_text(value, field_name="allowed value")
        for value in allowed_values
        if str(value or "").strip()
    )
    if not normalized_values:
        raise ValueError("Workflow visibility allowed_values must not be empty when enabled")
    if len(normalized_values) == 1:
        return f"{clean_field_name} != {normalized_values[0]!r}"
    rendered = ", ".join(repr(value) for value in normalized_values)
    return f"{clean_field_name} not in [{rendered}]"


def xml_invisible_attr(expression: str) -> str:
    """Render one XML invisible attribute only when a modifier is needed."""
    normalized = str(expression or "").strip()
    return f' invisible="{escape(normalized, quote=True)}"' if normalized else ""


def _workflow_step_label(
    steps: Iterable[WorkflowStepSpec],
    key: str,
    label_field_name: str,
    default: str,
) -> str:
    clean_key = _clean_required_text(key, field_name="step key")
    step = index_workflow_steps(steps).get(clean_key)
    if step is None:
        return str(default or "")
    return str(getattr(step, label_field_name) or "").strip() or str(default or "")


def _clean_required_text(value: Any, *, field_name: str) -> str:
    clean_value = str(value or "").strip()
    if not clean_value:
        raise ValueError(f"Workflow config {field_name} is required")
    return clean_value
