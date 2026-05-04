"""Canonical helpers for Odoo report upserts."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Mapping, Protocol, Sequence, runtime_checkable


PAPERFORMAT_RESERVED_EXTRA_KEYS = frozenset(
    {
        "name",
        "format",
        "orientation",
        "margin_top",
        "margin_bottom",
        "margin_left",
        "margin_right",
        "header_spacing",
        "header_line",
        "dpi",
        "disable_shrinking",
        "css_margins",
        "default",
    }
)
LAYOUT_RESERVED_EXTRA_KEYS = frozenset({"name", "view_id", "sequence", "image", "pdf"})
ACTION_RESERVED_EXTRA_KEYS = frozenset(
    {
        "name",
        "model",
        "report_type",
        "report_name",
        "report_file",
        "print_report_name",
        "binding_model_id",
        "binding_type",
        "paperformat_id",
    }
)


@runtime_checkable
class ReportUpsertConnection(Protocol):
    """Minimal Odoo RPC contract required by report upserts."""

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
        raise ValueError(f"Report {field_name} is required")
    return clean_value


def _clean_extra_values(
    values: Mapping[str, Any],
    *,
    reserved_keys: frozenset[str],
) -> dict[str, Any]:
    normalized = dict(values or {})
    reserved_used = sorted(key for key in normalized if key in reserved_keys)
    if reserved_used:
        raise ValueError(f"Report extra_values cannot override reserved keys: {', '.join(reserved_used)}")
    return normalized


@dataclass(frozen=True)
class PaperformatSpec:
    """Declare one `report.paperformat` row."""

    name: str
    format: str = "A4"
    orientation: str = "Portrait"
    margin_top: float = 0.0
    margin_bottom: float = 0.0
    margin_left: float = 0.0
    margin_right: float = 0.0
    header_spacing: float = 0.0
    header_line: bool = False
    dpi: int = 90
    disable_shrinking: bool = False
    css_margins: bool = False
    default: bool = False
    extra_values: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        object.__setattr__(self, "name", _clean_required_text(self.name, field_name="paperformat name"))
        object.__setattr__(self, "format", _clean_required_text(self.format, field_name="format"))
        object.__setattr__(self, "orientation", _clean_required_text(self.orientation, field_name="orientation"))
        object.__setattr__(self, "margin_top", float(self.margin_top))
        object.__setattr__(self, "margin_bottom", float(self.margin_bottom))
        object.__setattr__(self, "margin_left", float(self.margin_left))
        object.__setattr__(self, "margin_right", float(self.margin_right))
        object.__setattr__(self, "header_spacing", float(self.header_spacing))
        object.__setattr__(self, "header_line", bool(self.header_line))
        object.__setattr__(self, "dpi", int(self.dpi))
        object.__setattr__(self, "disable_shrinking", bool(self.disable_shrinking))
        object.__setattr__(self, "css_margins", bool(self.css_margins))
        object.__setattr__(self, "default", bool(self.default))
        object.__setattr__(
            self,
            "extra_values",
            _clean_extra_values(self.extra_values, reserved_keys=PAPERFORMAT_RESERVED_EXTRA_KEYS),
        )


@dataclass(frozen=True)
class ReportLayoutSpec:
    """Declare one `report.layout` row."""

    name: str
    view_id: int
    sequence: int = 50
    image: Any = None
    pdf: Any = None
    extra_values: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        object.__setattr__(self, "name", _clean_required_text(self.name, field_name="layout name"))
        object.__setattr__(self, "view_id", _required_record_id(self.view_id, context=f"report.layout {self.name} view"))
        object.__setattr__(self, "sequence", int(self.sequence))
        object.__setattr__(
            self,
            "extra_values",
            _clean_extra_values(self.extra_values, reserved_keys=LAYOUT_RESERVED_EXTRA_KEYS),
        )


@dataclass(frozen=True)
class ReportActionSpec:
    """Declare one `ir.actions.report` row."""

    name: str
    model_name: str
    report_name: str
    report_type: str = "qweb-pdf"
    report_file: str = ""
    print_report_name: str = ""
    binding_model_id: int = 0
    binding_type: str = "report"
    paperformat_id: int = 0
    extra_values: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        object.__setattr__(self, "name", _clean_required_text(self.name, field_name="action name"))
        object.__setattr__(self, "model_name", _clean_required_text(self.model_name, field_name="model_name"))
        object.__setattr__(self, "report_name", _clean_required_text(self.report_name, field_name="report_name"))
        object.__setattr__(self, "report_type", _clean_required_text(self.report_type, field_name="report_type"))
        object.__setattr__(self, "report_file", str(self.report_file or "").strip())
        object.__setattr__(self, "print_report_name", str(self.print_report_name or "").strip())
        object.__setattr__(self, "binding_model_id", _record_id(self.binding_model_id))
        object.__setattr__(self, "binding_type", _clean_required_text(self.binding_type, field_name="binding_type"))
        object.__setattr__(self, "paperformat_id", _record_id(self.paperformat_id))
        object.__setattr__(
            self,
            "extra_values",
            _clean_extra_values(self.extra_values, reserved_keys=ACTION_RESERVED_EXTRA_KEYS),
        )


def upsert_paperformat(conn: ReportUpsertConnection, spec: PaperformatSpec) -> int:
    """Create or update one `report.paperformat` row by exact name."""
    normalized = spec if isinstance(spec, PaperformatSpec) else PaperformatSpec(**dict(spec))
    values = {
        "name": normalized.name,
        "format": normalized.format,
        "orientation": normalized.orientation,
        "margin_top": normalized.margin_top,
        "margin_bottom": normalized.margin_bottom,
        "margin_left": normalized.margin_left,
        "margin_right": normalized.margin_right,
        "header_spacing": normalized.header_spacing,
        "header_line": normalized.header_line,
        "dpi": normalized.dpi,
        "disable_shrinking": normalized.disable_shrinking,
        "css_margins": normalized.css_margins,
        "default": normalized.default,
        **dict(normalized.extra_values),
    }
    existing_ids = conn.search("report.paperformat", [("name", "=", normalized.name)], limit=1)
    if existing_ids:
        paperformat_id = _required_record_id(existing_ids[0], context=f"report.paperformat {normalized.name}")
        conn.write("report.paperformat", [paperformat_id], values)
        return paperformat_id
    return _required_record_id(conn.create("report.paperformat", values), context=f"created report.paperformat {normalized.name}")


def upsert_report_layout(conn: ReportUpsertConnection, spec: ReportLayoutSpec) -> int:
    """Create or update one `report.layout` row by exact name."""
    normalized = spec if isinstance(spec, ReportLayoutSpec) else ReportLayoutSpec(**dict(spec))
    values: dict[str, Any] = {
        "name": normalized.name,
        "view_id": normalized.view_id,
        "sequence": normalized.sequence,
        **dict(normalized.extra_values),
    }
    if normalized.image is not None:
        values["image"] = normalized.image
    if normalized.pdf is not None:
        values["pdf"] = normalized.pdf
    existing_ids = conn.search("report.layout", [("name", "=", normalized.name)], limit=1)
    if existing_ids:
        layout_id = _required_record_id(existing_ids[0], context=f"report.layout {normalized.name}")
        conn.write("report.layout", [layout_id], values)
        return layout_id
    return _required_record_id(conn.create("report.layout", values), context=f"created report.layout {normalized.name}")


def upsert_report_action(conn: ReportUpsertConnection, spec: ReportActionSpec) -> int:
    """Create or update one `ir.actions.report` row by exact report/model."""
    normalized = spec if isinstance(spec, ReportActionSpec) else ReportActionSpec(**dict(spec))
    values: dict[str, Any] = {
        "name": normalized.name,
        "model": normalized.model_name,
        "report_type": normalized.report_type,
        "report_name": normalized.report_name,
        "report_file": normalized.report_file or normalized.report_name,
        "binding_model_id": normalized.binding_model_id or False,
        "binding_type": normalized.binding_type,
        "paperformat_id": normalized.paperformat_id or False,
        **dict(normalized.extra_values),
    }
    if normalized.print_report_name:
        values["print_report_name"] = normalized.print_report_name
    existing_ids = conn.search(
        "ir.actions.report",
        [
            ("report_name", "=", normalized.report_name),
            ("model", "=", normalized.model_name),
        ],
        limit=1,
    )
    if existing_ids:
        action_id = _required_record_id(existing_ids[0], context=f"ir.actions.report {normalized.report_name}")
        conn.write("ir.actions.report", [action_id], values)
        return action_id
    return _required_record_id(conn.create("ir.actions.report", values), context=f"created ir.actions.report {normalized.report_name}")


def _record_id(value: Any) -> int:
    if isinstance(value, Mapping):
        return _record_id(value.get("id"))
    if isinstance(value, (list, tuple)) and value:
        return _record_id(value[0])
    return int(value or 0)


def _required_record_id(value: Any, *, context: str) -> int:
    record_id = _record_id(value)
    if record_id <= 0:
        raise RuntimeError(f"Report upsert did not receive a valid ID for {context}")
    return record_id
