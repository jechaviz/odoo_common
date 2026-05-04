"""Canonical helpers for Odoo product catalog upserts."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Mapping, Protocol, Sequence, runtime_checkable


CATEGORY_RESERVED_EXTRA_KEYS = frozenset({"name", "parent_id"})
PRICELIST_RESERVED_EXTRA_KEYS = frozenset({"name", "currency_id", "company_id", "active"})
PRICELIST_ITEM_RESERVED_EXTRA_KEYS = frozenset(
    {
        "pricelist_id",
        "applied_on",
        "product_tmpl_id",
        "compute_price",
        "fixed_price",
        "min_quantity",
    }
)


@runtime_checkable
class ProductCatalogUpsertConnection(Protocol):
    """Minimal Odoo RPC contract required by product catalog upserts."""

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
        raise ValueError(f"Product catalog {field_name} is required")
    return clean_value


def _clean_extra_values(
    values: Mapping[str, Any],
    *,
    reserved_keys: frozenset[str],
) -> dict[str, Any]:
    normalized = dict(values or {})
    reserved_used = sorted(key for key in normalized if key in reserved_keys)
    if reserved_used:
        raise ValueError(f"Product catalog extra_values cannot override reserved keys: {', '.join(reserved_used)}")
    return normalized


@dataclass(frozen=True)
class ProductCategorySpec:
    """Declare one `product.category` row."""

    name: str
    parent_id: int = 0
    extra_values: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        object.__setattr__(self, "name", _clean_required_text(self.name, field_name="category name"))
        object.__setattr__(self, "parent_id", _record_id(self.parent_id))
        object.__setattr__(
            self,
            "extra_values",
            _clean_extra_values(self.extra_values, reserved_keys=CATEGORY_RESERVED_EXTRA_KEYS),
        )


@dataclass(frozen=True)
class PricelistSpec:
    """Declare one `product.pricelist` row."""

    name: str
    currency_id: int
    company_id: int = 0
    active: bool = True
    extra_values: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        object.__setattr__(self, "name", _clean_required_text(self.name, field_name="pricelist name"))
        object.__setattr__(self, "currency_id", _required_record_id(self.currency_id, context=f"{self.name} currency"))
        object.__setattr__(self, "company_id", _record_id(self.company_id))
        object.__setattr__(self, "active", bool(self.active))
        object.__setattr__(
            self,
            "extra_values",
            _clean_extra_values(self.extra_values, reserved_keys=PRICELIST_RESERVED_EXTRA_KEYS),
        )


@dataclass(frozen=True)
class PricelistItemSpec:
    """Declare one fixed-price `product.pricelist.item` row for a product template."""

    pricelist_id: int
    product_template_id: int
    fixed_price: float
    applied_on: str = "1_product"
    compute_price: str = "fixed"
    min_quantity: float = 0.0
    extra_values: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        object.__setattr__(
            self,
            "pricelist_id",
            _required_record_id(self.pricelist_id, context="product.pricelist"),
        )
        object.__setattr__(
            self,
            "product_template_id",
            _required_record_id(self.product_template_id, context="product.template"),
        )
        object.__setattr__(self, "fixed_price", float(self.fixed_price))
        object.__setattr__(self, "applied_on", _clean_required_text(self.applied_on, field_name="applied_on"))
        object.__setattr__(self, "compute_price", _clean_required_text(self.compute_price, field_name="compute_price"))
        object.__setattr__(self, "min_quantity", float(self.min_quantity))
        object.__setattr__(
            self,
            "extra_values",
            _clean_extra_values(self.extra_values, reserved_keys=PRICELIST_ITEM_RESERVED_EXTRA_KEYS),
        )


def upsert_product_category(conn: ProductCatalogUpsertConnection, spec: ProductCategorySpec) -> int:
    """Create or update one `product.category` row by exact name/parent."""
    normalized = spec if isinstance(spec, ProductCategorySpec) else ProductCategorySpec(**dict(spec))
    parent_value: int | bool = normalized.parent_id or False
    values = {
        "name": normalized.name,
        "parent_id": parent_value,
        **dict(normalized.extra_values),
    }
    existing_ids = conn.search(
        "product.category",
        [
            ("name", "=", normalized.name),
            ("parent_id", "=", parent_value),
        ],
        limit=1,
    )
    if existing_ids:
        category_id = _required_record_id(existing_ids[0], context=f"product.category {normalized.name}")
        conn.write("product.category", [category_id], values)
        return category_id
    return _required_record_id(conn.create("product.category", values), context=f"created product.category {normalized.name}")


def upsert_pricelist(conn: ProductCatalogUpsertConnection, spec: PricelistSpec) -> int:
    """Create or update one `product.pricelist` row by exact name/company."""
    normalized = spec if isinstance(spec, PricelistSpec) else PricelistSpec(**dict(spec))
    company_value: int | bool = normalized.company_id or False
    values = {
        "name": normalized.name,
        "currency_id": normalized.currency_id,
        "company_id": company_value,
        "active": normalized.active,
        **dict(normalized.extra_values),
    }
    existing_ids = conn.search(
        "product.pricelist",
        [
            ("name", "=", normalized.name),
            ("company_id", "=", company_value),
        ],
        limit=1,
    )
    if existing_ids:
        pricelist_id = _required_record_id(existing_ids[0], context=f"product.pricelist {normalized.name}")
        conn.write("product.pricelist", [pricelist_id], values)
        return pricelist_id
    return _required_record_id(conn.create("product.pricelist", values), context=f"created product.pricelist {normalized.name}")


def upsert_pricelist_item(conn: ProductCatalogUpsertConnection, spec: PricelistItemSpec) -> int:
    """Create or update one fixed-price `product.pricelist.item` by pricelist/template."""
    normalized = spec if isinstance(spec, PricelistItemSpec) else PricelistItemSpec(**dict(spec))
    values = {
        "pricelist_id": normalized.pricelist_id,
        "applied_on": normalized.applied_on,
        "product_tmpl_id": normalized.product_template_id,
        "compute_price": normalized.compute_price,
        "fixed_price": normalized.fixed_price,
        "min_quantity": normalized.min_quantity,
        **dict(normalized.extra_values),
    }
    existing_ids = conn.search(
        "product.pricelist.item",
        [
            ("pricelist_id", "=", normalized.pricelist_id),
            ("product_tmpl_id", "=", normalized.product_template_id),
        ],
        limit=1,
    )
    if existing_ids:
        item_id = _required_record_id(existing_ids[0], context="product.pricelist.item")
        conn.write("product.pricelist.item", [item_id], values)
        return item_id
    return _required_record_id(conn.create("product.pricelist.item", values), context="created product.pricelist.item")


def _record_id(value: Any) -> int:
    if isinstance(value, Mapping):
        return _record_id(value.get("id"))
    if isinstance(value, (list, tuple)) and value:
        return _record_id(value[0])
    return int(value or 0)


def _required_record_id(value: Any, *, context: str) -> int:
    record_id = _record_id(value)
    if record_id <= 0:
        raise RuntimeError(f"Product catalog upsert did not receive a valid ID for {context}")
    return record_id
