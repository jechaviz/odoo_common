"""Canonical declarative phase runtime contracts."""

from .phase_runtime import (
    FailurePolicy,
    PhaseSpec,
    build_phase_error_payload,
    build_phase_runner_kwargs,
    build_phase_status_payload,
    serialize_phase_error_payload,
    should_run_phase,
)

__all__ = [
    "FailurePolicy",
    "PhaseSpec",
    "build_phase_error_payload",
    "build_phase_runner_kwargs",
    "build_phase_status_payload",
    "serialize_phase_error_payload",
    "should_run_phase",
]
