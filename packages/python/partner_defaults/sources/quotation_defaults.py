"""
Quotation/Order Address Defaults Capability
===========================================
Handles address selection and "Set as Default" syncing on sale.order.
"""

import logging
from typing import Any, Dict
from lib.python.odoo_reusable.odoo_views.infrastructure import ViewInfrastructureMixin
from lib.python.odoo_reusable.odoo_views.xmlid_resolution import XmlIdResolutionMixin
from lib.python.odoo_reusable.odoo_views.custom_fields import CustomField

logger = logging.getLogger(__name__)

class QuotationDefaultsMixin(ViewInfrastructureMixin, XmlIdResolutionMixin):
    """Generic capability for managing quotation address defaults."""

    def setup_quotation_defaults_capability(self, dry_run: bool = False) -> Dict[str, Any]:
        """Deploy fields and views for quotation address management."""
        results = {"fields": [], "views": [], "actions": {}}
        
        # 0. Ensure Customer Addresses is enabled in settings
        if not dry_run:
            self._upsert_config("group_sale_delivery_address", True)

        # 1. Add fields to sale.order
        field_specs = [
            CustomField(
                name="x_partner_contact_id",
                model="sale.order",
                field_description="Main Contact",
                field_type="many2one",
                relation="res.partner",
                help="The specific contact person for this order.",
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
        base_view_id = self._resolve_xml_id("sale.view_order_form", model="ir.ui.view")
        
        if not base_view_id:
            # Absolute fallback if XML ID resolution fails
            base_view_id = 794 # Standard ID for sale.view_order_form
            logger.info("Using hardcoded fallback Base Sale View (ID: %s)", base_view_id)
        else:
            logger.info("Targeting Base Sale Order View (ID: %s)", base_view_id)
            
        if base_view_id:
            arch = """
<data>
    <!-- Configure Contact Field (New Custom Field) -->
    <xpath expr="//field[@name='partner_id']" position="after">
        <field name="x_partner_contact_id" 
               context="{'default_type': 'contact', 'show_address': 0, 'show_email': 1, 'default_parent_id': partner_id}"
               options="{'always_reload': True, 'no_create': True, 'no_open': True}"
               invisible="not partner_id"/>
    </xpath>
    
    <!-- Configure Invoice Address Field (Existing Native Field) -->
    <xpath expr="//field[@name='partner_invoice_id']" position="attributes">
        <attribute name="context">{'default_type': 'invoice', 'show_address': 1, 'show_vat': 0, 'default_parent_id': partner_id}</attribute>
        <attribute name="options">{'always_reload': True}</attribute>
    </xpath>

    <!-- Configure Shipping Address Field (Existing Native Field) -->
    <xpath expr="//field[@name='partner_shipping_id']" position="attributes">
        <attribute name="context">{'default_type': 'delivery', 'show_address': 1, 'show_vat': 0, 'default_parent_id': partner_id}</attribute>
        <attribute name="options">{'always_reload': True}</attribute>
    </xpath>
</data>
""".strip()
            if not dry_run:
                logger.info("Generated View Architecture:\n%s", arch)
                view_id = self._upsert_view(
                    name="RP Sale Order Address Defaults",
                    model="sale.order",
                    view_type="form",
                    arch=arch,
                    inherit_id=base_view_id,
                    mode="extension"
                )
                results["views"].append({"name": "RP Sale Order Address Defaults", "status": "updated"})

        # The setup_quotation_automation_rules call is removed.

        return results

    def _get_field_id(self, model_name: str, field_name: str) -> int:
        """Helper to get field ID."""
        ids = self.connection.search("ir.model.fields", [("model", "=", model_name), ("name", "=", field_name)])
        return ids[0] if ids else 0

    def _upsert_server_action(self, name: str, model_name: str, code: str) -> int:
        """Helper to create a server action and return its ID."""
        model_id = self._get_model_id(model_name)
        if not model_id: return 0
        
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
        else:
            return self.connection.create("ir.actions.server", vals)
