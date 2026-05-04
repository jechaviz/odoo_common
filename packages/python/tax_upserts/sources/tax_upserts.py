"""Canonical helpers for Odoo tax upserts."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Mapping, Protocol, Sequence, runtime_checkable


TAX_GROUP_RESERVED_EXTRA_KEYS = frozenset(
    {
        "name",
        "sequence",
        "company_id",
        "country_id",
        "tax_payable_account_id",
        "tax_receivable_account_id",
    }
)
TAX_RESERVED_EXTRA_KEYS = frozenset(
    {
        "name",
        "type_tax_use",
        "amount_type",
        "amount",
        "active",
        "company_id",
        "country_id",
        "tax_group_id",
        "description",
        "invoice_label",
        "tax_label",
        "price_include",
        "include_base_amount",
    }
)


@runtime_checkable
class TaxUpsertConnection(Protocol):
    """Minimal Odoo RPC contract required by tax upserts."""

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
        raise ValueError(f"Tax {field_name} is required")
    return clean_value


def _clean_extra_values(
    values: Mapping[str, Any],
    *,
    reserved_keys: frozenset[str],
) -> dict[str, Any]:
    normalized = dict(values or {})
    reserved_used = sorted(key for key in normalized if key in reserved_keys)
    if reserved_used:
        raise ValueError(f"Tax extra_values cannot override reserved keys: {', '.join(reserved_used)}")
    return normalized


@dataclass(frozen=True)
class TaxGroupSpec:
    """Declare one `account.tax.group` row."""

    name: str
    sequence: int = 0
    company_id: int = 0
    country_id: int = 0
    tax_payable_account_id: int | None = None
    tax_receivable_account_id: int | None = None
    extra_values: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        object.__setattr__(self, "name", _clean_required_text(self.name, field_name="group name"))
        object.__setattr__(self, "sequence", int(self.sequence))
        object.__setattr__(self, "company_id", _record_id(self.company_id))
        object.__setattr__(self, "country_id", _record_id(self.country_id))
        object.__setattr__(self, "tax_payable_account_id", _optional_record_id(self.tax_payable_account_id))
        object.__setattr__(self, "tax_receivable_account_id", _optional_record_id(self.tax_receivable_account_id))
        object.__setattr__(
            self,
            "extra_values",
            _clean_extra_values(self.extra_values, reserved_keys=TAX_GROUP_RESERVED_EXTRA_KEYS),
        )


@dataclass(frozen=True)
class TaxSpec:
    """Declare one `account.tax` row."""

    name: str
    amount: float
    tax_group_id: int
    type_tax_use: str = "sale"
    amount_type: str = "percent"
    active: bool = True
    company_id: int = 0
    country_id: int = 0
    description: str = ""
    invoice_label: str = ""
    tax_label: str = ""
    price_include: bool = False
    include_base_amount: bool = False
    extra_values: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        object.__setattr__(self, "name", _clean_required_text(self.name, field_name="name"))
        object.__setattr__(self, "amount", float(self.amount))
        object.__setattr__(self, "tax_group_id", _required_record_id(self.tax_group_id, context=f"{self.name} tax_group"))
        object.__setattr__(self, "type_tax_use", _clean_required_text(self.type_tax_use, field_name="type_tax_use"))
        object.__setattr__(self, "amount_type", _clean_required_text(self.amount_type, field_name="amount_type"))
        object.__setattr__(self, "active", bool(self.active))
        object.__setattr__(self, "company_id", _record_id(self.company_id))
        object.__setattr__(self, "country_id", _record_id(self.country_id))
        object.__setattr__(self, "description", str(self.description or "").strip())
        object.__setattr__(self, "invoice_label", str(self.invoice_label or "").strip())
        object.__setattr__(self, "tax_label", str(self.tax_label or "").strip())
        object.__setattr__(self, "price_include", bool(self.price_include))
        object.__setattr__(self, "include_base_amount", bool(self.include_base_amount))
        object.__setattr__(
            self,
            "extra_values",
            _clean_extra_values(self.extra_values, reserved_keys=TAX_RESERVED_EXTRA_KEYS),
        )


def upsert_tax_group(conn: TaxUpsertConnection, spec: TaxGroupSpec) -> int:
    """Create or update one `account.tax.group` row by exact name/company/country."""
    normalized = spec if isinstance(spec, TaxGroupSpec) else TaxGroupSpec(**dict(spec))
    company_value: int | bool = normalized.company_id or False
    country_value: int | bool = normalized.country_id or False
    values: dict[str, Any] = {
        "name": normalized.name,
        "sequence": normalized.sequence,
        "company_id": company_value,
        "country_id": country_value,
        **dict(normalized.extra_values),
    }
    if normalized.tax_payable_account_id is not None:
        values["tax_payable_account_id"] = normalized.tax_payable_account_id or False
    if normalized.tax_receivable_account_id is not None:
        values["tax_receivable_account_id"] = normalized.tax_receivable_account_id or False

    existing_ids = conn.search(
        "account.tax.group",
        [
            ("name", "=", normalized.name),
            ("company_id", "=", company_value),
            ("country_id", "=", country_value),
        ],
        limit=1,
    )
    if existing_ids:
        group_id = _required_record_id(existing_ids[0], context=f"account.tax.group {normalized.name}")
        conn.write("account.tax.group", [group_id], values)
        return group_id
    return _required_record_id(conn.create("account.tax.group", values), context=f"created account.tax.group {normalized.name}")


def upsert_tax(conn: TaxUpsertConnection, spec: TaxSpec) -> int:
    """Create or update one `account.tax` row by exact name/type/company/country."""
    normalized = spec if isinstance(spec, TaxSpec) else TaxSpec(**dict(spec))
    company_value: int | bool = normalized.company_id or False
    country_value: int | bool = normalized.country_id or False
    values = {
        "name": normalized.name,
        "type_tax_use": normalized.type_tax_use,
        "amount_type": normalized.amount_type,
        "amount": normalized.amount,
        "active": normalized.active,
        "company_id": company_value,
        "country_id": country_value,
        "tax_group_id": normalized.tax_group_id,
        "description": normalized.description or False,
        "invoice_label": normalized.invoice_label or False,
        "tax_label": normalized.tax_label or False,
        "price_include": normalized.price_include,
        "include_base_amount": normalized.include_base_amount,
        **dict(normalized.extra_values),
    }
    existing_ids = conn.search(
        "account.tax",
        [
            ("name", "=", normalized.name),
            ("type_tax_use", "=", normalized.type_tax_use),
            ("company_id", "=", company_value),
            ("country_id", "=", country_value),
        ],
        limit=1,
    )
    if existing_ids:
        tax_id = _required_record_id(existing_ids[0], context=f"account.tax {normalized.name}")
        conn.write("account.tax", [tax_id], values)
        return tax_id
    return _required_record_id(conn.create("account.tax", values), context=f"created account.tax {normalized.name}")


def _optional_record_id(value: Any) -> int | None:
    if value is None:
        return None
    return _record_id(value)


def _record_id(value: Any) -> int:
    if isinstance(value, Mapping):
        return _record_id(value.get("id"))
    if isinstance(value, (list, tuple)) and value:
        return _record_id(value[0])
    return int(value or 0)


def _required_record_id(value: Any, *, context: str) -> int:
    record_id = _record_id(value)
    if record_id <= 0:
        raise RuntimeError(f"Tax upsert did not receive a valid ID for {context}")
    return record_id
