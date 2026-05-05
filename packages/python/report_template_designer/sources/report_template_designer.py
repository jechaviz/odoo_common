"""Reusable report-template designer contracts and importers.

The module intentionally converts legacy designer files into a neutral
blueprint instead of executing their expressions.  Consumers can store the
blueprint in Odoo, render a safe preview, and progressively map expressions to
QWeb, Python, or another trusted renderer.
"""

from __future__ import annotations

import base64
from dataclasses import dataclass, field
from decimal import Decimal, ROUND_HALF_UP
import html
import json
import re
from pathlib import Path
import xml.etree.ElementTree as ET
from typing import Any, Mapping, Sequence
from urllib.parse import urlencode


JRXML_NAMESPACE = "http://jasperreports.sourceforge.net/jasperreports"
JR = f"{{{JRXML_NAMESPACE}}}"
REPORT_DESIGNER_SCHEMA_VERSION = "odoo_common.report_template_designer.v1"
SAT_CFDI_VERIFICATION_URL = "https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx"
CFDI_FIELD_FALLBACK_PATHS: dict[str, tuple[str, ...]] = {
    "uuid": ("TimbreFiscalDigital/@UUID",),
    "rfcemisor": ("Emisor/@Rfc", "Emisor/@rfc"),
    "rfcreceptor": ("Receptor/@Rfc", "Receptor/@rfc"),
    "sellocfd": ("TimbreFiscalDigital/@SelloCFD", "TimbreFiscalDigital/@selloCFD", "@Sello", "@sello"),
    "totalcfdi": ("@Total", "@total"),
}
CFDI_DOC_LABELS: dict[str, dict[str, str]] = {
    "PYMNT": {"es": "RECIBO DE PAGO", "en": "PAYMENT RECEIPT"},
    "ZMN3": {"es": "NOTA DE CARGO", "en": "PRESS OFFICE"},
    "ZML2": {"es": "NOTA DE CARGO", "en": "PRESS OFFICE"},
    "ZMF2": {"es": "FACTURA", "en": "INVOICE"},
    "ZMN1": {"es": "FACTURA", "en": "INVOICE"},
    "ZMF5": {"es": "FACTURA", "en": "INVOICE"},
    "ZMF8": {"es": "FACTURA", "en": "INVOICE"},
    "ZMG2": {"es": "NOTA DE CREDITO", "en": "CREDIT NOTE"},
    "ZMN2": {"es": "NOTA DE CREDITO", "en": "CREDIT NOTE"},
    "ZMR8": {"es": "NOTA DE CREDITO", "en": "CREDIT NOTE"},
    "ZMR2": {"es": "NOTA DE CREDITO", "en": "CREDIT NOTE"},
}
CFDI_TYPE_LABELS: dict[str, dict[str, str]] = {
    "I": {"es": "FACTURA", "en": "INVOICE"},
    "E": {"es": "NOTA DE CREDITO", "en": "CREDIT NOTE"},
    "T": {"es": "COMPROBANTE DE TRASLADO", "en": "TRANSFER RECEIPT"},
    "P": {"es": "RECIBO DE PAGO", "en": "PAYMENT RECEIPT"},
    "N": {"es": "RECIBO DE NOMINA", "en": "PAYROLL RECEIPT"},
}
IMAGE_MIME_TYPES = {
    ".gif": "image/gif",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
}


def _local_name(tag: str) -> str:
    return str(tag or "").split("}", 1)[-1]


def _node_text(node: ET.Element | None) -> str:
    if node is None:
        return ""
    return "".join(node.itertext()).strip()


def _int_attr(node: ET.Element, name: str, default: int = 0) -> int:
    raw_value = str(node.get(name) or "").strip()
    if not raw_value:
        return default
    try:
        return int(float(raw_value))
    except ValueError:
        return default


def _clean_text(value: Any) -> str:
    return str(value or "").replace("\r\n", "\n").replace("\r", "\n").strip()


def _first_child(node: ET.Element, child_name: str) -> ET.Element | None:
    for child in list(node):
        if _local_name(child.tag) == child_name:
            return child
    return None


def _children(node: ET.Element, child_name: str) -> list[ET.Element]:
    return [child for child in list(node) if _local_name(child.tag) == child_name]


def _all_direct_named(root: ET.Element, child_name: str) -> list[ET.Element]:
    return [child for child in list(root) if _local_name(child.tag) == child_name]


def _expression_refs(expression: str) -> dict[str, list[str]]:
    value = str(expression or "")
    return {
        "fields": sorted(set(re.findall(r"\$F\{([^}]+)\}", value))),
        "parameters": sorted(set(re.findall(r"\$P\{([^}]+)\}", value))),
        "variables": sorted(set(re.findall(r"\$V\{([^}]+)\}", value))),
    }


def _xml_name_matches(actual: str, expected: str) -> bool:
    actual_local = _local_name(actual).split(":", 1)[-1].strip()
    expected_local = _local_name(expected).split(":", 1)[-1].strip()
    return actual_local == expected_local or actual_local.lower() == expected_local.lower()


def _xml_node_matches_segment(node: ET.Element, segment: str) -> bool:
    clean_segment = str(segment or "").strip()
    if clean_segment == "*":
        return True
    contains_match = re.search(
        r"contains\s*\(\s*name\(\)\s*,\s*['\"]([^'\"]+)['\"]\s*\)",
        clean_segment,
        flags=re.IGNORECASE,
    )
    if contains_match:
        return contains_match.group(1).lower() in _local_name(node.tag).split(":", 1)[-1].lower()
    return _xml_name_matches(node.tag, clean_segment)


def _xml_attr_value(node: ET.Element, attr_name: str) -> str:
    clean_name = str(attr_name or "").lstrip("@").strip()
    for key, value in node.attrib.items():
        if _xml_name_matches(key, clean_name):
            return str(value or "").strip()
    return ""


def _xml_descendants_by_name(root: ET.Element, name: str) -> list[ET.Element]:
    return [node for node in root.iter() if _xml_node_matches_segment(node, name)]


def _xml_child_nodes_by_name(nodes: Sequence[ET.Element], name: str) -> list[ET.Element]:
    return [child for node in nodes for child in list(node) if _xml_node_matches_segment(child, name)]


def _resolve_xml_path_value(root: ET.Element, path: str) -> str:
    clean_path = str(path or "").strip()
    if not clean_path:
        return ""
    if clean_path.startswith("//@"):
        attr_name = clean_path[3:]
        for node in root.iter():
            value = _xml_attr_value(node, attr_name)
            if value:
                return value
        return ""
    segments = [segment for segment in clean_path.strip("/").split("/") if segment]
    if not segments:
        return ""

    first_segment = segments[0]
    if first_segment.startswith("@"):
        return _xml_attr_value(root, first_segment)
    if first_segment == "*" and clean_path.startswith("/*/"):
        nodes = [root]
    elif _xml_node_matches_segment(root, first_segment):
        nodes = [root]
    elif first_segment == "*" or "contains(" in first_segment:
        nodes = _xml_child_nodes_by_name([root], first_segment)
    else:
        nodes = _xml_descendants_by_name(root, first_segment)
    segments = segments[1:]

    for segment in segments:
        if not nodes:
            return ""
        if segment.startswith("@"):
            for node in nodes:
                value = _xml_attr_value(node, segment)
                if value:
                    return value
            return ""
        nodes = _xml_child_nodes_by_name(nodes, segment)

    for node in nodes:
        text_value = _clean_text(node.text)
        if text_value:
            return text_value
    return ""


def _xml_path_exists(root: ET.Element, path: str) -> bool:
    clean_path = str(path or "").strip()
    if not clean_path:
        return False
    if _resolve_xml_path_value(root, clean_path):
        return True
    if clean_path.startswith("//@"):
        attr_name = clean_path[3:]
        return any(_xml_attr_value(node, attr_name) for node in root.iter())
    segments = [segment for segment in clean_path.strip("/").split("/") if segment]
    if not segments:
        return False
    first_segment = segments[0]
    if first_segment.startswith("@"):
        return bool(_xml_attr_value(root, first_segment))
    if first_segment == "*" and clean_path.startswith("/*/"):
        nodes = [root]
    elif _xml_node_matches_segment(root, first_segment):
        nodes = [root]
    elif first_segment == "*" or "contains(" in first_segment:
        nodes = _xml_child_nodes_by_name([root], first_segment)
    else:
        nodes = _xml_descendants_by_name(root, first_segment)
    for segment in segments[1:]:
        if not nodes:
            return False
        if segment.startswith("@"):
            return any(_xml_attr_value(node, segment) for node in nodes)
        nodes = _xml_child_nodes_by_name(nodes, segment)
    return bool(nodes)


def _resolve_field_description_value(root: ET.Element, description: str, *, fallback_name: str = "") -> str:
    candidates = [candidate.strip() for candidate in str(description or "").split("|") if candidate.strip()]
    if fallback_name:
        candidates.extend(CFDI_FIELD_FALLBACK_PATHS.get(fallback_name.lower(), ()))
        candidates.append(f"@{fallback_name}")
        candidates.append(fallback_name)
    for candidate in candidates:
        value = _resolve_xml_path_value(root, candidate)
        if value:
            return value
    return ""


def _field_description_exists(root: ET.Element, description: str, *, fallback_name: str = "") -> bool:
    candidates = [candidate.strip() for candidate in str(description or "").split("|") if candidate.strip()]
    if fallback_name:
        candidates.extend(CFDI_FIELD_FALLBACK_PATHS.get(fallback_name.lower(), ()))
        candidates.append(f"@{fallback_name}")
        candidates.append(fallback_name)
    return any(_xml_path_exists(root, candidate) for candidate in candidates)


def build_sample_field_values(
    blueprint: Mapping[str, Any],
    sample_xml_source: str | bytes | Path,
) -> dict[str, str]:
    """Resolve JRXML field names against one sample XML document.

    Field descriptions may contain one or more XML paths separated by `|`, such
    as `TimbreFiscalDigital/@UUID|TimbreFiscalDigital/@uUID`.
    """
    if isinstance(sample_xml_source, Path):
        source_text = sample_xml_source.read_text(encoding="utf-8")
    else:
        source_text = sample_xml_source.decode("utf-8") if isinstance(sample_xml_source, bytes) else str(sample_xml_source or "")
    root = ET.fromstring(source_text)
    values: dict[str, str] = {}
    for field_spec in blueprint.get("fields") or []:
        if not isinstance(field_spec, Mapping):
            continue
        field_name = str(field_spec.get("name") or "").strip()
        if not field_name:
            continue
        field_description = str(field_spec.get("description") or "").strip()
        value = _resolve_field_description_value(root, field_description, fallback_name=field_name)
        if value:
            values[field_name] = value
        elif _field_description_exists(root, field_description, fallback_name=field_name):
            values[field_name] = "__present__"
    return values


def _element_geometry(element: ET.Element) -> dict[str, int]:
    report_element = _first_child(element, "reportElement")
    source = report_element if report_element is not None else element
    return {
        "x": _int_attr(source, "x"),
        "y": _int_attr(source, "y"),
        "width": _int_attr(source, "width"),
        "height": _int_attr(source, "height"),
    }


def _report_element_attrs(element: ET.Element) -> dict[str, Any]:
    report_element = _first_child(element, "reportElement")
    if report_element is None:
        return {}
    attrs: dict[str, Any] = {}
    for key in (
        "key",
        "style",
        "mode",
        "forecolor",
        "backcolor",
        "positionType",
        "stretchType",
        "isPrintRepeatedValues",
        "isRemoveLineWhenBlank",
        "isPrintInFirstWholeBand",
        "isPrintWhenDetailOverflows",
    ):
        if report_element.get(key) is not None:
            attrs[key] = report_element.get(key)
    print_when = _node_text(_first_child(report_element, "printWhenExpression"))
    if print_when:
        attrs["print_when"] = {
            "expression": print_when,
            "refs": _expression_refs(print_when),
        }
    return attrs


def _text_style(element: ET.Element) -> dict[str, Any]:
    text_element = _first_child(element, "textElement")
    if text_element is None:
        return {}
    style: dict[str, Any] = {
        key: value
        for key, value in text_element.attrib.items()
        if str(value or "").strip()
    }
    font = _first_child(text_element, "font")
    if font is not None:
        style["font"] = {
            key: value
            for key, value in font.attrib.items()
            if str(value or "").strip()
        }
    return style


def _box_style(element: ET.Element) -> dict[str, Any]:
    box = _first_child(element, "box")
    if box is None:
        return {}
    style: dict[str, Any] = {
        key: value
        for key, value in box.attrib.items()
        if str(value or "").strip()
    }
    pens: dict[str, dict[str, str]] = {}
    for child in list(box):
        local = _local_name(child.tag)
        if local.endswith("Pen") or local == "pen":
            pens[local] = {
                key: value
                for key, value in child.attrib.items()
                if str(value or "").strip()
            }
    if pens:
        style["pens"] = pens
    return style


def _parse_style_definitions(root: ET.Element) -> dict[str, dict[str, Any]]:
    styles: dict[str, dict[str, Any]] = {}
    for style_node in _all_direct_named(root, "style"):
        name = str(style_node.get("name") or "").strip()
        if not name:
            continue
        payload: dict[str, Any] = {
            key: value
            for key, value in style_node.attrib.items()
            if str(value or "").strip()
        }
        box = _box_style(style_node)
        if box:
            payload["box"] = box
        styles[name] = payload
    return styles


def _component_payload(element: ET.Element) -> dict[str, Any]:
    payload: dict[str, Any] = {}
    for child in list(element):
        local = _local_name(child.tag)
        if local == "reportElement":
            continue
        if local == "jr":
            continue
        if local in {"list", "table"}:
            payload["component"] = local
            dataset_run = _first_child(child, "datasetRun")
            if dataset_run is not None:
                payload["dataset_run"] = {
                    "sub_dataset": dataset_run.get("subDataset"),
                    "data_source_expression": _node_text(_first_child(dataset_run, "dataSourceExpression")),
                }
            payload["raw_children"] = [_local_name(grandchild.tag) for grandchild in list(child)]
            break
    if not payload:
        payload["raw_children"] = [_local_name(child.tag) for child in list(element)]
    return payload


def _parse_element(element: ET.Element) -> dict[str, Any]:
    element_type = _local_name(element.tag)
    parsed: dict[str, Any] = {
        "type": element_type,
        "geometry": _element_geometry(element),
    }
    attrs = _report_element_attrs(element)
    if attrs:
        parsed["report_element"] = attrs
    box = _box_style(element)
    if box:
        parsed["box"] = box

    if element_type == "staticText":
        parsed["text"] = _node_text(_first_child(element, "text"))
        style = _text_style(element)
        if style:
            parsed["text_style"] = style
    elif element_type == "textField":
        expression = _node_text(_first_child(element, "textFieldExpression"))
        parsed["expression"] = {
            "kind": "text_field",
            "source": expression,
            "refs": _expression_refs(expression),
        }
        if element.get("isStretchWithOverflow") is not None:
            parsed["stretch_with_overflow"] = element.get("isStretchWithOverflow")
        style = _text_style(element)
        if style:
            parsed["text_style"] = style
    elif element_type == "image":
        expression = _node_text(_first_child(element, "imageExpression"))
        parsed["expression"] = {
            "kind": "image",
            "source": expression,
            "refs": _expression_refs(expression),
        }
        if element.get("scaleImage") is not None:
            parsed["scale_image"] = element.get("scaleImage")
    elif element_type == "frame":
        parsed["children"] = [
            _parse_element(child)
            for child in list(element)
            if _local_name(child.tag) not in {"reportElement", "box"}
        ]
    elif element_type == "componentElement":
        parsed.update(_component_payload(element))
    elif element_type == "line":
        graphic = _first_child(element, "graphicElement")
        if graphic is not None:
            graphic_payload = dict(graphic.attrib)
            pen = _first_child(graphic, "pen")
            if pen is not None:
                graphic_payload["pen"] = dict(pen.attrib)
            parsed["graphic"] = graphic_payload
    elif element_type == "rectangle":
        if element.get("radius") is not None:
            parsed["radius"] = element.get("radius")
        graphic = _first_child(element, "graphicElement")
        if graphic is not None:
            graphic_payload = dict(graphic.attrib)
            pen = _first_child(graphic, "pen")
            if pen is not None:
                graphic_payload["pen"] = dict(pen.attrib)
            parsed["graphic"] = graphic_payload
    else:
        parsed["raw_children"] = [_local_name(child.tag) for child in list(element)]
    return parsed


def _parse_field_like(node: ET.Element) -> dict[str, Any]:
    payload = {
        "name": node.get("name") or "",
        "class": node.get("class") or "",
    }
    description = _node_text(_first_child(node, "fieldDescription"))
    if description:
        payload["description"] = description
    return {key: value for key, value in payload.items() if value}


def _parse_variable(node: ET.Element) -> dict[str, Any]:
    expression = _node_text(_first_child(node, "variableExpression"))
    payload: dict[str, Any] = {
        "name": node.get("name") or "",
        "class": node.get("class") or "",
        "calculation": node.get("calculation") or "",
        "reset_type": node.get("resetType") or "",
        "expression": expression,
    }
    if expression:
        payload["refs"] = _expression_refs(expression)
    return {key: value for key, value in payload.items() if value}


def _parse_dataset(node: ET.Element) -> dict[str, Any]:
    dataset: dict[str, Any] = {
        "name": node.get("name") or "",
        "fields": [_parse_field_like(field_node) for field_node in _all_direct_named(node, "field")],
        "variables": [_parse_variable(variable_node) for variable_node in _all_direct_named(node, "variable")],
    }
    query = _node_text(_first_child(node, "queryString"))
    if query:
        dataset["query"] = query
    return dataset


def _parse_band(parent_name: str, band: ET.Element, index: int) -> dict[str, Any]:
    return {
        "name": parent_name,
        "index": index,
        "height": _int_attr(band, "height"),
        "split_type": band.get("splitType") or "",
        "elements": [
            _parse_element(child)
            for child in list(band)
            if _local_name(child.tag) not in {"property"}
        ],
    }


def _parse_bands(root: ET.Element) -> list[dict[str, Any]]:
    band_parent_names = {
        "background",
        "title",
        "pageHeader",
        "columnHeader",
        "detail",
        "columnFooter",
        "pageFooter",
        "lastPageFooter",
        "summary",
        "groupHeader",
        "groupFooter",
    }
    bands: list[dict[str, Any]] = []
    for parent in root.iter():
        parent_name = _local_name(parent.tag)
        if parent_name not in band_parent_names:
            continue
        for band_index, band in enumerate(_children(parent, "band")):
            bands.append(_parse_band(parent_name, band, band_index))
    return bands


def _expression_index(blueprint: Mapping[str, Any]) -> dict[str, Any]:
    expressions: list[dict[str, Any]] = []

    def visit(value: Any, path: str) -> None:
        if isinstance(value, Mapping):
            for expression_key in ("source", "expression", "data_source_expression"):
                if expression_key in value and isinstance(value.get(expression_key), str):
                    source = str(value.get(expression_key) or "")
                    if not source:
                        continue
                    expressions.append(
                        {
                            "path": f"{path}.{expression_key}" if path else expression_key,
                            "source": source,
                            "refs": _expression_refs(source),
                        }
                    )
            for key, child_value in value.items():
                visit(child_value, f"{path}.{key}" if path else str(key))
        elif isinstance(value, list):
            for index, item in enumerate(value):
                visit(item, f"{path}[{index}]")

    visit(blueprint, "")
    return {
        "count": len(expressions),
        "items": expressions,
        "unsupported_policy": "stored-not-executed",
    }


def _raw_jrxml_expression_index(root: ET.Element) -> dict[str, Any]:
    expressions: list[dict[str, Any]] = []
    for index, node in enumerate(root.iter()):
        tag = _local_name(node.tag)
        if not tag.endswith("Expression"):
            continue
        source = _node_text(node)
        if not source:
            continue
        expressions.append(
            {
                "index": index,
                "tag": tag,
                "source": source,
                "refs": _expression_refs(source),
            }
        )
    return {
        "count": len(expressions),
        "items": expressions,
        "unsupported_policy": "stored-not-executed",
    }


def parse_jrxml_document(source: str | bytes | Path, *, source_name: str = "") -> dict[str, Any]:
    """Parse a JasperReports JRXML document into a safe designer blueprint."""
    if isinstance(source, Path):
        source_text = source.read_text(encoding="utf-8")
        resolved_source_name = source_name or source.name
    else:
        source_text = source.decode("utf-8") if isinstance(source, bytes) else str(source or "")
        resolved_source_name = source_name

    root = ET.fromstring(source_text)
    if _local_name(root.tag) != "jasperReport":
        raise ValueError(f"JRXML root must be jasperReport, got {_local_name(root.tag)!r}")

    blueprint: dict[str, Any] = {
        "schema_version": REPORT_DESIGNER_SCHEMA_VERSION,
        "source": {
            "format": "jrxml",
            "name": resolved_source_name or root.get("name") or "jrxml",
            "report_name": root.get("name") or "",
            "language": root.get("language") or "",
        },
        "page": {
            "width": _int_attr(root, "pageWidth"),
            "height": _int_attr(root, "pageHeight"),
            "column_width": _int_attr(root, "columnWidth"),
            "margins": {
                "top": _int_attr(root, "topMargin"),
                "right": _int_attr(root, "rightMargin"),
                "bottom": _int_attr(root, "bottomMargin"),
                "left": _int_attr(root, "leftMargin"),
            },
        },
        "styles": _parse_style_definitions(root),
        "parameters": [_parse_field_like(node) for node in _all_direct_named(root, "parameter")],
        "fields": [_parse_field_like(node) for node in _all_direct_named(root, "field")],
        "variables": [_parse_variable(node) for node in _all_direct_named(root, "variable")],
        "datasets": [_parse_dataset(node) for node in _all_direct_named(root, "subDataset")],
        "bands": _parse_bands(root),
    }
    structural_expression_index = _expression_index(blueprint)
    raw_expression_index = _raw_jrxml_expression_index(root)
    blueprint["expression_index"] = {
        **raw_expression_index,
        "structural_count": structural_expression_index["count"],
        "structural_items": structural_expression_index["items"],
    }
    blueprint["stats"] = summarize_design_blueprint(blueprint)
    return blueprint


def parse_jrxml_file(path: str | Path) -> dict[str, Any]:
    return parse_jrxml_document(Path(path), source_name=Path(path).name)


def flatten_xml_sample(source: str | bytes | Path, *, source_name: str = "") -> dict[str, Any]:
    """Flatten an XML payload into paths usable by a report-template designer."""
    if isinstance(source, Path):
        source_text = source.read_text(encoding="utf-8")
        resolved_source_name = source_name or source.name
    else:
        source_text = source.decode("utf-8") if isinstance(source, bytes) else str(source or "")
        resolved_source_name = source_name
    root = ET.fromstring(source_text)

    path_rows: dict[str, dict[str, Any]] = {}

    def walk(node: ET.Element, path: str) -> None:
        local = _local_name(node.tag)
        current_path = f"{path}/{local}" if path else f"/{local}"
        row = path_rows.setdefault(
            current_path,
            {
                "path": current_path,
                "element": local,
                "count": 0,
                "attributes": {},
                "text_examples": [],
            },
        )
        row["count"] += 1
        for attr_name, attr_value in sorted(node.attrib.items()):
            attr_local = _local_name(attr_name)
            attr_row = row["attributes"].setdefault(
                attr_local,
                {
                    "name": attr_local,
                    "count": 0,
                    "examples": [],
                },
            )
            attr_row["count"] += 1
            if attr_value and attr_value not in attr_row["examples"] and len(attr_row["examples"]) < 3:
                attr_row["examples"].append(attr_value)
        node_text = _clean_text(node.text)
        if node_text and node_text not in row["text_examples"] and len(row["text_examples"]) < 3:
            row["text_examples"].append(node_text)
        for child in list(node):
            walk(child, current_path)

    walk(root, "")
    rows = sorted(path_rows.values(), key=lambda item: item["path"])
    for row in rows:
        row["attributes"] = sorted(row["attributes"].values(), key=lambda item: item["name"])
        row["repeating"] = int(row["count"]) > 1
    return {
        "schema_version": REPORT_DESIGNER_SCHEMA_VERSION,
        "source": {
            "format": "xml",
            "name": resolved_source_name or _local_name(root.tag),
            "root": _local_name(root.tag),
        },
        "paths": rows,
        "stats": {
            "path_count": len(rows),
            "repeating_path_count": sum(1 for row in rows if row["repeating"]),
            "attribute_count": sum(len(row["attributes"]) for row in rows),
        },
    }


def flatten_xml_sample_file(path: str | Path) -> dict[str, Any]:
    return flatten_xml_sample(Path(path), source_name=Path(path).name)


def summarize_design_blueprint(blueprint: Mapping[str, Any]) -> dict[str, int]:
    bands = list(blueprint.get("bands") or [])
    elements: list[Mapping[str, Any]] = []

    def visit_element(element: Mapping[str, Any]) -> None:
        elements.append(element)
        for child in element.get("children") or []:
            if isinstance(child, Mapping):
                visit_element(child)

    for band in bands:
        for element in band.get("elements") or []:
            if isinstance(element, Mapping):
                visit_element(element)
    element_types: dict[str, int] = {}
    for element in elements:
        kind = str(element.get("type") or "unknown")
        element_types[kind] = element_types.get(kind, 0) + 1
    return {
        "band_count": len(bands),
        "element_count": len(elements),
        "dataset_count": len(blueprint.get("datasets") or []),
        "field_count": len(blueprint.get("fields") or []),
        "variable_count": len(blueprint.get("variables") or []),
        "expression_count": int((blueprint.get("expression_index") or {}).get("count") or 0),
        **{f"element_{key}_count": value for key, value in sorted(element_types.items())},
    }


def dumps_canonical_json(payload: Mapping[str, Any]) -> str:
    return json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True)


def _style_from_geometry(geometry: Mapping[str, Any], *, offset_x: int = 0, offset_y: int = 0) -> str:
    x = int(geometry.get("x") or 0)
    y = int(geometry.get("y") or 0) + int(offset_y or 0)
    x += int(offset_x or 0)
    width = max(int(geometry.get("width") or 0), 1)
    height = max(int(geometry.get("height") or 0), 1)
    return f"left:{x}px;top:{y}px;width:{width}px;height:{height}px;"


def _join_inline_style(*parts: str) -> str:
    return "".join(part.rstrip(";") + ";" for part in parts if str(part or "").strip())


def _css_color(value: Any, default: str = "") -> str:
    text = str(value or "").strip()
    if re.fullmatch(r"#[0-9A-Fa-f]{6}", text):
        return text
    return default


def _truthy_text(value: Any, *, default: bool = False) -> bool:
    text = str(value or "").strip().lower()
    if text in {"1", "true", "yes", "y", "si", "sí"}:
        return True
    if text in {"0", "false", "no", "n"}:
        return False
    return default


def _sample_is_spanish(sample_values: Mapping[str, Any] | None) -> bool:
    language = _sample_value(sample_values, "lenguaje").lower()
    if language:
        return language.startswith("es")
    return _truthy_text(_sample_value(sample_values, "es"), default=True)


def _font_css(text_style: Mapping[str, Any] | None) -> str:
    font = text_style.get("font") if isinstance(text_style, Mapping) and isinstance(text_style.get("font"), Mapping) else {}
    css = ["font-family:Arial,Helvetica,sans-serif", "line-height:1.05"]
    size = str(font.get("size") or "").strip()
    if size.isdigit():
        css.append(f"font-size:{size}px")
    else:
        css.append("font-size:8px")
    if _truthy_text(font.get("isBold")):
        css.append("font-weight:700")
    if _truthy_text(font.get("isItalic")):
        css.append("font-style:italic")
    if _truthy_text(font.get("isUnderline")):
        css.append("text-decoration:underline")
    return ";".join(css)


def _text_alignment_css(text_style: Mapping[str, Any] | None) -> str:
    if not isinstance(text_style, Mapping):
        return ""
    css: list[str] = []
    horizontal = str(text_style.get("textAlignment") or "").strip().lower()
    if horizontal in {"left", "center", "right", "justify"}:
        css.append(f"text-align:{horizontal}")
    vertical = str(text_style.get("verticalAlignment") or "").strip().lower()
    if vertical == "middle":
        css.extend(["display:flex", "align-items:center"])
        if horizontal == "center":
            css.append("justify-content:center")
        elif horizontal == "right":
            css.append("justify-content:flex-end")
    elif vertical == "bottom":
        css.extend(["display:flex", "align-items:flex-end"])
    return ";".join(css)


def _padding_css(box: Mapping[str, Any] | None = None, named_box: Mapping[str, Any] | None = None) -> str:
    merged: dict[str, Any] = {}
    if isinstance(named_box, Mapping):
        merged.update(named_box)
    if isinstance(box, Mapping):
        merged.update(box)
    css: list[str] = []
    for key, css_key in (
        ("padding", "padding"),
        ("topPadding", "padding-top"),
        ("rightPadding", "padding-right"),
        ("bottomPadding", "padding-bottom"),
        ("leftPadding", "padding-left"),
    ):
        value = str(merged.get(key) or "").strip()
        if value.lstrip("-").isdigit():
            css.append(f"{css_key}:{int(value)}px")
    return ";".join(css)


def _effective_named_box(element: Mapping[str, Any], styles: Mapping[str, Any] | None) -> Mapping[str, Any]:
    report_element = element.get("report_element") if isinstance(element.get("report_element"), Mapping) else {}
    style_name = str(report_element.get("style") or "").strip()
    style = styles.get(style_name) if isinstance(styles, Mapping) else None
    if isinstance(style, Mapping) and isinstance(style.get("box"), Mapping):
        return style["box"]
    return {}


def _base_element_css(
    element: Mapping[str, Any],
    *,
    offset_x: int = 0,
    offset_y: int = 0,
    default_border: str = "0",
    default_background: str = "transparent",
) -> str:
    geometry = element.get("geometry") if isinstance(element.get("geometry"), Mapping) else {}
    report_element = element.get("report_element") if isinstance(element.get("report_element"), Mapping) else {}
    forecolor = _css_color(report_element.get("forecolor"), "#000000")
    mode = str(report_element.get("mode") or "").strip().lower()
    backcolor = _css_color(report_element.get("backcolor"), default_background)
    background = backcolor if mode == "opaque" else default_background
    return _join_inline_style(
        _style_from_geometry(geometry, offset_x=offset_x, offset_y=offset_y),
        "position:absolute;box-sizing:border-box;overflow:hidden;white-space:pre-wrap",
        f"border:{default_border}",
        f"color:{forecolor}",
        f"background:{background}",
    )


def _sample_value(sample_values: Mapping[str, Any] | None, field_name: str) -> str:
    if not sample_values:
        return ""
    clean_name = str(field_name or "").strip()
    if not clean_name:
        return ""
    if clean_name in sample_values:
        value = str(sample_values[clean_name] or "").strip()
        return "" if value == "__present__" else value
    clean_lower = clean_name.lower()
    for key, value in sample_values.items():
        if str(key or "").strip().lower() == clean_lower:
            text = str(value or "").strip()
            return "" if text == "__present__" else text
    return ""


def _sample_present(sample_values: Mapping[str, Any] | None, field_name: str) -> bool:
    if not sample_values:
        return False
    clean_name = str(field_name or "").strip()
    if clean_name in sample_values:
        return bool(str(sample_values[clean_name] or "").strip())
    clean_lower = clean_name.lower()
    return any(str(key or "").strip().lower() == clean_lower and bool(str(value or "").strip()) for key, value in sample_values.items())


def _decode_java_string_literal(value: str) -> str:
    raw_value = str(value or "")
    if len(raw_value) >= 2 and raw_value[0] == '"' and raw_value[-1] == '"':
        raw_value = raw_value[1:-1]
    return (
        raw_value
        .replace(r"\"", '"')
        .replace(r"\n", "\n")
        .replace(r"\r", "\n")
        .replace(r"\t", " ")
        .replace("\\\\", "\\")
    )


def _strip_preview_markup(value: str) -> str:
    text = str(value or "")
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", "", text)
    return html.unescape(text).replace("~", " ").strip()


def _localize_i18n_markers(value: str, sample_values: Mapping[str, Any] | None = None) -> str:
    use_spanish = _sample_is_spanish(sample_values)
    tipo = _sample_value(sample_values, "tipoDeComprobante")

    def replace_three(match: re.Match[str]) -> str:
        spanish, english, payment = match.group(1), match.group(2), match.group(3)
        if tipo == "P":
            return payment
        return spanish if use_spanish else english

    def replace_two(match: re.Match[str]) -> str:
        spanish, english = match.group(1), match.group(2)
        return spanish if use_spanish else english

    text = re.sub(r"~([^~]+)~([^~]+)~([^~]+)~", replace_three, str(value or ""))
    return re.sub(r"~([^~]+)~([^~]+)~", replace_two, text)


def _preview_noise_literal(value: str) -> bool:
    text = str(value or "").strip()
    if not text:
        return False
    if re.search(r"\(\.\+\??\)|\\\$[0-9]|\$[0-9]", text):
        return True
    return text in {"null", "&", "&#38;"}


def _cfdi_document_label(sample_values: Mapping[str, Any] | None) -> str:
    language = "es" if _sample_is_spanish(sample_values) else "en"
    doc = _sample_value(sample_values, "doc") or _sample_value(sample_values, "observaciones2")
    if doc in CFDI_DOC_LABELS:
        return CFDI_DOC_LABELS[doc][language]
    tipo = _sample_value(sample_values, "tipoDeComprobante")
    if tipo in CFDI_TYPE_LABELS:
        return CFDI_TYPE_LABELS[tipo][language]
    return ""


def _join_preview_lines(*lines: str) -> str:
    return "\n".join(line for line in (str(line or "").strip() for line in lines) if line)


def _format_party_block(sample_values: Mapping[str, Any] | None, prefix: str) -> str:
    name = _sample_value(sample_values, f"nombre{prefix}")
    street = _sample_value(sample_values, f"calle{prefix}")
    exterior = _sample_value(sample_values, f"noExt{prefix}")
    interior = _sample_value(sample_values, f"noInt{prefix}")
    colony = _sample_value(sample_values, f"colonia{prefix}")
    postal_code = _sample_value(sample_values, f"cp{prefix}")
    locality = _sample_value(sample_values, f"localidad{prefix}")
    municipality = _sample_value(sample_values, f"municipio{prefix}")
    state = _sample_value(sample_values, f"estado{prefix}")
    country = _sample_value(sample_values, f"pais{prefix}")
    rfc = _sample_value(sample_values, f"rfc{prefix}")
    tax_id = _sample_value(sample_values, f"taxid{prefix}") or _sample_value(sample_values, "NumRegIdTrib")
    reference = _sample_value(sample_values, f"ref{prefix}") or _sample_value(sample_values, f"referencia{prefix}")
    customer_id = _sample_value(sample_values, f"id{prefix}")
    street_line = " ".join(part for part in (street, f"No. {exterior}" if exterior else "", f"Int. {interior}" if interior else "") if part)
    city_line = " ".join(part for part in (colony, f"C.P. {postal_code}" if postal_code else "") if part)
    region_line = ", ".join(part for part in (locality, municipality, state, country) if part)
    return _join_preview_lines(
        name,
        street_line,
        city_line,
        region_line,
        reference,
        f"RFC: {rfc}" if rfc else "",
        f"TAX ID: {tax_id}" if tax_id else "",
        f"No de cliente: {customer_id}" if customer_id else "",
    )


def _special_preview_expression_text(source: str, sample_values: Mapping[str, Any] | None = None) -> str:
    if "$V{docs}" in source and ("$F{doc}" in source or "$F{tipoDeComprobante}" in source):
        return _cfdi_document_label(sample_values)
    if "$F{serie}" in source and "$F{folio}" in source:
        serie = _sample_value(sample_values, "serie").upper()
        folio = _sample_value(sample_values, "folio")
        return f"{serie} - {folio}".strip(" -")
    if "Folio Fiscal" in source and "$F{UUID}" in source:
        return _join_preview_lines("Folio Fiscal:", _sample_value(sample_values, "UUID"))
    if "Fecha/Hora" in source and "No. Certificado" in source:
        return _join_preview_lines(
            "Fecha/Hora Certificación:",
            "Fecha de Emisión:",
            "No. Certificado Digital:",
            "No. Serie Certificado SAT:",
        )
    if "$F{FechaTimbrado}" in source and "$F{fechaEmision}" in source and "$F{noCertificadoSAT}" in source:
        return _join_preview_lines(
            _sample_value(sample_values, "FechaTimbrado"),
            _sample_value(sample_values, "fechaEmision"),
            _sample_value(sample_values, "noCertificadoDigital"),
            _sample_value(sample_values, "noCertificadoSAT"),
        )
    if "Facturado a" in source and "Invoiced to" in source:
        return "Facturado a:"
    if "Embarcar a" in source and "Shipped To" in source:
        return "Embarcar a:"
    if "$F{nombreReceptor}" in source and "$F{rfcReceptor}" in source:
        return _format_party_block(sample_values, "Receptor")
    if "$F{nombreEmbarque}" in source or "$F{rfcEmbarque}" in source:
        return _format_party_block(sample_values, "Embarque")
    if "Lugar de Exped" in source and "$F{calleEmisor}" in source:
        return _join_preview_lines(
            "Lugar de Expedición:",
            _format_party_block(sample_values, "Emisor").split("\n", 1)[1] if "\n" in _format_party_block(sample_values, "Emisor") else "",
        )
    if "$F{selloCFD}" in source and source.strip() == "$F{selloCFD}":
        return _sample_value(sample_values, "selloCFD")
    if "$F{selloSAT}" in source and source.strip() == "$F{selloSAT}":
        return _sample_value(sample_values, "selloSAT")
    if "$F{cadenaOriginal}" in source and source.strip() == "$F{cadenaOriginal}":
        return _sample_value(sample_values, "cadenaOriginal")
    if "Página" in source or "Page" in source or "$V{PAGE_NUMBER}" in source:
        return "Página 1 de 1"
    return ""


def _preview_expression_text(expression: str, sample_values: Mapping[str, Any] | None = None) -> str:
    source = str(expression or "").strip()
    if not source:
        return ""
    exact_field = re.fullmatch(r"\$F\{([^}]+)\}", source)
    if exact_field:
        return _sample_value(sample_values, exact_field.group(1))
    special_text = _special_preview_expression_text(source, sample_values)
    if special_text:
        return special_text

    parts: list[str] = []
    for match in re.finditer(r'"(?:\\.|[^"\\])*"|\$F\{([^}]+)\}', source):
        token = match.group(0)
        field_name = match.group(1)
        if field_name:
            value = _sample_value(sample_values, field_name)
            if value:
                parts.append(value)
        else:
            literal = _decode_java_string_literal(token)
            if _preview_noise_literal(literal):
                continue
            parts.append(_localize_i18n_markers(literal, sample_values))
    text = _strip_preview_markup("".join(parts))
    if text:
        return text
    if re.fullmatch(r'"(?:\\.|[^"\\])*"', source):
        return _strip_preview_markup(_decode_java_string_literal(source))
    return ""


def _format_cfdi_total(value: Any) -> str:
    decimal_value = Decimal(str(value or "0")).quantize(Decimal("0.000001"), rounding=ROUND_HALF_UP)
    if decimal_value < 0:
        return "0.000000"
    text = format(decimal_value, "f")
    integer_part, decimal_part = text.split(".", 1)
    return f"{integer_part.lstrip('0') or '0'}.{decimal_part}"


def _cfdi_qr_barcode_src_from_sample_values(sample_values: Mapping[str, Any] | None) -> str:
    uuid = _sample_value(sample_values, "UUID")
    emitter_rfc = _sample_value(sample_values, "rfcEmisor")
    receiver_rfc = _sample_value(sample_values, "rfcReceptor")
    total = _sample_value(sample_values, "totalCFDi")
    seal = _sample_value(sample_values, "selloCFD") or _sample_value(sample_values, "sello")
    if not (uuid and emitter_rfc and receiver_rfc and total):
        return ""
    payload = {
        "id": uuid,
        "re": emitter_rfc,
        "rr": receiver_rfc,
        "tt": _format_cfdi_total(total),
    }
    if seal:
        payload["fe"] = seal[-8:]
    verification_url = SAT_CFDI_VERIFICATION_URL + "?" + urlencode(payload)
    return "/report/barcode/?" + urlencode(
        {
            "barcode_type": "QR",
            "value": verification_url,
            "width": 180,
            "height": 180,
        }
    )


def _literal_image_name(expression: str, sample_values: Mapping[str, Any] | None = None) -> str:
    preview_text = _preview_expression_text(expression, sample_values).strip()
    if re.search(r"\.(png|jpe?g|gif|webp|svg)$", preview_text, flags=re.IGNORECASE):
        return preview_text.strip("\"'")
    return ""


def _image_data_uri(image_name: str, asset_base_path: str | Path | None = None) -> str:
    if not image_name or asset_base_path is None:
        return ""
    base_path = Path(asset_base_path)
    candidate = (base_path / image_name).resolve()
    try:
        candidate.relative_to(base_path.resolve())
    except ValueError:
        return ""
    if not candidate.is_file():
        return ""
    mime_type = IMAGE_MIME_TYPES.get(candidate.suffix.lower())
    if not mime_type:
        return ""
    encoded = base64.b64encode(candidate.read_bytes()).decode("ascii")
    return f"data:{mime_type};base64,{encoded}"


def _print_when_allows(element: Mapping[str, Any], sample_values: Mapping[str, Any] | None = None) -> bool:
    report_element = element.get("report_element") if isinstance(element.get("report_element"), Mapping) else {}
    print_when = report_element.get("print_when") if isinstance(report_element.get("print_when"), Mapping) else {}
    expression = str(print_when.get("expression") or "").strip()
    if not expression:
        return True
    not_null = re.fullmatch(r"\$F\{([^}]+)\}\s*!=\s*null", expression)
    if not_null:
        return _sample_present(sample_values, not_null.group(1))
    is_null = re.fullmatch(r"\$F\{([^}]+)\}\s*==\s*null", expression)
    if is_null:
        return not _sample_present(sample_values, is_null.group(1))
    return True


def _preview_element_html(
    element: Mapping[str, Any],
    *,
    asset_base_path: str | Path | None = None,
    offset_x: int = 0,
    offset_y: int = 0,
    sample_values: Mapping[str, Any] | None = None,
    styles: Mapping[str, Any] | None = None,
) -> str:
    if not _print_when_allows(element, sample_values):
        return ""
    kind = str(element.get("type") or "")
    classes = "oc_report_designer_preview__element"
    if kind:
        classes += f" oc_report_designer_preview__element--{html.escape(kind)}"
    if kind == "staticText":
        text_style = element.get("text_style") if isinstance(element.get("text_style"), Mapping) else {}
        box = element.get("box") if isinstance(element.get("box"), Mapping) else {}
        base_style = _join_inline_style(
            _base_element_css(element, offset_x=offset_x, offset_y=offset_y),
            _font_css(text_style),
            _text_alignment_css(text_style),
            _padding_css(box, _effective_named_box(element, styles)),
        )
        content = html.escape(str(element.get("text") or ""))
    elif kind == "textField":
        text_style = element.get("text_style") if isinstance(element.get("text_style"), Mapping) else {}
        box = element.get("box") if isinstance(element.get("box"), Mapping) else {}
        base_style = _join_inline_style(
            _base_element_css(element, offset_x=offset_x, offset_y=offset_y),
            _font_css(text_style),
            _text_alignment_css(text_style),
            _padding_css(box, _effective_named_box(element, styles)),
        )
        expression = (element.get("expression") or {}).get("source") if isinstance(element.get("expression"), Mapping) else ""
        preview_text = _preview_expression_text(str(expression or ""), sample_values)
        content = html.escape(preview_text)
    elif kind == "image":
        base_style = _join_inline_style(
            _base_element_css(element, offset_x=offset_x, offset_y=offset_y),
            "padding:0",
        )
        expression = (element.get("expression") or {}).get("source") if isinstance(element.get("expression"), Mapping) else ""
        qr_src = _cfdi_qr_barcode_src_from_sample_values(sample_values) if "qrcode" in str(expression or "").lower() or "?re=" in str(expression or "") else ""
        if qr_src:
            content = (
                f'<img class="oc_report_designer_preview__qr" src="{html.escape(qr_src, quote=True)}" '
                'style="display:block;height:100%;object-fit:contain;width:100%;" alt="Codigo QR CFDI"/>'
            )
        else:
            image_name = _literal_image_name(str(expression or ""), sample_values)
            data_uri = _image_data_uri(image_name, asset_base_path)
            if data_uri:
                content = (
                    f'<img class="oc_report_designer_preview__asset" src="{html.escape(data_uri, quote=True)}" '
                    'style="display:block;height:100%;object-fit:contain;width:100%;" alt=""/>'
                )
            else:
                content = ""
    elif kind == "line":
        content = ""
        classes += " oc_report_designer_preview__line"
        geometry = element.get("geometry") if isinstance(element.get("geometry"), Mapping) else {}
        report_element = element.get("report_element") if isinstance(element.get("report_element"), Mapping) else {}
        color = _css_color(report_element.get("forecolor"), "#000000")
        line_style = "dotted" if "Dotted" in str(element.get("graphic") or "") else "solid"
        border_css = f"border-left:1px {line_style} {color}" if int(geometry.get("width") or 0) <= 1 else f"border-top:1px {line_style} {color}"
        base_style = _join_inline_style(
            _base_element_css(element, offset_x=offset_x, offset_y=offset_y),
            "background:transparent;padding:0",
            "border:0",
            border_css,
        )
    elif kind == "rectangle":
        content = ""
        classes += " oc_report_designer_preview__rectangle"
        report_element = element.get("report_element") if isinstance(element.get("report_element"), Mapping) else {}
        color = _css_color(report_element.get("forecolor"), "#8E8E8E")
        radius = str(element.get("radius") or "").strip()
        radius_css = f"border-radius:{radius}px" if radius.isdigit() else ""
        base_style = _join_inline_style(
            _base_element_css(element, offset_x=offset_x, offset_y=offset_y, default_border=f"1px solid {color}"),
            radius_css,
            "pointer-events:none",
        )
    elif kind == "frame":
        base_style = _join_inline_style(
            _base_element_css(element, offset_x=offset_x, offset_y=offset_y),
            "padding:0",
        )
        child_html = "".join(
            _preview_element_html(
                child,
                asset_base_path=asset_base_path,
                offset_x=0,
                offset_y=0,
                sample_values=sample_values,
                styles=styles,
            )
            for child in element.get("children") or []
            if isinstance(child, Mapping)
        )
        content = child_html
        classes += " oc_report_designer_preview__frame"
    elif kind == "componentElement":
        content = ""
        base_style = _join_inline_style(
            _base_element_css(element, offset_x=offset_x, offset_y=offset_y),
            "padding:0",
        )
    elif kind in {"subreport", "break", "printWhenExpression"}:
        return ""
    else:
        base_style = _base_element_css(element, offset_x=offset_x, offset_y=offset_y)
        content = ""
    return f"<div class=\"{classes}\" style=\"{base_style}\">{content}</div>"


def build_preview_html(
    blueprint: Mapping[str, Any],
    *,
    asset_base_path: str | Path | None = None,
    max_bands: int = 12,
    sample_values: Mapping[str, Any] | None = None,
) -> str:
    """Build a safe HTML preview that resembles the fixed-band JRXML canvas."""
    page = blueprint.get("page") if isinstance(blueprint.get("page"), Mapping) else {}
    width = int(page.get("width") or 612)
    margins = page.get("margins") if isinstance(page.get("margins"), Mapping) else {}
    margin_left = int(margins.get("left") or 0)
    margin_top = int(margins.get("top") or 0)
    margin_bottom = int(margins.get("bottom") or 0)
    styles = blueprint.get("styles") if isinstance(blueprint.get("styles"), Mapping) else {}
    bands = list(blueprint.get("bands") or [])[: max(int(max_bands or 0), 1)]
    current_y = 0
    element_html: list[str] = []
    for band in bands:
        if not isinstance(band, Mapping):
            continue
        height = max(int(band.get("height") or 1), 1)
        for element in band.get("elements") or []:
            if isinstance(element, Mapping):
                element_html.append(
                    _preview_element_html(
                        element,
                        asset_base_path=asset_base_path,
                        offset_x=margin_left,
                        offset_y=margin_top + current_y,
                        sample_values=sample_values,
                        styles=styles,
                    )
                )
        current_y += height
    height = max(margin_top + current_y + margin_bottom, int(page.get("height") or 792))
    return (
        '<div class="oc_report_designer_preview" style="background:#e5e7eb;border:1px solid #d1d5db;box-sizing:border-box;max-width:100%;overflow:auto;padding:12px;">'
        f'<div class="oc_report_designer_preview__page" style="background:#fff;box-shadow:0 4px 18px rgba(15,23,42,.22);height:{height}px;margin:0 auto;position:relative;width:{width}px;">'
        f"{''.join(element_html)}</div></div>"
    )


def _slug_code(value: str) -> str:
    slug = re.sub(r"[^A-Za-z0-9]+", "-", str(value or "").strip()).strip("-").upper()
    return slug[:48] or "REPORT-DESIGN"


def build_design_record_values(
    jrxml_path: str | Path,
    *,
    sample_xml_paths: Sequence[str | Path] = (),
    code: str = "",
    name: str = "",
    document_family: str = "",
    active: bool = True,
) -> dict[str, Any]:
    """Build Odoo custom-model values for an imported report design."""
    path = Path(jrxml_path)
    blueprint = parse_jrxml_file(path)
    sample_schemas = [flatten_xml_sample_file(Path(sample_path)) for sample_path in sample_xml_paths]
    sample_field_values: dict[str, str] = {}
    for sample_path in sample_xml_paths:
        values = build_sample_field_values(blueprint, Path(sample_path))
        if not sample_field_values:
            sample_field_values = values
    stats = blueprint.get("stats") or {}
    display_name = name or str((blueprint.get("source") or {}).get("report_name") or path.stem)
    return {
        "x_name": display_name,
        "x_code": code or _slug_code(path.stem),
        "x_active": bool(active),
        "x_source_format": "jrxml",
        "x_render_stage": "imported",
        "x_document_family": document_family or "generic",
        "x_source_name": path.name,
        "x_page_width": int((blueprint.get("page") or {}).get("width") or 0),
        "x_page_height": int((blueprint.get("page") or {}).get("height") or 0),
        "x_band_count": int(stats.get("band_count") or 0),
        "x_element_count": int(stats.get("element_count") or 0),
        "x_dataset_count": int(stats.get("dataset_count") or 0),
        "x_expression_count": int(stats.get("expression_count") or 0),
        "x_layout_json": dumps_canonical_json(blueprint),
        "x_expression_json": dumps_canonical_json(blueprint.get("expression_index") or {}),
        "x_data_schema_json": dumps_canonical_json({"samples": sample_schemas, "field_values": sample_field_values}),
        "x_preview_html": build_preview_html(blueprint, asset_base_path=path.parent, sample_values=sample_field_values),
        "x_source_jrxml": path.read_text(encoding="utf-8"),
        "x_notes": "Imported from JRXML. Expressions are indexed for migration and preview but are not executed.",
    }


@dataclass(frozen=True)
class ReportDesignerModelSpec:
    model: str
    name: str
    info: str


@dataclass(frozen=True)
class ReportDesignerFieldSpec:
    model: str
    name: str
    field_description: str
    field_type: str
    relation: str | None = None
    help_text: str | None = None
    selection_options: tuple[tuple[str, str], ...] = field(default_factory=tuple)


@dataclass(frozen=True)
class ReportDesignerViewBlueprint:
    name: str
    model: str
    view_type: str
    arch_db: str


REPORT_TEMPLATE_SOURCE_FORMAT_OPTIONS: tuple[tuple[str, str], ...] = (
    ("jrxml", "JRXML / JasperReports"),
    ("qweb", "QWeb Odoo"),
    ("html", "HTML"),
    ("xml", "XML"),
)

REPORT_TEMPLATE_RENDER_STAGE_OPTIONS: tuple[tuple[str, str], ...] = (
    ("imported", "Importada"),
    ("mapped", "Mapeada"),
    ("preview_ready", "Lista para preview"),
    ("production", "Produccion"),
)

REPORT_DESIGNER_MODELS: tuple[ReportDesignerModelSpec, ...] = (
    ReportDesignerModelSpec(
        model="x_odoo_report_design",
        name="Report Template Design",
        info="Reusable report/template designer records with JRXML import, band blueprint, expression index, sample data schema, and safe preview HTML.",
    ),
)

REPORT_DESIGNER_FIELDS: tuple[ReportDesignerFieldSpec, ...] = (
    ReportDesignerFieldSpec("x_odoo_report_design", "x_name", "Nombre", "char"),
    ReportDesignerFieldSpec("x_odoo_report_design", "x_code", "Clave", "char"),
    ReportDesignerFieldSpec("x_odoo_report_design", "x_active", "Activo", "boolean"),
    ReportDesignerFieldSpec(
        "x_odoo_report_design",
        "x_source_format",
        "Formato origen",
        "selection",
        selection_options=REPORT_TEMPLATE_SOURCE_FORMAT_OPTIONS,
    ),
    ReportDesignerFieldSpec(
        "x_odoo_report_design",
        "x_render_stage",
        "Estado de diseno",
        "selection",
        selection_options=REPORT_TEMPLATE_RENDER_STAGE_OPTIONS,
    ),
    ReportDesignerFieldSpec("x_odoo_report_design", "x_document_family", "Familia de documento", "char"),
    ReportDesignerFieldSpec("x_odoo_report_design", "x_source_name", "Archivo origen", "char"),
    ReportDesignerFieldSpec("x_odoo_report_design", "x_page_width", "Ancho pagina", "integer"),
    ReportDesignerFieldSpec("x_odoo_report_design", "x_page_height", "Alto pagina", "integer"),
    ReportDesignerFieldSpec("x_odoo_report_design", "x_band_count", "Bandas", "integer"),
    ReportDesignerFieldSpec("x_odoo_report_design", "x_element_count", "Elementos", "integer"),
    ReportDesignerFieldSpec("x_odoo_report_design", "x_dataset_count", "Datasets", "integer"),
    ReportDesignerFieldSpec("x_odoo_report_design", "x_expression_count", "Expresiones", "integer"),
    ReportDesignerFieldSpec("x_odoo_report_design", "x_layout_json", "Layout normalizado", "text"),
    ReportDesignerFieldSpec("x_odoo_report_design", "x_expression_json", "Indice de logica", "text"),
    ReportDesignerFieldSpec("x_odoo_report_design", "x_data_schema_json", "Datos de prueba", "text"),
    ReportDesignerFieldSpec("x_odoo_report_design", "x_preview_html", "Preview", "html"),
    ReportDesignerFieldSpec("x_odoo_report_design", "x_source_jrxml", "JRXML original", "text"),
    ReportDesignerFieldSpec("x_odoo_report_design", "x_notes", "Notas", "text"),
)


def _arch(value: str) -> str:
    return "\n".join(line.rstrip() for line in value.strip().splitlines())


REPORT_DESIGNER_VIEW_BLUEPRINTS: tuple[ReportDesignerViewBlueprint, ...] = (
    ReportDesignerViewBlueprint(
        name="Odoo Report Designer List",
        model="x_odoo_report_design",
        view_type="list",
        arch_db=_arch(
            """
            <list string="Disenos de plantillas">
                <field name="x_name"/>
                <field name="x_code"/>
                <field name="x_document_family"/>
                <field name="x_source_format"/>
                <field name="x_render_stage"/>
                <field name="x_band_count" optional="show"/>
                <field name="x_element_count" optional="show"/>
                <field name="x_dataset_count" optional="show"/>
                <field name="x_expression_count" optional="show"/>
                <field name="x_active" optional="show"/>
            </list>
            """
        ),
    ),
    ReportDesignerViewBlueprint(
        name="Odoo Report Designer Form",
        model="x_odoo_report_design",
        view_type="form",
        arch_db=_arch(
            """
            <form string="Diseno de plantilla">
                <sheet>
                    <notebook>
                        <page string="Preview">
                            <group>
                                <field name="x_code" readonly="1"/>
                                <field name="x_name" readonly="1"/>
                                <field name="x_source_name" readonly="1"/>
                            </group>
                            <field name="x_preview_html" nolabel="1" readonly="1"/>
                        </page>
                        <page string="Resumen">
                            <group>
                                <group string="Plantilla">
                                    <field name="x_name"/>
                                    <field name="x_code"/>
                                    <field name="x_document_family"/>
                                    <field name="x_source_format"/>
                                    <field name="x_render_stage"/>
                                    <field name="x_active"/>
                                </group>
                                <group string="Complejidad">
                                    <field name="x_source_name"/>
                                    <field name="x_page_width"/>
                                    <field name="x_page_height"/>
                                    <field name="x_band_count"/>
                                    <field name="x_element_count"/>
                                    <field name="x_dataset_count"/>
                                    <field name="x_expression_count"/>
                                </group>
                            </group>
                        </page>
                        <page string="Bandas y layout">
                            <field name="x_layout_json" nolabel="1"/>
                        </page>
                        <page string="Logica">
                            <field name="x_expression_json" nolabel="1"/>
                        </page>
                        <page string="Datos de prueba">
                            <field name="x_data_schema_json" nolabel="1"/>
                        </page>
                        <page string="JRXML original" groups="base.group_no_one">
                            <field name="x_source_jrxml" nolabel="1"/>
                        </page>
                        <page string="Notas">
                            <field name="x_notes" nolabel="1"/>
                        </page>
                    </notebook>
                </sheet>
            </form>
            """
        ),
    ),
)


__all__ = [
    "JRXML_NAMESPACE",
    "REPORT_DESIGNER_FIELDS",
    "REPORT_DESIGNER_MODELS",
    "REPORT_DESIGNER_SCHEMA_VERSION",
    "REPORT_DESIGNER_VIEW_BLUEPRINTS",
    "REPORT_TEMPLATE_RENDER_STAGE_OPTIONS",
    "REPORT_TEMPLATE_SOURCE_FORMAT_OPTIONS",
    "ReportDesignerFieldSpec",
    "ReportDesignerModelSpec",
    "ReportDesignerViewBlueprint",
    "build_design_record_values",
    "build_preview_html",
    "dumps_canonical_json",
    "flatten_xml_sample",
    "flatten_xml_sample_file",
    "parse_jrxml_document",
    "parse_jrxml_file",
    "summarize_design_blueprint",
]
