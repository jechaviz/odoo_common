"""Reusable helpers for seeding canonical partner language defaults."""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from typing import Any, Protocol, runtime_checkable


logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class PartnerLanguageDefaultsSpec:
    """Declare the Odoo contract for partner language default seeding."""

    record_id_field_name: str = "id"
    default_language_code: str = "en_US"
    language_model_name: str = "res.lang"
    language_code_field_name: str = "code"
    language_name_field_name: str = "name"
    language_active_field_name: str = "active"
    partner_model_name: str = "res.partner"
    partner_language_field_name: str = "lang"
    company_model_name: str = "res.company"
    model_fields_model_name: str = "ir.model.fields"
    model_fields_model_field_name: str = "model"
    model_fields_name_field_name: str = "name"
    default_model_name: str = "ir.default"
    default_field_id_field_name: str = "field_id"
    default_condition_field_name: str = "condition"
    default_user_id_field_name: str = "user_id"
    default_company_id_field_name: str = "company_id"
    default_json_value_field_name: str = "json_value"
    default_condition_value: Any = False
    english_code_prefix: str = "en_"
    english_root_code: str = "en"
    english_name_token: str = "english"
    exact_code_score: int = 300
    prefixed_code_score: int = 250
    root_code_score: int = 240
    name_token_score: int = 200
    active_score_bonus: int = 10


DEFAULT_PARTNER_LANGUAGE_DEFAULTS_SPEC = PartnerLanguageDefaultsSpec()
DEFAULT_ENGLISH_LANGUAGE_CODE = DEFAULT_PARTNER_LANGUAGE_DEFAULTS_SPEC.default_language_code


@runtime_checkable
class PartnerLanguageDefaultsConnection(Protocol):
    """Minimal Odoo RPC contract required by the partner language helpers."""

    def search_read(
        self,
        model_name: str,
        domain: list[tuple[str, str, Any]],
        fields: list[str],
        **kwargs: Any,
    ) -> list[dict[str, Any]]:
        """Return rows for the requested model and domain."""

    def search(
        self,
        model_name: str,
        domain: list[tuple[str, str, Any]],
        limit: int | None = None,
    ) -> list[int]:
        """Return matching record ids."""

    def write(self, model_name: str, ids: list[int], values: dict[str, Any]) -> Any:
        """Update one or more records."""

    def create(self, model_name: str, values: dict[str, Any]) -> Any:
        """Create one record."""


def resolve_canonical_english_lang_code(
    conn: PartnerLanguageDefaultsConnection,
    spec: PartnerLanguageDefaultsSpec = DEFAULT_PARTNER_LANGUAGE_DEFAULTS_SPEC,
) -> str:
    """Return the best English language code available for this tenant."""
    rows = conn.search_read(
        spec.language_model_name,
        [],
        [
            spec.record_id_field_name,
            spec.language_code_field_name,
            spec.language_name_field_name,
            spec.language_active_field_name,
        ],
        order=f"{spec.record_id_field_name} asc",
    )
    best_code = ""
    best_score = -1
    for row in rows:
        code = str(row.get(spec.language_code_field_name) or "").strip()
        if not code:
            continue
        normalized_code = code.lower()
        normalized_name = str(row.get(spec.language_name_field_name) or "").strip().lower()
        active_bonus = spec.active_score_bonus if bool(row.get(spec.language_active_field_name)) else 0
        score = -1
        if code == spec.default_language_code:
            score = spec.exact_code_score + active_bonus
        elif normalized_code.startswith(spec.english_code_prefix):
            score = spec.prefixed_code_score + active_bonus
        elif normalized_code == spec.english_root_code:
            score = spec.root_code_score + active_bonus
        elif spec.english_name_token in normalized_name:
            score = spec.name_token_score + active_bonus
        if score > best_score:
            best_score = score
            best_code = code
    return best_code or spec.default_language_code


def _company_scope_ids(
    conn: PartnerLanguageDefaultsConnection,
    spec: PartnerLanguageDefaultsSpec,
) -> list[int | bool]:
    company_ids = sorted(
        {
            int(value)
            for value in (conn.search(spec.company_model_name, []) or [])
            if int(value or 0) > 0
        }
    )
    return [False, *company_ids]


def ensure_partner_language_defaults(
    conn: PartnerLanguageDefaultsConnection,
    *,
    dry_run: bool = False,
    spec: PartnerLanguageDefaultsSpec = DEFAULT_PARTNER_LANGUAGE_DEFAULTS_SPEC,
) -> str:
    """Activate English when needed and seed the configured partner language default."""
    lang_rows = conn.search_read(
        spec.language_model_name,
        [(spec.language_code_field_name, "=", spec.default_language_code)],
        [
            spec.record_id_field_name,
            spec.language_code_field_name,
            spec.language_active_field_name,
        ],
        limit=1,
    )
    if lang_rows and not bool(lang_rows[0].get(spec.language_active_field_name)):
        lang_id = int(lang_rows[0].get(spec.record_id_field_name) or 0)
        if lang_id > 0:
            if dry_run:
                logger.info("[DRY RUN] Would activate %s language", spec.default_language_code)
            else:
                conn.write(
                    spec.language_model_name,
                    [lang_id],
                    {spec.language_active_field_name: True},
                )
                logger.info("Activated %s language", spec.default_language_code)

    lang_code = resolve_canonical_english_lang_code(conn, spec)
    field_rows = conn.search_read(
        spec.model_fields_model_name,
        [
            (spec.model_fields_model_field_name, "=", spec.partner_model_name),
            (spec.model_fields_name_field_name, "=", spec.partner_language_field_name),
        ],
        [spec.record_id_field_name],
        limit=1,
    )
    if not field_rows:
        logger.warning(
            "Skipping partner language default sync because %s.%s was not found",
            spec.partner_model_name,
            spec.partner_language_field_name,
        )
        return lang_code

    field_id = int(field_rows[0].get(spec.record_id_field_name) or 0)
    if field_id <= 0:
        return lang_code

    json_value = json.dumps(lang_code)
    touched = 0
    for company_id in _company_scope_ids(conn, spec):
        domain = [
            (spec.default_field_id_field_name, "=", field_id),
            (spec.default_condition_field_name, "=", spec.default_condition_value),
            (spec.default_user_id_field_name, "=", False),
            (spec.default_company_id_field_name, "=", company_id or False),
        ]
        payload = {
            spec.default_field_id_field_name: field_id,
            spec.default_condition_field_name: spec.default_condition_value,
            spec.default_user_id_field_name: False,
            spec.default_company_id_field_name: company_id or False,
            spec.default_json_value_field_name: json_value,
        }
        existing_ids = conn.search(spec.default_model_name, domain, limit=1)
        if dry_run:
            logger.info(
                "[DRY RUN] Would %s %s.%s default to %s for company scope %s",
                "update" if existing_ids else "create",
                spec.partner_model_name,
                spec.partner_language_field_name,
                lang_code,
                company_id or "global",
            )
            touched += 1
            continue
        if existing_ids:
            conn.write(spec.default_model_name, existing_ids, payload)
        else:
            conn.create(spec.default_model_name, payload)
        touched += 1
    logger.info(
        "Synchronized %s.%s default to %s across %s scope(s).",
        spec.partner_model_name,
        spec.partner_language_field_name,
        lang_code,
        touched,
    )
    return lang_code


def apply_partner_language_default(
    conn: PartnerLanguageDefaultsConnection,
    payload: dict[str, Any],
    spec: PartnerLanguageDefaultsSpec = DEFAULT_PARTNER_LANGUAGE_DEFAULTS_SPEC,
) -> dict[str, Any]:
    """Inject the canonical English language when the partner payload omits it."""
    normalized_payload = dict(payload or {})
    if str(normalized_payload.get(spec.partner_language_field_name) or "").strip():
        return normalized_payload
    normalized_payload[spec.partner_language_field_name] = resolve_canonical_english_lang_code(conn, spec)
    return normalized_payload
