"""Canonical helpers for strict generic Odoo record upserts."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Mapping, Protocol, Sequence, runtime_checkable


DomainTerm = tuple[str, str, Any]


@runtime_checkable
class RecordUpsertConnection(Protocol):
    """Minimal Odoo RPC contract required by generic record upserts."""

    def search(
        self,
        model_name: str,
        domain: Sequence[DomainTerm],
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
        raise ValueError(f"Odoo record upsert {field_name} is required")
    return clean_value


def _normalize_domain(domain: Sequence[Sequence[Any]]) -> tuple[DomainTerm, ...]:
    if isinstance(domain, (str, bytes)) or not isinstance(domain, Sequence):
        raise TypeError("Odoo record upsert domain must be a sequence of triplets")
    normalized: list[DomainTerm] = []
    for term in domain:
        if isinstance(term, (str, bytes)) or not isinstance(term, Sequence) or len(term) != 3:
            raise TypeError("Odoo record upsert domain terms must be explicit triplets")
        field_name = _clean_required_text(term[0], field_name="domain field")
        operator = _clean_required_text(term[1], field_name="domain operator")
        normalized.append((field_name, operator, term[2]))
    if not normalized:
        raise ValueError("Odoo record upsert domain must not be empty")
    return tuple(normalized)


def _normalize_values(values: Mapping[str, Any]) -> dict[str, Any]:
    if not isinstance(values, Mapping):
        raise TypeError("Odoo record upsert values must be a mapping")
    normalized = dict(values)
    if not normalized:
        raise ValueError("Odoo record upsert values must not be empty")
    for key in normalized:
        _clean_required_text(key, field_name="values key")
    return normalized


@dataclass(frozen=True)
class RecordUpsertSpec:
    """Declare one generic Odoo record upsert by exact domain."""

    model_name: str
    domain: Sequence[Sequence[Any]]
    values: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        object.__setattr__(self, "model_name", _clean_required_text(self.model_name, field_name="model_name"))
        object.__setattr__(self, "domain", _normalize_domain(self.domain))
        object.__setattr__(self, "values", _normalize_values(self.values))


def upsert_record(conn: RecordUpsertConnection, spec: RecordUpsertSpec) -> int:
    """Create or update one record by exact domain, rejecting ambiguous matches."""
    normalized = spec if isinstance(spec, RecordUpsertSpec) else RecordUpsertSpec(**dict(spec))
    existing_ids = conn.search(normalized.model_name, normalized.domain, limit=2)
    if len(existing_ids) > 1:
        raise LookupError(
            f"Odoo record upsert domain is ambiguous for {normalized.model_name}: "
            f"{list(normalized.domain)!r}"
        )
    if existing_ids:
        record_id = _required_record_id(existing_ids[0], context=f"{normalized.model_name} existing record")
        conn.write(normalized.model_name, [record_id], normalized.values)
        return record_id
    return _required_record_id(
        conn.create(normalized.model_name, normalized.values),
        context=f"created {normalized.model_name}",
    )


def upsert_records(
    conn: RecordUpsertConnection,
    specs: Sequence[RecordUpsertSpec | Mapping[str, Any]],
) -> tuple[int, ...]:
    """Create or update a sequence of records, preserving caller order."""
    return tuple(
        upsert_record(conn, spec if isinstance(spec, RecordUpsertSpec) else RecordUpsertSpec(**dict(spec)))
        for spec in specs
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
        raise RuntimeError(f"Odoo record upsert did not receive a valid ID for {context}")
    return record_id
