"""Neutral report-template builder contracts.

This module composes existing common primitives into publication plans.  It
does not connect to Odoo, execute RPC calls, or evaluate report expressions.
Consumers own all live publication and ID resolution.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from html import escape
from pathlib import Path
import re
from typing import Any, Literal, Mapping, Sequence

from odoo_common.record_upserts import RecordUpsertSpec
from odoo_common.report_template_designer import build_design_record_values
from odoo_common.report_upserts import PaperformatSpec, ReportActionSpec
from odoo_common.text_templates import render_template_file
from odoo_common.view_upserts import QWebTemplateSpec, QWebViewSpec


REPORT_TEMPLATE_BUILDER_SCHEMA_VERSION = "odoo_common.report_template_builder.v1"

BandRole = Literal[
    "preview_toolbar",
    "pdf_header",
    "body",
    "line_table",
    "totals",
    "terms",
    "notes",
    "signature",
    "pdf_footer",
]

_SECTION_RE = re.compile(r"^(?P<number>\d+)\.\s+(?P<title>.+)$")
_CLAUSE_RE = re.compile(r"^(?P<number>\d+\.\d+)\s+(?P<body>.+)$")


def _clean_required_text(value: Any, *, field_name: str) -> str:
    clean_value = str(value or "").strip()
    if not clean_value:
        raise ValueError(f"Report template builder {field_name} is required")
    return clean_value


def _clean_optional_text(value: Any) -> str:
    return str(value or "").strip()


def _normalize_sequence(values: Sequence[Any] | None) -> tuple[Any, ...]:
    if values is None:
        return tuple()
    if isinstance(values, (str, bytes)) or not isinstance(values, Sequence):
        raise TypeError("Report template builder sequence values must be explicit sequences")
    return tuple(values)


def _normalize_mapping(value: Mapping[str, Any] | None) -> dict[str, Any]:
    if value is None:
        return {}
    if not isinstance(value, Mapping):
        raise TypeError("Report template builder mapping values must be mappings")
    normalized = dict(value)
    for key in normalized:
        _clean_required_text(key, field_name="mapping key")
    return normalized


def _normalize_class_prefix(value: Any) -> str:
    prefix = _clean_required_text(value, field_name="class_prefix")
    if not re.fullmatch(r"[A-Za-z][A-Za-z0-9_-]*", prefix):
        raise ValueError(f"Report template builder class_prefix is invalid: {prefix!r}")
    return prefix


def _normalize_template_key(value: Any) -> str:
    key = _clean_required_text(value, field_name="template key")
    if not re.fullmatch(r"[A-Za-z0-9_.-]+", key):
        raise ValueError(f"Report template builder template key is invalid: {key!r}")
    return key


def _qweb_string_literal(value: str) -> str:
    return "'" + str(value or "").replace("\\", "\\\\").replace("'", "\\'") + "'"


def _attrs_to_html(attrs: Mapping[str, Any]) -> str:
    parts: list[str] = []
    for key, value in attrs.items():
        clean_key = _clean_required_text(key, field_name="HTML attribute")
        clean_value = str(value)
        parts.append(f'{clean_key}="{escape(clean_value, quote=True)}"')
    return (" " + " ".join(parts)) if parts else ""


@dataclass(frozen=True)
class ReportTemplateSourceSpec:
    """Declare one imported designer source and optional sample XML payloads."""

    jrxml_path: str | Path
    code: str
    name: str
    document_family: str = ""
    sample_xml_paths: Sequence[str | Path] = ()
    extra_record_values: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        object.__setattr__(self, "jrxml_path", Path(self.jrxml_path))
        object.__setattr__(self, "code", _clean_required_text(self.code, field_name="source code"))
        object.__setattr__(self, "name", _clean_required_text(self.name, field_name="source name"))
        object.__setattr__(self, "document_family", _clean_optional_text(self.document_family))
        object.__setattr__(self, "sample_xml_paths", tuple(Path(path) for path in _normalize_sequence(self.sample_xml_paths)))
        object.__setattr__(self, "extra_record_values", _normalize_mapping(self.extra_record_values))


@dataclass(frozen=True)
class TemplateRegistryEntry:
    """Declare one reusable text template file and token replacements."""

    key: str
    filename: str
    replacements: Mapping[str, Any] = field(default_factory=dict)
    require_all_tokens: bool = True

    def __post_init__(self) -> None:
        object.__setattr__(self, "key", _clean_required_text(self.key, field_name="registry key"))
        object.__setattr__(self, "filename", _clean_required_text(self.filename, field_name="registry filename"))
        object.__setattr__(self, "replacements", _normalize_mapping(self.replacements))
        object.__setattr__(self, "require_all_tokens", bool(self.require_all_tokens))


@dataclass(frozen=True)
class ReportTemplateBandSpec:
    """Declare one visual/report band in neutral order."""

    key: str
    label: str
    role: BandRole = "body"
    sequence: int = 100
    qweb: str = ""
    html: str = ""
    reserved_mm: float = 0.0
    visible: bool = True
    collapse_when_empty: bool = True
    metadata: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        object.__setattr__(self, "key", _clean_required_text(self.key, field_name="band key"))
        object.__setattr__(self, "label", _clean_required_text(self.label, field_name="band label"))
        object.__setattr__(self, "role", _clean_required_text(self.role, field_name="band role"))
        object.__setattr__(self, "sequence", int(self.sequence))
        object.__setattr__(self, "qweb", _clean_optional_text(self.qweb))
        object.__setattr__(self, "html", _clean_optional_text(self.html))
        object.__setattr__(self, "reserved_mm", float(self.reserved_mm))
        object.__setattr__(self, "visible", bool(self.visible))
        object.__setattr__(self, "collapse_when_empty", bool(self.collapse_when_empty))
        object.__setattr__(self, "metadata", _normalize_mapping(self.metadata))
        if self.role not in BandRole.__args__:  # type: ignore[attr-defined]
            raise ValueError(f"Unsupported report band role: {self.role!r}")


@dataclass(frozen=True)
class PreviewToolbarSpec:
    """Declare web-preview toolbar content and actions."""

    title: str
    reference: str = ""
    brand: str = ""
    actions: Sequence[str] = ("back", "theme", "print", "pdf")
    class_prefix: str = "oc_report"

    def __post_init__(self) -> None:
        object.__setattr__(self, "title", _clean_required_text(self.title, field_name="toolbar title"))
        object.__setattr__(self, "reference", _clean_optional_text(self.reference))
        object.__setattr__(self, "brand", _clean_optional_text(self.brand))
        object.__setattr__(self, "actions", tuple(_clean_required_text(action, field_name="toolbar action") for action in _normalize_sequence(self.actions)))
        object.__setattr__(self, "class_prefix", _normalize_class_prefix(self.class_prefix))


@dataclass(frozen=True)
class TermsDocumentSpec:
    """Declare safe legal/notes text rendering."""

    source_text: str
    title: str = "Terms and conditions"
    class_prefix: str = "oc_report_terms"
    empty_message: str = "Terms unavailable."

    def __post_init__(self) -> None:
        object.__setattr__(self, "source_text", str(self.source_text or ""))
        object.__setattr__(self, "title", _clean_optional_text(self.title))
        object.__setattr__(self, "class_prefix", _normalize_class_prefix(self.class_prefix))
        object.__setattr__(self, "empty_message", _clean_required_text(self.empty_message, field_name="empty message"))


@dataclass(frozen=True)
class ReservedPdfLayoutSpec:
    """Declare a wkhtmltopdf-safe external layout with reserved PDF bands."""

    template_key: str
    template_name: str
    model_names: Sequence[str] = ()
    class_prefix: str = "oc_report"
    header_height_mm: float = 52.0
    footer_height_mm: float = 12.0
    title_variable: str = "oc_report_document_title"
    reference_variable: str = "oc_report_document_ref"

    def __post_init__(self) -> None:
        object.__setattr__(self, "template_key", _normalize_template_key(self.template_key))
        object.__setattr__(self, "template_name", _clean_required_text(self.template_name, field_name="layout template name"))
        object.__setattr__(self, "model_names", tuple(_clean_required_text(name, field_name="layout model name") for name in _normalize_sequence(self.model_names)))
        object.__setattr__(self, "class_prefix", _normalize_class_prefix(self.class_prefix))
        object.__setattr__(self, "header_height_mm", float(self.header_height_mm))
        object.__setattr__(self, "footer_height_mm", float(self.footer_height_mm))
        object.__setattr__(self, "title_variable", _clean_required_text(self.title_variable, field_name="title variable"))
        object.__setattr__(self, "reference_variable", _clean_required_text(self.reference_variable, field_name="reference variable"))


@dataclass(frozen=True)
class ReportTemplatePublicationSpec:
    """Declare QWeb/report publication specs without live IDs."""

    target_model: str
    qweb_template_key: str
    qweb_template_name: str
    report_action_name: str
    report_name: str = ""
    report_file: str = ""
    print_report_name: str = ""
    paperformat: PaperformatSpec | None = None
    binding_model_id: int = 0
    paperformat_id: int = 0
    class_prefix: str = "oc_report"
    extra_report_action_values: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        object.__setattr__(self, "target_model", _clean_required_text(self.target_model, field_name="target model"))
        object.__setattr__(self, "qweb_template_key", _normalize_template_key(self.qweb_template_key))
        object.__setattr__(self, "qweb_template_name", _clean_required_text(self.qweb_template_name, field_name="QWeb template name"))
        object.__setattr__(self, "report_action_name", _clean_required_text(self.report_action_name, field_name="report action name"))
        object.__setattr__(self, "report_name", _clean_optional_text(self.report_name) or self.qweb_template_key)
        object.__setattr__(self, "report_file", _clean_optional_text(self.report_file) or self.report_name)
        object.__setattr__(self, "print_report_name", _clean_optional_text(self.print_report_name))
        object.__setattr__(self, "binding_model_id", int(self.binding_model_id or 0))
        object.__setattr__(self, "paperformat_id", int(self.paperformat_id or 0))
        object.__setattr__(self, "class_prefix", _normalize_class_prefix(self.class_prefix))
        object.__setattr__(self, "extra_report_action_values", _normalize_mapping(self.extra_report_action_values))


@dataclass(frozen=True)
class ReportTemplateBuildPlan:
    """Pure plan returned by the builder; callers choose how to publish it."""

    schema_version: str
    design_record_specs: tuple[RecordUpsertSpec, ...] = ()
    qweb_template_specs: tuple[QWebTemplateSpec, ...] = ()
    qweb_view_specs: tuple[QWebViewSpec, ...] = ()
    paperformat_specs: tuple[PaperformatSpec, ...] = ()
    report_action_specs: tuple[ReportActionSpec, ...] = ()
    bands: tuple[ReportTemplateBandSpec, ...] = ()
    warnings: tuple[str, ...] = ()
    metadata: Mapping[str, Any] = field(default_factory=dict)


def render_template_registry(
    templates_dir: str | Path,
    entries: Sequence[TemplateRegistryEntry | Mapping[str, Any]],
) -> dict[str, str]:
    """Render a declared text-template registry using strict common helpers."""
    rendered: dict[str, str] = {}
    for entry_value in entries:
        entry = entry_value if isinstance(entry_value, TemplateRegistryEntry) else TemplateRegistryEntry(**dict(entry_value))
        if entry.key in rendered:
            raise ValueError(f"Duplicate report template registry key: {entry.key!r}")
        rendered[entry.key] = render_template_file(
            templates_dir,
            entry.filename,
            entry.replacements,
            require_all_tokens=entry.require_all_tokens,
        )
    return rendered


def render_terms_html(spec: TermsDocumentSpec | Mapping[str, Any]) -> str:
    """Render plain legal/notes text into escaped HTML sections and clauses."""
    normalized = spec if isinstance(spec, TermsDocumentSpec) else TermsDocumentSpec(**dict(spec))
    class_prefix = normalized.class_prefix
    lines = [line.strip() for line in normalized.source_text.splitlines()]
    if not any(lines):
        return (
            f'<div class="{class_prefix}-content">'
            f'<p class="{class_prefix}-paragraph">{escape(normalized.empty_message)}</p>'
            "</div>"
        )

    blocks: list[str] = []
    paragraph_lines: list[str] = []
    clause_number = ""
    clause_lines: list[str] = []
    list_items: list[str] = []

    def normalize_inline(parts: Sequence[str]) -> str:
        return " ".join(part.strip() for part in parts if str(part or "").strip())

    def flush_paragraph() -> None:
        nonlocal paragraph_lines
        if paragraph_lines:
            blocks.append(f'<p class="{class_prefix}-paragraph">{escape(normalize_inline(paragraph_lines))}</p>')
            paragraph_lines = []

    def flush_clause() -> None:
        nonlocal clause_number, clause_lines
        if clause_number:
            blocks.append(
                f'<p class="{class_prefix}-clause">'
                f'<span class="{class_prefix}-clause-number">{escape(clause_number)}</span> '
                f'<span class="{class_prefix}-clause-body">{escape(normalize_inline(clause_lines))}</span>'
                "</p>"
            )
            clause_number = ""
            clause_lines = []

    def flush_list() -> None:
        nonlocal list_items
        if list_items:
            blocks.append(
                f'<ul class="{class_prefix}-list">'
                + "".join(f"<li>{escape(item)}</li>" for item in list_items)
                + "</ul>"
            )
            list_items = []

    if normalized.title:
        blocks.append(f'<h4 class="{class_prefix}-title">{escape(normalized.title)}</h4>')

    for line in lines:
        if not line:
            flush_clause()
            flush_paragraph()
            flush_list()
            continue

        section_match = _SECTION_RE.match(line)
        if section_match and not _CLAUSE_RE.match(line):
            flush_clause()
            flush_paragraph()
            flush_list()
            blocks.append(f'<h5 class="{class_prefix}-section">{escape(line)}</h5>')
            continue

        clause_match = _CLAUSE_RE.match(line)
        if clause_match:
            flush_clause()
            flush_paragraph()
            flush_list()
            clause_number = clause_match.group("number")
            clause_lines = [clause_match.group("body")]
            continue

        if line.startswith("- "):
            flush_clause()
            flush_paragraph()
            list_items.append(line[2:].strip())
            continue

        if list_items:
            flush_list()
        if clause_number:
            clause_lines.append(line)
        else:
            paragraph_lines.append(line)

    flush_clause()
    flush_paragraph()
    flush_list()
    return f'<div class="{class_prefix}-content">' + "".join(blocks) + "</div>"


def render_preview_toolbar(spec: PreviewToolbarSpec | Mapping[str, Any]) -> str:
    """Render a generic web-preview toolbar fragment."""
    normalized = spec if isinstance(spec, PreviewToolbarSpec) else PreviewToolbarSpec(**dict(spec))
    prefix = normalized.class_prefix
    actions = []
    action_labels = {
        "back": "Back",
        "theme": "Theme",
        "print": "Print",
        "pdf": "Export PDF",
        "sample": "Sample record",
        "validate": "Validate",
    }
    for action in normalized.actions:
        label = action_labels.get(action, action.replace("_", " ").title())
        attrs = {
            "type": "button",
            "class": f"{prefix}-toolbar-action {prefix}-toolbar-action-{action}",
            f"data-{prefix.replace('_', '-')}-action": action,
            "aria-label": label,
            "title": label,
        }
        actions.append(f"<button{_attrs_to_html(attrs)}>{escape(label)}</button>")
    brand = f'<span class="{prefix}-toolbar-mark">{escape(normalized.brand)}</span>' if normalized.brand else ""
    return (
        f'<div class="{prefix}-toolbar" data-{prefix.replace("_", "-")}-toolbar="1">'
        f'<div class="{prefix}-toolbar-left">{brand}'
        f'<div class="{prefix}-toolbar-copy">'
        f'<div class="{prefix}-toolbar-title">{escape(normalized.title)}</div>'
        f'<div class="{prefix}-toolbar-ref">{escape(normalized.reference)}</div>'
        "</div></div>"
        f'<div class="{prefix}-toolbar-actions">{"".join(actions)}</div>'
        "</div>"
    )


def build_design_record_specs(
    sources: Sequence[ReportTemplateSourceSpec | Mapping[str, Any]],
) -> tuple[RecordUpsertSpec, ...]:
    """Build generic record upsert specs for imported designer records."""
    specs: list[RecordUpsertSpec] = []
    for source_value in sources:
        source = source_value if isinstance(source_value, ReportTemplateSourceSpec) else ReportTemplateSourceSpec(**dict(source_value))
        values = build_design_record_values(
            source.jrxml_path,
            sample_xml_paths=source.sample_xml_paths,
            code=source.code,
            name=source.name,
            document_family=source.document_family,
        )
        values.update(source.extra_record_values)
        specs.append(
            RecordUpsertSpec(
                "x_odoo_report_design",
                (("x_code", "=", source.code),),
                values,
            )
        )
    return tuple(specs)


def build_report_qweb_arch(
    publication: ReportTemplatePublicationSpec | Mapping[str, Any],
    bands: Sequence[ReportTemplateBandSpec | Mapping[str, Any]] = (),
    *,
    toolbar: PreviewToolbarSpec | Mapping[str, Any] | None = None,
    terms: TermsDocumentSpec | Mapping[str, Any] | None = None,
) -> str:
    """Build a neutral QWeb template arch from ordered bands."""
    normalized_publication = publication if isinstance(publication, ReportTemplatePublicationSpec) else ReportTemplatePublicationSpec(**dict(publication))
    normalized_bands = sorted(
        (
            band_value if isinstance(band_value, ReportTemplateBandSpec) else ReportTemplateBandSpec(**dict(band_value))
            for band_value in bands
        ),
        key=lambda band: (band.sequence, band.key),
    )
    prefix = normalized_publication.class_prefix
    parts: list[str] = [
        f'<t t-name="{escape(normalized_publication.qweb_template_key, quote=True)}">',
        f'  <div class="{prefix} {prefix}-{escape(normalized_publication.target_model.replace(".", "-"), quote=True)}">',
    ]
    if toolbar is not None:
        parts.extend(
            [
                "    <t t-if=\"report_type != 'pdf'\">",
                "      " + render_preview_toolbar(toolbar),
                "    </t>",
            ]
        )
    for band in normalized_bands:
        if not band.visible:
            continue
        content = band.qweb or band.html
        if not content:
            continue
        parts.append(
            f'    <section class="{prefix}-band {prefix}-band-{escape(band.role, quote=True)}" '
            f'data-report-band="{escape(band.key, quote=True)}">'
        )
        parts.append(content)
        parts.append("    </section>")
    if terms is not None:
        parts.append(
            f'    <section class="{prefix}-band {prefix}-band-terms" data-report-band="terms">'
        )
        parts.append(render_terms_html(terms))
        parts.append("    </section>")
    parts.extend(["  </div>", "</t>"])
    return "\n".join(parts)


def build_qweb_template_specs(
    publication: ReportTemplatePublicationSpec | Mapping[str, Any],
    bands: Sequence[ReportTemplateBandSpec | Mapping[str, Any]] = (),
    *,
    toolbar: PreviewToolbarSpec | Mapping[str, Any] | None = None,
    terms: TermsDocumentSpec | Mapping[str, Any] | None = None,
) -> tuple[QWebTemplateSpec, ...]:
    """Build keyed QWeb template specs from neutral bands."""
    normalized = publication if isinstance(publication, ReportTemplatePublicationSpec) else ReportTemplatePublicationSpec(**dict(publication))
    return (
        QWebTemplateSpec(
            name=normalized.qweb_template_name,
            key=normalized.qweb_template_key,
            arch_db=build_report_qweb_arch(normalized, bands, toolbar=toolbar, terms=terms),
        ),
    )


def build_reserved_pdf_layout_arch(spec: ReservedPdfLayoutSpec | Mapping[str, Any]) -> str:
    """Build a generic external layout with reserved PDF header/footer bands."""
    normalized = spec if isinstance(spec, ReservedPdfLayoutSpec) else ReservedPdfLayoutSpec(**dict(spec))
    prefix = normalized.class_prefix
    model_filter = "True"
    if normalized.model_names:
        quoted_models = ", ".join(_qweb_string_literal(name) for name in normalized.model_names)
        model_filter = f"oc_model_name in [{quoted_models}]"
    return f"""<t t-name="{escape(normalized.template_key, quote=True)}">
    <t t-set="oc_model_name" t-value="(o and o._name) or (doc and doc._name) or ''"/>
    <t t-set="oc_report_type" t-value="report_type or ((o and o.env.context.get('report_type')) or (doc and doc.env.context.get('report_type')) or '')"/>
    <t t-set="oc_uses_reserved_pdf_bands" t-value="oc_report_type == 'pdf' and ({model_filter})"/>
    <div t-if="oc_uses_reserved_pdf_bands" t-attf-class="header o_company_#{{company.id}}_layout {prefix}-pdf-header">
        <style>
            html, body{{margin:0 !important;padding:0 !important;}}
            .{prefix}-pdf-header-shell{{box-sizing:border-box;height:{normalized.header_height_mm:g}mm;overflow:hidden;padding:4mm 8mm 0;font-family:Helvetica,Arial,sans-serif;}}
            .{prefix}-pdf-header-table{{width:100%;border-collapse:collapse;table-layout:fixed;}}
            .{prefix}-pdf-header-logo{{width:34%;vertical-align:top;}}
            .{prefix}-pdf-header-logo img{{max-width:60mm;max-height:20mm;}}
            .{prefix}-pdf-header-meta{{text-align:right;vertical-align:top;font-size:9px;line-height:1.35;color:#334155;}}
            .{prefix}-pdf-header-title{{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#1f2937;}}
            .{prefix}-pdf-header-ref{{font-size:10px;font-weight:700;text-align:right;color:#1f2937;}}
            .{prefix}-pdf-footer-shell{{box-sizing:border-box;height:{normalized.footer_height_mm:g}mm;padding:2mm 4mm 0;border-top:1px solid #dbe4f0;font-family:Helvetica,Arial,sans-serif;font-size:9px;color:#64748b;}}
        </style>
        <div class="{prefix}-pdf-header-shell">
            <table class="{prefix}-pdf-header-table"><tr>
                <td class="{prefix}-pdf-header-logo"><img t-if="company.logo" t-att-src="image_data_uri(company.logo)" alt="Logo"/></td>
                <td class="{prefix}-pdf-header-meta">
                    <div t-field="company.name"/>
                    <div><t t-call="web.company_address_list"/></div>
                </td>
            </tr></table>
            <table class="{prefix}-pdf-header-table"><tr>
                <td class="{prefix}-pdf-header-title"><span t-out="{normalized.title_variable} or ''"/></td>
                <td class="{prefix}-pdf-header-ref"><span t-out="{normalized.reference_variable} or ''"/></td>
            </tr></table>
        </div>
    </div>
    <t t-call="web.external_layout_body" snail_mail_compatible="True">
        <t t-out="0"/>
    </t>
    <div t-if="oc_uses_reserved_pdf_bands" t-attf-class="footer o_company_#{{company.id}}_layout {prefix}-pdf-footer">
        <div class="{prefix}-pdf-footer-shell">
            <table style="width:100%;border-collapse:collapse;table-layout:fixed;"><tr>
                <td style="width:72%;text-align:left;"><div t-if="company.report_footer" t-field="company.report_footer"/></td>
                <td style="width:28%;text-align:right;font-weight:600;">Page <span class="page"/> of <span class="topage"/></td>
            </tr></table>
        </div>
    </div>
</t>"""


def build_reserved_pdf_layout_template_spec(
    spec: ReservedPdfLayoutSpec | Mapping[str, Any],
) -> QWebTemplateSpec:
    """Build one keyed QWeb external-layout template spec."""
    normalized = spec if isinstance(spec, ReservedPdfLayoutSpec) else ReservedPdfLayoutSpec(**dict(spec))
    return QWebTemplateSpec(
        name=normalized.template_name,
        key=normalized.template_key,
        arch_db=build_reserved_pdf_layout_arch(normalized),
    )


def build_report_action_specs(
    publication: ReportTemplatePublicationSpec | Mapping[str, Any],
) -> tuple[ReportActionSpec, ...]:
    """Build report action specs without resolving live model/paperformat IDs."""
    normalized = publication if isinstance(publication, ReportTemplatePublicationSpec) else ReportTemplatePublicationSpec(**dict(publication))
    return (
        ReportActionSpec(
            name=normalized.report_action_name,
            model_name=normalized.target_model,
            report_name=normalized.report_name,
            report_file=normalized.report_file,
            print_report_name=normalized.print_report_name,
            binding_model_id=normalized.binding_model_id,
            paperformat_id=normalized.paperformat_id,
            extra_values=normalized.extra_report_action_values,
        ),
    )


def build_report_template_plan(
    *,
    sources: Sequence[ReportTemplateSourceSpec | Mapping[str, Any]] = (),
    publication: ReportTemplatePublicationSpec | Mapping[str, Any] | None = None,
    bands: Sequence[ReportTemplateBandSpec | Mapping[str, Any]] = (),
    toolbar: PreviewToolbarSpec | Mapping[str, Any] | None = None,
    terms: TermsDocumentSpec | Mapping[str, Any] | None = None,
    reserved_layout: ReservedPdfLayoutSpec | Mapping[str, Any] | None = None,
    metadata: Mapping[str, Any] | None = None,
) -> ReportTemplateBuildPlan:
    """Build a pure publication plan for a neutral report template."""
    normalized_bands = tuple(
        band_value if isinstance(band_value, ReportTemplateBandSpec) else ReportTemplateBandSpec(**dict(band_value))
        for band_value in bands
    )
    qweb_template_specs: tuple[QWebTemplateSpec, ...] = ()
    report_action_specs: tuple[ReportActionSpec, ...] = ()
    paperformat_specs: tuple[PaperformatSpec, ...] = ()
    warnings: list[str] = []
    if publication is not None:
        normalized_publication = publication if isinstance(publication, ReportTemplatePublicationSpec) else ReportTemplatePublicationSpec(**dict(publication))
        qweb_template_specs = build_qweb_template_specs(normalized_publication, normalized_bands, toolbar=toolbar, terms=terms)
        report_action_specs = build_report_action_specs(normalized_publication)
        if normalized_publication.paperformat is not None:
            paperformat_specs = (normalized_publication.paperformat,)
        if normalized_publication.paperformat is not None and normalized_publication.paperformat_id:
            warnings.append("Publication declares both paperformat and paperformat_id; caller must decide publish/order policy.")

    qweb_view_specs: list[QWebViewSpec] = []
    if reserved_layout is not None:
        qweb_view_specs.append(
            QWebViewSpec(
                name=(
                    reserved_layout.template_name
                    if isinstance(reserved_layout, ReservedPdfLayoutSpec)
                    else str(dict(reserved_layout).get("template_name") or "")
                ),
                key=(
                    reserved_layout.template_key
                    if isinstance(reserved_layout, ReservedPdfLayoutSpec)
                    else str(dict(reserved_layout).get("template_key") or "")
                ),
                arch_db=build_reserved_pdf_layout_arch(reserved_layout),
                mode="primary",
            )
        )

    return ReportTemplateBuildPlan(
        schema_version=REPORT_TEMPLATE_BUILDER_SCHEMA_VERSION,
        design_record_specs=build_design_record_specs(sources),
        qweb_template_specs=qweb_template_specs,
        qweb_view_specs=tuple(qweb_view_specs),
        paperformat_specs=paperformat_specs,
        report_action_specs=report_action_specs,
        bands=tuple(sorted(normalized_bands, key=lambda band: (band.sequence, band.key))),
        warnings=tuple(warnings),
        metadata=_normalize_mapping(metadata),
    )
