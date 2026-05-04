"""Canonical helpers for already-loaded resource configuration mappings."""

from __future__ import annotations

from copy import deepcopy
from typing import Any, Mapping, Sequence


def deep_merge_mappings(base: Mapping[str, Any], overrides: Mapping[str, Any]) -> dict[str, Any]:
    """Deep-merge mappings while preserving value copies."""
    _require_mapping(base, field_name="base")
    _require_mapping(overrides, field_name="overrides")
    merged = deepcopy(dict(base))
    for key, value in overrides.items():
        clean_key = _clean_required_text(key, field_name="mapping key")
        if isinstance(value, Mapping) and isinstance(merged.get(clean_key), Mapping):
            merged[clean_key] = deep_merge_mappings(merged[clean_key], value)
        else:
            merged[clean_key] = deepcopy(value)
    return merged


def read_string_tuple(
    config: Mapping[str, Any],
    key: str,
    default_values: Sequence[str] = (),
) -> tuple[str, ...]:
    """Read one list-valued config key as a cleaned tuple of strings."""
    _require_mapping(config, field_name="config")
    clean_key = _clean_required_text(key, field_name="key")
    raw_values = config.get(clean_key)
    if raw_values is None:
        return _clean_string_tuple(default_values)
    if isinstance(raw_values, (str, bytes)) or not isinstance(raw_values, Sequence):
        raise TypeError(f"Resource config {clean_key!r} must be a sequence of strings")
    cleaned = _clean_string_tuple(raw_values)
    if cleaned:
        return cleaned
    return _clean_string_tuple(default_values)


def read_string_mapping(
    config: Mapping[str, Any],
    key: str,
    default_values: Mapping[str, str],
) -> dict[str, str]:
    """Read one mapping-valued config key as a cleaned string mapping."""
    _require_mapping(config, field_name="config")
    _require_mapping(default_values, field_name="default_values")
    clean_key = _clean_required_text(key, field_name="key")
    raw_mapping = config.get(clean_key)
    if raw_mapping is None:
        raw_mapping = {}
    if not isinstance(raw_mapping, Mapping):
        raise TypeError(f"Resource config {clean_key!r} must be a mapping")

    normalized: dict[str, str] = {}
    for raw_key, raw_default_value in default_values.items():
        item_key = _clean_required_text(raw_key, field_name="default mapping key")
        value = str(raw_mapping.get(item_key) or "").strip()
        normalized[item_key] = value or str(raw_default_value)
    return normalized


def read_nested_mapping_list(config: Mapping[str, Any], *path: str) -> list[dict[str, Any]]:
    """Read one nested list-valued config path and keep only mapping items."""
    _require_mapping(config, field_name="config")
    if not path:
        raise ValueError("Resource config nested path must not be empty")

    current: Any = config
    for raw_key in path:
        key = _clean_required_text(raw_key, field_name="path key")
        if not isinstance(current, Mapping):
            raise TypeError(f"Resource config path {'.'.join(path)!r} does not resolve through mappings")
        current = current.get(key)
    if current is None:
        return []
    if isinstance(current, (str, bytes)) or not isinstance(current, Sequence):
        raise TypeError(f"Resource config path {'.'.join(path)!r} must resolve to a list")
    return [deepcopy(dict(item)) for item in current if isinstance(item, Mapping)]


def _clean_required_text(value: Any, *, field_name: str) -> str:
    clean_value = str(value or "").strip()
    if not clean_value:
        raise ValueError(f"Resource config {field_name} is required")
    return clean_value


def _require_mapping(value: Any, *, field_name: str) -> None:
    if not isinstance(value, Mapping):
        raise TypeError(f"Resource config {field_name} must be a mapping")


def _clean_string_tuple(values: Sequence[Any]) -> tuple[str, ...]:
    if isinstance(values, (str, bytes)):
        raise TypeError("Resource config string tuple values must be a sequence, not text")
    return tuple(str(value).strip() for value in values if str(value).strip())
