"""Reusable report-template designer contracts and importers.

The module intentionally converts legacy designer files into a neutral
blueprint instead of executing their expressions.  Consumers can store the
blueprint in Odoo, render a safe preview, and progressively map expressions to
QWeb, Python, or another trusted renderer.
"""

from __future__ import annotations

import ast
import base64
from collections.abc import Mapping as MappingABC
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
JASPER_POINT_TO_CSS_PIXEL = 4 / 3
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


@dataclass(frozen=True)
class ReportDesignerExpressionTranslation:
    source: str
    python_source: str
    supported: bool
    notes: tuple[str, ...] = field(default_factory=tuple)

    def to_dict(self) -> dict[str, Any]:
        return {
            "source_language": "jrxml-java-groovy-subset",
            "target_language": "python",
            "python_source": self.python_source,
            "supported": self.supported,
            "notes": list(self.notes),
            "safe_eval": "opt-in",
        }


_STRING_LITERAL_RE = re.compile(r'("(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\')')
_REF_CALL_RE = r'(?:field|param|var)\("[^"]+"\)'
_STRING_VALUE_RE = r'(?:"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\')'
_SIMPLE_CALL_RE = rf"(?:{_REF_CALL_RE}|{_STRING_VALUE_RE}|[A-Za-z_]\w*\([^()]*\))"
_ARGUMENTS_RE = r"((?:[^()]|\([^()]*\))*)"
_ALLOWED_EXPRESSION_FUNCTIONS = {
    "contains",
    "contains_key",
    "decimal_format",
    "decimal_formatter",
    "equals",
    "field",
    "format_us",
    "is_empty",
    "length",
    "map_get",
    "param",
    "regex_replace",
    "to_float",
    "to_int",
    "to_string",
    "to_upper",
    "trim",
    "var",
}
_ALLOWED_EXPRESSION_AST_NODES = (
    ast.Expression,
    ast.Constant,
    ast.Name,
    ast.Load,
    ast.Call,
    ast.BinOp,
    ast.Add,
    ast.Sub,
    ast.Mult,
    ast.Div,
    ast.FloorDiv,
    ast.Mod,
    ast.BoolOp,
    ast.And,
    ast.Or,
    ast.UnaryOp,
    ast.Not,
    ast.USub,
    ast.UAdd,
    ast.Compare,
    ast.Eq,
    ast.NotEq,
    ast.Is,
    ast.IsNot,
    ast.Lt,
    ast.LtE,
    ast.Gt,
    ast.GtE,
    ast.IfExp,
    ast.Dict,
    ast.List,
    ast.Tuple,
)


def _replace_outside_string_literals(value: str, replacer: Any) -> str:
    parts = _STRING_LITERAL_RE.split(str(value or ""))
    for index, part in enumerate(parts):
        if index % 2 == 0 and part:
            parts[index] = replacer(part)
    return "".join(parts)


def _without_string_literals(value: str) -> str:
    parts = _STRING_LITERAL_RE.split(str(value or ""))
    for index in range(1, len(parts), 2):
        parts[index] = '""'
    return "".join(parts)


def _normalize_string_literals(value: str) -> str:
    parts = _STRING_LITERAL_RE.split(str(value or ""))
    for index in range(1, len(parts), 2):
        parts[index] = re.sub(r"\\+\$", "$", parts[index])
    return "".join(parts)


def _replace_java_keywords(value: str) -> str:
    def replace_segment(segment: str) -> str:
        segment = re.sub(r"\bnull\b", "None", segment)
        segment = re.sub(r"\btrue\b", "True", segment, flags=re.IGNORECASE)
        segment = re.sub(r"\bfalse\b", "False", segment, flags=re.IGNORECASE)
        segment = segment.replace("&&", " and ").replace("||", " or ")
        segment = re.sub(r"!(?!=)", " not ", segment)
        return segment

    return _replace_outside_string_literals(value, replace_segment)


def _strip_balanced_outer_parentheses(value: str) -> str:
    text = str(value or "").strip()
    while text.startswith("(") and text.endswith(")"):
        depth = 0
        quote = ""
        escaped = False
        balanced_at_end = False
        for index, char in enumerate(text):
            if quote:
                escaped = (char == "\\" and not escaped)
                if char == quote and not escaped:
                    quote = ""
                elif char != "\\":
                    escaped = False
                continue
            if char in {"'", '"'}:
                quote = char
                escaped = False
                continue
            if char == "(":
                depth += 1
            elif char == ")":
                depth -= 1
                if depth == 0:
                    balanced_at_end = index == len(text) - 1
                    break
        if not balanced_at_end:
            return text
        text = text[1:-1].strip()
    return text


def _split_top_level_args(value: str) -> list[str]:
    args: list[str] = []
    start = 0
    depth = 0
    quote = ""
    escaped = False
    for index, char in enumerate(value):
        if quote:
            escaped = (char == "\\" and not escaped)
            if char == quote and not escaped:
                quote = ""
            elif char != "\\":
                escaped = False
            continue
        if char in {"'", '"'}:
            quote = char
            escaped = False
            continue
        if char in "([{":
            depth += 1
        elif char in ")]}":
            depth = max(depth - 1, 0)
        elif char == "," and depth == 0:
            args.append(value[start:index].strip())
            start = index + 1
    tail = value[start:].strip()
    if tail:
        args.append(tail)
    return args


def _split_top_level_key_value(value: str) -> tuple[str, str] | None:
    depth = 0
    quote = ""
    escaped = False
    for index, char in enumerate(value):
        if quote:
            escaped = (char == "\\" and not escaped)
            if char == quote and not escaped:
                quote = ""
            elif char != "\\":
                escaped = False
            continue
        if char in {"'", '"'}:
            quote = char
            escaped = False
            continue
        if char in "([{":
            depth += 1
        elif char in ")]}":
            depth = max(depth - 1, 0)
        elif char == ":" and depth == 0:
            return value[:index].strip(), value[index + 1 :].strip()
    return None


def _find_matching_paren(value: str, open_index: int) -> int:
    depth = 0
    quote = ""
    escaped = False
    for index in range(open_index, len(value)):
        char = value[index]
        if quote:
            escaped = (char == "\\" and not escaped)
            if char == quote and not escaped:
                quote = ""
            elif char != "\\":
                escaped = False
            continue
        if char in {"'", '"'}:
            quote = char
            escaped = False
            continue
        if char == "(":
            depth += 1
        elif char == ")":
            depth -= 1
            if depth == 0:
                return index
    return -1


def _split_java_ternary(value: str) -> tuple[str, str, str] | None:
    text = _strip_balanced_outer_parentheses(value)
    depth = 0
    quote = ""
    escaped = False
    question_index = -1
    nested_ternaries = 0
    for index, char in enumerate(text):
        if quote:
            escaped = (char == "\\" and not escaped)
            if char == quote and not escaped:
                quote = ""
            elif char != "\\":
                escaped = False
            continue
        if char in {"'", '"'}:
            quote = char
            escaped = False
            continue
        if char in "([{":
            depth += 1
            continue
        if char in ")]}":
            depth = max(depth - 1, 0)
            continue
        if depth != 0:
            continue
        if char == "," and question_index == -1:
            return None
        if char == "?":
            if question_index == -1:
                question_index = index
            nested_ternaries += 1
        elif char == ":" and question_index != -1:
            nested_ternaries -= 1
            if nested_ternaries == 0:
                return (
                    text[:question_index].strip(),
                    text[question_index + 1 : index].strip(),
                    text[index + 1 :].strip(),
                )
    return None


def _translate_java_ternary(value: str) -> str:
    text = _strip_balanced_outer_parentheses(value)
    split = _split_java_ternary(text)
    if split is None:
        return text
    condition, true_value, false_value = split
    return (
        f"({_translate_java_ternary(true_value)} "
        f"if {_translate_java_ternary(condition)} "
        f"else {_translate_java_ternary(false_value)})"
    )


def _rewrite_parenthesized_ternaries(value: str) -> str:
    text = str(value or "")
    for _ in range(12):
        stack: list[int] = []
        quote = ""
        escaped = False
        changed = False
        for index, char in enumerate(text):
            if quote:
                escaped = (char == "\\" and not escaped)
                if char == quote and not escaped:
                    quote = ""
                elif char != "\\":
                    escaped = False
                continue
            if char in {"'", '"'}:
                quote = char
                escaped = False
                continue
            if char == "(":
                stack.append(index)
            elif char == ")" and stack:
                open_index = stack.pop()
                content = text[open_index + 1 : index]
                if _split_java_ternary(content) is None:
                    continue
                replacement = _translate_java_ternary(content)
                text = text[:open_index] + replacement + text[index + 1 :]
                changed = True
                break
        if not changed:
            return text
    return text


def _rewrite_function_arg_ternaries(value: str) -> str:
    text = str(value or "")
    function_pattern = re.compile(rf"\b({'|'.join(sorted(_ALLOWED_EXPRESSION_FUNCTIONS))})\(")
    search_start = 0
    while True:
        match = function_pattern.search(text, search_start)
        if not match:
            return text
        open_index = match.end() - 1
        close_index = _find_matching_paren(text, open_index)
        if close_index == -1:
            return text
        args = _split_top_level_args(text[open_index + 1 : close_index])
        rewritten_args: list[str] = []
        changed = False
        for arg in args:
            rewritten_arg = _rewrite_parenthesized_ternaries(arg)
            if _split_java_ternary(rewritten_arg) is not None:
                rewritten_arg = _translate_java_ternary(rewritten_arg)
            changed = changed or rewritten_arg != arg
            rewritten_args.append(rewritten_arg)
        if changed:
            replacement = f"{match.group(1)}({', '.join(rewritten_args)})"
            text = text[: match.start()] + replacement + text[close_index + 1 :]
            search_start = match.start() + len(replacement)
        else:
            search_start = close_index + 1


def _rewrite_embedded_ternaries(value: str) -> str:
    text = _rewrite_parenthesized_ternaries(value)
    text = _rewrite_function_arg_ternaries(text)
    if _split_java_ternary(text) is not None:
        text = _translate_java_ternary(text)
    return text


def _replace_jasper_refs(value: str) -> str:
    def replace_ref(match: re.Match[str]) -> str:
        kind = match.group(1)
        name = match.group(2).replace("\\", "\\\\").replace('"', '\\"')
        helper = {"F": "field", "P": "param", "V": "var"}[kind]
        return f'{helper}("{name}")'

    return re.sub(r"\$([FPV])\{([^}]+)\}", replace_ref, value)


def _rewrite_groovy_map_literal(value: str) -> str:
    text = _strip_balanced_outer_parentheses(value)
    if not text.startswith("[") or not text.endswith("]"):
        return value
    entries = _split_top_level_args(text[1:-1])
    if not entries:
        return "{}"
    rewritten_entries: list[str] = []
    for entry in entries:
        split = _split_top_level_key_value(entry)
        if split is None:
            return value
        key, item_value = split
        rewritten_entries.append(f"{key}: {item_value}")
    return "{" + ", ".join(rewritten_entries) + "}"


def _rewrite_simple_methods(value: str) -> str:
    text = value
    no_arg_methods = {
        "toUpperCase": "to_upper",
        "toString": "to_string",
        "toDouble": "to_float",
        "doubleValue": "to_float",
        "intValue": "to_int",
        "trim": "trim",
        "isEmpty": "is_empty",
        "length": "length",
    }
    for _ in range(4):
        previous = text
        for java_method, helper in no_arg_methods.items():
            text = re.sub(
                rf"(?P<base>{_SIMPLE_CALL_RE})\.{java_method}\(\)",
                lambda match, fn=helper: f'{fn}({match.group("base")})',
                text,
            )
        arg_methods = {
            "contains": "contains",
            "containsKey": "contains_key",
            "equals": "equals",
            "get": "map_get",
            "replaceAll": "regex_replace",
        }
        for java_method, helper in arg_methods.items():
            text = re.sub(
                rf"(?P<base>{_SIMPLE_CALL_RE})\.{java_method}\({_ARGUMENTS_RE}\)",
                lambda match, fn=helper: f'{fn}({match.group("base")}, {match.group(2).strip()})',
                text,
            )
        if text == previous:
            break
    return text


def _rewrite_string_format_calls(value: str) -> str:
    text = value
    needle = "String.format("
    start = text.find(needle)
    while start != -1:
        open_index = start + len("String.format")
        close_index = _find_matching_paren(text, open_index)
        if close_index == -1:
            break
        args = _split_top_level_args(text[open_index + 1 : close_index])
        if args and args[0] == "Locale.US":
            args = args[1:]
        if len(args) >= 2:
            replacement = f"format_us({', '.join(args)})"
            text = text[:start] + replacement + text[close_index + 1 :]
            start = text.find(needle, start + len(replacement))
        else:
            start = text.find(needle, close_index + 1)
    return text


def _rewrite_decimal_format_calls(value: str) -> str:
    pattern = re.compile(
        r"new\s+(?:java\.text\.)?DecimalFormat\((?P<format>\"(?:\\.|[^\"\\])*\"|'(?:\\.|[^'\\])*')\)\.format\("
    )
    text = value
    search_start = 0
    while True:
        match = pattern.search(text, search_start)
        if not match:
            return text
        open_index = match.end() - 1
        close_index = _find_matching_paren(text, open_index)
        if close_index == -1:
            return text
        expression = text[open_index + 1 : close_index].strip()
        replacement = f"decimal_format({match.group('format')}, {expression})"
        text = text[: match.start()] + replacement + text[close_index + 1 :]
        search_start = match.start() + len(replacement)


def _rewrite_decimal_format_constructors(value: str) -> str:
    return re.sub(
        r"new\s+(?:java\.text\.)?DecimalFormat\((?P<format>\"(?:\\.|[^\"\\])*\"|'(?:\\.|[^'\\])*')\)",
        lambda match: f"decimal_formatter({match.group('format')})",
        value,
    )


def _validate_python_expression_ast(python_source: str) -> tuple[bool, list[str]]:
    notes: list[str] = []
    try:
        parsed = ast.parse(python_source, mode="eval")
    except SyntaxError as exc:
        return False, [f"python-parse-error:{exc.msg}"]
    for node in ast.walk(parsed):
        if not isinstance(node, _ALLOWED_EXPRESSION_AST_NODES):
            return False, [f"unsupported-python-node:{node.__class__.__name__}"]
        if isinstance(node, ast.Call):
            if not isinstance(node.func, ast.Name) or node.func.id not in _ALLOWED_EXPRESSION_FUNCTIONS:
                return False, ["unsupported-python-call"]
        if isinstance(node, ast.Name) and node.id not in _ALLOWED_EXPRESSION_FUNCTIONS and node.id not in {"None", "True", "False"}:
            return False, [f"unsupported-python-name:{node.id}"]
    notes.append("safe-python-subset")
    return True, notes


def translate_jrxml_expression_to_python(source: str) -> dict[str, Any]:
    """Translate a conservative JRXML Java/Groovy expression subset to Python."""
    original = str(source or "").strip()
    if not original:
        return ReportDesignerExpressionTranslation(original, "", False, ("empty-expression",)).to_dict()
    notes: list[str] = []
    python_source = _replace_jasper_refs(original)
    python_source = _replace_java_keywords(python_source)
    python_source = _rewrite_groovy_map_literal(python_source)
    python_source = _rewrite_simple_methods(python_source)
    python_source = _rewrite_embedded_ternaries(python_source)
    python_source = _rewrite_string_format_calls(python_source)
    python_source = _rewrite_decimal_format_calls(python_source)
    python_source = _rewrite_decimal_format_constructors(python_source)
    python_source = _rewrite_simple_methods(python_source)
    python_source = _rewrite_embedded_ternaries(python_source)
    python_source = _normalize_string_literals(python_source)
    unsupported_markers = [
        (r"\$[FPV]\{", "untranslated-jasper-reference"),
        (r"\bnew\s+", "unsupported-java-constructor"),
        (r"\bString\.", "unsupported-java-string-format"),
        (r"\bLocale\.", "unsupported-java-locale"),
        (r"\.[A-Za-z_]\w*\(", "unsupported-java-method"),
    ]
    searchable_python_source = _without_string_literals(python_source)
    for pattern, note in unsupported_markers:
        if re.search(pattern, searchable_python_source):
            notes.append(note)
    supported, ast_notes = _validate_python_expression_ast(python_source)
    notes.extend(ast_notes)
    if notes and any(note.startswith(("unsupported-", "untranslated-", "python-parse-error")) for note in notes):
        supported = False
    return ReportDesignerExpressionTranslation(original, python_source, supported, tuple(dict.fromkeys(notes))).to_dict()


def _case_insensitive_lookup(values: Mapping[str, Any] | None, name: str) -> Any:
    if not values:
        return None
    if name in values:
        return values[name]
    clean_name = str(name or "").strip().lower()
    for key, value in values.items():
        if str(key or "").strip().lower() == clean_name:
            return value
    return None


def _java_bool_text(value: bool) -> str:
    return "true" if value else "false"


def evaluate_jrxml_python_expression(
    source: str,
    *,
    fields: Mapping[str, Any] | None = None,
    parameters: Mapping[str, Any] | None = None,
    variables: Mapping[str, Any] | None = None,
) -> Any:
    """Evaluate a translated JRXML expression inside a tiny Python allow-list."""
    translation = translate_jrxml_expression_to_python(source)
    if not translation.get("supported"):
        return None
    python_source = str(translation.get("python_source") or "")

    def field_value(name: str) -> Any:
        return _case_insensitive_lookup(fields, name)

    def param_value(name: str) -> Any:
        return _case_insensitive_lookup(parameters, name)

    def var_value(name: str) -> Any:
        return _case_insensitive_lookup(variables, name)

    def to_string(value: Any) -> str:
        if value is None:
            return ""
        if isinstance(value, bool):
            return _java_bool_text(value)
        return str(value)

    def to_float(value: Any) -> float:
        if value in (None, ""):
            return 0.0
        try:
            return float(str(value).replace(",", ""))
        except (TypeError, ValueError):
            return 0.0

    def to_int(value: Any) -> int:
        return int(to_float(value))

    def format_us(format_spec: str, *values: Any) -> str:
        spec = str(format_spec or "")
        if spec.startswith("%"):
            spec = spec[1:]
        if not values:
            return ""
        if spec.endswith("s"):
            return spec[:-1] + to_string(values[0])
        try:
            return format(to_float(values[0]), spec)
        except (TypeError, ValueError):
            return to_string(values[0])

    def decimal_format(pattern: str, value: Any) -> str:
        clean_pattern = str(pattern or "")
        decimals = len(clean_pattern.split(".", 1)[1]) if "." in clean_pattern else 0
        integer_pattern = clean_pattern.split(".", 1)[0]
        integer_width = integer_pattern.count("0")
        decimal_value = Decimal(str(to_float(value))).quantize(
            Decimal("1") if decimals == 0 else Decimal("1." + ("0" * decimals)),
            rounding=ROUND_HALF_UP,
        )
        sign = "-" if decimal_value < 0 else ""
        text = format(abs(decimal_value), f".{decimals}f")
        integer, _, fractional = text.partition(".")
        integer = integer.zfill(integer_width)
        return sign + integer + (("." + fractional) if decimals else "")

    def map_get(mapping: Any, key: Any) -> Any:
        if isinstance(mapping, Mapping):
            if key in mapping:
                return mapping[key]
            return mapping.get(to_string(key))
        return None

    def contains(value: Any, needle: Any) -> bool:
        if value is None:
            return False
        if isinstance(value, Mapping):
            return needle in value or to_string(needle) in value
        return to_string(needle) in to_string(value)

    def regex_replace(value: Any, pattern: Any, replacement: Any) -> str:
        replacement_text = re.sub(r"\$(\d+)", r"\\\1", to_string(replacement).replace(r"\$", "$"))
        return re.sub(str(pattern or ""), replacement_text, to_string(value))

    helpers = {
        "contains": contains,
        "contains_key": contains,
        "decimal_format": decimal_format,
        "decimal_formatter": lambda pattern: {"type": "decimal_format", "pattern": str(pattern or "")},
        "equals": lambda value, other: value == other or to_string(value) == to_string(other),
        "field": field_value,
        "format_us": format_us,
        "is_empty": lambda value: to_string(value) == "",
        "length": lambda value: len(to_string(value)),
        "map_get": map_get,
        "param": param_value,
        "regex_replace": regex_replace,
        "to_float": to_float,
        "to_int": to_int,
        "to_string": to_string,
        "to_upper": lambda value: to_string(value).upper(),
        "trim": lambda value: to_string(value).strip(),
        "var": var_value,
    }
    try:
        parsed = ast.parse(python_source, mode="eval")
        code = compile(parsed, "<jrxml-expression>", "eval")
        return eval(code, {"__builtins__": {}}, helpers)
    except Exception:
        return None


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


def _resolve_dataset_field_value(root: ET.Element, row_node: ET.Element, description: str, *, fallback_name: str = "") -> str:
    candidates = [candidate.strip() for candidate in str(description or "").split("|") if candidate.strip()]
    if fallback_name:
        candidates.extend(CFDI_FIELD_FALLBACK_PATHS.get(fallback_name.lower(), ()))
        candidates.append(f"@{fallback_name}")
        candidates.append(fallback_name)
    for candidate in candidates:
        source_node = root if candidate.startswith("/") else row_node
        value = _resolve_xml_path_value(source_node, candidate)
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


def _child_node_by_name(node: ET.Element, name: str) -> ET.Element | None:
    for child in list(node):
        if _xml_node_matches_segment(child, name):
            return child
    return None


def _concept_dataset_nodes(root: ET.Element, sample_values: Mapping[str, Any] | None = None) -> list[ET.Element]:
    serie = (_sample_value(sample_values, "serie") or _xml_attr_value(root, "Serie") or _xml_attr_value(root, "serie")).upper()
    if serie == "A":
        especiales = _child_node_by_name(root, "Especiales")
        especiales_conceptos = _child_node_by_name(especiales, "Conceptos") if especiales is not None else None
        nodes = _xml_child_nodes_by_name([especiales_conceptos], "Concepto") if especiales_conceptos is not None else []
        if nodes:
            return nodes
    conceptos = _child_node_by_name(root, "Conceptos")
    nodes = _xml_child_nodes_by_name([conceptos], "Concepto") if conceptos is not None else []
    if nodes:
        return nodes
    return _xml_descendants_by_name(root, "Concepto")


def _sample_dataset_rows(root: ET.Element, blueprint: Mapping[str, Any], sample_values: Mapping[str, Any]) -> dict[str, list[dict[str, str]]]:
    rows_by_dataset: dict[str, list[dict[str, str]]] = {}
    for dataset in blueprint.get("datasets") or []:
        if not isinstance(dataset, Mapping):
            continue
        dataset_name = str(dataset.get("name") or "").strip()
        if not dataset_name:
            continue
        if dataset_name == "Conceptos":
            row_nodes = _concept_dataset_nodes(root, sample_values)
        else:
            row_nodes = []
        if not row_nodes:
            continue
        dataset_rows: list[dict[str, str]] = []
        for row_node in row_nodes:
            row_values: dict[str, str] = {}
            for field_spec in dataset.get("fields") or []:
                if not isinstance(field_spec, Mapping):
                    continue
                field_name = str(field_spec.get("name") or "").strip()
                if not field_name:
                    continue
                description = str(field_spec.get("description") or "").strip()
                value = _resolve_dataset_field_value(root, row_node, description, fallback_name=field_name)
                if value:
                    row_values[field_name] = value
            if row_values:
                dataset_rows.append(row_values)
        if dataset_rows:
            rows_by_dataset[dataset_name] = dataset_rows
    return rows_by_dataset


def build_sample_field_values(
    blueprint: Mapping[str, Any],
    sample_xml_source: str | bytes | Path,
) -> dict[str, Any]:
    """Resolve JRXML field names against one sample XML document.

    Field descriptions may contain one or more XML paths separated by `|`, such
    as `TimbreFiscalDigital/@UUID|TimbreFiscalDigital/@uUID`.
    """
    if isinstance(sample_xml_source, Path):
        source_text = sample_xml_source.read_text(encoding="utf-8")
    else:
        source_text = sample_xml_source.decode("utf-8") if isinstance(sample_xml_source, bytes) else str(sample_xml_source or "")
    root = ET.fromstring(source_text)
    values: dict[str, Any] = {}
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
    dataset_rows = _sample_dataset_rows(root, blueprint, values)
    if dataset_rows:
        values["__datasets__"] = dataset_rows
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
            list_contents = _first_child(child, "listContents")
            if list_contents is not None:
                payload["list_contents"] = {
                    "height": _int_attr(list_contents, "height"),
                    "width": _int_attr(list_contents, "width"),
                    "elements": [
                        _parse_element(grandchild)
                        for grandchild in list(list_contents)
                        if _local_name(grandchild.tag) not in {"property"}
                    ],
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
                    translation = translate_jrxml_expression_to_python(source)
                    expressions.append(
                        {
                            "path": f"{path}.{expression_key}" if path else expression_key,
                            "source": source,
                            "refs": _expression_refs(source),
                            "python": translation,
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
        translation = translate_jrxml_expression_to_python(source)
        expressions.append(
            {
                "index": index,
                "tag": tag,
                "source": source,
                "refs": _expression_refs(source),
                "python": translation,
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


def _css_px(value: float) -> str:
    rounded = round(float(value or 0), 2)
    if abs(rounded - round(rounded)) < 0.01:
        return f"{int(round(rounded))}px"
    return f"{rounded:.2f}".rstrip("0").rstrip(".") + "px"


def _scaled(value: Any, scale: float) -> float:
    return float(value or 0) * float(scale or 1)


def _style_from_geometry(
    geometry: Mapping[str, Any],
    *,
    offset_x: int = 0,
    offset_y: int = 0,
    scale: float = 1.0,
) -> str:
    x = int(geometry.get("x") or 0) + int(offset_x or 0)
    y = int(geometry.get("y") or 0) + int(offset_y or 0)
    width = max(int(geometry.get("width") or 0), 1)
    height = max(int(geometry.get("height") or 0), 1)
    return (
        f"left:{_css_px(_scaled(x, scale))};top:{_css_px(_scaled(y, scale))};"
        f"width:{_css_px(_scaled(width, scale))};height:{_css_px(_scaled(height, scale))};"
    )


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


def _font_css(text_style: Mapping[str, Any] | None, *, scale: float = 1.0) -> str:
    font = text_style.get("font") if isinstance(text_style, Mapping) and isinstance(text_style.get("font"), Mapping) else {}
    css = ["font-family:Arial,Helvetica,sans-serif", "line-height:1.05"]
    size = str(font.get("size") or "").strip()
    if size.isdigit():
        css.append(f"font-size:{_css_px(_scaled(int(size), scale))}")
    else:
        css.append(f"font-size:{_css_px(_scaled(8, scale))}")
    if _truthy_text(font.get("isBold")):
        css.append("font-weight:700")
    if _truthy_text(font.get("isItalic")):
        css.append("font-style:italic")
    if _truthy_text(font.get("isUnderline")):
        css.append("text-decoration:underline")
    return ";".join(css)


def _text_alignment_css(text_style: Mapping[str, Any] | None, *, allow_vertical: bool = True) -> str:
    if not isinstance(text_style, Mapping):
        return ""
    css: list[str] = []
    horizontal = str(text_style.get("textAlignment") or "").strip().lower()
    if horizontal in {"left", "center", "right", "justify"}:
        css.append(f"text-align:{horizontal}")
    vertical = str(text_style.get("verticalAlignment") or "").strip().lower()
    if not allow_vertical:
        return ";".join(css)
    if vertical == "middle":
        css.extend(["display:flex", "align-items:center"])
        if horizontal == "center":
            css.append("justify-content:center")
        elif horizontal == "right":
            css.append("justify-content:flex-end")
    elif vertical == "bottom":
        css.extend(["display:flex", "align-items:flex-end"])
    return ";".join(css)


def _padding_css(
    box: Mapping[str, Any] | None = None,
    named_box: Mapping[str, Any] | None = None,
    *,
    scale: float = 1.0,
) -> str:
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
            css.append(f"{css_key}:{_css_px(_scaled(int(value), scale))}")
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
    scale: float = 1.0,
) -> str:
    geometry = element.get("geometry") if isinstance(element.get("geometry"), Mapping) else {}
    report_element = element.get("report_element") if isinstance(element.get("report_element"), Mapping) else {}
    forecolor = _css_color(report_element.get("forecolor"), "#000000")
    mode = str(report_element.get("mode") or "").strip().lower()
    backcolor = _css_color(report_element.get("backcolor"), default_background)
    background = backcolor if mode == "opaque" else default_background
    return _join_inline_style(
        _style_from_geometry(geometry, offset_x=offset_x, offset_y=offset_y, scale=scale),
        "position:absolute;box-sizing:border-box;overflow:hidden;white-space:pre-wrap",
        f"border:{default_border}",
        f"color:{forecolor}",
        f"background:{background}",
    )


def _longest_text_token_length(value: str) -> int:
    tokens = re.split(r"\s+", str(value or "").strip())
    return max((len(token) for token in tokens), default=0)


def _text_needs_free_flow(value: str) -> bool:
    text = str(value or "")
    return "\n" in text or len(text) > 52 or _longest_text_token_length(text) > 38


def _text_flow_css(element: Mapping[str, Any], preview_text: str, *, scale: float = 1.0) -> str:
    css = ["overflow-wrap:anywhere", "word-break:break-word"]
    if _truthy_text(element.get("stretch_with_overflow")) and _text_needs_free_flow(preview_text):
        geometry = element.get("geometry") if isinstance(element.get("geometry"), Mapping) else {}
        height = max(int(geometry.get("height") or 0), 1)
        css.extend(
            [
                "display:block",
                "height:auto",
                f"min-height:{_css_px(_scaled(height, scale))}",
                "overflow:visible",
            ]
        )
    return ";".join(css)


def _geometry_int(element: Mapping[str, Any], key: str, default: int = 0) -> int:
    geometry = element.get("geometry") if isinstance(element.get("geometry"), Mapping) else {}
    try:
        return int(float(geometry.get(key) or default))
    except (TypeError, ValueError):
        return default


def _report_element(element: Mapping[str, Any]) -> Mapping[str, Any]:
    report_element = element.get("report_element") if isinstance(element.get("report_element"), Mapping) else {}
    return report_element


def _is_float_position(element: Mapping[str, Any]) -> bool:
    kind = str(element.get("type") or "")
    if kind in {"line", "rectangle"} and "RelativeToBandHeight" in str(_report_element(element).get("stretchType") or ""):
        return False
    return str(_report_element(element).get("positionType") or "").strip().lower() == "float"


def _font_size_points(element: Mapping[str, Any]) -> int:
    text_style = element.get("text_style") if isinstance(element.get("text_style"), Mapping) else {}
    font = text_style.get("font") if isinstance(text_style.get("font"), Mapping) else {}
    size = str(font.get("size") or "").strip()
    return int(size) if size.isdigit() else 8


def _horizontal_padding_points(element: Mapping[str, Any], styles: Mapping[str, Any] | None) -> int:
    box = element.get("box") if isinstance(element.get("box"), Mapping) else {}
    named_box = _effective_named_box(element, styles)
    merged: dict[str, Any] = {}
    if isinstance(named_box, Mapping):
        merged.update(named_box)
    if isinstance(box, Mapping):
        merged.update(box)
    total = 0
    for key in ("padding", "leftPadding", "rightPadding"):
        value = str(merged.get(key) or "").strip()
        if value.lstrip("-").isdigit():
            total += int(value)
    return max(total, 0)


def _preview_text_for_element(element: Mapping[str, Any], sample_values: Mapping[str, Any] | None) -> str:
    kind = str(element.get("type") or "")
    if kind == "staticText":
        return str(element.get("text") or "")
    if kind == "textField":
        expression = (element.get("expression") or {}).get("source") if isinstance(element.get("expression"), Mapping) else ""
        return _preview_expression_text(str(expression or ""), sample_values)
    return ""


def _estimate_wrapped_text_height_points(
    element: Mapping[str, Any],
    preview_text: str,
    *,
    styles: Mapping[str, Any] | None,
) -> int:
    base_height = max(_geometry_int(element, "height", 1), 1)
    if not (_truthy_text(element.get("stretch_with_overflow")) and _text_needs_free_flow(preview_text)):
        return base_height
    width = max(_geometry_int(element, "width", 1) - _horizontal_padding_points(element, styles), 1)
    font_size = max(_font_size_points(element), 1)
    average_char_width = max(font_size * 0.62, 1)
    chars_per_line = max(int(width / average_char_width), 1)
    logical_lines = str(preview_text or "").splitlines() or [""]
    line_count = 0
    for line in logical_lines:
        clean_line = line.rstrip()
        line_count += max(1, (len(clean_line) + chars_per_line - 1) // chars_per_line)
    estimated = int((line_count * font_size * 1.05) + 0.999)
    return max(base_height, estimated)


def _element_effective_height(
    element: Mapping[str, Any],
    *,
    sample_values: Mapping[str, Any] | None,
    styles: Mapping[str, Any] | None,
) -> int:
    if not _print_when_allows(element, sample_values):
        return 0
    kind = str(element.get("type") or "")
    base_height = max(_geometry_int(element, "height", 1), 1)
    if kind in {"staticText", "textField"}:
        return _estimate_wrapped_text_height_points(
            element,
            _preview_text_for_element(element, sample_values),
            styles=styles,
        )
    if kind == "frame":
        children = [child for child in element.get("children") or [] if isinstance(child, Mapping)]
        _, content_height = _flowed_child_layout(children, sample_values=sample_values, styles=styles)
        return max(base_height, content_height)
    if kind == "componentElement":
        dataset_run = element.get("dataset_run") if isinstance(element.get("dataset_run"), Mapping) else {}
        dataset_name = str(dataset_run.get("sub_dataset") or "").strip()
        rows = _sample_dataset_values(sample_values, dataset_name)
        list_contents = element.get("list_contents") if isinstance(element.get("list_contents"), Mapping) else {}
        row_height = int(list_contents.get("height") or base_height or 1)
        content_elements = [child for child in list_contents.get("elements") or [] if isinstance(child, Mapping)]
        if not rows or not content_elements:
            return base_height
        rendered_height = 0
        for row_values in rows[:20]:
            row_sample_values = _merged_sample_values(sample_values, row_values)
            _, row_content_height = _flowed_child_layout(content_elements, sample_values=row_sample_values, styles=styles)
            rendered_height += max(row_height, row_content_height or row_height)
        return max(base_height, rendered_height)
    return base_height


def _flowed_child_layout(
    children: Sequence[Mapping[str, Any]],
    *,
    sample_values: Mapping[str, Any] | None,
    styles: Mapping[str, Any] | None,
) -> tuple[list[tuple[Mapping[str, Any], int, int]], int]:
    layout: list[tuple[Mapping[str, Any], int, int]] = []
    growth_bottom = 0
    content_bottom = 0
    for child in children:
        if not isinstance(child, Mapping) or not _print_when_allows(child, sample_values):
            continue
        original_y = _geometry_int(child, "y", 0)
        base_height = max(_geometry_int(child, "height", 1), 1)
        adjusted_y = max(original_y, growth_bottom) if _is_float_position(child) else original_y
        effective_height = _element_effective_height(child, sample_values=sample_values, styles=styles)
        content_bottom = max(content_bottom, adjusted_y + effective_height)
        if adjusted_y > original_y or effective_height > base_height:
            growth_bottom = max(growth_bottom, adjusted_y + effective_height)
        layout.append((child, adjusted_y, effective_height))
    return layout, content_bottom


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


def _format_preview_amount(value: Any, decimals: int = 2) -> str:
    try:
        decimal_value = Decimal(str(value or "0")).quantize(Decimal("1." + ("0" * decimals)), rounding=ROUND_HALF_UP)
        return f"{decimal_value:,.{decimals}f}"
    except Exception:
        return str(value or "")


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


def _format_address_block(sample_values: Mapping[str, Any] | None, prefix: str) -> str:
    street = _sample_value(sample_values, f"calle{prefix}")
    exterior = _sample_value(sample_values, f"noExt{prefix}")
    interior = _sample_value(sample_values, f"noInt{prefix}")
    colony = _sample_value(sample_values, f"colonia{prefix}")
    postal_code = _sample_value(sample_values, f"cp{prefix}")
    locality = _sample_value(sample_values, f"localidad{prefix}")
    municipality = _sample_value(sample_values, f"municipio{prefix}")
    state = _sample_value(sample_values, f"estado{prefix}")
    country = _sample_value(sample_values, f"pais{prefix}")
    street_line = " ".join(part for part in (street, f"No. {exterior}" if exterior else "", f"Int. {interior}" if interior else "") if part)
    city_line = " ".join(part for part in (colony, f"C.P. {postal_code}" if postal_code else "") if part)
    region_line = ", ".join(part for part in (locality, municipality, state, country) if part)
    return _join_preview_lines(street_line, city_line, region_line)


def _cfdi_type_display(sample_values: Mapping[str, Any] | None) -> str:
    value = _sample_value(sample_values, "tipoDeComprobante")
    labels = {
        "I": "I - Ingreso",
        "E": "E - Egreso",
        "T": "T - Traslado",
        "P": "P - Pago",
        "N": "N - Nomina",
    }
    return labels.get(value, value)


def _payment_terms_block(sample_values: Mapping[str, Any] | None) -> str:
    return _join_preview_lines(
        f"Metodo de Pago: {_sample_value(sample_values, 'metodoDePago')}" if _sample_value(sample_values, "metodoDePago") else "Metodo de Pago:",
        f"Forma de pago: {_sample_value(sample_values, 'formaDePago')}" if _sample_value(sample_values, "formaDePago") else "Forma de pago:",
        f"Uso CFDI: {_sample_value(sample_values, 'usoCfdi')}" if _sample_value(sample_values, "usoCfdi") else "",
        f"Tipo de Comprobante: {_cfdi_type_display(sample_values)}" if _cfdi_type_display(sample_values) else "",
    )


def _legend_block(sample_values: Mapping[str, Any] | None) -> str:
    return _join_preview_lines(
        f"Importe con letra: {_sample_value(sample_values, 'cantidadLetra')}" if _sample_value(sample_values, "cantidadLetra") else "",
        f"Documento de Referencia: {_sample_value(sample_values, 'referenciaMensaje')}" if _sample_value(sample_values, "referenciaMensaje") else "",
    )


def _special_preview_expression_text(source: str, sample_values: Mapping[str, Any] | None = None) -> str:
    if "$F{idReceptor}.contains" in source and "802442" in source:
        id_receptor = _sample_value(sample_values, "idReceptor")
        if "802442" not in id_receptor:
            return ""
    if "$F{claveProdServ}" in source and "$F{descripcion}" in source:
        clave = _sample_value(sample_values, "claveProdServ")
        descripcion = _sample_value(sample_values, "descripcion")
        return f"{clave} - {descripcion}".strip(" -")
    if "$F{cantidad}.toDouble()" in source:
        cantidad = _format_preview_amount(_sample_value(sample_values, "cantidad"), 2)
        unidad = _sample_value(sample_values, "unidad")
        return f"{cantidad} {unidad}".strip()
    if "$F{valorUnitarioPlantilla}.toDouble()" in source:
        precio = _format_preview_amount(_sample_value(sample_values, "valorUnitarioPlantilla") or _sample_value(sample_values, "valorUnitario"), 2)
        categoria = _sample_value(sample_values, "categoria")
        return f"${precio} {categoria}".strip()
    if "$F{importe}.toDouble()" in source:
        return _format_preview_amount(_sample_value(sample_values, "importe"), 2)
    if "$F{metodoDePago}" in source and "$F{formaDePago}" in source and "$F{usoCfdi}" in source:
        return _payment_terms_block(sample_values)
    if "$F{cantidadLetra}" in source and "$F{referenciaMensaje}" in source:
        return _legend_block(sample_values)
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
    if "$F{nombreReceptor}" in source and "$F{rfcReceptor}" in source and "$F{calleReceptor}" in source:
        return _format_party_block(sample_values, "Receptor")
    if "$F{nombreEmbarque}" in source or ("$F{rfcEmbarque}" in source and "$F{calleEmbarque}" in source):
        return _format_party_block(sample_values, "Embarque")
    if "Lugar de Exped" in source and "$F{calleEmisor}" in source:
        return _join_preview_lines(
            "Lugar de Expedición:",
            _format_address_block(sample_values, "Emisor"),
        )
    if "$F{selloCFD}" in source and source.strip() == "$F{selloCFD}":
        return _sample_value(sample_values, "selloCFD")
    if "$F{selloSAT}" in source and source.strip() == "$F{selloSAT}":
        return _sample_value(sample_values, "selloSAT")
    if "$F{cadenaOriginal}" in source and source.strip() == "$F{cadenaOriginal}":
        return _sample_value(sample_values, "cadenaOriginal")
    if "$V{PAGE_NUMBER}" in source:
        if source.strip().startswith('" "'):
            return "1"
        if "Página" in source or "Page" in source:
            return "Página 1 de"
    return ""


def _preview_expression_text(expression: str, sample_values: Mapping[str, Any] | None = None) -> str:
    source = str(expression or "").strip()
    if not source:
        return ""
    exact_field = re.fullmatch(r"\$F\{([^}]+)\}", source)
    if exact_field:
        return _sample_value(sample_values, exact_field.group(1))
    special_text = _special_preview_expression_text(source, sample_values)
    if "$F{idReceptor}.contains" in source and "802442" in source:
        return special_text
    if special_text:
        return special_text
    evaluated = evaluate_jrxml_python_expression(
        source,
        fields=sample_values,
        parameters=sample_values,
        variables=sample_values,
    )
    if evaluated is not None:
        evaluated_text = _java_bool_text(evaluated) if isinstance(evaluated, bool) else str(evaluated)
        evaluated_text = _strip_preview_markup(_localize_i18n_markers(evaluated_text, sample_values))
        if evaluated_text:
            return evaluated_text

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


def _sample_dataset_values(sample_values: Mapping[str, Any] | None, dataset_name: str) -> list[dict[str, Any]]:
    datasets = sample_values.get("__datasets__") if isinstance(sample_values, Mapping) else None
    if not isinstance(datasets, Mapping):
        return []
    rows = datasets.get(dataset_name)
    if not isinstance(rows, Sequence) or isinstance(rows, (str, bytes)):
        return []
    return [dict(row) for row in rows if isinstance(row, Mapping)]


def _merged_sample_values(sample_values: Mapping[str, Any] | None, row_values: Mapping[str, Any]) -> dict[str, Any]:
    merged = dict(sample_values or {})
    merged.update(row_values)
    return merged


def _component_list_html(
    element: Mapping[str, Any],
    *,
    asset_base_path: str | Path | None,
    offset_x: int,
    offset_y: int,
    sample_values: Mapping[str, Any] | None,
    scale: float,
    styles: Mapping[str, Any] | None,
) -> str:
    dataset_run = element.get("dataset_run") if isinstance(element.get("dataset_run"), Mapping) else {}
    dataset_name = str(dataset_run.get("sub_dataset") or "").strip()
    rows = _sample_dataset_values(sample_values, dataset_name)
    list_contents = element.get("list_contents") if isinstance(element.get("list_contents"), Mapping) else {}
    content_elements = [child for child in list_contents.get("elements") or [] if isinstance(child, Mapping)]
    if not rows or not content_elements:
        return ""
    row_height = int(list_contents.get("height") or (element.get("geometry") or {}).get("height") or 1)
    rendered_rows: list[str] = []
    current_row_y = 0
    for row_values in rows[:20]:
        row_sample_values = _merged_sample_values(sample_values, row_values)
        row_layout, row_content_height = _flowed_child_layout(
            content_elements,
            sample_values=row_sample_values,
            styles=styles,
        )
        row_effective_height = max(row_height, row_content_height or row_height)
        for child, adjusted_y, _effective_height in row_layout:
            rendered_rows.append(
                _preview_element_html(
                    child,
                    asset_base_path=asset_base_path,
                    offset_x=0,
                    offset_y=current_row_y + adjusted_y - _geometry_int(child, "y", 0),
                    container_height=row_effective_height,
                    sample_values=row_sample_values,
                    scale=scale,
                    styles=styles,
                )
            )
        current_row_y += row_effective_height
    return "".join(rendered_rows)


def _preview_element_html(
    element: Mapping[str, Any],
    *,
    asset_base_path: str | Path | None = None,
    offset_x: int = 0,
    offset_y: int = 0,
    sample_values: Mapping[str, Any] | None = None,
    scale: float = 1.0,
    styles: Mapping[str, Any] | None = None,
    container_height: int | None = None,
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
        static_text = str(element.get("text") or "")
        base_style = _join_inline_style(
            _base_element_css(element, offset_x=offset_x, offset_y=offset_y, scale=scale),
            _font_css(text_style, scale=scale),
            _text_alignment_css(text_style),
            _padding_css(box, _effective_named_box(element, styles), scale=scale),
            _text_flow_css(element, static_text, scale=scale),
        )
        content = html.escape(static_text)
    elif kind == "textField":
        text_style = element.get("text_style") if isinstance(element.get("text_style"), Mapping) else {}
        box = element.get("box") if isinstance(element.get("box"), Mapping) else {}
        expression = (element.get("expression") or {}).get("source") if isinstance(element.get("expression"), Mapping) else ""
        preview_text = _preview_expression_text(str(expression or ""), sample_values)
        needs_free_flow = _truthy_text(element.get("stretch_with_overflow")) and _text_needs_free_flow(preview_text)
        base_style = _join_inline_style(
            _base_element_css(element, offset_x=offset_x, offset_y=offset_y, scale=scale),
            _font_css(text_style, scale=scale),
            _text_alignment_css(text_style, allow_vertical=not needs_free_flow),
            _padding_css(box, _effective_named_box(element, styles), scale=scale),
            _text_flow_css(element, preview_text, scale=scale),
        )
        content = html.escape(preview_text)
    elif kind == "image":
        base_style = _join_inline_style(
            _base_element_css(element, offset_x=offset_x, offset_y=offset_y, scale=scale),
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
        relative_height_css = ""
        if container_height and "RelativeToBandHeight" in str(report_element.get("stretchType") or ""):
            stretch_height = max(_geometry_int(element, "height", 1), int(container_height) - _geometry_int(element, "y", 0))
            relative_height_css = f"height:{_css_px(_scaled(stretch_height, scale))}"
        base_style = _join_inline_style(
            _base_element_css(element, offset_x=offset_x, offset_y=offset_y, scale=scale),
            "background:transparent;padding:0",
            "border:0",
            border_css,
            relative_height_css,
        )
    elif kind == "rectangle":
        content = ""
        classes += " oc_report_designer_preview__rectangle"
        report_element = element.get("report_element") if isinstance(element.get("report_element"), Mapping) else {}
        color = _css_color(report_element.get("forecolor"), "#8E8E8E")
        radius = str(element.get("radius") or "").strip()
        radius_css = f"border-radius:{radius}px" if radius.isdigit() else ""
        relative_height_css = ""
        if container_height and "RelativeToBandHeight" in str(report_element.get("stretchType") or ""):
            stretch_height = max(_geometry_int(element, "height", 1), int(container_height) - _geometry_int(element, "y", 0))
            relative_height_css = f"height:{_css_px(_scaled(stretch_height, scale))}"
        base_style = _join_inline_style(
            _base_element_css(
                element,
                offset_x=offset_x,
                offset_y=offset_y,
                default_border=f"1px solid {color}",
                scale=scale,
            ),
            radius_css,
            relative_height_css,
            "pointer-events:none",
        )
    elif kind == "frame":
        children = [child for child in element.get("children") or [] if isinstance(child, Mapping)]
        child_layout, content_height = _flowed_child_layout(children, sample_values=sample_values, styles=styles)
        effective_height = max(_geometry_int(element, "height", 1), content_height)
        base_style = _join_inline_style(
            _base_element_css(element, offset_x=offset_x, offset_y=offset_y, scale=scale),
            "padding:0",
            f"height:{_css_px(_scaled(effective_height, scale))}",
            "overflow:visible",
        )
        child_html = "".join(
            _preview_element_html(
                child,
                asset_base_path=asset_base_path,
                offset_x=0,
                offset_y=adjusted_y - _geometry_int(child, "y", 0),
                container_height=effective_height,
                sample_values=sample_values,
                scale=scale,
                styles=styles,
            )
            for child, adjusted_y, _effective_height in child_layout
        )
        content = child_html
        classes += " oc_report_designer_preview__frame"
    elif kind == "componentElement":
        dataset_run = element.get("dataset_run") if isinstance(element.get("dataset_run"), Mapping) else {}
        dataset_name = str(dataset_run.get("sub_dataset") or "").strip()
        list_contents = element.get("list_contents") if isinstance(element.get("list_contents"), Mapping) else {}
        effective_height = _element_effective_height(element, sample_values=sample_values, styles=styles)
        content = _component_list_html(
            element,
            asset_base_path=asset_base_path,
            offset_x=0,
            offset_y=0,
            sample_values=sample_values,
            scale=scale,
            styles=styles,
        )
        base_style = _join_inline_style(
            _base_element_css(element, offset_x=offset_x, offset_y=offset_y, scale=scale),
            "padding:0",
            f"height:{_css_px(_scaled(effective_height, scale))}",
            "overflow:visible",
        )
    elif kind in {"subreport", "break", "printWhenExpression"}:
        return ""
    else:
        base_style = _base_element_css(element, offset_x=offset_x, offset_y=offset_y, scale=scale)
        content = ""
    return f"<div class=\"{classes}\" style=\"{base_style}\">{content}</div>"


def build_preview_html(
    blueprint: Mapping[str, Any],
    *,
    asset_base_path: str | Path | None = None,
    max_bands: int = 12,
    sample_values: Mapping[str, Any] | None = None,
    scale: float = JASPER_POINT_TO_CSS_PIXEL,
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
        band_elements = [element for element in band.get("elements") or [] if isinstance(element, Mapping)]
        fixed_height = max(int(band.get("height") or 1), 1)
        band_layout, content_height = _flowed_child_layout(
            band_elements,
            sample_values=sample_values,
            styles=styles,
        )
        height = max(fixed_height, content_height)
        for element, adjusted_y, _effective_height in band_layout:
            element_html.append(
                _preview_element_html(
                    element,
                    asset_base_path=asset_base_path,
                    offset_x=margin_left,
                    offset_y=margin_top + current_y + adjusted_y - _geometry_int(element, "y", 0),
                    container_height=height,
                    sample_values=sample_values,
                    scale=scale,
                    styles=styles,
                )
            )
        current_y += height
    height = max(margin_top + current_y + margin_bottom, int(page.get("height") or 792))
    page_width = _css_px(_scaled(width, scale))
    page_height = _css_px(_scaled(height, scale))
    return (
        '<div class="oc_report_designer_preview" style="background:#e5e7eb;border:1px solid #d1d5db;box-sizing:border-box;max-width:100%;overflow:auto;padding:12px;">'
        f'<div class="oc_report_designer_preview__page" style="background:#fff;box-shadow:0 4px 18px rgba(15,23,42,.22);height:{page_height};margin:0 auto;position:relative;width:{page_width};">'
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
    sample_field_values_by_file: dict[str, Any] = {}
    for sample_path in sample_xml_paths:
        resolved_sample_path = Path(sample_path)
        values = build_sample_field_values(blueprint, resolved_sample_path)
        if not sample_field_values:
            sample_field_values = values
        sample_field_values_by_file[resolved_sample_path.name] = values
    sample_records = _build_design_sample_record_values_from_blueprint(blueprint, sample_xml_paths)
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
        "x_data_schema_json": dumps_canonical_json(
            {
                "samples": sample_schemas,
                "field_values": sample_field_values,
                "translated_files": sample_field_values_by_file,
            }
        ),
        "x_test_data_html": build_test_data_html(sample_records),
        "x_preview_html": build_preview_html(blueprint, asset_base_path=path.parent, sample_values=sample_field_values),
        "x_source_jrxml": path.read_text(encoding="utf-8"),
        "x_notes": "Imported from JRXML. Expressions are indexed for migration and preview but are not executed.",
    }


def _human_size(byte_count: int) -> str:
    value = max(int(byte_count or 0), 0)
    if value < 1024:
        return f"{value} B"
    if value < 1024 * 1024:
        return f"{value / 1024:.1f} KB"
    return f"{value / (1024 * 1024):.1f} MB"


def _option_label(options: Sequence[tuple[str, str]], value: str) -> str:
    labels = {str(key): str(label) for key, label in options}
    return labels.get(str(value or ""), str(value or ""))


def _build_design_sample_record_values_from_blueprint(
    blueprint: Mapping[str, Any],
    sample_xml_paths: Sequence[str | Path] = (),
) -> tuple[dict[str, Any], ...]:
    records: list[dict[str, Any]] = []
    sequence = 10
    for sample_xml_path in sample_xml_paths:
        path = Path(sample_xml_path)
        if not path.exists():
            continue
        raw_xml = path.read_text(encoding="utf-8")
        schema = flatten_xml_sample_file(path)
        values = build_sample_field_values(blueprint, path)
        records.append(
            {
                "x_name": f"{path.name} original",
                "x_sequence": sequence,
                "x_kind": "original_xml",
                "x_source_filename": path.name,
                "x_source_format": "xml",
                "x_mimetype": "application/xml",
                "x_content": raw_xml,
                "x_file_name": path.name,
                "x_active": True,
                "x_notes": "XML original disponible para pruebas de preview y mapeo.",
            }
        )
        sequence += 10
        translated_payload = {
            "source_filename": path.name,
            "target": "odoo.report_template_designer.sample_context",
            "field_values": values,
            "schema": schema,
        }
        translated_name = f"{path.stem}.translated.json"
        records.append(
            {
                "x_name": f"{path.name} traducido",
                "x_sequence": sequence,
                "x_kind": "translated",
                "x_source_filename": translated_name,
                "x_source_format": "json",
                "x_mimetype": "application/json",
                "x_content": dumps_canonical_json(translated_payload),
                "x_file_name": translated_name,
                "x_active": True,
                "x_notes": "Contexto traducido a campos y rutas XML para validar el render Odoo.",
            }
        )
        sequence += 10
    return tuple(records)


def build_design_sample_record_values(
    jrxml_path: str | Path,
    *,
    sample_xml_paths: Sequence[str | Path] = (),
) -> tuple[dict[str, Any], ...]:
    """Build editable Odoo child records for original and translated test data."""
    return _build_design_sample_record_values_from_blueprint(parse_jrxml_file(Path(jrxml_path)), sample_xml_paths)


def build_test_data_html(sample_records: Sequence[Mapping[str, Any]]) -> str:
    """Render a compact test-data table with safe fallback code drawers."""
    rows: list[str] = []
    if not sample_records:
        return (
            '<div class="oc_report_test_data">'
            '<table class="oc_report_test_data__table">'
            "<thead><tr><th>Tipo</th><th>Archivo</th><th>Formato</th><th>Tamano</th><th>Acciones</th></tr></thead>"
            "<tbody></tbody></table></div>"
        )
    for index, raw_record in enumerate(sample_records, start=1):
        record = raw_record if isinstance(raw_record, MappingABC) else {}
        code = str(record.get("x_content") or "")
        kind = str(record.get("x_kind") or "")
        source_format = str(record.get("x_source_format") or "")
        filename = str(record.get("x_source_filename") or record.get("x_file_name") or record.get("x_name") or "")
        kind_label = _option_label(REPORT_TEST_DATA_KIND_OPTIONS, kind)
        format_label = _option_label(REPORT_TEST_DATA_FORMAT_OPTIONS, source_format)
        escaped_code = html.escape(code)
        rows.append(
            (
                f'<tr class="oc_report_test_data__row" data-oc-report-test-row="1" data-oc-report-test-index="{index}" '
                f'data-oc-report-test-format="{html.escape(source_format, quote=True)}">'
                f"<td>{html.escape(kind_label)}</td>"
                f"<td>{html.escape(filename)}</td>"
                f"<td>{html.escape(format_label)}</td>"
                f"<td>{html.escape(_human_size(len(code.encode('utf-8'))))}</td>"
                '<td class="oc_report_test_data__actions">'
                '<button type="button" class="oc_report_test_data__button oc_report_test_data__button--open" data-oc-report-test-open="1">Ver codigo</button>'
                '<button type="button" class="oc_report_test_data__button oc_report_test_data__button--copy" data-oc-report-test-copy="1">Copiar</button>'
                "</td>"
                "</tr>"
                '<tr class="oc_report_test_data__drawer-row">'
                '<td colspan="5">'
                '<details class="oc_report_test_data__drawer">'
                "<summary>Codigo</summary>"
                f'<textarea class="oc_report_test_data__code" data-oc-report-test-code="1" readonly="readonly">{escaped_code}</textarea>'
                f'<pre class="oc_report_test_data__pre">{escaped_code}</pre>'
                "</details>"
                "</td>"
                "</tr>"
            )
        )
    return (
        '<div class="oc_report_test_data" data-oc-report-test-data="1">'
        '<table class="oc_report_test_data__table">'
        "<thead><tr><th>Tipo</th><th>Archivo</th><th>Formato</th><th>Tamano</th><th>Acciones</th></tr></thead>"
        f"<tbody>{''.join(rows)}</tbody>"
        "</table></div>"
    )


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
    relation_field: str | None = None
    relation_table: str | None = None
    column1: str | None = None
    column2: str | None = None
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

REPORT_TEST_DATA_KIND_OPTIONS: tuple[tuple[str, str], ...] = (
    ("original_xml", "XML original"),
    ("translated", "Archivo traducido"),
    ("manual", "Manual"),
)

REPORT_TEST_DATA_FORMAT_OPTIONS: tuple[tuple[str, str], ...] = (
    ("xml", "XML"),
    ("json", "JSON"),
    ("text", "Texto"),
)

REPORT_DESIGNER_MODELS: tuple[ReportDesignerModelSpec, ...] = (
    ReportDesignerModelSpec(
        model="x_odoo_report_design",
        name="Report Template Design",
        info="Reusable report/template designer records with JRXML import, band blueprint, expression index, sample data schema, and safe preview HTML.",
    ),
    ReportDesignerModelSpec(
        model="x_odoo_report_design_sample",
        name="Report Template Test Data",
        info="Original and translated test-data files linked to neutral report/template designer records.",
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
    ReportDesignerFieldSpec("x_odoo_report_design", "x_test_data_html", "Visor de datos de prueba", "html"),
    ReportDesignerFieldSpec("x_odoo_report_design", "x_preview_html", "Preview", "html"),
    ReportDesignerFieldSpec("x_odoo_report_design", "x_source_jrxml", "JRXML original", "text"),
    ReportDesignerFieldSpec("x_odoo_report_design", "x_notes", "Notas", "text"),
    ReportDesignerFieldSpec("x_odoo_report_design_sample", "x_name", "Nombre", "char"),
    ReportDesignerFieldSpec("x_odoo_report_design_sample", "x_sequence", "Secuencia", "integer"),
    ReportDesignerFieldSpec(
        "x_odoo_report_design_sample",
        "x_design_id",
        "Plantilla",
        "many2one",
        relation="x_odoo_report_design",
    ),
    ReportDesignerFieldSpec(
        "x_odoo_report_design_sample",
        "x_kind",
        "Tipo",
        "selection",
        selection_options=REPORT_TEST_DATA_KIND_OPTIONS,
    ),
    ReportDesignerFieldSpec("x_odoo_report_design_sample", "x_source_filename", "Archivo", "char"),
    ReportDesignerFieldSpec(
        "x_odoo_report_design_sample",
        "x_source_format",
        "Formato",
        "selection",
        selection_options=REPORT_TEST_DATA_FORMAT_OPTIONS,
    ),
    ReportDesignerFieldSpec("x_odoo_report_design_sample", "x_mimetype", "MIME", "char"),
    ReportDesignerFieldSpec("x_odoo_report_design_sample", "x_file", "Archivo subido", "binary"),
    ReportDesignerFieldSpec("x_odoo_report_design_sample", "x_file_name", "Nombre archivo", "char"),
    ReportDesignerFieldSpec("x_odoo_report_design_sample", "x_content", "Codigo", "text"),
    ReportDesignerFieldSpec("x_odoo_report_design_sample", "x_active", "Activo", "boolean"),
    ReportDesignerFieldSpec("x_odoo_report_design_sample", "x_notes", "Notas", "text"),
    ReportDesignerFieldSpec(
        "x_odoo_report_design",
        "x_sample_ids",
        "Datos de prueba",
        "one2many",
        relation="x_odoo_report_design_sample",
        relation_field="x_design_id",
    ),
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
                            <field name="x_test_data_html" nolabel="1" readonly="1"/>
                            <field name="x_sample_ids" nolabel="1" mode="list,form" context="{'default_x_design_id': id}">
                                <list string="Datos de prueba" create="1" delete="1">
                                    <field name="x_sequence" widget="handle"/>
                                    <field name="x_kind"/>
                                    <field name="x_source_filename"/>
                                    <field name="x_source_format"/>
                                    <field name="x_file" filename="x_file_name" optional="show"/>
                                    <field name="x_file_name" optional="hide"/>
                                    <field name="x_active" optional="show"/>
                                </list>
                                <form string="Dato de prueba">
                                    <sheet>
                                        <group>
                                            <group>
                                                <field name="x_name"/>
                                                <field name="x_kind"/>
                                                <field name="x_source_filename"/>
                                                <field name="x_source_format"/>
                                                <field name="x_active"/>
                                            </group>
                                            <group>
                                                <field name="x_file" filename="x_file_name"/>
                                                <field name="x_file_name"/>
                                                <field name="x_mimetype"/>
                                                <field name="x_sequence"/>
                                            </group>
                                        </group>
                                        <notebook>
                                            <page string="Codigo">
                                                <field name="x_content" nolabel="1"/>
                                            </page>
                                            <page string="Notas">
                                                <field name="x_notes" nolabel="1"/>
                                            </page>
                                        </notebook>
                                    </sheet>
                                </form>
                            </field>
                            <field name="x_data_schema_json" nolabel="1" groups="base.group_no_one"/>
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
    "REPORT_TEST_DATA_FORMAT_OPTIONS",
    "REPORT_TEST_DATA_KIND_OPTIONS",
    "ReportDesignerFieldSpec",
    "ReportDesignerExpressionTranslation",
    "ReportDesignerModelSpec",
    "ReportDesignerViewBlueprint",
    "build_design_record_values",
    "build_design_sample_record_values",
    "build_preview_html",
    "dumps_canonical_json",
    "evaluate_jrxml_python_expression",
    "flatten_xml_sample",
    "flatten_xml_sample_file",
    "build_test_data_html",
    "parse_jrxml_document",
    "parse_jrxml_file",
    "summarize_design_blueprint",
    "translate_jrxml_expression_to_python",
]
