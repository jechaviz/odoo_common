"""Canonical helpers for Odoo manual model and custom-field upserts."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Mapping, Protocol, Sequence, runtime_checkable


FIELD_RESERVED_EXTRA_KEYS = frozenset(
    {
        "name",
        "model",
        "model_id",
        "field_description",
        "ttype",
        "state",
        "required",
        "help",
        "relation",
        "relation_field",
        "relation_table",
        "column1",
        "column2",
        "selection",
        "selection_ids",
    }
)
MODEL_RESERVED_EXTRA_KEYS = frozenset({"model", "name", "state", "info"})


@runtime_checkable
class CustomFieldUpsertConnection(Protocol):
    """Minimal Odoo RPC contract required by custom-field upserts."""

    def search(
        self,
        model_name: str,
        domain: Sequence[tuple[str, str, Any]],
        limit: int | None = None,
    ) -> list[int]:
        """Return matching record ids."""

    def search_read(
        self,
        model_name: str,
        domain: Sequence[tuple[str, str, Any]],
        fields: Sequence[str] | None = None,
        limit: int | None = None,
        **kwargs: Any,
    ) -> list[Mapping[str, Any]]:
        """Return matching rows with requested fields."""

    def write(self, model_name: str, ids: Sequence[int], values: Mapping[str, Any]) -> Any:
        """Update one or more records."""

    def create(self, model_name: str, values: Mapping[str, Any]) -> Any:
        """Create one record."""

    def unlink(self, model_name: str, ids: Sequence[int]) -> Any:
        """Delete one or more records."""


def _clean_required_text(value: Any, *, field_name: str) -> str:
    clean_value = str(value or "").strip()
    if not clean_value:
        raise ValueError(f"Custom field {field_name} is required")
    return clean_value


def _clean_extra_values(
    values: Mapping[str, Any],
    *,
    reserved_keys: frozenset[str],
) -> dict[str, Any]:
    normalized = dict(values or {})
    reserved_used = sorted(key for key in normalized if key in reserved_keys)
    if reserved_used:
        raise ValueError(f"Custom field extra_values cannot override reserved keys: {', '.join(reserved_used)}")
    return normalized


@dataclass(frozen=True)
class ManualModelSpec:
    """Declare one manual `ir.model` row."""

    model_name: str
    display_name: str
    info: str = ""
    state: str = "manual"
    extra_values: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        object.__setattr__(self, "model_name", _clean_required_text(self.model_name, field_name="model_name"))
        object.__setattr__(self, "display_name", _clean_required_text(self.display_name, field_name="display_name"))
        object.__setattr__(self, "info", str(self.info or "").strip())
        object.__setattr__(self, "state", _clean_required_text(self.state, field_name="model state"))
        object.__setattr__(
            self,
            "extra_values",
            _clean_extra_values(self.extra_values, reserved_keys=MODEL_RESERVED_EXTRA_KEYS),
        )


@dataclass(frozen=True)
class SelectionOption:
    """Declare one managed selection option."""

    value: str
    label: str

    def __post_init__(self) -> None:
        object.__setattr__(self, "value", _clean_required_text(self.value, field_name="selection value"))
        object.__setattr__(self, "label", _clean_required_text(self.label, field_name="selection label"))


@dataclass(frozen=True)
class CustomFieldSpec:
    """Declare one manual `ir.model.fields` row."""

    model_name: str
    field_name: str
    field_description: str
    field_type: str
    required: bool = False
    help_text: str = ""
    relation: str = ""
    relation_field: str = ""
    relation_table: str = ""
    column1: str = ""
    column2: str = ""
    state: str = "manual"
    selection_options: tuple[SelectionOption | tuple[str, str], ...] = field(default_factory=tuple)
    extra_values: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        object.__setattr__(self, "model_name", _clean_required_text(self.model_name, field_name="model_name"))
        object.__setattr__(self, "field_name", _clean_required_text(self.field_name, field_name="field_name"))
        object.__setattr__(
            self,
            "field_description",
            _clean_required_text(self.field_description, field_name="field_description"),
        )
        object.__setattr__(self, "field_type", _clean_required_text(self.field_type, field_name="field_type"))
        object.__setattr__(self, "required", bool(self.required))
        object.__setattr__(self, "help_text", str(self.help_text or "").strip())
        object.__setattr__(self, "relation", str(self.relation or "").strip())
        object.__setattr__(self, "relation_field", str(self.relation_field or "").strip())
        object.__setattr__(self, "relation_table", str(self.relation_table or "").strip())
        object.__setattr__(self, "column1", str(self.column1 or "").strip())
        object.__setattr__(self, "column2", str(self.column2 or "").strip())
        object.__setattr__(self, "state", _clean_required_text(self.state, field_name="field state"))
        selection_options: list[SelectionOption] = []
        for option in self.selection_options:
            if isinstance(option, SelectionOption):
                selection_options.append(option)
            else:
                value, label = option
                selection_options.append(SelectionOption(value=value, label=label))
        _validate_selection_options(selection_options)
        object.__setattr__(self, "selection_options", tuple(selection_options))
        object.__setattr__(
            self,
            "extra_values",
            _clean_extra_values(self.extra_values, reserved_keys=FIELD_RESERVED_EXTRA_KEYS),
        )
        if self.field_type == "selection" and not selection_options:
            raise ValueError(f"Selection field {self.model_name}.{self.field_name} requires selection_options")


@dataclass(frozen=True)
class CustomFieldUpsertResult:
    """Return the upsert status for one field."""

    field_id: int
    status: str
    selection_rows_created: int = 0
    selection_rows_updated: int = 0
    selection_rows_removed: int = 0


def build_selection_literal(selection_options: Sequence[SelectionOption | tuple[str, str]]) -> str:
    """Serialize selection options into Odoo's Python literal format."""
    normalized = _normalize_selection_options(selection_options)

    def escape(value: str) -> str:
        return str(value).replace("\\", "\\\\").replace("'", "\\'")

    return "[" + ", ".join(f"('{escape(option.value)}', '{escape(option.label)}')" for option in normalized) + "]"


def build_selection_reset_commands(selection_options: Sequence[SelectionOption | tuple[str, str]]) -> list[tuple[int, int, Any]]:
    """Build exact reset commands for `ir.model.fields.selection` M2M writes."""
    normalized = _normalize_selection_options(selection_options)
    commands: list[tuple[int, int, Any]] = [(5, 0, 0)]
    commands.extend(
        (
            0,
            0,
            {
                "value": option.value,
                "name": option.label,
                "sequence": index,
            },
        )
        for index, option in enumerate(normalized)
    )
    return commands


def upsert_manual_model(conn: CustomFieldUpsertConnection, spec: ManualModelSpec) -> int:
    """Create or update one manual model row by technical name."""
    normalized = spec if isinstance(spec, ManualModelSpec) else ManualModelSpec(**dict(spec))
    values = {
        "model": normalized.model_name,
        "name": normalized.display_name,
        "state": normalized.state,
        "info": normalized.info,
        **dict(normalized.extra_values),
    }
    existing_ids = conn.search("ir.model", [("model", "=", normalized.model_name)], limit=1)
    if existing_ids:
        model_id = _required_record_id(existing_ids[0], context=f"ir.model {normalized.model_name}")
        conn.write("ir.model", [model_id], values)
        return model_id
    return _required_record_id(conn.create("ir.model", values), context=f"created ir.model {normalized.model_name}")


def upsert_custom_field(
    conn: CustomFieldUpsertConnection,
    spec: CustomFieldSpec,
) -> CustomFieldUpsertResult:
    """Create or update one manual field and reconcile selection rows when declared."""
    normalized = spec if isinstance(spec, CustomFieldSpec) else CustomFieldSpec(**dict(spec))
    model_id = _resolve_model_id(conn, normalized.model_name)
    selection_literal = (
        build_selection_literal(normalized.selection_options)
        if normalized.selection_options
        else ""
    )
    existing = conn.search_read(
        "ir.model.fields",
        [("model", "=", normalized.model_name), ("name", "=", normalized.field_name)],
        ["id", "ttype", "relation"],
        limit=1,
    )
    values = _custom_field_write_values(normalized, selection_literal=selection_literal)
    if existing:
        field_id = _required_record_id(
            existing[0].get("id"),
            context=f"ir.model.fields {normalized.model_name}.{normalized.field_name}",
        )
        _validate_existing_field_contract(existing[0], normalized)
        conn.write("ir.model.fields", [field_id], values)
        selection_counts = _sync_selection_options_if_needed(conn, field_id, normalized.selection_options)
        return CustomFieldUpsertResult(field_id=field_id, status="updated", **selection_counts)

    create_values = {
        "name": normalized.field_name,
        "model_id": model_id,
        "model": normalized.model_name,
        "ttype": normalized.field_type,
        "state": normalized.state,
        **values,
    }
    field_id = _required_record_id(
        conn.create("ir.model.fields", create_values),
        context=f"created ir.model.fields {normalized.model_name}.{normalized.field_name}",
    )
    selection_counts = _sync_selection_options_if_needed(conn, field_id, normalized.selection_options)
    return CustomFieldUpsertResult(field_id=field_id, status="created", **selection_counts)


def sync_selection_options(
    conn: CustomFieldUpsertConnection,
    field_id: int,
    selection_options: Sequence[SelectionOption | tuple[str, str]],
) -> dict[str, int]:
    """Reconcile `ir.model.fields.selection` rows for one managed selection field."""
    clean_field_id = _required_record_id(field_id, context="ir.model.fields")
    expected = _normalize_selection_options(selection_options)
    expected_by_value = {option.value: option for option in expected}
    expected_sequence = {option.value: index for index, option in enumerate(expected)}

    existing = conn.search_read(
        "ir.model.fields.selection",
        [("field_id", "=", clean_field_id)],
        ["id", "value", "name", "sequence"],
        order="sequence asc, id asc",
    )
    kept_ids_by_value: dict[str, int] = {}
    stale_ids: list[int] = []
    updated = 0
    for row in existing:
        row_id = _record_id(row.get("id"))
        value = str(row.get("value") or "").strip()
        if row_id <= 0:
            continue
        if value not in expected_by_value or value in kept_ids_by_value:
            stale_ids.append(row_id)
            continue
        kept_ids_by_value[value] = row_id
        write_values: dict[str, Any] = {}
        option = expected_by_value[value]
        if str(row.get("name") or "") != option.label:
            write_values["name"] = option.label
        if int(row.get("sequence") or 0) != expected_sequence[value]:
            write_values["sequence"] = expected_sequence[value]
        if write_values:
            conn.write("ir.model.fields.selection", [row_id], write_values)
            updated += 1

    created = 0
    for option in expected:
        if option.value in kept_ids_by_value:
            continue
        conn.create(
            "ir.model.fields.selection",
            {
                "field_id": clean_field_id,
                "value": option.value,
                "name": option.label,
                "sequence": expected_sequence[option.value],
            },
        )
        created += 1

    removed = 0
    if stale_ids:
        unique_stale_ids = sorted(set(stale_ids))
        conn.unlink("ir.model.fields.selection", unique_stale_ids)
        removed = len(unique_stale_ids)
    return {
        "selection_rows_created": created,
        "selection_rows_updated": updated,
        "selection_rows_removed": removed,
    }


def _custom_field_write_values(spec: CustomFieldSpec, *, selection_literal: str) -> dict[str, Any]:
    values: dict[str, Any] = {
        "field_description": spec.field_description,
        "required": spec.required,
        "help": spec.help_text,
        **dict(spec.extra_values),
    }
    if spec.relation:
        values["relation"] = spec.relation
    if spec.relation_field:
        values["relation_field"] = spec.relation_field
    if spec.relation_table:
        values["relation_table"] = spec.relation_table
    if spec.column1:
        values["column1"] = spec.column1
    if spec.column2:
        values["column2"] = spec.column2
    if selection_literal:
        values["selection"] = selection_literal
    return values


def _sync_selection_options_if_needed(
    conn: CustomFieldUpsertConnection,
    field_id: int,
    selection_options: Sequence[SelectionOption],
) -> dict[str, int]:
    if not selection_options:
        return {
            "selection_rows_created": 0,
            "selection_rows_updated": 0,
            "selection_rows_removed": 0,
        }
    return sync_selection_options(conn, field_id, selection_options)


def _validate_existing_field_contract(row: Mapping[str, Any], spec: CustomFieldSpec) -> None:
    current_type = str(row.get("ttype") or "").strip()
    if current_type and current_type != spec.field_type:
        raise TypeError(
            f"Existing field {spec.model_name}.{spec.field_name} has type {current_type!r}, expected {spec.field_type!r}"
        )
    current_relation = str(row.get("relation") or "").strip()
    if spec.relation and current_relation and current_relation != spec.relation:
        raise TypeError(
            f"Existing field {spec.model_name}.{spec.field_name} has relation {current_relation!r}, expected {spec.relation!r}"
        )


def _resolve_model_id(conn: CustomFieldUpsertConnection, model_name: str) -> int:
    rows = conn.search_read("ir.model", [("model", "=", model_name)], ["id"], limit=1)
    if not rows:
        raise LookupError(f"Odoo model not found: {model_name}")
    return _required_record_id(rows[0].get("id"), context=f"ir.model {model_name}")


def _normalize_selection_options(
    selection_options: Sequence[SelectionOption | tuple[str, str]],
) -> tuple[SelectionOption, ...]:
    normalized: list[SelectionOption] = []
    for option in selection_options:
        if isinstance(option, SelectionOption):
            normalized.append(option)
        else:
            value, label = option
            normalized.append(SelectionOption(value=value, label=label))
    _validate_selection_options(normalized)
    return tuple(normalized)


def _validate_selection_options(selection_options: Sequence[SelectionOption]) -> None:
    seen: set[str] = set()
    for option in selection_options:
        if option.value in seen:
            raise ValueError(f"Duplicate selection value: {option.value}")
        seen.add(option.value)


def _record_id(value: Any) -> int:
    if isinstance(value, Mapping):
        return _record_id(value.get("id"))
    if isinstance(value, (list, tuple)) and value:
        return _record_id(value[0])
    return int(value or 0)


def _required_record_id(value: Any, *, context: str) -> int:
    record_id = _record_id(value)
    if record_id <= 0:
        raise RuntimeError(f"Custom field upsert did not receive a valid ID for {context}")
    return record_id
