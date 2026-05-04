"""Canonical strict text-template loading and token rendering helpers."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path, PurePosixPath
from typing import Any, Mapping


def render_template(
    template: str,
    replacements: Mapping[str, Any],
    *,
    require_all_tokens: bool = True,
    strip_result: bool = True,
) -> str:
    """Render text by applying explicit token replacements."""
    if not isinstance(template, str):
        raise TypeError("Text template must be a string")
    normalized_replacements = _normalize_replacements(replacements)
    if require_all_tokens:
        missing_tokens = [token for token, _value in normalized_replacements if token not in template]
        if missing_tokens:
            joined_tokens = ", ".join(repr(token) for token in missing_tokens)
            raise ValueError(f"Text template is missing replacement token(s): {joined_tokens}")

    rendered = template
    for token, value in normalized_replacements:
        rendered = rendered.replace(token, value)
    return rendered.strip() if strip_result else rendered


@lru_cache(maxsize=128)
def load_template_from_dir(
    templates_dir: str | Path,
    filename: str | Path,
    *,
    strip_result: bool = True,
) -> str:
    """Load one UTF-8 template from a declared directory and safe relative name."""
    template_path = Path(templates_dir) / _clean_relative_template_name(filename)
    if not template_path.is_file():
        raise FileNotFoundError(f"Missing text template: {template_path}")
    template = template_path.read_text(encoding="utf-8")
    return template.strip() if strip_result else template


def render_template_file(
    templates_dir: str | Path,
    filename: str | Path,
    replacements: Mapping[str, Any],
    *,
    require_all_tokens: bool = True,
    strip_result: bool = True,
) -> str:
    """Load and render one declared text template."""
    template = load_template_from_dir(templates_dir, filename, strip_result=strip_result)
    return render_template(
        template,
        replacements,
        require_all_tokens=require_all_tokens,
        strip_result=strip_result,
    )


def _normalize_replacements(replacements: Mapping[str, Any]) -> tuple[tuple[str, str], ...]:
    if not isinstance(replacements, Mapping):
        raise TypeError("Text template replacements must be a mapping")

    normalized: list[tuple[str, str]] = []
    for token, value in replacements.items():
        clean_token = str(token or "")
        if not clean_token:
            raise ValueError("Text template replacement token is required")
        normalized.append((clean_token, str(value)))
    return tuple(normalized)


def _clean_relative_template_name(filename: str | Path) -> str:
    raw_filename = str(filename).strip()
    if not raw_filename:
        raise ValueError("Text template filename is required")
    if "\\" in raw_filename:
        raise ValueError(f"Text template filename must use POSIX-style paths: {raw_filename!r}")

    path = PurePosixPath(raw_filename)
    raw_parts = raw_filename.split("/")
    if path.is_absolute() or any(part in {"", ".", ".."} for part in raw_parts):
        raise ValueError(f"Text template filename must be relative and normalized: {raw_filename!r}")
    if ":" in raw_parts[0]:
        raise ValueError(f"Text template filename must not include a drive prefix: {raw_filename!r}")
    return path.as_posix()
