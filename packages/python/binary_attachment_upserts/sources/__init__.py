"""Canonical Odoo binary attachment upsert helpers."""

from .binary_attachment_upserts import (
    BinaryAttachmentSpec,
    BinaryAttachmentUpsertConnection,
    compute_binary_attachment_checksum,
    encode_binary_attachment_content,
    upsert_binary_attachment,
)

__all__ = [
    "BinaryAttachmentSpec",
    "BinaryAttachmentUpsertConnection",
    "compute_binary_attachment_checksum",
    "encode_binary_attachment_content",
    "upsert_binary_attachment",
]
