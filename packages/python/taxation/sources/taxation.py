"""
Tax Configuration Mixin
======================
Provides reusable methods for configuring Odoo Taxes (Sales Tax, Texas-specific).
"""

import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

class TaxationMixin:
    """Mixin to handle Odoo tax configurations."""

    _conn: Any

    def configure_sales_tax(
        self, 
        name: str = "Sales Tax (Texas)", 
        amount: float = 8.25, 
        country_code: str = "US",
        state_code: str = "TX"
    ) -> int:
        """
        Configure a specific sales tax.
        :param name: Name of the tax.
        :param amount: Tax percentage (e.g., 8.25).
        :param country_code: Country code for the tax.
        :param state_code: State code for the tax.
        :return: Tax ID.
        """
        # Get country and state IDs
        country_ids = self._conn.search("res.country", [("code", "=", country_code)])
        if not country_ids:
            logger.error("Country %s not found.", country_code)
            return -1
        
        state_ids = self._conn.search("res.country.state", [
            ("code", "=", state_code), 
            ("country_id", "=", country_ids[0])
        ])
        
        # Search for existing tax
        tax_domain = [
            ("name", "=", name),
            ("type_tax_use", "=", "sale"),
            ("amount", "=", amount)
        ]
        existing_tax_ids = self._conn.search("account.tax", tax_domain)
        
        tax_vals = {
            "name": name,
            "amount": amount,
            "amount_type": "percent",
            "type_tax_use": "sale",
            "country_id": country_ids[0],
        }

        # Odoo 19 requires tax_group_id and it MUST match the country_id of the tax
        try:
            country_id = country_ids[0]
            # Search for a tax group that matches the country
            group_ids = self._conn.search("account.tax.group", [
                ("country_id", "=", country_id),
                ("name", "ilike", "Sales")
            ], limit=1)
            
            if not group_ids:
                 # Try matching just by country
                 group_ids = self._conn.search("account.tax.group", [("country_id", "=", country_id)], limit=1)
            
            if not group_ids:
                 # If still not found, search for any group and check if we can update its country (risky)
                 # or create a new one for this country.
                 logger.warning("No Tax Group found for country %s. Creating a temporary 'Sales' group.", country_code)
                 group_id = self._conn.create("account.tax.group", {
                     "name": "Sales (TIS)",
                     "country_id": country_id
                 })
                 group_ids = [group_id]
            
            if group_ids:
                tax_vals["tax_group_id"] = group_ids[0]
                logger.info("Using Tax Group ID: %s (matched with country ID: %s)", group_ids[0], country_id)
        except Exception as e:
            logger.debug("Failed to find/set tax_group_id: %s", e)
        
        # Some Odoo versions support state_id on taxes, others don't (depends on localization module)
        # We check the fields first
        try:
            tax_fields = self._conn.execute("account.tax", "fields_get", ["state_id"])
            if "state_id" in tax_fields and state_ids:
                tax_vals["state_id"] = state_ids[0]
        except Exception:
            logger.debug("state_id field not available on account.tax, skipping.")

        if existing_tax_ids:
            logger.info("Tax '%s' already exists (ID: %s).", name, existing_tax_ids[0])
            self._conn.write("account.tax", existing_tax_ids, tax_vals)
            return existing_tax_ids[0]
        
        logger.info("Creating tax '%s'...", name)
        tax_id = self._conn.create("account.tax", tax_vals)
        return tax_id

    def set_default_customer_tax(self, tax_id: int) -> bool:
        """Sets the default tax for new customer accounts if applicable."""
        # This usually involves setting default values on res.partner or via properties
        # In many Odoo setups, taxes are defined on the product, but we might want
        # to ensure the company has this tax as default.
        return True # Placeholder for more complex logic
