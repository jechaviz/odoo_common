"""OWASP-first security scanner for app bridge contracts."""

from __future__ import annotations

from dataclasses import dataclass
import json
from typing import Literal

from .contracts import OdooAppBridgeSpec


SecuritySeverity = Literal["critical", "high", "medium", "low", "info"]

SENSITIVE_RISK_TAGS = frozenset({"admin", "approval", "identity", "inventory", "money", "procurement", "secret"})
MUTATING_METHODS = frozenset({"create", "write", "unlink", "action_confirm", "action_cancel", "button_validate"})
HIGH_PAYLOAD_BYTES = 2 * 1024 * 1024
SECURITY_SEVERITY_RANK: dict[SecuritySeverity, int] = {
    "critical": 50,
    "high": 40,
    "medium": 30,
    "low": 20,
    "info": 10,
}
SECURITY_SCORE_PENALTY: dict[SecuritySeverity, int] = {
    "critical": 40,
    "high": 15,
    "medium": 5,
    "low": 2,
    "info": 0,
}


@dataclass(frozen=True)
class SecurityScanFinding:
    severity: SecuritySeverity
    code: str
    message: str
    path: str
    recommendation: str
    owasp: str

    def as_dict(self) -> dict[str, str]:
        return {
            "severity": self.severity,
            "code": self.code,
            "message": self.message,
            "path": self.path,
            "recommendation": self.recommendation,
            "owasp": self.owasp,
        }


@dataclass(frozen=True)
class SecurityReleaseThresholds:
    """Promotion thresholds for a generated app security release gate."""

    min_score: int = 90
    block_severities: tuple[SecuritySeverity, ...] = ("critical", "high")
    max_medium_findings: int = 2
    max_low_findings: int = 999
    max_total_findings: int = 999

    def __post_init__(self) -> None:
        if not 0 <= self.min_score <= 100:
            raise ValueError("min_score must be between 0 and 100")
        invalid = set(self.block_severities) - set(SECURITY_SEVERITY_RANK)
        if invalid:
            raise ValueError(f"invalid block_severities: {sorted(invalid)!r}")
        for name in ("max_medium_findings", "max_low_findings", "max_total_findings"):
            value = int(getattr(self, name))
            if value < 0:
                raise ValueError(f"{name} must be >= 0")
            object.__setattr__(self, name, value)
        object.__setattr__(self, "min_score", int(self.min_score))
        object.__setattr__(self, "block_severities", tuple(self.block_severities))

    def as_dict(self) -> dict[str, object]:
        return {
            "min_score": self.min_score,
            "block_severities": list(self.block_severities),
            "max_medium_findings": self.max_medium_findings,
            "max_low_findings": self.max_low_findings,
            "max_total_findings": self.max_total_findings,
        }


@dataclass(frozen=True)
class SecurityReleaseGateReport:
    """Auditable security promotion decision for one app bridge contract."""

    passed: bool
    score: int
    blocking_findings: tuple[SecurityScanFinding, ...]
    findings: tuple[SecurityScanFinding, ...]
    thresholds: SecurityReleaseThresholds
    contract_digest: str
    app_slug: str
    app_module: str
    counts_by_severity: dict[str, int]
    failure_reasons: tuple[str, ...]

    def as_dict(self) -> dict[str, object]:
        return {
            "passed": self.passed,
            "score": self.score,
            "failure_reasons": list(self.failure_reasons),
            "blocking_findings": [finding.as_dict() for finding in self.blocking_findings],
            "findings": [finding.as_dict() for finding in self.findings],
            "counts_by_severity": dict(self.counts_by_severity),
            "thresholds": self.thresholds.as_dict(),
            "contract_digest": self.contract_digest,
            "app": {
                "slug": self.app_slug,
                "module": self.app_module,
            },
        }

    def as_json(self) -> str:
        return json.dumps(self.as_dict(), indent=2, sort_keys=True) + "\n"


def scan_app_bridge_security(spec: OdooAppBridgeSpec) -> tuple[SecurityScanFinding, ...]:
    """Return OWASP-oriented findings for an app bridge contract."""
    findings: list[SecurityScanFinding] = []
    findings.extend(_scan_global_security(spec))
    findings.extend(_scan_queries(spec))
    findings.extend(_scan_commands(spec))
    findings.extend(_scan_functions(spec))
    return tuple(findings)


def evaluate_app_bridge_security_release(
    spec: OdooAppBridgeSpec,
    thresholds: SecurityReleaseThresholds | None = None,
) -> SecurityReleaseGateReport:
    """Return an auditable release-gate decision for an app bridge contract."""
    resolved_thresholds = thresholds or SecurityReleaseThresholds()
    findings = scan_app_bridge_security(spec)
    counts = _count_findings_by_severity(findings)
    score = _security_score(findings)
    blocking_findings = tuple(
        finding for finding in findings if finding.severity in resolved_thresholds.block_severities
    )
    failure_reasons: list[str] = []
    if score < resolved_thresholds.min_score:
        failure_reasons.append(f"score {score} is below minimum {resolved_thresholds.min_score}")
    if blocking_findings:
        failure_reasons.append("blocking severity findings are present")
    if counts["medium"] > resolved_thresholds.max_medium_findings:
        failure_reasons.append(f"medium findings exceed maximum {resolved_thresholds.max_medium_findings}")
    if counts["low"] > resolved_thresholds.max_low_findings:
        failure_reasons.append(f"low findings exceed maximum {resolved_thresholds.max_low_findings}")
    if len(findings) > resolved_thresholds.max_total_findings:
        failure_reasons.append(f"total findings exceed maximum {resolved_thresholds.max_total_findings}")
    return SecurityReleaseGateReport(
        passed=not failure_reasons,
        score=score,
        blocking_findings=blocking_findings,
        findings=findings,
        thresholds=resolved_thresholds,
        contract_digest=spec.contract_digest(),
        app_slug=spec.app.slug,
        app_module=spec.app.module,
        counts_by_severity=counts,
        failure_reasons=tuple(failure_reasons),
    )


def _scan_global_security(spec: OdooAppBridgeSpec) -> list[SecurityScanFinding]:
    security = spec.security
    findings: list[SecurityScanFinding] = []

    if "*" in security.allowed_cors_origins:
        findings.append(
            _finding(
                "high",
                "OAB-SEC-001",
                "CORS allows any origin.",
                "security.allowed_cors_origins",
                "Replace wildcard CORS with an explicit allowlist of trusted origins.",
                "OWASP API7:2023 Security Misconfiguration",
            )
        )
    if not security.rate_limit_enabled:
        findings.append(
            _finding(
                "high",
                "OAB-SEC-002",
                "Rate limiting is disabled for bridge routes.",
                "security.rate_limit_enabled",
                "Enable per-route and per-principal rate limits, especially for auth, bot, and function endpoints.",
                "OWASP API4:2023 Unrestricted Resource Consumption",
            )
        )
    if not security.require_https:
        findings.append(
            _finding(
                "high",
                "OAB-SEC-003",
                "HTTPS is not required by the bridge contract.",
                "security.require_https",
                "Require HTTPS and secure cookies for all app bridge traffic.",
                "OWASP API8:2023 Security Misconfiguration",
            )
        )
    if security.max_payload_bytes > HIGH_PAYLOAD_BYTES:
        findings.append(
            _finding(
                "medium",
                "OAB-SEC-004",
                "Maximum request payload is high.",
                "security.max_payload_bytes",
                "Keep payload limits close to the largest expected request and reject oversized bodies early.",
                "OWASP API4:2023 Unrestricted Resource Consumption",
            )
        )
    if not security.force_csrf_for_session_commands:
        findings.append(
            _finding(
                "high",
                "OAB-SEC-005",
                "Session command CSRF protection can be bypassed globally.",
                "security.force_csrf_for_session_commands",
                "Keep CSRF enforced for browser/session-backed commands and functions.",
                "OWASP API7:2023 Security Misconfiguration",
            )
        )
    if security.oauth_allow_email_fallback:
        findings.append(
            _finding(
                "high",
                "OAB-SEC-006",
                "OAuth identity may fall back to email matching.",
                "security.oauth_allow_email_fallback",
                "Bind OAuth users by provider subject identifier and treat email only as display or verified metadata.",
                "OWASP API2:2023 Broken Authentication",
            )
        )
    if security.expose_provider_secrets:
        findings.append(
            _finding(
                "critical",
                "OAB-SEC-007",
                "Provider secrets are marked as exposable.",
                "security.expose_provider_secrets",
                "Never include OAuth/API provider secrets in generated static assets, contracts, OpenAPI, or public routes.",
                "OWASP API8:2023 Security Misconfiguration",
            )
        )
    if security.expose_static_provider_config:
        findings.append(
            _finding(
                "medium",
                "OAB-SEC-008",
                "Static provider configuration exposure is enabled.",
                "security.expose_static_provider_config",
                "Expose only non-secret provider metadata needed by the client and keep credentials server-side.",
                "OWASP API3:2023 Broken Object Property Level Authorization",
            )
        )
    if not security.api_key_required and _has_sensitive_routes(spec):
        findings.append(
            _finding(
                "high",
                "OAB-SEC-009",
                "API keys are disabled while sensitive bot, internal, command, or function routes exist.",
                "security.api_key_required",
                "Require API keys or an equivalent signed credential for non-public automation and sensitive operations.",
                "OWASP API2:2023 Broken Authentication",
            )
        )
    return findings


def _scan_queries(spec: OdooAppBridgeSpec) -> list[SecurityScanFinding]:
    findings: list[SecurityScanFinding] = []
    for query in spec.queries:
        role = spec.role_by_name(query.role)
        path = f"queries.{query.name}"
        if role.auth == "public" and query.use_sudo:
            findings.append(
                _finding(
                    "critical",
                    "OAB-SEC-101",
                    "Public query executes with sudo.",
                    path + ".use_sudo",
                    "Remove sudo from public queries or move the route behind portal/internal authentication.",
                    "OWASP API1:2023 Broken Object Level Authorization",
                )
            )
    return findings


def _scan_commands(spec: OdooAppBridgeSpec) -> list[SecurityScanFinding]:
    findings: list[SecurityScanFinding] = []
    for command in spec.commands:
        role = spec.role_by_name(command.role)
        path = f"commands.{command.name}"
        if role.auth == "public" and (_command_is_risky(command) or not command.idempotent):
            findings.append(
                _finding(
                    "critical",
                    "OAB-SEC-201",
                    "Public command can trigger risky server-side behavior.",
                    path,
                    "Keep commands behind authenticated roles, remove risky methods/tags, and require idempotency for mutations.",
                    "OWASP API5:2023 Broken Function Level Authorization",
                )
            )
        if command.csrf_required is False:
            findings.append(
                _finding(
                    "high",
                    "OAB-SEC-202",
                    "Command explicitly disables CSRF protection.",
                    path + ".csrf_required",
                    "Require CSRF tokens for browser/session-backed command calls.",
                    "OWASP API7:2023 Security Misconfiguration",
                )
            )
    return findings


def _scan_functions(spec: OdooAppBridgeSpec) -> list[SecurityScanFinding]:
    findings: list[SecurityScanFinding] = []
    for function in spec.functions:
        role = spec.role_by_name(function.role)
        path = f"functions.{function.name}"
        if role.auth == "public" and (_has_sensitive_risk(function.risk_tags) or not function.idempotent):
            findings.append(
                _finding(
                    "high",
                    "OAB-SEC-301",
                    "Public function route can execute risky application code.",
                    path,
                    "Move risky functions behind an authenticated role and require idempotency keys for state changes.",
                    "OWASP API5:2023 Broken Function Level Authorization",
                )
            )
        if function.csrf_required is False:
            findings.append(
                _finding(
                    "high",
                    "OAB-SEC-302",
                    "Function explicitly disables CSRF protection.",
                    path + ".csrf_required",
                    "Require CSRF tokens for browser/session-backed function calls.",
                    "OWASP API7:2023 Security Misconfiguration",
                )
            )
    return findings


def _has_sensitive_routes(spec: OdooAppBridgeSpec) -> bool:
    for query in spec.queries:
        if spec.role_by_name(query.role).auth in {"bot", "internal"} or query.use_sudo or _has_sensitive_risk(query.risk_tags):
            return True
    for command in spec.commands:
        if spec.role_by_name(command.role).auth in {"bot", "internal"} or _command_is_risky(command):
            return True
    for function in spec.functions:
        if spec.role_by_name(function.role).auth in {"bot", "internal"} or _has_sensitive_risk(function.risk_tags):
            return True
    return False


def _command_is_risky(command: object) -> bool:
    method = str(getattr(command, "method", "")).lower().rsplit(".", 1)[-1]
    return method in MUTATING_METHODS or bool(getattr(command, "use_sudo", False)) or _has_sensitive_risk(getattr(command, "risk_tags", ()))


def _has_sensitive_risk(risk_tags: tuple[str, ...]) -> bool:
    return bool(set(risk_tags) & SENSITIVE_RISK_TAGS)


def _security_score(findings: tuple[SecurityScanFinding, ...]) -> int:
    penalty = sum(SECURITY_SCORE_PENALTY[finding.severity] for finding in findings)
    return max(0, 100 - penalty)


def _count_findings_by_severity(findings: tuple[SecurityScanFinding, ...]) -> dict[str, int]:
    counts = {severity: 0 for severity in SECURITY_SEVERITY_RANK}
    for finding in findings:
        counts[finding.severity] += 1
    return counts


def _finding(
    severity: SecuritySeverity,
    code: str,
    message: str,
    path: str,
    recommendation: str,
    owasp: str,
) -> SecurityScanFinding:
    return SecurityScanFinding(
        severity=severity,
        code=code,
        message=message,
        path=path,
        recommendation=recommendation,
        owasp=owasp,
    )


__all__ = [
    "SecurityReleaseGateReport",
    "SecurityReleaseThresholds",
    "SecurityScanFinding",
    "SecuritySeverity",
    "evaluate_app_bridge_security_release",
    "scan_app_bridge_security",
]
