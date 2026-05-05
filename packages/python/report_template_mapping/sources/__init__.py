"""Canonical report-template mapping and CFDI QR helpers."""

from .report_template_mapping import (
    DEFAULT_CFDI40_JRXML_FIELD_MAPPINGS,
    REPORT_TEMPLATE_MAPPING_SCHEMA_VERSION,
    SAT_CFDI_VERIFICATION_URL,
    CfdiQrPayloadSpec,
    JrxmlReferenceSpec,
    ReportTemplateFieldMappingSpec,
    ReportTemplateMappingPlan,
    build_cfdi_qr_img_tag,
    build_cfdi_qr_verification_url,
    build_odoo_qr_barcode_src,
    build_odoo_qr_img_tag,
    build_qweb_mapping_context,
    build_report_template_mapping_plan,
    extract_jrxml_references,
    format_cfdi_qr_total,
)

__all__ = [
    "DEFAULT_CFDI40_JRXML_FIELD_MAPPINGS",
    "REPORT_TEMPLATE_MAPPING_SCHEMA_VERSION",
    "SAT_CFDI_VERIFICATION_URL",
    "CfdiQrPayloadSpec",
    "JrxmlReferenceSpec",
    "ReportTemplateFieldMappingSpec",
    "ReportTemplateMappingPlan",
    "build_cfdi_qr_img_tag",
    "build_cfdi_qr_verification_url",
    "build_odoo_qr_barcode_src",
    "build_odoo_qr_img_tag",
    "build_qweb_mapping_context",
    "build_report_template_mapping_plan",
    "extract_jrxml_references",
    "format_cfdi_qr_total",
]
