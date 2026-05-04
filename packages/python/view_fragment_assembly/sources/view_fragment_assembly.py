"""Strict XML view fragment assembly helpers."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from typing import Any, Mapping, Sequence


def _clean_required_text(value: Any, *, field_name: str) -> str:
    normalized = str(value or "").strip()
    if not normalized:
        raise ValueError(f"View fragment {field_name} is required")
    return normalized


def _normalize_relative_path(value: Any) -> Path:
    raw = str(value or "").strip().replace("\\", "/").lstrip("/")
    if not raw:
        raise ValueError("View fragment file path is required")
    path = PurePosixPath(raw)
    if path.is_absolute() or any(part in {"", ".", ".."} for part in path.parts):
        raise ValueError(f"View fragment file path must be relative and normalized: {value!r}")
    if path.parts and ":" in path.parts[0]:
        raise ValueError(f"View fragment file path must not include a drive prefix: {value!r}")
    return Path(path.as_posix())


@dataclass(frozen=True)
class ViewFragmentRegistry:
    """Map fragment keys to files under one declared root."""

    fragment_root: str | Path
    fragment_files: Mapping[str, str | Path]

    def __post_init__(self) -> None:
        root = Path(self.fragment_root)
        normalized_files: dict[str, Path] = {}
        for raw_key, raw_path in dict(self.fragment_files or {}).items():
            key = _clean_required_text(raw_key, field_name="key")
            if key in normalized_files:
                raise ValueError(f"Duplicate view fragment key: {key}")
            normalized_files[key] = _normalize_relative_path(raw_path)
        if not normalized_files:
            raise ValueError("View fragment registry requires at least one fragment")
        object.__setattr__(self, "fragment_root", root)
        object.__setattr__(self, "fragment_files", normalized_files)


@dataclass(frozen=True)
class ViewAssemblyBlueprint:
    """Declare one view assembled from registered fragment keys."""

    name: str
    model_name: str
    inherit_base_name: str
    fragment_keys: tuple[str, ...]

    def __post_init__(self) -> None:
        object.__setattr__(self, "name", _clean_required_text(self.name, field_name="blueprint name"))
        object.__setattr__(self, "model_name", _clean_required_text(self.model_name, field_name="model_name"))
        object.__setattr__(
            self,
            "inherit_base_name",
            _clean_required_text(self.inherit_base_name, field_name="inherit_base_name"),
        )
        keys = tuple(_clean_required_text(key, field_name="fragment_key") for key in self.fragment_keys)
        if not keys:
            raise ValueError(f"View blueprint {self.name!r} requires at least one fragment")
        object.__setattr__(self, "fragment_keys", keys)

    def as_dict(self) -> dict[str, object]:
        """Serialize the blueprint without leaking dataclass internals."""
        return {
            "name": self.name,
            "model": self.model_name,
            "inherit_base_name": self.inherit_base_name,
            "fragment_keys": list(self.fragment_keys),
        }


def read_view_fragment(registry: ViewFragmentRegistry, fragment_key: str) -> str:
    """Read one registered fragment by exact key."""
    key = _clean_required_text(fragment_key, field_name="key")
    relative_path = registry.fragment_files.get(key)
    if relative_path is None:
        raise KeyError(f"Unknown view fragment: {key}")
    fragment_path = Path(registry.fragment_root) / relative_path
    if not fragment_path.is_file():
        raise FileNotFoundError(f"View fragment file not found: {fragment_path}")
    return fragment_path.read_text(encoding="utf-8")


def build_view_arch(
    registry: ViewFragmentRegistry,
    fragment_keys: Sequence[str],
    substitutions: Mapping[str, str] | None = None,
    *,
    wrapper_tag: str = "data",
) -> str:
    """Assemble registered fragments into one wrapped XML arch string."""
    clean_wrapper_tag = _clean_required_text(wrapper_tag, field_name="wrapper_tag")
    keys = [_clean_required_text(key, field_name="fragment_key") for key in fragment_keys]
    if not keys:
        raise ValueError("build_view_arch requires at least one fragment key")
    combined = "\n".join(read_view_fragment(registry, key) for key in keys)
    arch = f"<{clean_wrapper_tag}>{combined}</{clean_wrapper_tag}>"
    for token, value in dict(substitutions or {}).items():
        clean_token = _clean_required_text(token, field_name="substitution token")
        arch = arch.replace(clean_token, str(value))
    return arch


def validate_registered_fragment_files(registry: ViewFragmentRegistry) -> tuple[Path, ...]:
    """Return registered fragment paths after verifying every file exists."""
    paths: list[Path] = []
    for relative_path in registry.fragment_files.values():
        absolute_path = Path(registry.fragment_root) / relative_path
        if not absolute_path.is_file():
            raise FileNotFoundError(f"View fragment file not found: {absolute_path}")
        paths.append(absolute_path)
    return tuple(paths)


__all__ = [
    "ViewAssemblyBlueprint",
    "ViewFragmentRegistry",
    "build_view_arch",
    "read_view_fragment",
    "validate_registered_fragment_files",
]
