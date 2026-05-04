"""Canonical Odoo mail template upsert helpers."""

from .mail_template_upserts import (
    MailTemplateSpec,
    MailTemplateUpsertConnection,
    build_report_template_reset_commands,
    normalize_report_action_ids,
    upsert_mail_template,
)

__all__ = [
    "MailTemplateSpec",
    "MailTemplateUpsertConnection",
    "build_report_template_reset_commands",
    "normalize_report_action_ids",
    "upsert_mail_template",
]
