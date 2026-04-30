"""Reusable helpers for persisting Odoo defaults and config parameters."""

from __future__ import annotations

import json
from typing import Any


class DefaultValuePersistenceMixin:
    """Persist `ir.default` and `ir.config_parameter` values through one connection contract."""

    def upsert_global_default(self, model_name: str, field_name: str, value: Any) -> int:
        """Create/update one global default plus one record per company for the target field."""
        field_records = self.connection.search_read(
            "ir.model.fields",
            [("model", "=", model_name), ("name", "=", field_name)],
            fields=["id"],
            limit=1,
        )
        if not field_records:
            return 0
        field_id = int(field_records[0].get("id") or 0)
        if field_id <= 0:
            return 0

        json_value = json.dumps(value)
        updated = self.upsert_ir_default_record(
            field_id=field_id,
            company_id=False,
            user_id=False,
            json_value=json_value,
        )

        company_ids = self.connection.search("res.company", [])
        for company_id in company_ids:
            updated += self.upsert_ir_default_record(
                field_id=field_id,
                company_id=int(company_id),
                user_id=False,
                json_value=json_value,
            )
        return updated

    def upsert_ir_default_record(self, *, field_id: int, company_id: Any, user_id: Any, json_value: str) -> int:
        """Upsert one `ir.default` row by `(field_id, company_id, user_id, condition=False)`."""
        domain = [
            ("field_id", "=", field_id),
            ("condition", "=", False),
            ("user_id", "=", user_id or False),
            ("company_id", "=", company_id or False),
        ]
        existing_ids = self.connection.search("ir.default", domain, limit=1)
        payload = {
            "field_id": field_id,
            "condition": False,
            "user_id": user_id or False,
            "company_id": company_id or False,
            "json_value": json_value,
        }
        if existing_ids:
            self.connection.write("ir.default", existing_ids, payload)
            return 1
        self.connection.create("ir.default", payload)
        return 1

    def read_config_param(self, key: str, default_value: str = "") -> str:
        """Read one `ir.config_parameter` value with a string fallback."""
        rows = self.connection.search_read(
            "ir.config_parameter",
            [("key", "=", key)],
            fields=["value"],
            limit=1,
        )
        if not rows:
            return default_value
        return str(rows[0].get("value") or default_value)

    def write_config_param(self, key: str, value: str) -> None:
        """Upsert one `ir.config_parameter` value."""
        rows = self.connection.search_read(
            "ir.config_parameter",
            [("key", "=", key)],
            fields=["id"],
            limit=1,
        )
        if rows:
            param_id = int(rows[0].get("id") or 0)
            if param_id > 0:
                self.connection.write("ir.config_parameter", [param_id], {"value": str(value)})
                return
        self.connection.create("ir.config_parameter", {"key": key, "value": str(value)})
