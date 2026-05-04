"""Canonical contracts and payload helpers for declarative phase execution."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal, Mapping

FailurePolicy = Literal["continue", "stop"]
_FAILURE_POLICIES = frozenset({"continue", "stop"})


@dataclass(frozen=True)
class PhaseSpec:
    """Declarative description of one execution phase."""

    step_number: int
    title: str
    result_key: str
    runner_name: str
    skip_flag_name: str | None = None
    forwarded_args: tuple[str, ...] = ()
    failure_policy: FailurePolicy = "stop"

    def __post_init__(self) -> None:
        object.__setattr__(self, "step_number", _clean_step_number(self.step_number))
        object.__setattr__(self, "title", _clean_required_text(self.title, field_name="title"))
        object.__setattr__(self, "result_key", _clean_required_text(self.result_key, field_name="result_key"))
        object.__setattr__(self, "runner_name", _clean_required_text(self.runner_name, field_name="runner_name"))
        object.__setattr__(self, "skip_flag_name", _clean_optional_text(self.skip_flag_name))
        object.__setattr__(self, "forwarded_args", _clean_forwarded_args(self.forwarded_args))
        if self.failure_policy not in _FAILURE_POLICIES:
            raise ValueError(f"Phase failure_policy must be one of {sorted(_FAILURE_POLICIES)!r}")


def should_run_phase(phase: PhaseSpec, phase_context: Mapping[str, Any]) -> bool:
    """Return whether a phase should execute under its declared skip flag."""
    _require_phase_context(phase_context)
    if phase.skip_flag_name is None:
        return True
    return not bool(phase_context.get(phase.skip_flag_name, False))


def build_phase_runner_kwargs(
    phase: PhaseSpec,
    phase_context: Mapping[str, Any],
) -> dict[str, Any]:
    """Forward only explicitly declared context arguments to a phase runner."""
    _require_phase_context(phase_context)
    missing_args = [arg_name for arg_name in phase.forwarded_args if arg_name not in phase_context]
    if missing_args:
        joined_args = ", ".join(repr(arg_name) for arg_name in missing_args)
        raise KeyError(f"Phase context is missing forwarded arg(s): {joined_args}")
    return {arg_name: phase_context[arg_name] for arg_name in phase.forwarded_args}


def build_phase_status_payload(
    phase: PhaseSpec,
    status: str,
    message: str | None = None,
) -> dict[str, Any]:
    """Build a normalized phase status payload."""
    payload: dict[str, Any] = {
        "step_number": phase.step_number,
        "title": phase.title,
        "status": _clean_required_text(status, field_name="status"),
        "failure_policy": phase.failure_policy,
    }
    clean_message = _clean_optional_text(message)
    if clean_message:
        payload["message"] = clean_message
    return payload


def build_phase_error_payload(
    phase: PhaseSpec,
    error_type: str,
    message: str,
    details: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    """Build a normalized phase error payload from explicit error fields."""
    return {
        "phase": phase.result_key,
        "step_number": phase.step_number,
        "title": phase.title,
        "failure_policy": phase.failure_policy,
        "error_type": _clean_required_text(error_type, field_name="error_type"),
        "message": _clean_required_text(message, field_name="message"),
        "details": _clean_details(details),
    }


def serialize_phase_error_payload(
    phase: PhaseSpec,
    exc: Exception,
    details: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    """Convert an exception into a structured phase error payload."""
    return build_phase_error_payload(
        phase,
        error_type=type(exc).__name__,
        message=str(exc),
        details=details,
    )


def _clean_step_number(value: int) -> int:
    if isinstance(value, bool) or not isinstance(value, int):
        raise TypeError("Phase step_number must be an integer")
    if value < 0:
        raise ValueError("Phase step_number must be non-negative")
    return value


def _clean_forwarded_args(value: tuple[str, ...]) -> tuple[str, ...]:
    if isinstance(value, (str, bytes)) or not isinstance(value, tuple):
        raise TypeError("Phase forwarded_args must be a tuple of strings")
    normalized = tuple(_clean_required_text(item, field_name="forwarded arg") for item in value)
    if len(set(normalized)) != len(normalized):
        raise ValueError("Phase forwarded_args must not contain duplicates")
    return normalized


def _clean_details(details: Mapping[str, Any] | None) -> dict[str, Any]:
    if details is None:
        return {}
    if not isinstance(details, Mapping):
        raise TypeError("Phase error details must be a mapping")
    return dict(details)


def _require_phase_context(phase_context: Mapping[str, Any]) -> None:
    if not isinstance(phase_context, Mapping):
        raise TypeError("Phase context must be a mapping")


def _clean_required_text(value: Any, *, field_name: str) -> str:
    clean_value = str(value or "").strip()
    if not clean_value:
        raise ValueError(f"Phase {field_name} is required")
    return clean_value


def _clean_optional_text(value: Any) -> str | None:
    if value is None:
        return None
    clean_value = str(value or "").strip()
    return clean_value or None
