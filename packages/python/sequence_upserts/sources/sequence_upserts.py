"""Canonical helpers for Odoo sequence upserts."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Mapping, Protocol, Sequence, runtime_checkable


SEQUENCE_RESERVED_EXTRA_KEYS = frozenset(
    {
        "name",
        "code",
        "prefix",
        "suffix",
        "padding",
        "number_next",
        "number_increment",
        "implementation",
        "company_id",
    }
)


@runtime_checkable
class SequenceUpsertConnection(Protocol):
    """Minimal Odoo RPC contract required by sequence upserts."""

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
        raise ValueError(f"Sequence {field_name} is required")
    return clean_value


def _clean_extra_values(values: Mapping[str, Any]) -> dict[str, Any]:
    normalized = dict(values or {})
    reserved_used = sorted(key for key in normalized if key in SEQUENCE_RESERVED_EXTRA_KEYS)
    if reserved_used:
        raise ValueError(f"Sequence extra_values cannot override reserved keys: {', '.join(reserved_used)}")
    return normalized


@dataclass(frozen=True)
class SequenceSpec:
    """Declare one `ir.sequence` row."""

    name: str
    code: str
    prefix: str = ""
    suffix: str = ""
    padding: int = 0
    number_next: int = 1
    number_increment: int = 1
    implementation: str = "standard"
    company_id: int = 0
    extra_values: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        object.__setattr__(self, "name", _clean_required_text(self.name, field_name="name"))
        object.__setattr__(self, "code", _clean_required_text(self.code, field_name="code"))
        object.__setattr__(self, "prefix", str(self.prefix or ""))
        object.__setattr__(self, "suffix", str(self.suffix or ""))
        object.__setattr__(self, "padding", _positive_or_zero_int(self.padding, field_name="padding"))
        object.__setattr__(self, "number_next", _positive_int(self.number_next, field_name="number_next"))
        object.__setattr__(self, "number_increment", _positive_int(self.number_increment, field_name="number_increment"))
        object.__setattr__(self, "implementation", _clean_required_text(self.implementation, field_name="implementation"))
        object.__setattr__(self, "company_id", _record_id(self.company_id))
        object.__setattr__(self, "extra_values", _clean_extra_values(self.extra_values))


def upsert_sequence(conn: SequenceUpsertConnection, spec: SequenceSpec) -> int:
    """Create or update one `ir.sequence` row by exact code/company."""
    normalized = spec if isinstance(spec, SequenceSpec) else SequenceSpec(**dict(spec))
    company_value: int | bool = normalized.company_id or False
    values = {
        "name": normalized.name,
        "code": normalized.code,
        "prefix": normalized.prefix,
        "suffix": normalized.suffix,
        "padding": normalized.padding,
        "number_next": normalized.number_next,
        "number_increment": normalized.number_increment,
        "implementation": normalized.implementation,
        "company_id": company_value,
        **dict(normalized.extra_values),
    }
    existing_ids = conn.search(
        "ir.sequence",
        [
            ("code", "=", normalized.code),
            ("company_id", "=", company_value),
        ],
        limit=1,
    )
    if existing_ids:
        sequence_id = _required_record_id(existing_ids[0], context=f"ir.sequence {normalized.code}")
        conn.write("ir.sequence", [sequence_id], values)
        return sequence_id
    return _required_record_id(conn.create("ir.sequence", values), context=f"created ir.sequence {normalized.code}")


def _positive_or_zero_int(value: Any, *, field_name: str) -> int:
    numeric = int(value or 0)
    if numeric < 0:
        raise ValueError(f"Sequence {field_name} must be zero or positive")
    return numeric


def _positive_int(value: Any, *, field_name: str) -> int:
    numeric = int(value or 0)
    if numeric <= 0:
        raise ValueError(f"Sequence {field_name} must be positive")
    return numeric


def _record_id(value: Any) -> int:
    if isinstance(value, Mapping):
        return _record_id(value.get("id"))
    if isinstance(value, (list, tuple)) and value:
        return _record_id(value[0])
    return int(value or 0)


def _required_record_id(value: Any, *, context: str) -> int:
    record_id = _record_id(value)
    if record_id <= 0:
        raise RuntimeError(f"Sequence upsert did not receive a valid ID for {context}")
    return record_id
