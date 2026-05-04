"""Strict helpers for Odoo registry and XML ID lookups."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Mapping, Protocol, Sequence, runtime_checkable


@runtime_checkable
class RegistryLookupConnection(Protocol):
    """Minimal Odoo RPC contract required by registry lookup helpers."""

    def search_read(
        self,
        model_name: str,
        domain: Sequence[tuple[str, str, Any]],
        fields: Sequence[str] | None = None,
        limit: int | None = None,
        **kwargs: Any,
    ) -> list[Mapping[str, Any]]:
        """Return matching rows with requested fields."""

    def execute(
        self,
        model_name: str,
        method_name: str,
        args: Sequence[Any],
        **kwargs: Any,
    ) -> Any:
        """Execute one model method."""


def _clean_required_text(value: Any, *, field_name: str) -> str:
    clean_value = str(value or "").strip()
    if not clean_value:
        raise ValueError(f"Odoo registry {field_name} is required")
    return clean_value


@dataclass(frozen=True)
class XmlIdRef:
    """Parsed `module.name` XML ID."""

    module: str
    name: str

    def __post_init__(self) -> None:
        object.__setattr__(self, "module", _clean_required_text(self.module, field_name="xml_id module"))
        object.__setattr__(self, "name", _clean_required_text(self.name, field_name="xml_id name"))

    @property
    def xml_id(self) -> str:
        """Return the canonical dotted XML ID."""
        return f"{self.module}.{self.name}"


@dataclass(frozen=True)
class XmlIdMetadata:
    """Resolved `ir.model.data` metadata for one XML ID."""

    xml_id: str
    module: str
    name: str
    model: str
    res_id: int
    metadata_id: int = 0


def split_xml_id(xml_id: str) -> XmlIdRef:
    """Split and validate a `module.name` XML ID."""
    clean_xml_id = _clean_required_text(xml_id, field_name="xml_id")
    if "." not in clean_xml_id:
        raise ValueError(f"XML ID must use module.name format: {clean_xml_id!r}")
    module, name = clean_xml_id.split(".", 1)
    return XmlIdRef(module=module, name=name)


def resolve_xml_id_metadata(
    conn: RegistryLookupConnection,
    xml_id: str,
    *,
    model_name: str | None = None,
) -> XmlIdMetadata:
    """Resolve one XML ID through `ir.model.data` or fail loudly."""
    ref = split_xml_id(xml_id)
    domain: list[tuple[str, str, Any]] = [
        ("module", "=", ref.module),
        ("name", "=", ref.name),
    ]
    clean_model_name = str(model_name or "").strip()
    if clean_model_name:
        domain.append(("model", "=", clean_model_name))
    rows = conn.search_read(
        "ir.model.data",
        domain,
        ["id", "module", "name", "model", "res_id"],
        limit=1,
    )
    if not rows:
        model_suffix = f" for model {clean_model_name}" if clean_model_name else ""
        raise LookupError(f"XML ID not found{model_suffix}: {ref.xml_id}")
    row = rows[0]
    row_model = _clean_required_text(row.get("model"), field_name=f"{ref.xml_id} model")
    res_id = _required_record_id(row.get("res_id"), context=f"xml_id {ref.xml_id}")
    metadata_id = _record_id(row.get("id"))
    return XmlIdMetadata(
        xml_id=ref.xml_id,
        module=ref.module,
        name=ref.name,
        model=row_model,
        res_id=res_id,
        metadata_id=metadata_id,
    )


def resolve_xml_id(
    conn: RegistryLookupConnection,
    xml_id: str,
    *,
    model_name: str | None = None,
) -> int:
    """Resolve one XML ID to its target record id."""
    return resolve_xml_id_metadata(conn, xml_id, model_name=model_name).res_id


def resolve_model_id(conn: RegistryLookupConnection, model_name: str) -> int:
    """Resolve one Odoo model registry id."""
    clean_model_name = _clean_required_text(model_name, field_name="model_name")
    rows = conn.search_read("ir.model", [("model", "=", clean_model_name)], ["id"], limit=1)
    if not rows:
        raise LookupError(f"Odoo model not found: {clean_model_name}")
    return _required_record_id(rows[0].get("id"), context=f"ir.model {clean_model_name}")


def resolve_exact_window_action_id(
    conn: RegistryLookupConnection,
    *,
    res_model: str,
    name: str,
) -> int:
    """Resolve one `ir.actions.act_window` by exact model/name and fail on ambiguity."""
    clean_res_model = _clean_required_text(res_model, field_name="window action res_model")
    clean_name = _clean_required_text(name, field_name="window action name")
    rows = conn.search_read(
        "ir.actions.act_window",
        [
            ("res_model", "=", clean_res_model),
            ("name", "=", clean_name),
        ],
        ["id", "name"],
        order="id",
        limit=2,
    )
    return _exact_single_record_id(
        rows,
        context=f"ir.actions.act_window {clean_name!r} for {clean_res_model}",
    )


def resolve_exact_server_action_id(
    conn: RegistryLookupConnection,
    *,
    name: str,
    model_name: str | None = None,
) -> int:
    """Resolve one code server action by exact name and optional model."""
    clean_name = _clean_required_text(name, field_name="server action name")
    domain: list[tuple[str, str, Any]] = [
        ("name", "=", clean_name),
        ("state", "=", "code"),
        ("type", "=", "ir.actions.server"),
    ]
    clean_model_name = str(model_name or "").strip()
    if clean_model_name:
        domain.append(("model_id", "=", resolve_model_id(conn, clean_model_name)))
    rows = conn.search_read(
        "ir.actions.server",
        domain,
        ["id", "name"],
        order="id",
        limit=2,
    )
    model_suffix = f" for {clean_model_name}" if clean_model_name else ""
    return _exact_single_record_id(
        rows,
        context=f"ir.actions.server {clean_name!r}{model_suffix}",
    )


def resolve_exact_base_view_id(
    conn: RegistryLookupConnection,
    *,
    model_name: str,
    view_name: str,
    view_type: str,
) -> int:
    """Resolve one non-inherited base `ir.ui.view` by exact model/name/type."""
    clean_model_name = _clean_required_text(model_name, field_name="base view model_name")
    clean_view_name = _clean_required_text(view_name, field_name="base view name")
    clean_view_type = _clean_required_text(view_type, field_name="base view type")
    rows = conn.search_read(
        "ir.ui.view",
        [
            ("model", "=", clean_model_name),
            ("type", "=", clean_view_type),
            ("inherit_id", "=", False),
            ("name", "=", clean_view_name),
        ],
        ["id", "name"],
        order="priority,id",
        limit=2,
    )
    return _exact_single_record_id(
        rows,
        context=f"base ir.ui.view {clean_view_name!r} ({clean_view_type}) for {clean_model_name}",
    )


def resolve_exact_base_form_view_id(
    conn: RegistryLookupConnection,
    *,
    model_name: str,
    view_name: str,
) -> int:
    """Resolve one non-inherited base form view by exact model/name."""
    return resolve_exact_base_view_id(
        conn,
        model_name=model_name,
        view_name=view_name,
        view_type="form",
    )


def resolve_model_field_ids(
    conn: RegistryLookupConnection,
    model_name: str,
    field_names: Sequence[str],
    *,
    require_all: bool = True,
) -> list[int]:
    """Resolve field ids for one model, preserving caller-declared order."""
    rows_by_name = _read_model_field_rows_by_name(conn, model_name, field_names)
    clean_field_names = [_clean_required_text(field_name, field_name="field_name") for field_name in field_names]
    missing = [field_name for field_name in clean_field_names if field_name not in rows_by_name]
    if require_all and missing:
        raise LookupError(f"Odoo model fields not found for {model_name}: {', '.join(missing)}")
    return [
        _required_record_id(rows_by_name[field_name].get("id"), context=f"ir.model.fields {model_name}.{field_name}")
        for field_name in clean_field_names
        if field_name in rows_by_name
    ]


def resolve_model_field_names(
    conn: RegistryLookupConnection,
    model_name: str,
    field_names: Sequence[str],
    *,
    require_all: bool = True,
) -> set[str]:
    """Return existing field names from an explicit candidate list."""
    rows_by_name = _read_model_field_rows_by_name(conn, model_name, field_names)
    clean_field_names = [_clean_required_text(field_name, field_name="field_name") for field_name in field_names]
    missing = [field_name for field_name in clean_field_names if field_name not in rows_by_name]
    if require_all and missing:
        raise LookupError(f"Odoo model fields not found for {model_name}: {', '.join(missing)}")
    return {field_name for field_name in clean_field_names if field_name in rows_by_name}


def fields_get(
    conn: RegistryLookupConnection,
    model_name: str,
    *,
    attributes: Sequence[str] = ("type",),
) -> dict[str, dict[str, Any]]:
    """Call `fields_get` and validate the returned metadata shape."""
    clean_model_name = _clean_required_text(model_name, field_name="model_name")
    clean_attributes = [_clean_required_text(attribute, field_name="fields_get attribute") for attribute in attributes]
    payload = conn.execute(
        clean_model_name,
        "fields_get",
        [],
        attributes=clean_attributes,
    )
    if not isinstance(payload, Mapping):
        raise TypeError(f"fields_get for {clean_model_name} must return a mapping")
    normalized: dict[str, dict[str, Any]] = {}
    for field_name, field_meta in payload.items():
        clean_field_name = _clean_required_text(field_name, field_name="fields_get field name")
        if not isinstance(field_meta, Mapping):
            raise TypeError(f"fields_get metadata for {clean_model_name}.{clean_field_name} must be a mapping")
        normalized[clean_field_name] = dict(field_meta)
    return normalized


def selection_values(field_meta: Mapping[str, Any]) -> list[str]:
    """Extract technical values from one `fields_get` selection payload."""
    selection = field_meta.get("selection")
    if not isinstance(selection, Sequence) or isinstance(selection, (str, bytes)):
        raise TypeError("fields_get selection metadata must be a sequence of pairs")
    values: list[str] = []
    for item in selection:
        if not isinstance(item, Sequence) or isinstance(item, (str, bytes)) or not item:
            raise TypeError("fields_get selection entries must be non-empty pairs")
        values.append(_clean_required_text(item[0], field_name="selection value"))
    return values


def _read_model_field_rows_by_name(
    conn: RegistryLookupConnection,
    model_name: str,
    field_names: Sequence[str],
) -> dict[str, Mapping[str, Any]]:
    clean_model_name = _clean_required_text(model_name, field_name="model_name")
    clean_field_names = [_clean_required_text(field_name, field_name="field_name") for field_name in field_names]
    if not clean_field_names:
        return {}
    rows = conn.search_read(
        "ir.model.fields",
        [("model", "=", clean_model_name), ("name", "in", clean_field_names)],
        ["id", "name"],
        limit=len(clean_field_names),
    )
    rows_by_name: dict[str, Mapping[str, Any]] = {}
    for row in rows:
        field_name = _clean_required_text(row.get("name"), field_name=f"{clean_model_name} field name")
        rows_by_name[field_name] = row
    return rows_by_name


def _record_id(value: Any) -> int:
    if isinstance(value, Mapping):
        return _record_id(value.get("id"))
    if isinstance(value, (list, tuple)) and value:
        return _record_id(value[0])
    return int(value or 0)


def _required_record_id(value: Any, *, context: str) -> int:
    record_id = _record_id(value)
    if record_id <= 0:
        raise RuntimeError(f"Odoo registry lookup did not receive a valid ID for {context}")
    return record_id


def _exact_single_record_id(rows: Sequence[Mapping[str, Any]], *, context: str) -> int:
    if not rows:
        raise LookupError(f"Odoo registry record not found: {context}")
    if len(rows) > 1:
        raise LookupError(f"Odoo registry record is ambiguous: {context}")
    return _required_record_id(rows[0].get("id"), context=context)
