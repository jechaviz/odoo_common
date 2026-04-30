"""Reusable builders for partner-default autofill server actions."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from .text_templates import (
    load_template_from_dir,
    render_template,
)


_TEMPLATES_DIR = Path(__file__).resolve().parent / "templates"


@dataclass(frozen=True)
class PartnerDefaultsAutofillSpec:
    """Project wiring for syncing invoice/delivery/contact defaults from a customer."""

    partner_model_name: str = "res.partner"
    sale_model_name: str = "sale.order"
    invoice_model_name: str = "account.move"
    sale_customer_field_name: str = "partner_id"
    sale_invoice_field_name: str = "partner_invoice_id"
    sale_delivery_field_name: str = "partner_shipping_id"
    sale_contact_field_name: str = "x_customer_contact_id"
    sale_rep_field_name: str = "x_customer_rep"
    invoice_customer_field_name: str = "partner_id"
    invoice_invoice_field_name: str = "x_invoice_address_id"
    invoice_delivery_field_name: str = "partner_shipping_id"
    invoice_contact_field_name: str = "x_customer_contact_id"
    invoice_rep_field_name: str = "x_customer_rep"
    partner_default_invoice_field_name: str = "x_default_invoice_address_id"
    partner_default_delivery_field_name: str = "x_default_delivery_address_id"
    partner_default_contact_field_name: str = "x_default_customer_contact_id"
    linked_sale_order_field_name: str = "invoice_origin"
    skip_context_key: str = "skip_rp_partner_defaults_sync"

    def template_context(self) -> dict[str, str]:
        """Render context consumed by the reusable partner-defaults template."""
        return {
            "__PARTNER_MODEL_NAME__": self.partner_model_name,
            "__SALE_MODEL_NAME__": self.sale_model_name,
            "__INVOICE_MODEL_NAME__": self.invoice_model_name,
            "__SALE_CUSTOMER_FIELD_NAME__": self.sale_customer_field_name,
            "__SALE_INVOICE_FIELD_NAME__": self.sale_invoice_field_name,
            "__SALE_DELIVERY_FIELD_NAME__": self.sale_delivery_field_name,
            "__SALE_CONTACT_FIELD_NAME__": self.sale_contact_field_name,
            "__SALE_REP_FIELD_NAME__": self.sale_rep_field_name,
            "__INVOICE_CUSTOMER_FIELD_NAME__": self.invoice_customer_field_name,
            "__INVOICE_INVOICE_FIELD_NAME__": self.invoice_invoice_field_name,
            "__INVOICE_DELIVERY_FIELD_NAME__": self.invoice_delivery_field_name,
            "__INVOICE_CONTACT_FIELD_NAME__": self.invoice_contact_field_name,
            "__INVOICE_REP_FIELD_NAME__": self.invoice_rep_field_name,
            "__PARTNER_DEFAULT_INVOICE_FIELD_NAME__": self.partner_default_invoice_field_name,
            "__PARTNER_DEFAULT_DELIVERY_FIELD_NAME__": self.partner_default_delivery_field_name,
            "__PARTNER_DEFAULT_CONTACT_FIELD_NAME__": self.partner_default_contact_field_name,
            "__LINKED_SALE_ORDER_FIELD_NAME__": self.linked_sale_order_field_name,
            "__SKIP_CONTEXT_KEY__": self.skip_context_key,
        }


def build_partner_defaults_autofill_server_action(spec: PartnerDefaultsAutofillSpec) -> str:
    """Render safe-eval code that syncs partner defaults for sale/invoice records."""
    return render_template(
        load_template_from_dir(_TEMPLATES_DIR, "partner_defaults_autofill_server_action.py.tmpl"),
        spec.template_context(),
    )
