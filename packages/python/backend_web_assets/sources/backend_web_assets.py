"""Canonical helpers for publishing declared backend web assets in Odoo."""

from __future__ import annotations

import base64
import hashlib
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from typing import Any, Callable, Mapping, Protocol, Sequence, runtime_checkable


DIRECTIVES_WITH_TARGET = frozenset({"before", "after", "replace"})
ALLOWED_BACKEND_WEB_ASSET_DIRECTIVES = frozenset({"append", "prepend", "before", "after", "replace"})


def guess_backend_web_asset_mimetype(relative_path: str | Path) -> str:
    """Return the canonical mimetype for a publishable backend web asset path."""
    suffix = PurePosixPath(str(relative_path).replace("\\", "/")).suffix.lower()
    if suffix == ".js":
        return "application/javascript"
    if suffix == ".css":
        return "text/css"
    return "application/octet-stream"


def _normalize_relative_path(value: str | Path) -> Path:
    raw = str(value or "").strip().replace("\\", "/").lstrip("/")
    if not raw:
        raise ValueError("Backend web asset relative_path is required")
    path = PurePosixPath(raw)
    if path.is_absolute() or any(part in {"", ".", ".."} for part in path.parts):
        raise ValueError(f"Backend web asset path must be relative and normalized: {value!r}")
    if path.parts and ":" in path.parts[0]:
        raise ValueError(f"Backend web asset path must not include a drive prefix: {value!r}")
    return Path(path.as_posix())


def _normalize_text(value: Any, *, field_name: str) -> str:
    normalized = str(value or "").strip()
    if not normalized:
        raise ValueError(f"Backend web asset {field_name} is required")
    return normalized


@dataclass(frozen=True)
class BackendWebAssetSpec:
    """Declare one backend asset and its target `ir.asset` placement."""

    name: str
    relative_path: str | Path
    mimetype: str = ""
    sequence: int = 1000
    bundle: str = "web.assets_backend"
    directive: str = "append"
    target: str = ""

    def __post_init__(self) -> None:
        relative_path = _normalize_relative_path(self.relative_path)
        mimetype = str(self.mimetype or "").strip() or guess_backend_web_asset_mimetype(relative_path)
        directive = str(self.directive or "").strip().lower() or "append"
        target = str(self.target or "").strip().replace("\\", "/").lstrip("/")

        if directive not in ALLOWED_BACKEND_WEB_ASSET_DIRECTIVES:
            raise ValueError(f"Unsupported backend web asset directive: {directive!r}")
        if directive in DIRECTIVES_WITH_TARGET and not target:
            raise ValueError(f"Directive {directive!r} requires target for asset {self.name!r}")

        object.__setattr__(self, "name", _normalize_text(self.name, field_name="name"))
        object.__setattr__(self, "relative_path", relative_path)
        object.__setattr__(self, "mimetype", mimetype)
        object.__setattr__(self, "sequence", int(self.sequence))
        object.__setattr__(self, "bundle", _normalize_text(self.bundle, field_name="bundle"))
        object.__setattr__(self, "directive", directive)
        object.__setattr__(self, "target", target)


@dataclass(frozen=True)
class BackendWebAssetPublisherSpec:
    """Declare the Odoo model/value contract used by the publisher."""

    attachment_model_name: str = "ir.attachment"
    ir_asset_model_name: str = "ir.asset"
    attachment_name_prefix: str = "odoo-common.backend-web-assets::"
    attachment_type: str = "binary"
    attachment_public: bool = True
    attachment_res_model: str = "ir.ui.view"
    attachment_res_id: int = 0
    web_content_route: str = "/web/content"

    def __post_init__(self) -> None:
        object.__setattr__(
            self,
            "attachment_model_name",
            _normalize_text(self.attachment_model_name, field_name="attachment_model_name"),
        )
        object.__setattr__(
            self,
            "ir_asset_model_name",
            _normalize_text(self.ir_asset_model_name, field_name="ir_asset_model_name"),
        )
        object.__setattr__(
            self,
            "attachment_name_prefix",
            _normalize_text(self.attachment_name_prefix, field_name="attachment_name_prefix"),
        )
        object.__setattr__(
            self,
            "attachment_type",
            _normalize_text(self.attachment_type, field_name="attachment_type"),
        )
        object.__setattr__(self, "attachment_public", bool(self.attachment_public))
        object.__setattr__(
            self,
            "attachment_res_model",
            _normalize_text(self.attachment_res_model, field_name="attachment_res_model"),
        )
        object.__setattr__(self, "attachment_res_id", int(self.attachment_res_id))
        object.__setattr__(
            self,
            "web_content_route",
            _normalize_text(self.web_content_route, field_name="web_content_route").rstrip("/"),
        )


DEFAULT_BACKEND_WEB_ASSET_PUBLISHER_SPEC = BackendWebAssetPublisherSpec()
BackendWebAssetContentTransform = Callable[[BackendWebAssetSpec, bytes], bytes]


@dataclass(frozen=True)
class BackendWebAssetPublishResult:
    """Describe one published backend web asset."""

    spec: BackendWebAssetSpec
    attachment_name: str
    attachment_id: int
    ir_asset_id: int
    checksum: str
    web_path: str


@dataclass(frozen=True)
class BackendWebAssetPublication:
    """Describe a complete publication pass."""

    assets: tuple[BackendWebAssetPublishResult, ...]
    stale_ir_assets_removed: int = 0
    stale_attachments_removed: int = 0


@runtime_checkable
class BackendWebAssetConnection(Protocol):
    """Minimal Odoo RPC contract required by backend web asset publication."""

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

    def unlink(self, model_name: str, ids: Sequence[int]) -> Any:
        """Delete one or more records."""


def dedupe_backend_web_asset_specs(
    specs: Sequence[BackendWebAssetSpec | Mapping[str, Any]],
) -> tuple[BackendWebAssetSpec, ...]:
    """Deduplicate specs by bundle/path and fail on conflicting declarations."""
    deduped: list[BackendWebAssetSpec] = []
    seen: dict[tuple[str, str], BackendWebAssetSpec] = {}
    for spec in specs:
        normalized = spec if isinstance(spec, BackendWebAssetSpec) else BackendWebAssetSpec(**dict(spec))
        key = (normalized.bundle, normalized.relative_path.as_posix())
        existing = seen.get(key)
        if existing is None:
            seen[key] = normalized
            deduped.append(normalized)
            continue
        if existing != normalized:
            raise ValueError(f"Conflicting backend web asset spec for bundle/path {key}: {existing!r} vs {normalized!r}")
    return tuple(deduped)


def build_backend_web_asset_specs_from_common_bindings(
    bindings: Sequence[Any],
    *,
    start_sequence: int = 10000,
    sequence_step: int = 1,
    bundle: str = "web.assets_backend",
    directive: str = "append",
    target: str = "",
    target_prefix_to_strip: str | Path | None = None,
    name_prefix: str = "",
) -> tuple[BackendWebAssetSpec, ...]:
    """Build backend asset specs from dependency-ordered common sync bindings."""
    if sequence_step < 1:
        raise ValueError("Backend web asset sequence_step must be >= 1")

    grouped_bindings: dict[str, list[Any]] = {}
    component_order: list[str] = []
    for binding in bindings:
        language = str(_common_binding_value(binding, "language") or "").strip().lower()
        if language != "web":
            continue

        source_relative = _normalize_relative_path(_common_binding_value(binding, "source_relative"))
        if source_relative.suffix.lower() not in {".js", ".css"}:
            continue

        publish_order_index = _common_binding_value(binding, "publish_order_index")
        if publish_order_index is None:
            raise ValueError(
                "Common web asset bindings must include publish_order_index for "
                f"{source_relative.as_posix()}"
            )

        component_key = _normalize_text(
            _common_binding_value(binding, "component_key"),
            field_name="component_key",
        )
        if component_key not in grouped_bindings:
            grouped_bindings[component_key] = []
            component_order.append(component_key)
        grouped_bindings[component_key].append(binding)

    sequence = int(start_sequence)
    specs: list[BackendWebAssetSpec] = []
    for component_key in component_order:
        component_bindings = sorted(
            grouped_bindings[component_key],
            key=lambda binding: (
                int(_common_binding_value(binding, "publish_order_index")),
                _normalize_relative_path(_common_binding_value(binding, "source_relative")).as_posix(),
            ),
        )
        for binding in component_bindings:
            source_relative = _normalize_relative_path(_common_binding_value(binding, "source_relative"))
            target_relative = _strip_backend_web_asset_target_prefix(
                _common_binding_value(binding, "target_relative"),
                target_prefix_to_strip,
            )
            title = str(_common_binding_value(binding, "title") or component_key).strip() or component_key
            specs.append(
                BackendWebAssetSpec(
                    name=f"{name_prefix}{_humanize_backend_web_asset_name(title, source_relative)}",
                    relative_path=target_relative,
                    mimetype=guess_backend_web_asset_mimetype(source_relative),
                    sequence=sequence,
                    bundle=bundle,
                    directive=directive,
                    target=target,
                )
            )
            sequence += sequence_step
    return tuple(specs)


def replace_backend_web_asset_tokens(
    content: bytes,
    replacements: Mapping[str | bytes, Any],
    *,
    require_all: bool = True,
) -> bytes:
    """Apply explicit byte replacements to one asset payload."""
    updated = bytes(content)
    for raw_token, raw_value in replacements.items():
        token = raw_token if isinstance(raw_token, bytes) else str(raw_token).encode("utf-8")
        if not token:
            raise ValueError("Backend web asset replacement token must not be empty")
        if require_all and token not in updated:
            raise ValueError(f"Backend web asset replacement token not found: {token!r}")
        value = raw_value if isinstance(raw_value, bytes) else str(raw_value).encode("utf-8")
        updated = updated.replace(token, value)
    return updated


def compute_backend_web_asset_fingerprint(
    asset_root: str | Path,
    specs: Sequence[BackendWebAssetSpec],
    *,
    content_transform: BackendWebAssetContentTransform | None = None,
) -> str:
    """Compute a deterministic fingerprint from declared paths, sequences, and content."""
    root = Path(asset_root)
    fingerprint = hashlib.sha1()
    for spec in dedupe_backend_web_asset_specs(specs):
        content = _read_backend_web_asset_content(root, spec, content_transform=content_transform)
        fingerprint.update(str(spec.sequence).encode("utf-8"))
        fingerprint.update(b"::")
        fingerprint.update(spec.bundle.encode("utf-8"))
        fingerprint.update(b"::")
        fingerprint.update(spec.relative_path.as_posix().encode("utf-8"))
        fingerprint.update(b"::")
        fingerprint.update(content)
        fingerprint.update(b"\n")
    return fingerprint.hexdigest()


def publish_backend_web_assets(
    conn: BackendWebAssetConnection,
    asset_root: str | Path,
    specs: Sequence[BackendWebAssetSpec],
    *,
    publisher_spec: BackendWebAssetPublisherSpec = DEFAULT_BACKEND_WEB_ASSET_PUBLISHER_SPEC,
    content_transform: BackendWebAssetContentTransform | None = None,
    managed_asset_name_prefixes: Sequence[str] = (),
    cleanup_stale_attachments: bool = False,
) -> BackendWebAssetPublication:
    """Publish declared files as attachment-backed `ir.asset` rows."""
    root = Path(asset_root)
    active_asset_names: set[str] = set()
    active_attachment_names: set[str] = set()
    published: list[BackendWebAssetPublishResult] = []

    for spec in dedupe_backend_web_asset_specs(specs):
        content = _read_backend_web_asset_content(root, spec, content_transform=content_transform)
        checksum = hashlib.sha1(content).hexdigest()
        attachment_name = build_backend_web_asset_attachment_name(spec, checksum, publisher_spec=publisher_spec)
        attachment_id = upsert_backend_web_asset_attachment(
            conn,
            spec,
            attachment_name=attachment_name,
            content=content,
            publisher_spec=publisher_spec,
        )
        web_path = build_backend_web_asset_content_path(
            attachment_id,
            checksum,
            publisher_spec=publisher_spec,
        )
        ir_asset_id = upsert_backend_ir_asset(
            conn,
            spec,
            web_path=web_path,
            publisher_spec=publisher_spec,
        )
        active_asset_names.add(spec.name)
        active_attachment_names.add(attachment_name)
        published.append(
            BackendWebAssetPublishResult(
                spec=spec,
                attachment_name=attachment_name,
                attachment_id=attachment_id,
                ir_asset_id=ir_asset_id,
                checksum=checksum,
                web_path=web_path,
            )
        )

    stale_ir_assets_removed = 0
    if managed_asset_name_prefixes:
        stale_ir_assets_removed = cleanup_stale_backend_ir_assets(
            conn,
            active_asset_names,
            managed_asset_name_prefixes,
            publisher_spec=publisher_spec,
        )

    stale_attachments_removed = 0
    if cleanup_stale_attachments:
        stale_attachments_removed = cleanup_stale_backend_asset_attachments(
            conn,
            active_attachment_names,
            publisher_spec=publisher_spec,
        )

    return BackendWebAssetPublication(
        assets=tuple(published),
        stale_ir_assets_removed=stale_ir_assets_removed,
        stale_attachments_removed=stale_attachments_removed,
    )


def build_backend_web_asset_attachment_name(
    spec: BackendWebAssetSpec,
    checksum: str,
    *,
    publisher_spec: BackendWebAssetPublisherSpec = DEFAULT_BACKEND_WEB_ASSET_PUBLISHER_SPEC,
) -> str:
    """Build the managed attachment name for a content-addressed asset."""
    return f"{publisher_spec.attachment_name_prefix}{spec.relative_path.as_posix()}::{checksum}"


def build_backend_web_asset_content_path(
    attachment_id: int,
    checksum: str,
    *,
    publisher_spec: BackendWebAssetPublisherSpec = DEFAULT_BACKEND_WEB_ASSET_PUBLISHER_SPEC,
) -> str:
    """Build the `/web/content` URL used by `ir.asset.path`."""
    route = str(publisher_spec.web_content_route or "").rstrip("/")
    if not route:
        raise ValueError("Backend web asset web_content_route is required")
    return f"{route}/{int(attachment_id)}?download=false&unique={checksum}"


def upsert_backend_web_asset_attachment(
    conn: BackendWebAssetConnection,
    spec: BackendWebAssetSpec,
    *,
    attachment_name: str,
    content: bytes,
    publisher_spec: BackendWebAssetPublisherSpec = DEFAULT_BACKEND_WEB_ASSET_PUBLISHER_SPEC,
) -> int:
    """Create the content-addressed attachment when it does not exist."""
    existing = conn.search_read(
        publisher_spec.attachment_model_name,
        [
            ("name", "=", attachment_name),
            ("type", "=", publisher_spec.attachment_type),
        ],
        ["id"],
        limit=1,
    )
    if existing:
        return _required_record_id(existing[0].get("id"), context=f"existing {publisher_spec.attachment_model_name}")

    values = {
        "name": attachment_name,
        "type": publisher_spec.attachment_type,
        "datas": base64.b64encode(content).decode("ascii"),
        "mimetype": spec.mimetype,
        "public": bool(publisher_spec.attachment_public),
        "res_model": publisher_spec.attachment_res_model,
        "res_id": int(publisher_spec.attachment_res_id),
    }
    return _required_record_id(
        conn.create(publisher_spec.attachment_model_name, values),
        context=f"created {publisher_spec.attachment_model_name}",
    )


def upsert_backend_ir_asset(
    conn: BackendWebAssetConnection,
    spec: BackendWebAssetSpec,
    *,
    web_path: str,
    publisher_spec: BackendWebAssetPublisherSpec = DEFAULT_BACKEND_WEB_ASSET_PUBLISHER_SPEC,
) -> int:
    """Create or update the `ir.asset` row for one backend web asset."""
    existing = conn.search_read(
        publisher_spec.ir_asset_model_name,
        [
            ("name", "=", spec.name),
            ("bundle", "=", spec.bundle),
        ],
        ["id"],
        limit=1,
    )
    values: dict[str, Any] = {
        "name": spec.name,
        "bundle": spec.bundle,
        "path": web_path,
        "sequence": int(spec.sequence),
        "active": True,
        "directive": spec.directive,
        "target": spec.target or False,
    }
    if existing:
        asset_id = _required_record_id(existing[0].get("id"), context=f"existing {publisher_spec.ir_asset_model_name}")
        conn.write(publisher_spec.ir_asset_model_name, [asset_id], values)
        return asset_id
    return _required_record_id(
        conn.create(publisher_spec.ir_asset_model_name, values),
        context=f"created {publisher_spec.ir_asset_model_name}",
    )


def cleanup_stale_backend_ir_assets(
    conn: BackendWebAssetConnection,
    active_asset_names: set[str] | frozenset[str],
    managed_name_prefixes: Sequence[str],
    *,
    publisher_spec: BackendWebAssetPublisherSpec = DEFAULT_BACKEND_WEB_ASSET_PUBLISHER_SPEC,
) -> int:
    """Delete managed `ir.asset` rows not present in the active publication set."""
    stale_ids: list[int] = []
    seen_ids: set[int] = set()
    for prefix in managed_name_prefixes:
        clean_prefix = str(prefix or "").strip()
        if not clean_prefix:
            raise ValueError("Managed backend web asset name prefixes must not be empty")
        rows = conn.search_read(
            publisher_spec.ir_asset_model_name,
            [("name", "like", f"{clean_prefix}%")],
            ["id", "name"],
        )
        for row in rows:
            asset_id = _record_id(row.get("id"))
            asset_name = str(row.get("name") or "")
            if asset_id <= 0 or asset_id in seen_ids or asset_name in active_asset_names:
                continue
            seen_ids.add(asset_id)
            stale_ids.append(asset_id)
    if stale_ids:
        conn.unlink(publisher_spec.ir_asset_model_name, stale_ids)
    return len(stale_ids)


def cleanup_stale_backend_asset_attachments(
    conn: BackendWebAssetConnection,
    active_attachment_names: set[str] | frozenset[str],
    *,
    publisher_spec: BackendWebAssetPublisherSpec = DEFAULT_BACKEND_WEB_ASSET_PUBLISHER_SPEC,
) -> int:
    """Delete managed attachments not present in the active publication set."""
    rows = conn.search_read(
        publisher_spec.attachment_model_name,
        [
            ("name", "like", f"{publisher_spec.attachment_name_prefix}%"),
            ("type", "=", publisher_spec.attachment_type),
        ],
        ["id", "name"],
    )
    stale_ids = [
        _record_id(row.get("id"))
        for row in rows
        if _record_id(row.get("id")) > 0 and str(row.get("name") or "") not in active_attachment_names
    ]
    if stale_ids:
        conn.unlink(publisher_spec.attachment_model_name, stale_ids)
    return len(stale_ids)


def _read_backend_web_asset_content(
    asset_root: Path,
    spec: BackendWebAssetSpec,
    *,
    content_transform: BackendWebAssetContentTransform | None,
) -> bytes:
    absolute_path = asset_root / spec.relative_path
    if not absolute_path.exists() or not absolute_path.is_file():
        raise FileNotFoundError(f"Backend web asset file not found: {absolute_path}")
    content = absolute_path.read_bytes()
    if content_transform is not None:
        content = content_transform(spec, content)
    if not isinstance(content, bytes):
        raise TypeError(f"Backend web asset content_transform must return bytes for {spec.relative_path.as_posix()}")
    return content


def _common_binding_value(binding: Any, key: str) -> Any:
    if isinstance(binding, Mapping):
        return binding.get(key)
    return getattr(binding, key, None)


def _strip_backend_web_asset_target_prefix(
    target_relative: Any,
    target_prefix_to_strip: str | Path | None,
) -> Path:
    path = _normalize_relative_path(target_relative)
    if target_prefix_to_strip is None or str(target_prefix_to_strip or "").strip() == "":
        return path

    prefix = _normalize_relative_path(target_prefix_to_strip)
    prefix_parts = prefix.parts
    if path.parts[: len(prefix_parts)] != prefix_parts:
        raise ValueError(
            "Backend web asset target_relative does not start with declared "
            f"target_prefix_to_strip {prefix.as_posix()!r}: {path.as_posix()!r}"
        )
    remaining_parts = path.parts[len(prefix_parts) :]
    if not remaining_parts:
        raise ValueError(
            "Backend web asset target_prefix_to_strip removed the entire path: "
            f"{path.as_posix()!r}"
        )
    return Path(PurePosixPath(*remaining_parts).as_posix())


def _humanize_backend_web_asset_name(component_title: str, source_relative: Path) -> str:
    suffix = "CSS" if source_relative.suffix.lower() == ".css" else "JS"
    stem = source_relative.stem.replace("_", " ").replace("-", " ").strip()
    title = stem.title() if stem else source_relative.name
    return f"{component_title} {title} ({suffix})"


def _record_id(value: Any) -> int:
    if isinstance(value, Mapping):
        return _record_id(value.get("id"))
    if isinstance(value, (list, tuple)) and value:
        return _record_id(value[0])
    return int(value or 0)


def _required_record_id(value: Any, *, context: str) -> int:
    record_id = _record_id(value)
    if record_id <= 0:
        raise RuntimeError(f"Backend web asset publisher did not receive a valid ID for {context}")
    return record_id
