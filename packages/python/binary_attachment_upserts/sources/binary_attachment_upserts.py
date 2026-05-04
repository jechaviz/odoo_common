"""Canonical helpers for Odoo binary attachment upserts."""

from __future__ import annotations

import base64
import hashlib
from dataclasses import dataclass, field
from typing import Any, Mapping, Protocol, Sequence, runtime_checkable


ATTACHMENT_RESERVED_EXTRA_KEYS = frozenset(
    {
        "name",
        "type",
        "datas",
        "mimetype",
        "datas_fname",
        "public",
        "res_model",
        "res_id",
    }
)


@runtime_checkable
class BinaryAttachmentUpsertConnection(Protocol):
    """Minimal Odoo RPC contract required by binary attachment upserts."""

    def search_read(
        self,
        model_name: str,
        domain: Sequence[tuple[str, str, Any]],
        fields: Sequence[str] | None = None,
        limit: int | None = None,
        **kwargs: Any,
    ) -> list[Mapping[str, Any]]:
        """Return matching rows with requested fields."""

    def write(self, model_name: str, ids: Sequence[int], values: Mapping[str, Any]) -> Any:
        """Update one or more records."""

    def create(self, model_name: str, values: Mapping[str, Any]) -> Any:
        """Create one record."""


def _clean_required_text(value: Any, *, field_name: str) -> str:
    clean_value = str(value or "").strip()
    if not clean_value:
        raise ValueError(f"Binary attachment {field_name} is required")
    return clean_value


def _clean_extra_values(values: Mapping[str, Any]) -> dict[str, Any]:
    normalized = dict(values or {})
    reserved_used = sorted(key for key in normalized if key in ATTACHMENT_RESERVED_EXTRA_KEYS)
    if reserved_used:
        raise ValueError(f"Binary attachment extra_values cannot override reserved keys: {', '.join(reserved_used)}")
    return normalized


@dataclass(frozen=True)
class BinaryAttachmentSpec:
    """Declare one binary `ir.attachment` row."""

    name: str
    content: bytes | str
    mimetype: str
    datas_fname: str = ""
    public: bool = True
    res_model: str = "ir.ui.view"
    res_id: int = 0
    extra_values: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        object.__setattr__(self, "name", _clean_required_text(self.name, field_name="name"))
        object.__setattr__(self, "content", _content_bytes(self.content))
        object.__setattr__(self, "mimetype", _clean_required_text(self.mimetype, field_name="mimetype"))
        object.__setattr__(self, "datas_fname", str(self.datas_fname or "").strip() or self.name)
        object.__setattr__(self, "public", bool(self.public))
        object.__setattr__(self, "res_model", _clean_required_text(self.res_model, field_name="res_model"))
        object.__setattr__(self, "res_id", int(self.res_id or 0))
        object.__setattr__(self, "extra_values", _clean_extra_values(self.extra_values))


def compute_binary_attachment_checksum(content: bytes | str) -> str:
    """Compute a SHA1 checksum for one attachment payload."""
    return hashlib.sha1(_content_bytes(content)).hexdigest()


def encode_binary_attachment_content(content: bytes | str) -> str:
    """Encode one attachment payload as Odoo `datas` base64 ASCII."""
    return base64.b64encode(_content_bytes(content)).decode("ascii")


def upsert_binary_attachment(
    conn: BinaryAttachmentUpsertConnection,
    spec: BinaryAttachmentSpec,
) -> int:
    """Create or update one binary `ir.attachment` by exact name/type."""
    normalized = spec if isinstance(spec, BinaryAttachmentSpec) else BinaryAttachmentSpec(**dict(spec))
    values = {
        "name": normalized.name,
        "type": "binary",
        "datas": encode_binary_attachment_content(normalized.content),
        "mimetype": normalized.mimetype,
        "datas_fname": normalized.datas_fname,
        "public": normalized.public,
        "res_model": normalized.res_model,
        "res_id": normalized.res_id,
        **dict(normalized.extra_values),
    }
    existing = conn.search_read(
        "ir.attachment",
        [
            ("name", "=", normalized.name),
            ("type", "=", "binary"),
        ],
        ["id"],
        limit=1,
    )
    if existing:
        attachment_id = _required_record_id(existing[0].get("id"), context=f"ir.attachment {normalized.name}")
        conn.write("ir.attachment", [attachment_id], values)
        return attachment_id
    return _required_record_id(conn.create("ir.attachment", values), context=f"created ir.attachment {normalized.name}")


def _content_bytes(content: bytes | str) -> bytes:
    if isinstance(content, bytes):
        if not content:
            raise ValueError("Binary attachment content must not be empty")
        return content
    encoded = str(content or "").encode("utf-8")
    if not encoded:
        raise ValueError("Binary attachment content must not be empty")
    return encoded


def _record_id(value: Any) -> int:
    if isinstance(value, Mapping):
        return _record_id(value.get("id"))
    if isinstance(value, (list, tuple)) and value:
        return _record_id(value[0])
    return int(value or 0)


def _required_record_id(value: Any, *, context: str) -> int:
    record_id = _record_id(value)
    if record_id <= 0:
        raise RuntimeError(f"Binary attachment upsert did not receive a valid ID for {context}")
    return record_id
