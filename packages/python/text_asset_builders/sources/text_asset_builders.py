"""Canonical builders for concatenated text assets driven by JSON manifests."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any, Sequence


def load_text_asset_module_order(manifest_path: str | Path, key: str = "modules") -> tuple[str, ...]:
    """Load and normalize an ordered module list from a JSON manifest."""
    path = Path(manifest_path)
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise TypeError(f"Text asset manifest must contain a JSON object: {path}")

    clean_key = _clean_required_text(key, field_name="manifest key")
    modules = payload.get(clean_key)
    if isinstance(modules, (str, bytes)) or not isinstance(modules, Sequence):
        raise ValueError(f"Text asset manifest key {clean_key!r} must contain a non-empty list: {path}")

    normalized = tuple(_clean_required_text(item, field_name="module") for item in modules if str(item or "").strip())
    if not normalized:
        raise ValueError(f"Text asset manifest has no modules: {path}")
    if len(set(normalized)) != len(normalized):
        raise ValueError(f"Text asset manifest contains duplicate modules: {path}")
    return normalized


def assemble_text_modules(
    source_root: str | Path,
    module_order: Sequence[str],
    *,
    separator: str = "",
    strip_trailing: bool = False,
    append_final_newline: bool = True,
) -> tuple[str, tuple[dict[str, int | str], ...]]:
    """Concatenate ordered text modules and collect build metadata."""
    root = Path(source_root)
    if isinstance(module_order, (str, bytes)) or not isinstance(module_order, Sequence):
        raise TypeError("Text asset module_order must be a sequence")
    clean_module_order = tuple(_clean_required_text(module, field_name="module") for module in module_order)
    if not clean_module_order:
        raise ValueError("Text asset module_order must not be empty")

    chunks: list[str] = []
    details: list[dict[str, int | str]] = []
    for module_name in clean_module_order:
        module_path = root / module_name
        if not module_path.is_file():
            raise FileNotFoundError(f"Text asset module not found: {module_path}")
        text = module_path.read_text(encoding="utf-8")
        chunks.append(text.rstrip() if strip_trailing else text)
        details.append(
            {
                "module": module_name,
                "lines": len(text.splitlines()),
                "bytes": len(text.encode("utf-8")),
            }
        )

    assembled_text = str(separator).join(chunks)
    if append_final_newline and not assembled_text.endswith("\n"):
        assembled_text += "\n"
    return assembled_text, tuple(details)


def build_text_asset_manifest_payload(
    *,
    repo_root: str | Path,
    target_path: str | Path,
    assembled_text: str,
    module_details: Sequence[dict[str, int | str]],
) -> dict[str, Any]:
    """Build a JSON-friendly manifest payload for one assembled text asset."""
    root = Path(repo_root)
    target = Path(target_path)
    return {
        "target": target.relative_to(root).as_posix(),
        "sha1": hashlib.sha1(str(assembled_text).encode("utf-8")).hexdigest(),
        "modules": [dict(item) for item in module_details],
    }


def write_text_asset_build_manifest(
    *,
    repo_root: str | Path,
    target_path: str | Path,
    build_manifest_path: str | Path,
    assembled_text: str,
    module_details: Sequence[dict[str, int | str]],
) -> dict[str, Any]:
    """Persist a small manifest describing the assembled text asset."""
    payload = build_text_asset_manifest_payload(
        repo_root=repo_root,
        target_path=target_path,
        assembled_text=assembled_text,
        module_details=module_details,
    )
    output = Path(build_manifest_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8", newline="\n")
    return payload


def _clean_required_text(value: Any, *, field_name: str) -> str:
    clean_value = str(value or "").strip()
    if not clean_value:
        raise ValueError(f"Text asset {field_name} is required")
    if "\\" in clean_value:
        raise ValueError(f"Text asset {field_name} must use POSIX-style paths: {clean_value!r}")
    path = Path(clean_value)
    if path.is_absolute() or any(part in {"", ".", ".."} for part in clean_value.split("/")):
        raise ValueError(f"Text asset {field_name} must be relative and normalized: {clean_value!r}")
    if ":" in clean_value.split("/", 1)[0]:
        raise ValueError(f"Text asset {field_name} must not include a drive prefix: {clean_value!r}")
    return clean_value
