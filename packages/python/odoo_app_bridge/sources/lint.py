"""Security and ergonomics lint rules for app bridge contracts."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from .contracts import OdooAppBridgeSpec


Severity = Literal["error", "warning"]

SENSITIVE_FIELD_HINTS = ("password", "token", "secret", "api_key", "apikey", "oauth", "access_key")
RISKY_CONTEXT_KEYS = {"allowed_company_ids", "uid", "force_company", "params", "bin_size"}
REQUIRES_IDEMPOTENCY_RISKS = {"money", "inventory", "approval", "procurement", "fulfillment"}
NON_PUBLIC_RISKS = {"money", "inventory", "approval", "identity", "admin", "procurement"}


@dataclass(frozen=True)
class BridgeLintIssue:
    severity: Severity
    code: str
    message: str
    path: str

    def as_dict(self) -> dict[str, str]:
        return {
            "severity": self.severity,
            "code": self.code,
            "message": self.message,
            "path": self.path,
        }


def lint_app_bridge_spec(spec: OdooAppBridgeSpec) -> tuple[BridgeLintIssue, ...]:
    issues: list[BridgeLintIssue] = []
    issues.extend(_lint_queries(spec))
    issues.extend(_lint_commands(spec))
    issues.extend(_lint_functions(spec))
    issues.extend(_lint_events(spec))
    issues.extend(_lint_crons(spec))
    return tuple(issues)


def _lint_queries(spec: OdooAppBridgeSpec) -> list[BridgeLintIssue]:
    issues: list[BridgeLintIssue] = []
    for query in spec.queries:
        auth = spec.role_by_name(query.role).auth
        path = f"queries.{query.name}"
        if not query.tags:
            issues.append(BridgeLintIssue("warning", "Q001", "query has no tags", path))
        if query.use_sudo and auth in {"public", "portal"}:
            issues.append(BridgeLintIssue("error", "Q002", "public or portal query must not use sudo", path + ".use_sudo"))
        for field_name in set(query.fields) | set(query.response_map):
            if any(hint in field_name.lower() for hint in SENSITIVE_FIELD_HINTS):
                issues.append(BridgeLintIssue("warning", "Q003", f"query exposes sensitive-looking field {field_name!r}", path + ".fields"))
        for key in query.allowed_context_keys:
            if key in RISKY_CONTEXT_KEYS:
                issues.append(BridgeLintIssue("warning", "Q004", f"query allows risky context key {key!r}", path + ".allowed_context_keys"))
        if auth == "public" and query.max_limit > 50:
            issues.append(BridgeLintIssue("warning", "Q005", "public query max_limit is high", path + ".max_limit"))
    return issues


def _lint_commands(spec: OdooAppBridgeSpec) -> list[BridgeLintIssue]:
    issues: list[BridgeLintIssue] = []
    for command in spec.commands:
        role = spec.role_by_name(command.role)
        path = f"commands.{command.name}"
        if not command.tags:
            issues.append(BridgeLintIssue("warning", "C001", "command has no tags", path))
        if command.use_sudo and role.auth in {"public", "portal"}:
            issues.append(BridgeLintIssue("error", "C002", "public or portal command must not use sudo", path + ".use_sudo"))
        if role.auth == "public" and set(command.risk_tags) & NON_PUBLIC_RISKS:
            issues.append(BridgeLintIssue("error", "C003", "public command carries sensitive risk tags", path + ".risk_tags"))
        if set(command.risk_tags) & REQUIRES_IDEMPOTENCY_RISKS and not command.idempotent:
            issues.append(BridgeLintIssue("error", "C004", "sensitive business command should be idempotent", path + ".idempotent"))
        if command.idempotent and not command.require_idempotency_key:
            issues.append(BridgeLintIssue("warning", "C005", "idempotent command should usually require Idempotency-Key", path + ".require_idempotency_key"))
        for key in command.allowed_context_keys:
            if key in RISKY_CONTEXT_KEYS:
                issues.append(BridgeLintIssue("warning", "C006", f"command allows risky context key {key!r}", path + ".allowed_context_keys"))
    return issues


def _lint_events(spec: OdooAppBridgeSpec) -> list[BridgeLintIssue]:
    issues: list[BridgeLintIssue] = []
    for event in spec.events:
        path = f"events.{event.name}"
        if not event.tags:
            issues.append(BridgeLintIssue("warning", "E001", "event has no tags", path))
        if event.direction == "inbound" and not event.required_headers:
            issues.append(BridgeLintIssue("warning", "E002", "inbound event has no required headers", path + ".required_headers"))
        if not event.fields:
            issues.append(BridgeLintIssue("warning", "E003", "event has no payload fields", path + ".fields"))
    return issues


def _lint_functions(spec: OdooAppBridgeSpec) -> list[BridgeLintIssue]:
    issues: list[BridgeLintIssue] = []
    for function in spec.functions:
        role = spec.role_by_name(function.role)
        path = f"functions.{function.name}"
        if not function.tags:
            issues.append(BridgeLintIssue("warning", "F001", "function has no tags", path))
        if role.auth == "public" and set(function.risk_tags) & NON_PUBLIC_RISKS:
            issues.append(BridgeLintIssue("error", "F002", "public function carries sensitive risk tags", path + ".risk_tags"))
        if set(function.risk_tags) & REQUIRES_IDEMPOTENCY_RISKS and not function.idempotent:
            issues.append(BridgeLintIssue("error", "F003", "sensitive business function should be idempotent", path + ".idempotent"))
        if function.idempotent and not function.require_idempotency_key:
            issues.append(BridgeLintIssue("warning", "F004", "idempotent function should usually require Idempotency-Key", path + ".require_idempotency_key"))
        for key in function.allowed_context_keys:
            if key in RISKY_CONTEXT_KEYS:
                issues.append(BridgeLintIssue("warning", "F005", f"function allows risky context key {key!r}", path + ".allowed_context_keys"))
    return issues


def _lint_crons(spec: OdooAppBridgeSpec) -> list[BridgeLintIssue]:
    issues: list[BridgeLintIssue] = []
    for cron in spec.crons:
        path = f"crons.{cron.name}"
        if not cron.tags:
            issues.append(BridgeLintIssue("warning", "J001", "cron has no tags", path))
        if cron.interval_type == "minutes" and cron.interval_number < 5:
            issues.append(BridgeLintIssue("warning", "J002", "cron interval below five minutes can be noisy", path + ".interval_number"))
    return issues


__all__ = ["BridgeLintIssue", "Severity", "lint_app_bridge_spec"]
