"""Canonical Odoo XML ID upsert helpers."""

from .xmlid_upserts import (
    XmlIdRef,
    XmlIdSpec,
    XmlIdUpsertConnection,
    split_xml_id,
    upsert_xml_id,
    upsert_xml_id_value,
)

__all__ = [
    "XmlIdRef",
    "XmlIdSpec",
    "XmlIdUpsertConnection",
    "split_xml_id",
    "upsert_xml_id",
    "upsert_xml_id_value",
]
