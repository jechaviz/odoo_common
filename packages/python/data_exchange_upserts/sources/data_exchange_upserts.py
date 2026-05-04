"""Canonical helpers for Odoo data exchange upserts."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Mapping, Protocol, Sequence, runtime_checkable


EXPORT_RESERVED_EXTRA_KEYS = frozenset({"name", "resource", "export_fields"})
IMPORT_RESERVED_EXTRA_KEYS = frozenset({"res_model", "column_name", "field_name"})


@runtime_checkable
class DataExchangeUpsertConnection(Protocol):
    """Minimal Odoo RPC contract required by data exchange upserts."""

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
        raise ValueError(f"Data exchange {field_name} is required")
    return clean_value


def _clean_extra_values(
    values: Mapping[str, Any],
    *,
    reserved_keys: frozenset[str],
) -> dict[str, Any]:
    normalized = dict(values or {})
    reserved_used = sorted(key for key in normalized if key in reserved_keys)
    if reserved_used:
        raise ValueError(f"Data exchange extra_values cannot override reserved keys: {', '.join(reserved_used)}")
    return normalized


@dataclass(frozen=True)
class ExportTemplateSpec:
    """Declare one `ir.exports` row."""

    name: str
    resource: str
    field_names: tuple[str, ...]
    extra_values: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        object.__setattr__(self, "name", _clean_required_text(self.name, field_name="export name"))
        object.__setattr__(self, "resource", _clean_required_text(self.resource, field_name="resource"))
        object.__setattr__(self, "field_names", tuple(normalize_field_names(self.field_names)))
        object.__setattr__(
            self,
            "extra_values",
            _clean_extra_values(self.extra_values, reserved_keys=EXPORT_RESERVED_EXTRA_KEYS),
        )


@dataclass(frozen=True)
class ImportMappingSpec:
    """Declare one `base_import.mapping` row."""

    res_model: str
    column_name: str
    field_name: str
    extra_values: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        object.__setattr__(self, "res_model", _clean_required_text(self.res_model, field_name="res_model"))
        object.__setattr__(self, "column_name", _clean_required_text(self.column_name, field_name="column_name"))
        object.__setattr__(self, "field_name", _clean_required_text(self.field_name, field_name="field_name"))
        object.__setattr__(
            self,
            "extra_values",
            _clean_extra_values(self.extra_values, reserved_keys=IMPORT_RESERVED_EXTRA_KEYS),
        )


def normalize_field_names(field_names: Sequence[str]) -> list[str]:
    """Normalize export field names while preserving caller-declared order."""
    if not field_names:
        raise ValueError("Data exchange export field_names must not be empty")
    normalized: list[str] = []
    seen: set[str] = set()
    for field_name in field_names:
        clean_field_name = _clean_required_text(field_name, field_name="export field_name")
        if clean_field_name in seen:
            raise ValueError(f"Duplicate export field_name: {clean_field_name}")
        seen.add(clean_field_name)
        normalized.append(clean_field_name)
    return normalized


def build_export_field_commands(field_names: Sequence[str]) -> list[tuple[int, int, Any]]:
    """Build exact reset commands for `ir.exports.export_fields`."""
    commands: list[tuple[int, int, Any]] = [(5, 0, 0)]
    commands.extend((0, 0, {"name": field_name}) for field_name in normalize_field_names(field_names))
    return commands


def upsert_export_template(conn: DataExchangeUpsertConnection, spec: ExportTemplateSpec) -> int:
    """Create or update one `ir.exports` row by exact name/resource."""
    normalized = spec if isinstance(spec, ExportTemplateSpec) else ExportTemplateSpec(**dict(spec))
    values = {
        "name": normalized.name,
        "resource": normalized.resource,
        "export_fields": build_export_field_commands(normalized.field_names),
        **dict(normalized.extra_values),
    }
    existing_ids = conn.search(
        "ir.exports",
        [
            ("name", "=", normalized.name),
            ("resource", "=", normalized.resource),
        ],
        limit=1,
    )
    if existing_ids:
        export_id = _required_record_id(existing_ids[0], context=f"ir.exports {normalized.name}")
        conn.write("ir.exports", [export_id], values)
        return export_id
    return _required_record_id(conn.create("ir.exports", values), context=f"created ir.exports {normalized.name}")


def upsert_import_mapping(conn: DataExchangeUpsertConnection, spec: ImportMappingSpec) -> int:
    """Create or update one `base_import.mapping` row by exact model/column."""
    normalized = spec if isinstance(spec, ImportMappingSpec) else ImportMappingSpec(**dict(spec))
    values = {
        "res_model": normalized.res_model,
        "column_name": normalized.column_name,
        "field_name": normalized.field_name,
        **dict(normalized.extra_values),
    }
    existing_ids = conn.search(
        "base_import.mapping",
        [
            ("res_model", "=", normalized.res_model),
            ("column_name", "=", normalized.column_name),
        ],
        limit=1,
    )
    if existing_ids:
        mapping_id = _required_record_id(existing_ids[0], context=f"base_import.mapping {normalized.column_name}")
        conn.write("base_import.mapping", [mapping_id], values)
        return mapping_id
    return _required_record_id(
        conn.create("base_import.mapping", values),
        context=f"created base_import.mapping {normalized.column_name}",
    )


def _record_id(value: Any) -> int:
    if isinstance(value, Mapping):
        return _record_id(value.get("id"))
    if isinstance(value, (list, tuple)) and value:
        return _record_id(value[0])
    return int(value or 0)


def _required_record_id(value: Any, *, context: str) -> int:
    record_id = _record_id(value)
    if record_id <= 0:
        raise RuntimeError(f"Data exchange upsert did not receive a valid ID for {context}")
    return record_id
