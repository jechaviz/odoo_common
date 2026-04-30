"""Reusable helpers to seed parent-partner defaults from child contacts/addresses."""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from typing import Any, Iterable


@dataclass(frozen=True)
class PartnerChildDefaultFieldSpec:
    """Describe how one parent field should be backfilled from child partner records."""

    target_field_name: str
    selector: str


class PartnerChildDefaultSeedingMixin:
    """Seed parent partner defaults by scanning child contacts and delivery/invoice addresses."""

    def seed_partner_child_defaults(
        self,
        *,
        field_specs: Iterable[PartnerChildDefaultFieldSpec],
        partner_model: str = "res.partner",
        parent_domain: list[tuple[str, str, Any]] | None = None,
        parent_limit: int = 5000,
        child_limit: int = 10000,
        dry_run: bool | None = None,
    ) -> int:
        """Backfill parent fields from child partner rows using declared selector rules."""
        normalized_specs = tuple(field_specs)
        if not normalized_specs:
            return 0

        target_fields = tuple(spec.target_field_name for spec in normalized_specs)
        if not all(self._default_seed_field_exists(partner_model, field_name) for field_name in target_fields):
            return 0

        rows = self.connection.search_read(
            partner_model,
            list(parent_domain or []),
            fields=["name", *target_fields],
            limit=parent_limit,
        )
        if not rows:
            return 0

        parent_ids = [int((row or {}).get("id") or 0) for row in rows if int((row or {}).get("id") or 0) > 0]
        if not parent_ids:
            return 0

        child_rows = self.connection.search_read(
            partner_model,
            [("parent_id", "in", parent_ids)],
            fields=["parent_id", "type", "name", "email"],
            limit=child_limit,
        )
        children_by_parent: dict[int, list[dict[str, Any]]] = defaultdict(list)
        for child in child_rows:
            parent_id = self.partner_id_from_many2one((child or {}).get("parent_id"))
            if parent_id > 0:
                children_by_parent[parent_id].append(child)

        should_write = bool(not bool(dry_run))
        updated = 0
        for parent_row in rows:
            parent_id = int((parent_row or {}).get("id") or 0)
            if parent_id <= 0:
                continue

            child_candidates = children_by_parent.get(parent_id, [])
            if not child_candidates:
                continue

            values: dict[str, Any] = {}
            for spec in normalized_specs:
                current_value = self.partner_id_from_many2one((parent_row or {}).get(spec.target_field_name))
                if current_value:
                    continue
                resolved_child_id = self.resolve_partner_child_selector(child_candidates, spec.selector)
                if resolved_child_id:
                    values[spec.target_field_name] = resolved_child_id

            if not values:
                continue

            if should_write:
                self.connection.write(partner_model, [parent_id], values)
            updated += 1

        return updated

    @staticmethod
    def partner_id_from_many2one(value: Any) -> int:
        """Normalize a many2one-ish payload into an integer id."""
        if isinstance(value, (list, tuple)) and value:
            return int(value[0] or 0)
        return int(value or 0)

    @classmethod
    def resolve_partner_child_selector(cls, children: list[dict[str, Any]], selector: str) -> int:
        """Resolve one selector against available child rows."""
        normalized_selector = str(selector or "").strip().lower()
        if not normalized_selector:
            return 0
        if normalized_selector == "contact":
            return cls.pick_partner_contact_child(children)
        if normalized_selector.startswith("type:"):
            return cls.pick_partner_child_by_type(children, normalized_selector.split(":", 1)[1])
        raise ValueError(f"Unsupported partner-child selector: {selector}")

    @staticmethod
    def pick_partner_child_by_type(children: list[dict[str, Any]], partner_type: str) -> int:
        """Select the first child partner matching the requested address/contact type."""
        normalized_type = str(partner_type or "").strip().lower()
        for child in children:
            if str((child or {}).get("type") or "").strip().lower() != normalized_type:
                continue
            child_id = int((child or {}).get("id") or 0)
            if child_id > 0:
                return child_id
        return 0

    @classmethod
    def pick_partner_contact_child(cls, children: list[dict[str, Any]]) -> int:
        """Select the most sensible customer-contact child partner."""
        candidate_id = cls.pick_partner_child_by_type(children, "contact")
        if candidate_id:
            return candidate_id

        for child in children:
            child_type = str((child or {}).get("type") or "").strip().lower()
            if child_type in {"invoice", "delivery"}:
                continue
            child_id = int((child or {}).get("id") or 0)
            if child_id > 0:
                return child_id

        for child in children:
            child_id = int((child or {}).get("id") or 0)
            if child_id > 0:
                return child_id
        return 0

    def _default_seed_field_exists(self, model_name: str, field_name: str) -> bool:
        """Check field existence without assuming a broader view-infrastructure mixin."""
        rows = self.connection.search_read(
            "ir.model.fields",
            [("model", "=", model_name), ("name", "=", field_name)],
            fields=["id"],
            limit=1,
        )
        return bool(rows)
