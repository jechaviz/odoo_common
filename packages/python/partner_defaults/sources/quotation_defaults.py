"""
Quotation/Order Address Defaults Capability
===========================================
Handles address selection and "Set as Default" syncing on a configured order
model. Defaults describe the current sale.order/RP custom-field preset.
"""

from __future__ import annotations

from dataclasses import dataclass
import logging
from typing import Any

from lib.python.odoo_reusable.odoo_views.infrastructure import ViewInfrastructureMixin
from lib.python.odoo_reusable.odoo_views.xmlid_resolution import XmlIdResolutionMixin
from lib.python.odoo_reusable.odoo_views.custom_fields import CustomField

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class QuotationDefaultsSpec:
    """Declare the model, view, and fields used by quotation defaults setup."""

    order_model_name: str = "sale.order"
    base_view_xml_id: str = "sale.view_order_form"
    fallback_base_view_id: int | None = 794
    customer_field_name: str = "partner_id"
    invoice_field_name: str = "partner_invoice_id"
    delivery_field_name: str = "partner_shipping_id"
    contact_field_name: str = "x_partner_contact_id"
    contact_field_description: str = "Main Contact"
    contact_field_relation: str = "res.partner"
    contact_field_help: str = "The specific contact person for this order."
    delivery_address_config_key: str = "group_sale_delivery_address"
    view_name: str = "RP Sale Order Address Defaults"

    def view_arch(self) -> str:
        """Build the inherited form-view arch using declared field names."""
        return f"""
<data>
    <!-- Configure Contact Field (New Custom Field) -->
    <xpath expr="//field[@name='{self.customer_field_name}']" position="after">
        <field name="{self.contact_field_name}"
               context="{{'default_type': 'contact', 'show_address': 0, 'show_email': 1, 'default_parent_id': {self.customer_field_name}}}"
               options="{{'always_reload': True, 'no_create': True, 'no_open': True}}"
               invisible="not {self.customer_field_name}"/>
    </xpath>

    <!-- Configure Invoice Address Field (Existing Native Field) -->
    <xpath expr="//field[@name='{self.invoice_field_name}']" position="attributes">
        <attribute name="context">{{'default_type': 'invoice', 'show_address': 1, 'show_vat': 0, 'default_parent_id': {self.customer_field_name}}}</attribute>
        <attribute name="options">{{'always_reload': True}}</attribute>
    </xpath>

    <!-- Configure Shipping Address Field (Existing Native Field) -->
    <xpath expr="//field[@name='{self.delivery_field_name}']" position="attributes">
        <attribute name="context">{{'default_type': 'delivery', 'show_address': 1, 'show_vat': 0, 'default_parent_id': {self.customer_field_name}}}</attribute>
        <attribute name="options">{{'always_reload': True}}</attribute>
    </xpath>
</data>
""".strip()


class QuotationDefaultsMixin(ViewInfrastructureMixin, XmlIdResolutionMixin):
    """Generic capability for managing quotation address defaults."""

    def setup_quotation_defaults_capability(
        self,
        dry_run: bool = False,
        *,
        spec: QuotationDefaultsSpec | None = None,
    ) -> dict[str, Any]:
        """Deploy fields and views for quotation address management."""
        spec = spec or QuotationDefaultsSpec()
        results = {"fields": [], "views": [], "actions": {}}

        # 0. Ensure Customer Addresses is enabled in settings
        if not dry_run:
            self._upsert_config(spec.delivery_address_config_key, True)

        # 1. Add declared custom fields to the configured order model.
        field_specs = [
            CustomField(
                name=spec.contact_field_name,
                model=spec.order_model_name,
                field_description=spec.contact_field_description,
                field_type="many2one",
                relation=spec.contact_field_relation,
                help=spec.contact_field_help,
            ),
        ]

        for spec in field_specs:
            if not dry_run:
                status = self._upsert_field(spec)
                results["fields"].append({"name": spec.name, "status": status})

        # 2. Inject Fields into View

        # Live instance has rental, which normally inherits from sale.view_order_form.
        # However, in v19 SaaS, the rental primary view is often a placeholder.
        # We inherit directly from the base sale view for maximum reliability.
        base_view_id = (
            self._resolve_xml_id(spec.base_view_xml_id, model="ir.ui.view")
            if spec.base_view_xml_id
            else 0
        )

        if not base_view_id and spec.fallback_base_view_id:
            base_view_id = spec.fallback_base_view_id
            logger.info("Using configured fallback order view (ID: %s)", base_view_id)
        else:
            logger.info("Targeting configured order view (ID: %s)", base_view_id)

        if base_view_id:
            arch = spec.view_arch()
            if not dry_run:
                logger.info("Generated View Architecture:\n%s", arch)
                view_id = self._upsert_view(
                    name=spec.view_name,
                    model=spec.order_model_name,
                    view_type="form",
                    arch=arch,
                    inherit_id=base_view_id,
                    mode="extension"
                )
                results["views"].append({"name": spec.view_name, "status": "updated"})

        # The setup_quotation_automation_rules call is removed.

        return results

    def _get_field_id(self, model_name: str, field_name: str) -> int:
        """Helper to get field ID."""
        ids = self.connection.search("ir.model.fields", [("model", "=", model_name), ("name", "=", field_name)])
        return ids[0] if ids else 0

    def _upsert_server_action(self, name: str, model_name: str, code: str) -> int:
        """Helper to create a server action and return its ID."""
        model_id = self._get_model_id(model_name)
        if not model_id:
            return 0

        vals = {
            "name": f"RP {name}",
            "model_id": model_id,
            "state": "code",
            "code": code.strip(),
            "type": "ir.actions.server",
        }

        existing = self.connection.search("ir.actions.server", [("name", "=", f"RP {name}"), ("model_id", "=", model_id)])
        if existing:
            self.connection.write("ir.actions.server", existing, vals)
            return existing[0]
        return self.connection.create("ir.actions.server", vals)
