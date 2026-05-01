"""Reusable helpers for seeding canonical partner language defaults."""

from __future__ import annotations

import json
import logging
from typing import Any, Protocol, runtime_checkable


logger = logging.getLogger(__name__)

DEFAULT_ENGLISH_LANGUAGE_CODE = "en_US"


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


def resolve_canonical_english_lang_code(conn: PartnerLanguageDefaultsConnection) -> str:
    """Return the best English language code available for this tenant."""
    rows = conn.search_read(
        "res.lang",
        [],
        ["id", "code", "name", "active"],
        order="id asc",
    )
    best_code = ""
    best_score = -1
    for row in rows:
        code = str(row.get("code") or "").strip()
        if not code:
            continue
        normalized_code = code.lower()
        normalized_name = str(row.get("name") or "").strip().lower()
        active_bonus = 10 if bool(row.get("active")) else 0
        score = -1
        if code == DEFAULT_ENGLISH_LANGUAGE_CODE:
            score = 300 + active_bonus
        elif normalized_code.startswith("en_"):
            score = 250 + active_bonus
        elif normalized_code == "en":
            score = 240 + active_bonus
        elif "english" in normalized_name:
            score = 200 + active_bonus
        if score > best_score:
            best_score = score
            best_code = code
    return best_code or DEFAULT_ENGLISH_LANGUAGE_CODE


def _company_scope_ids(conn: PartnerLanguageDefaultsConnection) -> list[int | bool]:
    company_ids = sorted(
        {
            int(value)
            for value in (conn.search("res.company", []) or [])
            if int(value or 0) > 0
        }
    )
    return [False, *company_ids]


def ensure_partner_language_defaults(
    conn: PartnerLanguageDefaultsConnection,
    *,
    dry_run: bool = False,
) -> str:
    """Activate English when needed and seed the native `res.partner.lang` defaults."""
    lang_rows = conn.search_read(
        "res.lang",
        [("code", "=", DEFAULT_ENGLISH_LANGUAGE_CODE)],
        ["id", "code", "active"],
        limit=1,
    )
    if lang_rows and not bool(lang_rows[0].get("active")):
        lang_id = int(lang_rows[0].get("id") or 0)
        if lang_id > 0:
            if dry_run:
                logger.info("[DRY RUN] Would activate %s language", DEFAULT_ENGLISH_LANGUAGE_CODE)
            else:
                conn.write("res.lang", [lang_id], {"active": True})
                logger.info("Activated %s language", DEFAULT_ENGLISH_LANGUAGE_CODE)

    lang_code = resolve_canonical_english_lang_code(conn)
    field_rows = conn.search_read(
        "ir.model.fields",
        [("model", "=", "res.partner"), ("name", "=", "lang")],
        ["id"],
        limit=1,
    )
    if not field_rows:
        logger.warning("Skipping partner language default sync because res.partner.lang was not found")
        return lang_code

    field_id = int(field_rows[0].get("id") or 0)
    if field_id <= 0:
        return lang_code

    json_value = json.dumps(lang_code)
    touched = 0
    for company_id in _company_scope_ids(conn):
        domain = [
            ("field_id", "=", field_id),
            ("condition", "=", False),
            ("user_id", "=", False),
            ("company_id", "=", company_id or False),
        ]
        payload = {
            "field_id": field_id,
            "condition": False,
            "user_id": False,
            "company_id": company_id or False,
            "json_value": json_value,
        }
        existing_ids = conn.search("ir.default", domain, limit=1)
        if dry_run:
            logger.info(
                "[DRY RUN] Would %s res.partner.lang default to %s for company scope %s",
                "update" if existing_ids else "create",
                lang_code,
                company_id or "global",
            )
            touched += 1
            continue
        if existing_ids:
            conn.write("ir.default", existing_ids, payload)
        else:
            conn.create("ir.default", payload)
        touched += 1
    logger.info("Synchronized res.partner.lang default to %s across %s scope(s).", lang_code, touched)
    return lang_code


def apply_partner_language_default(
    conn: PartnerLanguageDefaultsConnection,
    payload: dict[str, Any],
) -> dict[str, Any]:
    """Inject the canonical English language when the partner payload omits it."""
    normalized_payload = dict(payload or {})
    if str(normalized_payload.get("lang") or "").strip():
        return normalized_payload
    normalized_payload["lang"] = resolve_canonical_english_lang_code(conn)
    return normalized_payload
