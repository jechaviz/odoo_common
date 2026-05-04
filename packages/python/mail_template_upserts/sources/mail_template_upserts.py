"""Canonical helpers for Odoo mail template upserts."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Mapping, Protocol, Sequence, runtime_checkable


MAIL_TEMPLATE_RESERVED_EXTRA_KEYS = frozenset(
    {
        "name",
        "model_id",
        "subject",
        "body_html",
        "report_template_ids",
        "report_name",
        "email_from",
        "email_to",
    }
)


@runtime_checkable
class MailTemplateUpsertConnection(Protocol):
    """Minimal Odoo RPC contract required by mail template upserts."""

    def search(
        self,
        model_name: str,
        domain: Sequence[tuple[str, str, Any]],
        limit: int | None = None,
    ) -> list[int]:
        """Return matching record ids."""

    def write(self, model_name: str, ids: Sequence[int], values: Mapping[str, Any]) -> Any:
        """Update one or more records."""

    def create(self, model_name: str, values: Mapping[str, Any]) -> Any:
        """Create one record."""


def _clean_required_text(value: Any, *, field_name: str) -> str:
    clean_value = str(value or "").strip()
    if not clean_value:
        raise ValueError(f"Mail template {field_name} is required")
    return clean_value


def _clean_extra_values(values: Mapping[str, Any]) -> dict[str, Any]:
    normalized = dict(values or {})
    reserved_used = sorted(key for key in normalized if key in MAIL_TEMPLATE_RESERVED_EXTRA_KEYS)
    if reserved_used:
        raise ValueError(f"Mail template extra_values cannot override reserved keys: {', '.join(reserved_used)}")
    return normalized


@dataclass(frozen=True)
class MailTemplateSpec:
    """Declare one modern `mail.template` row."""

    name: str
    model_id: int
    subject: str
    body_html: str
    report_action_ids: tuple[int, ...] | None = None
    report_name: str | None = None
    email_from: str | None = None
    email_to: str | None = None
    extra_values: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        object.__setattr__(self, "name", _clean_required_text(self.name, field_name="name"))
        object.__setattr__(self, "model_id", _required_record_id(self.model_id, context=f"{self.name} model_id"))
        object.__setattr__(self, "subject", _clean_required_text(self.subject, field_name="subject"))
        object.__setattr__(self, "body_html", _clean_required_text(self.body_html, field_name="body_html"))
        if self.report_action_ids is not None:
            object.__setattr__(self, "report_action_ids", tuple(normalize_report_action_ids(self.report_action_ids)))
        object.__setattr__(self, "report_name", None if self.report_name is None else str(self.report_name or "").strip())
        object.__setattr__(self, "email_from", None if self.email_from is None else str(self.email_from or "").strip())
        object.__setattr__(self, "email_to", None if self.email_to is None else str(self.email_to or "").strip())
        object.__setattr__(self, "extra_values", _clean_extra_values(self.extra_values))


def normalize_report_action_ids(report_action_ids: Sequence[int]) -> list[int]:
    """Normalize report action IDs for exact M2M writes."""
    normalized: list[int] = []
    seen: set[int] = set()
    for report_action_id in report_action_ids:
        numeric = _record_id(report_action_id)
        if numeric <= 0 or numeric in seen:
            continue
        seen.add(numeric)
        normalized.append(numeric)
    return normalized


def build_report_template_reset_commands(report_action_ids: Sequence[int]) -> list[tuple[int, int, list[int]]]:
    """Build exact reset commands for `mail.template.report_template_ids`."""
    return [(6, 0, normalize_report_action_ids(report_action_ids))]


def upsert_mail_template(conn: MailTemplateUpsertConnection, spec: MailTemplateSpec) -> int:
    """Create or update one `mail.template` row by exact name/model."""
    normalized = spec if isinstance(spec, MailTemplateSpec) else MailTemplateSpec(**dict(spec))
    values: dict[str, Any] = {
        "name": normalized.name,
        "model_id": normalized.model_id,
        "subject": normalized.subject,
        "body_html": normalized.body_html,
        **dict(normalized.extra_values),
    }
    if normalized.report_action_ids is not None:
        values["report_template_ids"] = build_report_template_reset_commands(normalized.report_action_ids)
    if normalized.report_name is not None:
        values["report_name"] = normalized.report_name or False
    if normalized.email_from is not None:
        values["email_from"] = normalized.email_from or False
    if normalized.email_to is not None:
        values["email_to"] = normalized.email_to or False

    existing_ids = conn.search(
        "mail.template",
        [
            ("name", "=", normalized.name),
            ("model_id", "=", normalized.model_id),
        ],
        limit=1,
    )
    if existing_ids:
        template_id = _required_record_id(existing_ids[0], context=f"mail.template {normalized.name}")
        conn.write("mail.template", [template_id], values)
        return template_id
    return _required_record_id(conn.create("mail.template", values), context=f"created mail.template {normalized.name}")


def _record_id(value: Any) -> int:
    if isinstance(value, Mapping):
        return _record_id(value.get("id"))
    if isinstance(value, (list, tuple)) and value:
        return _record_id(value[0])
    return int(value or 0)


def _required_record_id(value: Any, *, context: str) -> int:
    record_id = _record_id(value)
    if record_id <= 0:
        raise RuntimeError(f"Mail template upsert did not receive a valid ID for {context}")
    return record_id
