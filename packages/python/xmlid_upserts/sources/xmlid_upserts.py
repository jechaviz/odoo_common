"""Canonical helpers for Odoo XML ID upserts."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Mapping, Protocol, Sequence, runtime_checkable


XMLID_RESERVED_EXTRA_KEYS = frozenset({"module", "name", "model", "res_id", "noupdate"})


@runtime_checkable
class XmlIdUpsertConnection(Protocol):
    """Minimal Odoo RPC contract required by XML ID upserts."""

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


def _clean_required_text(value: Any, *, field_name: str) -> str:
    clean_value = str(value or "").strip()
    if not clean_value:
        raise ValueError(f"XML ID {field_name} is required")
    return clean_value


def _clean_extra_values(values: Mapping[str, Any]) -> dict[str, Any]:
    normalized = dict(values or {})
    reserved_used = sorted(key for key in normalized if key in XMLID_RESERVED_EXTRA_KEYS)
    if reserved_used:
        raise ValueError(f"XML ID extra_values cannot override reserved keys: {', '.join(reserved_used)}")
    return normalized


@dataclass(frozen=True)
class XmlIdRef:
    """Parsed `module.name` XML ID."""

    module: str
    name: str

    def __post_init__(self) -> None:
        object.__setattr__(self, "module", _clean_required_text(self.module, field_name="module"))
        object.__setattr__(self, "name", _clean_required_text(self.name, field_name="name"))

    @property
    def xml_id(self) -> str:
        """Return the canonical dotted XML ID."""
        return f"{self.module}.{self.name}"


@dataclass(frozen=True)
class XmlIdSpec:
    """Declare one `ir.model.data` row."""

    module: str
    name: str
    model_name: str
    res_id: int
    noupdate: bool = True
    extra_values: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        object.__setattr__(self, "module", _clean_required_text(self.module, field_name="module"))
        object.__setattr__(self, "name", _clean_required_text(self.name, field_name="name"))
        object.__setattr__(self, "model_name", _clean_required_text(self.model_name, field_name="model_name"))
        object.__setattr__(self, "res_id", _required_record_id(self.res_id, context=self.xml_id))
        object.__setattr__(self, "noupdate", bool(self.noupdate))
        object.__setattr__(self, "extra_values", _clean_extra_values(self.extra_values))

    @property
    def xml_id(self) -> str:
        """Return the canonical dotted XML ID."""
        return f"{self.module}.{self.name}"


def split_xml_id(xml_id: str) -> XmlIdRef:
    """Split and validate a `module.name` XML ID."""
    clean_xml_id = _clean_required_text(xml_id, field_name="xml_id")
    if "." not in clean_xml_id:
        raise ValueError(f"XML ID must use module.name format: {clean_xml_id!r}")
    module, name = clean_xml_id.split(".", 1)
    return XmlIdRef(module=module, name=name)


def upsert_xml_id(conn: XmlIdUpsertConnection, spec: XmlIdSpec) -> int:
    """Create or update one `ir.model.data` row by exact module/name."""
    normalized = spec if isinstance(spec, XmlIdSpec) else XmlIdSpec(**dict(spec))
    values = {
        "module": normalized.module,
        "name": normalized.name,
        "model": normalized.model_name,
        "res_id": normalized.res_id,
        "noupdate": normalized.noupdate,
        **dict(normalized.extra_values),
    }
    rows = conn.search_read(
        "ir.model.data",
        [
            ("module", "=", normalized.module),
            ("name", "=", normalized.name),
        ],
        ["id", "model", "res_id"],
        limit=1,
    )
    if rows:
        metadata_id = _required_record_id(rows[0].get("id"), context=f"ir.model.data {normalized.xml_id}")
        _validate_existing_model(rows[0], normalized)
        conn.write("ir.model.data", [metadata_id], values)
        return metadata_id
    return _required_record_id(conn.create("ir.model.data", values), context=f"created ir.model.data {normalized.xml_id}")


def upsert_xml_id_value(
    conn: XmlIdUpsertConnection,
    xml_id: str,
    model_name: str,
    res_id: int,
    *,
    noupdate: bool = True,
    extra_values: Mapping[str, Any] | None = None,
) -> int:
    """Create or update one `ir.model.data` row from a dotted XML ID."""
    ref = split_xml_id(xml_id)
    return upsert_xml_id(
        conn,
        XmlIdSpec(
            module=ref.module,
            name=ref.name,
            model_name=model_name,
            res_id=res_id,
            noupdate=noupdate,
            extra_values=extra_values or {},
        ),
    )


def _validate_existing_model(row: Mapping[str, Any], spec: XmlIdSpec) -> None:
    current_model = _clean_required_text(row.get("model"), field_name=f"{spec.xml_id} existing model")
    if current_model != spec.model_name:
        raise TypeError(
            f"Existing XML ID {spec.xml_id} targets model {current_model!r}, expected {spec.model_name!r}"
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
        raise RuntimeError(f"XML ID upsert did not receive a valid ID for {context}")
    return record_id
