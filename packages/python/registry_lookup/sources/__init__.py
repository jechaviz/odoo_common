"""Canonical Odoo registry lookup helpers."""

from .registry_lookup import (
    RegistryLookupConnection,
    XmlIdMetadata,
    XmlIdRef,
    fields_get,
    resolve_model_field_ids,
    resolve_model_field_names,
    resolve_model_id,
    resolve_xml_id,
    resolve_xml_id_metadata,
    selection_values,
    split_xml_id,
)

__all__ = [
    "RegistryLookupConnection",
    "XmlIdMetadata",
    "XmlIdRef",
    "fields_get",
    "resolve_model_field_ids",
    "resolve_model_field_names",
    "resolve_model_id",
    "resolve_xml_id",
    "resolve_xml_id_metadata",
    "selection_values",
    "split_xml_id",
]
