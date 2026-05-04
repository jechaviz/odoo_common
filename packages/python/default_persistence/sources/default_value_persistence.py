"""Reusable helpers for persisting Odoo defaults and config parameters."""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class DefaultPersistenceSpec:
    """Declare the Odoo models and fields used by default persistence."""

    record_id_field_name: str = "id"
    model_fields_model_name: str = "ir.model.fields"
    model_fields_model_field_name: str = "model"
    model_fields_name_field_name: str = "name"
    company_model_name: str = "res.company"
    default_model_name: str = "ir.default"
    default_field_id_field_name: str = "field_id"
    default_condition_field_name: str = "condition"
    default_user_id_field_name: str = "user_id"
    default_company_id_field_name: str = "company_id"
    default_json_value_field_name: str = "json_value"
    default_condition_value: Any = False
    config_parameter_model_name: str = "ir.config_parameter"
    config_parameter_key_field_name: str = "key"
    config_parameter_value_field_name: str = "value"


DEFAULT_VALUE_PERSISTENCE_SPEC = DefaultPersistenceSpec()


class DefaultValuePersistenceMixin:
    """Persist `ir.default` and `ir.config_parameter` values through one connection contract."""

    default_persistence_spec: DefaultPersistenceSpec = DEFAULT_VALUE_PERSISTENCE_SPEC

    def upsert_global_default(self, model_name: str, field_name: str, value: Any) -> int:
        """Create/update one global default plus one record per company for the target field."""
        spec = self.default_persistence_spec
        field_records = self.connection.search_read(
            spec.model_fields_model_name,
            [
                (spec.model_fields_model_field_name, "=", model_name),
                (spec.model_fields_name_field_name, "=", field_name),
            ],
            fields=[spec.record_id_field_name],
            limit=1,
        )
        if not field_records:
            return 0
        field_id = int(field_records[0].get(spec.record_id_field_name) or 0)
        if field_id <= 0:
            return 0

        json_value = json.dumps(value)
        updated = self.upsert_ir_default_record(
            field_id=field_id,
            company_id=False,
            user_id=False,
            json_value=json_value,
        )

        company_ids = self.connection.search(spec.company_model_name, [])
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
        spec = self.default_persistence_spec
        domain = [
            (spec.default_field_id_field_name, "=", field_id),
            (spec.default_condition_field_name, "=", spec.default_condition_value),
            (spec.default_user_id_field_name, "=", user_id or False),
            (spec.default_company_id_field_name, "=", company_id or False),
        ]
        existing_ids = self.connection.search(spec.default_model_name, domain, limit=1)
        payload = {
            spec.default_field_id_field_name: field_id,
            spec.default_condition_field_name: spec.default_condition_value,
            spec.default_user_id_field_name: user_id or False,
            spec.default_company_id_field_name: company_id or False,
            spec.default_json_value_field_name: json_value,
        }
        if existing_ids:
            self.connection.write(spec.default_model_name, existing_ids, payload)
            return 1
        self.connection.create(spec.default_model_name, payload)
        return 1

    def read_config_param(self, key: str, default_value: str = "") -> str:
        """Read one `ir.config_parameter` value with a caller-declared default."""
        spec = self.default_persistence_spec
        rows = self.connection.search_read(
            spec.config_parameter_model_name,
            [(spec.config_parameter_key_field_name, "=", key)],
            fields=[spec.config_parameter_value_field_name],
            limit=1,
        )
        if not rows:
            return default_value
        return str(rows[0].get(spec.config_parameter_value_field_name) or default_value)

    def write_config_param(self, key: str, value: str) -> None:
        """Upsert one `ir.config_parameter` value."""
        spec = self.default_persistence_spec
        rows = self.connection.search_read(
            spec.config_parameter_model_name,
            [(spec.config_parameter_key_field_name, "=", key)],
            fields=[spec.record_id_field_name],
            limit=1,
        )
        if rows:
            param_id = int(rows[0].get(spec.record_id_field_name) or 0)
            if param_id > 0:
                self.connection.write(
                    spec.config_parameter_model_name,
                    [param_id],
                    {spec.config_parameter_value_field_name: str(value)},
                )
                return
        self.connection.create(
            spec.config_parameter_model_name,
            {
                spec.config_parameter_key_field_name: key,
                spec.config_parameter_value_field_name: str(value),
            },
        )
