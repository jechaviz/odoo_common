"""Canonical helpers for configuring declared Odoo tax specs."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from types import MappingProxyType
from typing import Any, Protocol, runtime_checkable


logger = logging.getLogger(__name__)


CFDI40_MEXICO_VIEW_LABELS = MappingProxyType(
    {
        "RECEPTOR_SECTION": "Receptor CFDI 4.0",
        "RECEPTOR_FIELD": "Receptor",
        "ODOO_FISCAL_POSITION_FIELD": "Tratamiento fiscal",
        "BILLING_CARD": "Domicilio fiscal receptor",
        "BILLING_EMPTY": "Selecciona un receptor para validar RFC, régimen fiscal y código postal fiscal.",
        "BILLING_EMPTY_TITLE": "Receptor sin seleccionar",
        "BILLING_EMPTY_DETAILS": "Selecciona un receptor para ver RFC, régimen fiscal y código postal fiscal.",
        "DELIVERY_CARD": "Domicilio de entrega",
        "DELIVERY_TITLE": "Mismo domicilio fiscal",
        "DELIVERY_DETAILS": "El CFDI usa el domicilio fiscal del receptor; asigna entrega solo si la operación lo requiere.",
        "COMMERCIAL_CARD": "Venta y pago",
        "COMMERCIAL_REFERENCE": "Lista de precios",
        "COMMERCIAL_REFERENCE_META_LABEL": "Moneda",
        "COMMERCIAL_REFERENCE_META_VALUE": "Por definir",
        "COMMERCIAL_CONDITION_LABEL": "Condiciones de pago",
        "COMMERCIAL_CONDITION_VALUE": "Por definir",
        "COMMERCIAL_CONDITION_META_LABEL": "Regla",
        "COMMERCIAL_CONDITION_META_VALUE": "Sin regla especial",
        "COMMERCIAL_NOTE": "Se confirma al capturar los conceptos.",
        "DOCUMENT_SECTION": "Emisión CFDI 4.0",
        "INVOICE_DATE_FIELD": "Fecha de emisión",
        "PAYMENT_TERMS_FIELD": "Condiciones de pago",
        "DUE_DATE_FIELD": "Fecha de vencimiento",
        "SALES_PERSON_FIELD": "Responsable comercial",
        "PAYMENT_POLICY_FIELD": "Método de pago SAT",
        "PAYMENT_METHOD_FIELD": "Forma de pago SAT",
        "USAGE_FIELD": "Uso CFDI",
        "EXPORTACION_FIELD": "Exportación",
        "CFDI_RELATED_SECTION": "CFDI relacionados",
        "CFDI_ORIGIN_FIELD": "Tipo relación y UUID relacionados",
        "GLOBAL_INFO_SECTION": "Información global",
        "GLOBAL_PUBLIC_FIELD": "CFDI público en general",
        "GLOBAL_PERIODICITY_FIELD": "Periodicidad",
        "GLOBAL_MONTHS_FIELD": "Meses",
        "GLOBAL_YEAR_FIELD": "Año",
        "TAX_OBJECT_FIELD": "Objeto de impuesto",
        "DOCUMENT_TEMPLATE_FIELD": "Formato CFDI",
        "CURRENCY_FIELD": "Moneda",
        "SERIES_FIELD": "Serie CFDI",
        "BRANCH_FIELD": "Lugar de expedición",
        "BRANCH_PLACEHOLDER": "Sucursal fiscal",
        "WORKSPACE_ADVANCED_TAB": "Avanzado",
        "WORKSPACE_CFDI_PANEL": "Emisión CFDI 4.0",
        "WORKSPACE_COMPANY_FIELD": "Emisor / lugar de expedición",
        "WORKSPACE_TEMPLATES_PANEL": "Formato y complementos",
        "WORKSPACE_PAYLOADS_TAB": "Archivos tecnicos",
        "WORKSPACE_PAYLOADS_GROUP": "Contenido tecnico",
        "DOCUMENT_TYPE_FIELD": "Tipo de comprobante SAT",
        "REP_PANEL": "Complemento de pago REP 2.0",
        "PAYROLL_PANEL": "Nómina 1.2",
        "TRANSPORT_PANEL": "Traslado",
    }
)

CFDI40_MEXICO_DYNAMIC_RULES = (
    "Uso CFDI se selecciona conforme al régimen fiscal del receptor.",
    "Método de pago SAT distingue PUE de PPD; Forma de pago SAT conserva el catálogo c_FormaPago.",
    "En PPD, el cobro se documenta después con complemento de pago REP.",
    "El receptor CFDI 4.0 requiere RFC, nombre o razón social, régimen fiscal y código postal fiscal.",
)


def cfdi40_mexico_view_label(key: str) -> str:
    """Return one reusable CFDI 4.0 Mexico label by key."""
    clean_key = str(key or "").strip()
    if not clean_key:
        raise ValueError("CFDI 4.0 Mexico label key is required")
    try:
        return str(CFDI40_MEXICO_VIEW_LABELS[clean_key])
    except KeyError as exc:
        raise KeyError(f"Unknown CFDI 4.0 Mexico label key: {clean_key}") from exc


def build_cfdi40_mexico_view_label_substitutions(
    *,
    prefix: str = "{{CFDI40_",
    suffix: str = "}}",
) -> dict[str, str]:
    """Build token substitutions for XML fragments that consume CFDI 4.0 labels."""
    clean_prefix = str(prefix)
    clean_suffix = str(suffix)
    return {
        f"{clean_prefix}{key}{clean_suffix}": value
        for key, value in CFDI40_MEXICO_VIEW_LABELS.items()
    }


@dataclass(frozen=True)
class SalesTaxSpec:
    """Declare the Odoo model, field, and value contract for one sales tax."""

    name: str = "Sales Tax (Texas)"
    amount: float = 8.25
    country_code: str = "US"
    state_code: str = "TX"
    amount_type: str = "percent"
    type_tax_use: str = "sale"
    tax_group_name: str = "Sales"
    tax_group_create_name: str = "Sales (TIS)"
    create_missing_tax_group: bool = True
    country_model_name: str = "res.country"
    state_model_name: str = "res.country.state"
    tax_model_name: str = "account.tax"
    tax_group_model_name: str = "account.tax.group"
    name_field_name: str = "name"
    code_field_name: str = "code"
    country_field_name: str = "country_id"
    state_field_name: str = "state_id"
    amount_field_name: str = "amount"
    amount_type_field_name: str = "amount_type"
    type_tax_use_field_name: str = "type_tax_use"
    tax_group_field_name: str = "tax_group_id"


DEFAULT_SALES_TAX_SPEC = SalesTaxSpec()


@runtime_checkable
class TaxationConnection(Protocol):
    """Minimal Odoo RPC contract required by the taxation helpers."""

    def search(
        self,
        model_name: str,
        domain: list[tuple[str, str, Any]],
        limit: int | None = None,
    ) -> list[int]:
        """Return matching record ids."""

    def write(self, model_name: str, ids: list[int], values: dict[str, Any]) -> Any:
        """Update one or more records."""

    def create(self, model_name: str, values: dict[str, Any]) -> Any:
        """Create one record."""


class TaxationMixin:
    """Mixin to upsert Odoo tax records from explicit specs."""

    _conn: TaxationConnection
    default_sales_tax_spec: SalesTaxSpec = DEFAULT_SALES_TAX_SPEC

    def configure_sales_tax(self, spec: SalesTaxSpec | None = None) -> int:
        """Create or update the configured sales tax and return its record id."""
        spec = spec if spec is not None else self.default_sales_tax_spec
        country_id = self._first_record_id(
            self._conn.search(
                spec.country_model_name,
                [(spec.code_field_name, "=", spec.country_code)],
                limit=1,
            )
        )
        if country_id <= 0:
            logger.error("Country %s not found.", spec.country_code)
            return -1

        state_id = 0
        if spec.state_code:
            state_id = self._first_record_id(
                self._conn.search(
                    spec.state_model_name,
                    [
                        (spec.code_field_name, "=", spec.state_code),
                        (spec.country_field_name, "=", country_id),
                    ],
                    limit=1,
                )
            )
            if state_id <= 0:
                logger.error("State %s not found for country %s.", spec.state_code, spec.country_code)
                return -1

        tax_group_id = self._resolve_tax_group_id(spec, country_id)
        if tax_group_id <= 0:
            logger.error("Tax group %s not found for country %s.", spec.tax_group_name, spec.country_code)
            return -1

        tax_domain = [
            (spec.name_field_name, "=", spec.name),
            (spec.type_tax_use_field_name, "=", spec.type_tax_use),
            (spec.amount_field_name, "=", spec.amount),
            (spec.country_field_name, "=", country_id),
        ]
        existing_tax_ids = self._conn.search(spec.tax_model_name, tax_domain)

        tax_values: dict[str, Any] = {
            spec.name_field_name: spec.name,
            spec.amount_field_name: spec.amount,
            spec.amount_type_field_name: spec.amount_type,
            spec.type_tax_use_field_name: spec.type_tax_use,
            spec.country_field_name: country_id,
            spec.tax_group_field_name: tax_group_id,
        }
        if state_id > 0:
            tax_values[spec.state_field_name] = state_id

        if existing_tax_ids:
            tax_id = self._first_record_id(existing_tax_ids)
            logger.info("Updating tax '%s' (ID: %s).", spec.name, tax_id)
            self._conn.write(spec.tax_model_name, existing_tax_ids, tax_values)
            return tax_id

        logger.info("Creating tax '%s'.", spec.name)
        return self._record_id(self._conn.create(spec.tax_model_name, tax_values))

    def _resolve_tax_group_id(self, spec: SalesTaxSpec, country_id: int) -> int:
        group_ids = self._conn.search(
            spec.tax_group_model_name,
            [
                (spec.country_field_name, "=", country_id),
                (spec.name_field_name, "ilike", spec.tax_group_name),
            ],
            limit=1,
        )
        if group_ids:
            tax_group_id = self._first_record_id(group_ids)
            logger.info("Using tax group ID %s for country ID %s.", tax_group_id, country_id)
            return tax_group_id

        if not spec.create_missing_tax_group:
            return 0

        logger.info("Creating tax group '%s' for country ID %s.", spec.tax_group_create_name, country_id)
        return self._record_id(
            self._conn.create(
                spec.tax_group_model_name,
                {
                    spec.name_field_name: spec.tax_group_create_name,
                    spec.country_field_name: country_id,
                },
            )
        )

    @staticmethod
    def _first_record_id(record_ids: list[int]) -> int:
        if not record_ids:
            return 0
        return int(record_ids[0] or 0)

    @staticmethod
    def _record_id(value: Any) -> int:
        if isinstance(value, (list, tuple)) and value:
            return int(value[0] or 0)
        return int(value or 0)
