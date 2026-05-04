"""Canonical resource configuration normalizers."""

from .resource_config import (
    deep_merge_mappings,
    read_nested_mapping_list,
    read_string_mapping,
    read_string_tuple,
)

__all__ = [
    "deep_merge_mappings",
    "read_nested_mapping_list",
    "read_string_mapping",
    "read_string_tuple",
]
