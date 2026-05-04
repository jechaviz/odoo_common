"""Canonical declarative feature catalog helpers."""

from .feature_catalog import (
    FeatureSpec,
    index_features,
    serialize_features,
    validate_install_list,
)

__all__ = [
    "FeatureSpec",
    "index_features",
    "serialize_features",
    "validate_install_list",
]
