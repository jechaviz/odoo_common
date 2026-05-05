"""Reusable report-template designer contracts and importers.

The module intentionally converts legacy designer files into a neutral
blueprint instead of executing their expressions.  Consumers can store the
blueprint in Odoo, render a safe preview, and progressively map expressions to
QWeb, Python, or another trusted renderer.
"""

from __future__ import annotations

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
            parsed["graphic"] = dict(graphic.attrib)
    elif element_type == "rectangle":
        graphic = _first_child(element, "graphicElement")
        if graphic is not None:
            parsed["graphic"] = dict(graphic.attrib)
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


def _style_from_geometry(geometry: Mapping[str, Any], *, offset_y: int = 0) -> str:
    x = int(geometry.get("x") or 0)
    y = int(geometry.get("y") or 0) + int(offset_y or 0)
    width = max(int(geometry.get("width") or 0), 1)
    height = max(int(geometry.get("height") or 0), 1)
    return f"left:{x}px;top:{y}px;width:{width}px;height:{height}px;"


def _join_inline_style(*parts: str) -> str:
    return "".join(part.rstrip(";") + ";" for part in parts if str(part or "").strip())


def _sample_value(sample_values: Mapping[str, Any] | None, field_name: str) -> str:
    if not sample_values:
        return ""
    clean_name = str(field_name or "").strip()
    if not clean_name:
        return ""
    if clean_name in sample_values:
        return str(sample_values[clean_name] or "").strip()
    clean_lower = clean_name.lower()
    for key, value in sample_values.items():
        if str(key or "").strip().lower() == clean_lower:
            return str(value or "").strip()
    return ""


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


def _preview_expression_text(expression: str, sample_values: Mapping[str, Any] | None = None) -> str:
    source = str(expression or "").strip()
    if not source:
        return ""
    exact_field = re.fullmatch(r"\$F\{([^}]+)\}", source)
    if exact_field:
        return _sample_value(sample_values, exact_field.group(1)) or source

    parts: list[str] = []
    for match in re.finditer(r'"(?:\\.|[^"\\])*"|\$F\{([^}]+)\}', source):
        token = match.group(0)
        field_name = match.group(1)
        if field_name:
            parts.append(_sample_value(sample_values, field_name) or f"{{{field_name}}}")
        else:
            parts.append(_decode_java_string_literal(token))
    text = _strip_preview_markup("".join(parts))
    return text or source


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


def _preview_element_html(
    element: Mapping[str, Any],
    *,
    offset_y: int = 0,
    sample_values: Mapping[str, Any] | None = None,
) -> str:
    kind = str(element.get("type") or "")
    geometry = element.get("geometry") if isinstance(element.get("geometry"), Mapping) else {}
    base_style = _join_inline_style(
        _style_from_geometry(geometry, offset_y=offset_y),
        "position:absolute;box-sizing:border-box;border:1px solid rgba(59,130,246,.35);color:#111827;font-size:10px;line-height:1.15;overflow:hidden;padding:2px;white-space:pre-wrap;background:#fff",
    )
    classes = "oc_report_designer_preview__element"
    if kind:
        classes += f" oc_report_designer_preview__element--{html.escape(kind)}"
    if kind == "staticText":
        content = html.escape(str(element.get("text") or ""))
    elif kind == "textField":
        expression = (element.get("expression") or {}).get("source") if isinstance(element.get("expression"), Mapping) else ""
        base_style = _join_inline_style(base_style, "background:#eff6ff")
        preview_text = _preview_expression_text(str(expression or ""), sample_values)
        content = (
            '<span class="oc_report_designer_preview__expr" '
            'style="color:#1d4ed8;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;">'
            f"{html.escape(preview_text or 'campo')}</span>"
        )
    elif kind == "image":
        expression = (element.get("expression") or {}).get("source") if isinstance(element.get("expression"), Mapping) else ""
        base_style = _join_inline_style(base_style, "padding:0;background:#e5e7eb")
        qr_src = _cfdi_qr_barcode_src_from_sample_values(sample_values) if "qrcode" in str(expression or "").lower() or "?re=" in str(expression or "") else ""
        if qr_src:
            content = (
                f'<img class="oc_report_designer_preview__qr" src="{html.escape(qr_src, quote=True)}" '
                'style="display:block;height:100%;object-fit:contain;width:100%;" alt="Codigo QR CFDI"/>'
            )
        else:
            content = (
                '<span class="oc_report_designer_preview__image" '
                'style="align-items:center;box-sizing:border-box;display:flex;height:100%;justify-content:center;padding:2px;text-align:center;text-transform:uppercase;">'
                f"imagen {html.escape(_preview_expression_text(str(expression or ''), sample_values))}</span>"
            )
    elif kind == "line":
        content = ""
        classes += " oc_report_designer_preview__line"
        base_style = _join_inline_style(base_style, "border:0;border-top:1px solid #111827;background:transparent;padding:0")
    elif kind == "rectangle":
        content = ""
        classes += " oc_report_designer_preview__rectangle"
        base_style = _join_inline_style(base_style, "background:rgba(248,250,252,.45)")
    elif kind == "frame":
        child_html = "".join(
            _preview_element_html(child, offset_y=0, sample_values=sample_values)
            for child in element.get("children") or []
            if isinstance(child, Mapping)
        )
        content = child_html or '<span class="oc_report_designer_preview__muted" style="color:#64748b;">frame</span>'
        classes += " oc_report_designer_preview__frame"
        base_style = _join_inline_style(base_style, "background:rgba(248,250,252,.45)")
    elif kind == "componentElement":
        content = (
            '<span class="oc_report_designer_preview__component" '
            'style="background:#fef3c7;color:#92400e;display:inline-block;padding:2px 4px;">'
            f"{html.escape(str(element.get('component') or 'componente'))}</span>"
        )
    else:
        content = html.escape(kind or "elemento")
    return f"<div class=\"{classes}\" style=\"{base_style}\">{content}</div>"


def build_preview_html(
    blueprint: Mapping[str, Any],
    *,
    max_bands: int = 12,
    sample_values: Mapping[str, Any] | None = None,
) -> str:
    """Build a safe HTML preview that resembles the fixed-band JRXML canvas."""
    page = blueprint.get("page") if isinstance(blueprint.get("page"), Mapping) else {}
    width = int(page.get("width") or 612)
    bands = list(blueprint.get("bands") or [])[: max(int(max_bands or 0), 1)]
    current_y = 0
    band_html: list[str] = []
    element_html: list[str] = []
    for band in bands:
        if not isinstance(band, Mapping):
            continue
        height = max(int(band.get("height") or 1), 1)
        band_name = html.escape(str(band.get("name") or "band"))
        band_html.append(
            f"<div class=\"oc_report_designer_preview__band\" style=\"position:absolute;left:0;right:0;top:{current_y}px;height:{height}px;border-top:1px dashed #cbd5e1;color:#64748b;font-size:9px;line-height:1;pointer-events:none;\">"
            f"<span style=\"background:#f8fafc;padding:1px 4px;\">{band_name}</span></div>"
        )
        for element in band.get("elements") or []:
            if isinstance(element, Mapping):
                element_html.append(_preview_element_html(element, offset_y=current_y, sample_values=sample_values))
        current_y += height
    height = max(current_y, int(page.get("height") or 792))
    return (
        '<div class="oc_report_designer_preview" style="background:#f3f4f6;border:1px solid #d1d5db;box-sizing:border-box;max-width:100%;overflow:auto;padding:16px;">'
        f'<div class="oc_report_designer_preview__page" style="background:#fff;box-shadow:0 12px 30px rgba(15,23,42,.18);height:{height}px;margin:0 auto;position:relative;width:{width}px;">'
        f"{''.join(band_html)}{''.join(element_html)}</div></div>"
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
        sample_field_values.update(build_sample_field_values(blueprint, Path(sample_path)))
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
        "x_preview_html": build_preview_html(blueprint, sample_values=sample_field_values),
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
