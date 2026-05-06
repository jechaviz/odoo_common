"""Neutral report-template field mapping and CFDI QR helpers.

This module does not execute JRXML expressions. It builds explicit mapping
plans from designer aliases to trusted Odoo/QWeb/XML sources, plus SAT CFDI QR
payloads that callers can render through Odoo's barcode controller.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from decimal import Decimal, ROUND_HALF_UP
from html import escape
import re
from typing import Any, Literal, Mapping, Sequence
from urllib.parse import urlencode


REPORT_TEMPLATE_MAPPING_SCHEMA_VERSION = "odoo_common.report_template_mapping.v1"
SAT_CFDI_VERIFICATION_URL = "https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx"

ReferenceKind = Literal["field", "parameter", "variable"]
MappingSourceKind = Literal["field", "parameter", "variable", "xml_path", "literal", "computed"]

_REFERENCE_KINDS: tuple[ReferenceKind, ...] = ("field", "parameter", "variable")
_REFERENCE_COLLECTION_BY_KIND = {
    "field": "fields",
    "parameter": "parameters",
    "variable": "variables",
}
_TOKEN_PREFIX_BY_KIND = {
    "field": "F",
    "parameter": "P",
    "variable": "V",
}


def _clean_required_text(value: Any, *, field_name: str) -> str:
    clean_value = str(value or "").strip()
    if not clean_value:
        raise ValueError(f"Report template mapping {field_name} is required")
    return clean_value


def _clean_optional_text(value: Any) -> str:
    return str(value or "").strip()


def _normalize_mapping(value: Mapping[str, Any] | None) -> dict[str, Any]:
    if value is None:
        return {}
    if not isinstance(value, Mapping):
        raise TypeError("Report template mapping metadata must be a mapping")
    normalized = dict(value)
    for key in normalized:
        _clean_required_text(key, field_name="metadata key")
    return normalized


def _normalize_sequence(value: Sequence[Any] | None) -> tuple[Any, ...]:
    if value is None:
        return tuple()
    if isinstance(value, (str, bytes)) or not isinstance(value, Sequence):
        raise TypeError("Report template mapping sequence values must be explicit sequences")
    return tuple(value)


def _coerce_sequence(value: Any) -> tuple[Any, ...]:
    if value is None:
        return tuple()
    if isinstance(value, (str, bytes)):
        return (value,)
    if isinstance(value, Sequence):
        return tuple(value)
    return (value,)


def _safe_token(value: Any) -> str:
    return str(value or "").strip()


def _normalize_source_name(value: Any) -> str:
    raw_value = _clean_required_text(value, field_name="source name")
    match = re.fullmatch(r"\$(?P<prefix>[FPV])\{(?P<name>[^}]+)\}", raw_value)
    return match.group("name").strip() if match else raw_value


def _normalize_reference_kind(value: Any) -> ReferenceKind:
    kind = _clean_required_text(value, field_name="reference kind").lower()
    if kind == "fields":
        kind = "field"
    elif kind == "parameters":
        kind = "parameter"
    elif kind == "variables":
        kind = "variable"
    if kind not in _REFERENCE_KINDS:
        raise ValueError(f"Unsupported report template reference kind: {kind!r}")
    return kind  # type: ignore[return-value]


def _normalize_mapping_source_kind(value: Any) -> MappingSourceKind:
    kind = _clean_required_text(value, field_name="mapping source kind").lower()
    supported = ("field", "parameter", "variable", "xml_path", "literal", "computed")
    if kind not in supported:
        raise ValueError(f"Unsupported report template mapping source kind: {kind!r}")
    return kind  # type: ignore[return-value]


def _normalize_rfc(value: Any, *, field_name: str) -> str:
    rfc = _clean_required_text(value, field_name=field_name).upper()
    if not re.fullmatch(r"[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}", rfc):
        raise ValueError(f"Invalid RFC for {field_name}: {rfc!r}")
    return rfc


def _normalize_uuid(value: Any) -> str:
    uuid = _clean_required_text(value, field_name="CFDI UUID").upper()
    if not re.fullmatch(r"[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}", uuid):
        raise ValueError(f"Invalid CFDI UUID: {uuid!r}")
    return uuid


def format_cfdi_qr_total(value: Any) -> str:
    """Format a CFDI total for the SAT verification QR payload."""
    decimal_value = Decimal(str(value or "0")).quantize(Decimal("0.000001"), rounding=ROUND_HALF_UP)
    if decimal_value < 0:
        raise ValueError("CFDI QR total must not be negative")
    text = format(decimal_value, "f")
    integer_part, decimal_part = text.split(".", 1)
    integer_part = integer_part.lstrip("0") or "0"
    return f"{integer_part}.{decimal_part}"


@dataclass(frozen=True)
class JrxmlReferenceSpec:
    """One referenced JRXML symbol extracted from expression indexes."""

    kind: ReferenceKind
    name: str
    token: str
    count: int = 1

    def __post_init__(self) -> None:
        kind = _normalize_reference_kind(self.kind)
        name = _normalize_source_name(self.name)
        object.__setattr__(self, "kind", kind)
        object.__setattr__(self, "name", name)
        object.__setattr__(self, "token", f"${_TOKEN_PREFIX_BY_KIND[kind]}{{{name}}}")
        object.__setattr__(self, "count", int(self.count or 0))


@dataclass(frozen=True)
class ReportTemplateFieldMappingSpec:
    """Declare one mapping from a JRXML alias to a trusted Odoo/XML source."""

    source_name: str
    target_path: str
    source_kind: MappingSourceKind = "field"
    label: str = ""
    qweb_expression: str = ""
    xml_path: str = ""
    required: bool = False
    formatter: str = ""
    notes: str = ""
    metadata: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        object.__setattr__(self, "source_name", _normalize_source_name(self.source_name))
        object.__setattr__(self, "source_kind", _normalize_mapping_source_kind(self.source_kind))
        object.__setattr__(self, "target_path", _clean_required_text(self.target_path, field_name="target path"))
        object.__setattr__(self, "label", _clean_optional_text(self.label))
        object.__setattr__(self, "qweb_expression", _clean_optional_text(self.qweb_expression))
        object.__setattr__(self, "xml_path", _clean_optional_text(self.xml_path))
        object.__setattr__(self, "required", bool(self.required))
        object.__setattr__(self, "formatter", _clean_optional_text(self.formatter))
        object.__setattr__(self, "notes", _clean_optional_text(self.notes))
        object.__setattr__(self, "metadata", _normalize_mapping(self.metadata))


@dataclass(frozen=True)
class ReportTemplateMappingPlan:
    """Pure field-mapping plan for a template design."""

    schema_version: str
    document_family: str
    target_model: str
    references: tuple[JrxmlReferenceSpec, ...] = ()
    mappings: tuple[ReportTemplateFieldMappingSpec, ...] = ()
    mapped: tuple[JrxmlReferenceSpec, ...] = ()
    missing: tuple[JrxmlReferenceSpec, ...] = ()
    qweb_context: Mapping[str, str] = field(default_factory=dict)
    warnings: tuple[str, ...] = ()
    metadata: Mapping[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class CfdiQrPayloadSpec:
    """SAT CFDI verification QR payload inputs."""

    uuid: str
    emitter_rfc: str
    receiver_rfc: str
    total: Any
    seal: str
    verification_url: str = SAT_CFDI_VERIFICATION_URL

    def __post_init__(self) -> None:
        object.__setattr__(self, "uuid", _normalize_uuid(self.uuid))
        object.__setattr__(self, "emitter_rfc", _normalize_rfc(self.emitter_rfc, field_name="emitter RFC"))
        object.__setattr__(self, "receiver_rfc", _normalize_rfc(self.receiver_rfc, field_name="receiver RFC"))
        object.__setattr__(self, "total", format_cfdi_qr_total(self.total))
        seal = _clean_required_text(self.seal, field_name="CFDI seal")
        if len(seal) < 8:
            raise ValueError("CFDI seal must have at least 8 characters")
        object.__setattr__(self, "seal", seal)
        object.__setattr__(self, "verification_url", _clean_required_text(self.verification_url, field_name="verification URL"))


DEFAULT_CFDI40_JRXML_FIELD_MAPPINGS: tuple[ReportTemplateFieldMappingSpec, ...] = (
    ReportTemplateFieldMappingSpec(
        source_name="UUID",
        source_kind="field",
        target_path="cfdi.timbre_fiscal_digital.uuid",
        qweb_expression="o.l10n_mx_edi_cfdi_uuid or ''",
        xml_path="/cfdi:Comprobante/cfdi:Complemento/tfd:TimbreFiscalDigital/@UUID",
        required=True,
        label="Folio fiscal",
    ),
    ReportTemplateFieldMappingSpec(
        source_name="rfcEmisor",
        source_kind="field",
        target_path="cfdi.emisor.rfc",
        qweb_expression="o.company_id.vat or ''",
        xml_path="/cfdi:Comprobante/cfdi:Emisor/@Rfc",
        required=True,
        label="RFC emisor",
    ),
    ReportTemplateFieldMappingSpec(
        source_name="rfcReceptor",
        source_kind="field",
        target_path="cfdi.receptor.rfc",
        qweb_expression="o.partner_id.vat or ''",
        xml_path="/cfdi:Comprobante/cfdi:Receptor/@Rfc",
        required=True,
        label="RFC receptor",
    ),
    ReportTemplateFieldMappingSpec(
        source_name="totalCFDi",
        source_kind="field",
        target_path="cfdi.comprobante.total",
        qweb_expression="o.amount_total",
        xml_path="/cfdi:Comprobante/@Total",
        required=True,
        formatter="cfdi_qr_total",
        label="Total CFDI",
    ),
    ReportTemplateFieldMappingSpec(
        source_name="selloCFD",
        source_kind="field",
        target_path="cfdi.comprobante.sello",
        xml_path="/cfdi:Comprobante/@Sello",
        required=True,
        formatter="last_8",
        label="Sello CFD",
    ),
)


def _iter_expression_items(expression_index_or_blueprint: Mapping[str, Any]) -> tuple[Mapping[str, Any], ...]:
    if "expression_index" in expression_index_or_blueprint and isinstance(expression_index_or_blueprint.get("expression_index"), Mapping):
        expression_index_or_blueprint = expression_index_or_blueprint["expression_index"]  # type: ignore[assignment]
    items = expression_index_or_blueprint.get("items") if isinstance(expression_index_or_blueprint, Mapping) else ()
    structural_items = expression_index_or_blueprint.get("structural_items") if isinstance(expression_index_or_blueprint, Mapping) else ()
    rows: list[Mapping[str, Any]] = []
    for value in tuple(_normalize_sequence(items)) + tuple(_normalize_sequence(structural_items)):
        if isinstance(value, Mapping):
            rows.append(value)
    return tuple(rows)


def extract_jrxml_references(expression_index_or_blueprint: Mapping[str, Any]) -> tuple[JrxmlReferenceSpec, ...]:
    """Extract unique `$F`, `$P`, `$V` references from a designer expression index."""
    counts: dict[tuple[ReferenceKind, str], int] = {}
    for item in _iter_expression_items(expression_index_or_blueprint):
        refs = item.get("refs") if isinstance(item.get("refs"), Mapping) else {}
        for kind in _REFERENCE_KINDS:
            collection_key = _REFERENCE_COLLECTION_BY_KIND[kind]
            for raw_name in _normalize_sequence(refs.get(collection_key) if isinstance(refs, Mapping) else ()):
                name = _normalize_source_name(raw_name)
                key = (kind, name)
                counts[key] = counts.get(key, 0) + 1
    return tuple(
        JrxmlReferenceSpec(kind=kind, name=name, token="", count=count)
        for (kind, name), count in sorted(counts.items(), key=lambda item: (item[0][0], item[0][1].lower()))
    )


def build_qweb_mapping_context(
    mappings: Sequence[ReportTemplateFieldMappingSpec | Mapping[str, Any]],
) -> dict[str, str]:
    """Build an alias -> trusted QWeb expression context."""
    context: dict[str, str] = {}
    for mapping_value in mappings:
        mapping = mapping_value if isinstance(mapping_value, ReportTemplateFieldMappingSpec) else ReportTemplateFieldMappingSpec(**dict(mapping_value))
        if mapping.qweb_expression:
            context[mapping.source_name] = mapping.qweb_expression
    return context


def build_report_template_mapping_plan(
    expression_index_or_blueprint: Mapping[str, Any],
    mappings: Sequence[ReportTemplateFieldMappingSpec | Mapping[str, Any]],
    *,
    document_family: str = "",
    target_model: str = "",
    metadata: Mapping[str, Any] | None = None,
) -> ReportTemplateMappingPlan:
    """Build a pure mapping plan; callers decide how to publish or apply it."""
    normalized_mappings = tuple(
        mapping_value if isinstance(mapping_value, ReportTemplateFieldMappingSpec) else ReportTemplateFieldMappingSpec(**dict(mapping_value))
        for mapping_value in mappings
    )
    references = extract_jrxml_references(expression_index_or_blueprint)
    mapping_keys = {(mapping.source_kind, mapping.source_name) for mapping in normalized_mappings}
    mapped = tuple(reference for reference in references if (reference.kind, reference.name) in mapping_keys)
    missing = tuple(reference for reference in references if (reference.kind, reference.name) not in mapping_keys)
    warnings = tuple(
        f"Missing mapping for {reference.token}"
        for reference in missing
    )
    return ReportTemplateMappingPlan(
        schema_version=REPORT_TEMPLATE_MAPPING_SCHEMA_VERSION,
        document_family=_clean_optional_text(document_family),
        target_model=_clean_optional_text(target_model),
        references=references,
        mappings=normalized_mappings,
        mapped=mapped,
        missing=missing,
        qweb_context=build_qweb_mapping_context(normalized_mappings),
        warnings=warnings,
        metadata=_normalize_mapping(metadata),
    )


def mapping_plan_coverage_pct(plan: ReportTemplateMappingPlan) -> int:
    """Return a rounded percentage of JRXML references covered by mappings."""
    reference_count = len(plan.references)
    if reference_count <= 0:
        return 100
    return int(round((len(plan.mapped) / reference_count) * 100))


def _mapping_key(kind: Any, name: Any) -> tuple[str, str]:
    return _safe_token(kind), _safe_token(name)


def build_report_template_mapping_payload(
    plan: ReportTemplateMappingPlan,
    *,
    schema_version: str = "",
    metadata: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    """Serialize a mapping plan for Odoo text fields or JSON payloads."""
    extra_metadata = _normalize_mapping(metadata)
    return {
        "schema_version": schema_version or plan.schema_version,
        "common_schema_version": plan.schema_version,
        "document_family": plan.document_family,
        "target_model": plan.target_model,
        "reference_count": len(plan.references),
        "mapped_count": len(plan.mapped),
        "missing_count": len(plan.missing),
        "coverage_pct": mapping_plan_coverage_pct(plan),
        "references": [asdict(reference) for reference in plan.references],
        "mappings": [asdict(mapping) for mapping in plan.mappings],
        "mapped": [asdict(reference) for reference in plan.mapped],
        "missing": [asdict(reference) for reference in plan.missing],
        "qweb_context": dict(plan.qweb_context),
        "warnings": list(plan.warnings),
        "metadata": {**dict(plan.metadata), **extra_metadata},
    }


def build_report_template_mapping_summary_html(
    plan: ReportTemplateMappingPlan,
    *,
    row_limit: int = 80,
) -> str:
    """Render a compact neutral mapping summary for readonly Odoo HTML fields."""
    coverage = mapping_plan_coverage_pct(plan)
    mapping_by_key = {
        _mapping_key(mapping.source_kind, mapping.source_name): mapping
        for mapping in plan.mappings
    }
    rows: list[str] = []
    limit = max(int(row_limit or 0), 1)
    for reference in tuple(plan.references)[:limit]:
        mapping = mapping_by_key.get(_mapping_key(reference.kind, reference.name))
        status = "Mapped" if mapping else "Pending"
        target = mapping.target_path if mapping else ""
        expression = mapping.qweb_expression if mapping else ""
        xml_path = mapping.xml_path if mapping else ""
        rows.append(
            "<tr>"
            f"<td><code>{escape(reference.token)}</code></td>"
            f"<td>{escape(status)}</td>"
            f"<td>{escape(target)}</td>"
            f"<td><code>{escape(expression or xml_path)}</code></td>"
            f"<td>{int(reference.count or 0)}</td>"
            "</tr>"
        )
    if len(plan.references) > limit:
        rows.append(
            "<tr>"
            f'<td colspan="5">Showing {int(limit)} of {len(plan.references)} references.</td>'
            "</tr>"
        )
    empty = (
        '<tr><td colspan="5">No JRXML references were found for mapping.</td></tr>'
        if not rows
        else ""
    )
    warnings = "".join(
        f"<li>{escape(warning)}</li>"
        for warning in tuple(plan.warnings)[:12]
    )
    warning_html = (
        f'<ul class="oc_report_mapping__warnings">{warnings}</ul>'
        if warnings
        else '<p class="oc_report_mapping__ok">No critical mapping warnings.</p>'
    )
    return (
        '<div class="oc_report_mapping" data-oc-report-template-mapping="1">'
        '<div class="oc_report_mapping__metrics">'
        f"<span>References: {len(plan.references)}</span>"
        f"<span>Mapped: {len(plan.mapped)}</span>"
        f"<span>Pending: {len(plan.missing)}</span>"
        f"<span>Coverage: {coverage}%</span>"
        "</div>"
        '<table class="oc_report_mapping__table">'
        "<thead><tr><th>JRXML</th><th>Status</th><th>Target</th><th>QWeb/XML</th><th>Use</th></tr></thead>"
        f"<tbody>{''.join(rows)}{empty}</tbody>"
        "</table>"
        f"{warning_html}"
        "</div>"
    )


def _iter_blueprint_elements(blueprint: Mapping[str, Any]) -> tuple[Mapping[str, Any], ...]:
    elements: list[Mapping[str, Any]] = []

    def visit(element: Mapping[str, Any]) -> None:
        elements.append(element)
        for child in _coerce_sequence(element.get("children") if isinstance(element, Mapping) else ()):
            if isinstance(child, Mapping):
                visit(child)

    for band in _coerce_sequence(blueprint.get("bands")):
        if not isinstance(band, Mapping):
            continue
        for element in _coerce_sequence(band.get("elements")):
            if isinstance(element, Mapping):
                visit(element)
    return tuple(elements)


def build_report_template_preview_issues(
    blueprint: Mapping[str, Any],
    mapping_plan: ReportTemplateMappingPlan,
    *,
    sample_xml_paths: Sequence[str] | Sequence[Any] = (),
) -> tuple[dict[str, Any], ...]:
    """Summarize safe preview risks without executing JRXML expressions."""
    issues: list[dict[str, Any]] = []
    if not tuple(sample_xml_paths or ()):
        issues.append(
            {
                "severity": "info",
                "code": "missing-sample-data",
                "message": "No test XML files were attached to this design.",
                "details": ["Attach at least one XML or translated JSON sample to validate preview data."],
            }
        )
    if mapping_plan.missing:
        issues.append(
            {
                "severity": "warning",
                "code": "missing-field-mapping",
                "message": f"{len(mapping_plan.missing)} JRXML references still need explicit mappings.",
                "details": [reference.token for reference in mapping_plan.missing[:24]],
            }
        )
    unsupported_expressions = [
        item
        for item in _iter_expression_items(blueprint)
        if not bool((item.get("python") if isinstance(item.get("python"), Mapping) else {}).get("supported"))
    ]
    if unsupported_expressions:
        issues.append(
            {
                "severity": "warning",
                "code": "unsupported-expression",
                "message": f"{len(unsupported_expressions)} JRXML expressions are stored but not executable yet.",
                "details": [
                    _safe_token(item.get("source"))[:180]
                    for item in unsupported_expressions[:12]
                    if _safe_token(item.get("source"))
                ],
            }
        )
    preview_unsupported = sorted(
        {
            _safe_token(element.get("type"))
            for element in _iter_blueprint_elements(blueprint)
            if _safe_token(element.get("type")) in {"subreport", "break"}
        }
    )
    if preview_unsupported:
        issues.append(
            {
                "severity": "info",
                "code": "preview-element-gap",
                "message": "Some JRXML element types are indexed but skipped by the safe HTML preview.",
                "details": preview_unsupported,
            }
        )
    return tuple(issues)


def build_report_template_preview_issues_html(issues: Sequence[Mapping[str, Any]]) -> str:
    """Render preview issues in a compact readonly summary panel."""
    normalized = [issue for issue in issues if isinstance(issue, Mapping)]
    if not normalized:
        return (
            '<div class="oc_report_preview_issues" data-oc-report-preview-issues="1">'
            '<p class="oc_report_preview_issues__empty">No critical preview issues.</p>'
            "</div>"
        )
    rows: list[str] = []
    for issue in normalized:
        details = "".join(
            f"<li>{escape(_safe_token(detail))}</li>"
            for detail in _coerce_sequence(issue.get("details"))[:24]
            if _safe_token(detail)
        )
        details_html = f"<ul>{details}</ul>" if details else ""
        rows.append(
            "<tr>"
            f"<td>{escape(_safe_token(issue.get('severity')))}</td>"
            f"<td><code>{escape(_safe_token(issue.get('code')))}</code></td>"
            f"<td>{escape(_safe_token(issue.get('message')))}{details_html}</td>"
            "</tr>"
        )
    return (
        '<div class="oc_report_preview_issues" data-oc-report-preview-issues="1">'
        '<table class="oc_report_preview_issues__table">'
        "<thead><tr><th>Level</th><th>Code</th><th>Detail</th></tr></thead>"
        f"<tbody>{''.join(rows)}</tbody>"
        "</table>"
        "</div>"
    )


def build_cfdi_qr_verification_url(spec: CfdiQrPayloadSpec | Mapping[str, Any]) -> str:
    """Build the SAT public verification URL to encode in the CFDI QR."""
    normalized = spec if isinstance(spec, CfdiQrPayloadSpec) else CfdiQrPayloadSpec(**dict(spec))
    query = urlencode(
        {
            "id": normalized.uuid,
            "re": normalized.emitter_rfc,
            "rr": normalized.receiver_rfc,
            "tt": normalized.total,
            "fe": normalized.seal[-8:],
        }
    )
    return f"{normalized.verification_url}?{query}"


def build_odoo_qr_barcode_src(value: str, *, width: int = 220, height: int = 220) -> str:
    """Build an Odoo barcode-controller URL for a QR image."""
    payload = _clean_required_text(value, field_name="QR value")
    return "/report/barcode/?" + urlencode(
        {
            "barcode_type": "QR",
            "value": payload,
            "width": int(width),
            "height": int(height),
        }
    )


def build_odoo_qr_img_tag(value: str, *, width: int = 220, height: int = 220, alt: str = "QR") -> str:
    """Build a safe `<img>` tag pointing to Odoo's QR barcode renderer."""
    src = build_odoo_qr_barcode_src(value, width=width, height=height)
    clean_alt = _clean_optional_text(alt) or "QR"
    return (
        f'<img src="{escape(src, quote=True)}" '
        f'width="{int(width)}" height="{int(height)}" '
        f'alt="{escape(clean_alt, quote=True)}"/>'
    )


def build_cfdi_qr_img_tag(
    spec: CfdiQrPayloadSpec | Mapping[str, Any],
    *,
    width: int = 220,
    height: int = 220,
    alt: str = "Codigo QR CFDI",
) -> str:
    """Build an Odoo QR `<img>` tag for SAT CFDI verification."""
    return build_odoo_qr_img_tag(
        build_cfdi_qr_verification_url(spec),
        width=width,
        height=height,
        alt=alt,
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
    "build_report_template_mapping_payload",
    "build_report_template_mapping_plan",
    "build_report_template_mapping_summary_html",
    "build_report_template_preview_issues",
    "build_report_template_preview_issues_html",
    "extract_jrxml_references",
    "format_cfdi_qr_total",
    "mapping_plan_coverage_pct",
]
