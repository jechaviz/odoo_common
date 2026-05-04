"""Declarative sync helpers for generated consumer copies of common packages."""

from __future__ import annotations

import json
import os
import shutil
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from typing import Any, Mapping, Sequence


WEB_ASSET_SUFFIXES = frozenset({".js", ".css"})


@dataclass(frozen=True)
class CommonSyncEntry:
    """Declare one component sync target in a consumer repo."""

    component_key: str
    target_relative: Path
    mode: str = "tree"
    prune: bool = False

    def __post_init__(self) -> None:
        component_key = str(self.component_key or "").strip()
        if not component_key:
            raise ValueError("Common sync component_key is required")
        object.__setattr__(self, "component_key", component_key)
        object.__setattr__(self, "target_relative", normalize_relative_path(self.target_relative))
        object.__setattr__(self, "mode", normalize_sync_mode(self.mode))
        object.__setattr__(self, "prune", bool(self.prune))


@dataclass(frozen=True)
class CommonComponentPackage:
    """Resolved common package metadata from catalog and package manifest."""

    component_key: str
    title: str
    package_root: Path
    source_root: Path
    sync_mode: str
    exports: tuple[Path, ...]
    publish_order: tuple[Path, ...]
    language: str
    status: str
    dependencies: tuple[str, ...]


@dataclass(frozen=True)
class CommonSyncFileBinding:
    """Resolved source-to-target file binding for one exported file."""

    component_key: str
    title: str
    language: str
    status: str
    mode: str
    prune: bool
    source_root: Path
    target_root: Path
    source_relative: Path
    target_relative: Path
    publish_order_index: int | None


def resolve_default_common_root() -> Path:
    """Resolve the common root from env or the current checkout."""
    env_root = str(os.environ.get("ODOO_COMMON_ROOT") or "").strip()
    if env_root:
        return Path(env_root)

    for parent in Path(__file__).resolve().parents:
        if (parent / "catalog" / "components.json").is_file() and (parent / "packages").is_dir():
            return parent

    raise RuntimeError("ODOO_COMMON_ROOT is required when common root cannot be inferred.")


def _resolve_common_root(common_root: str | Path | None) -> Path:
    return Path(common_root) if common_root is not None else resolve_default_common_root()


def normalize_sync_mode(value: Any) -> str:
    mode = str(value or "tree").strip().lower()
    if mode not in {"tree", "file"}:
        raise ValueError(f"Unsupported common sync mode: {mode!r}")
    return mode


def normalize_relative_path(value: Any) -> Path:
    raw = str(value or "").strip().replace("\\", "/").lstrip("/")
    if not raw:
        raise ValueError("Common sync target path is required")
    path = PurePosixPath(raw)
    if path.is_absolute() or any(part in {"", ".", ".."} for part in path.parts):
        raise ValueError(f"Common sync path must be relative and normalized: {value!r}")
    if path.parts and ":" in path.parts[0]:
        raise ValueError(f"Common sync path must not include a drive prefix: {value!r}")
    return Path(path.as_posix())


def load_common_sync_entries(manifest_path: str | Path) -> list[CommonSyncEntry]:
    """Load sync entries from a consumer manifest."""
    payload = json.loads(Path(manifest_path).read_text(encoding="utf-8"))
    entries: list[CommonSyncEntry] = []
    for raw_entry in payload.get("entries", []):
        if not isinstance(raw_entry, Mapping):
            raise TypeError("Common sync manifest entries must be objects")
        entries.append(
            CommonSyncEntry(
                component_key=str(raw_entry.get("component_key") or "").strip(),
                target_relative=normalize_relative_path(raw_entry.get("target_relative")),
                mode=raw_entry.get("mode", "tree"),
                prune=bool(raw_entry.get("prune", False)),
            )
        )
    return entries


def load_common_component_catalog(common_root: str | Path | None = None) -> dict[str, dict[str, Any]]:
    """Load catalog components by key from a common checkout."""
    root = _resolve_common_root(common_root)
    payload = json.loads((root / "catalog" / "components.json").read_text(encoding="utf-8"))
    catalog: dict[str, dict[str, Any]] = {}
    for raw_entry in payload:
        if not isinstance(raw_entry, Mapping):
            continue
        key = str(raw_entry.get("key") or "").strip()
        if key:
            catalog[key] = dict(raw_entry)
    return catalog


def _normalize_path_list(raw_values: Any) -> tuple[Path, ...]:
    if not isinstance(raw_values, Sequence) or isinstance(raw_values, (str, bytes)):
        return tuple()
    return tuple(normalize_relative_path(value) for value in raw_values if str(value or "").strip())


def _normalize_component_keys(raw_values: Any) -> tuple[str, ...]:
    if not isinstance(raw_values, Sequence) or isinstance(raw_values, (str, bytes)):
        return tuple()
    return tuple(str(value or "").strip() for value in raw_values if str(value or "").strip())


def resolve_common_component_package(
    common_root: str | Path | None,
    component_key: str,
) -> CommonComponentPackage:
    """Resolve one component package from catalog and package manifest."""
    root = _resolve_common_root(common_root)
    key = str(component_key or "").strip()
    if not key:
        raise ValueError("component_key is required")
    catalog = load_common_component_catalog(root)
    component = catalog.get(key)
    if component is None:
        raise KeyError(f"Common component not found: {key}")

    package_path = normalize_relative_path(component.get("package_path"))
    package_root = root / package_path
    manifest_path = package_root / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest_key = str(manifest.get("key") or "").strip()
    if manifest_key != key:
        raise ValueError(f"Common component manifest key mismatch for {key}: {manifest_key or '<missing>'}")

    sync_root = normalize_relative_path(manifest.get("sync_root") or "sources")
    status = str(manifest.get("status") or component.get("status") or "").strip().lower()
    if status != "canonical":
        raise ValueError(f"Common component sync requires canonical package status: {key}")

    return CommonComponentPackage(
        component_key=key,
        title=str(component.get("title") or key).strip() or key,
        package_root=package_root,
        source_root=package_root / sync_root,
        sync_mode=normalize_sync_mode(manifest.get("sync_mode") or "tree"),
        exports=_normalize_path_list(manifest.get("exports")),
        publish_order=_normalize_path_list(manifest.get("publish_order")),
        language=str(manifest.get("language") or "").strip().lower(),
        status=status,
        dependencies=_normalize_component_keys(manifest.get("dependencies")),
    )


def resolve_common_component_source_root(common_root: str | Path | None, component_key: str) -> Path:
    """Return the source root for one component package."""
    return resolve_common_component_package(common_root, component_key).source_root


def _iter_relative_files(root: Path) -> list[Path]:
    if not root.exists():
        return []
    return sorted(path.relative_to(root) for path in root.rglob("*") if path.is_file())


def _iter_export_relative_files(source_root: Path, exports: tuple[Path, ...]) -> list[Path]:
    if not exports:
        return _iter_relative_files(source_root)

    resolved: list[Path] = []
    seen: set[str] = set()
    for export_path in exports:
        absolute_path = source_root / export_path
        if absolute_path.is_file():
            candidates = [export_path]
        elif absolute_path.is_dir():
            candidates = sorted(path.relative_to(source_root) for path in absolute_path.rglob("*") if path.is_file())
        else:
            raise FileNotFoundError(f"Common export path not found: {absolute_path}")

        for candidate in candidates:
            key = candidate.as_posix()
            if key not in seen:
                seen.add(key)
                resolved.append(candidate)
    return resolved


def _build_publish_order_index(
    package: CommonComponentPackage,
    relative_exports: list[Path],
) -> dict[str, int]:
    if package.language != "web":
        return {}
    if not package.publish_order:
        raise ValueError(f"Canonical web package {package.component_key} must declare publish_order.")

    export_asset_keys = {
        relative_path.as_posix()
        for relative_path in relative_exports
        if relative_path.suffix.lower() in WEB_ASSET_SUFFIXES
    }
    publish_order_index: dict[str, int] = {}
    for publish_index, publish_relative in enumerate(package.publish_order):
        publish_key = publish_relative.as_posix()
        if publish_relative.suffix.lower() not in WEB_ASSET_SUFFIXES:
            raise ValueError(
                f"Canonical web package {package.component_key} publish_order contains non-web asset: {publish_key}"
            )
        if publish_key not in export_asset_keys:
            raise ValueError(
                f"Canonical web package {package.component_key} publish_order references non-exported asset: {publish_key}"
            )
        if publish_key in publish_order_index:
            raise ValueError(
                f"Canonical web package {package.component_key} duplicates publish_order entry: {publish_key}"
            )
        publish_order_index[publish_key] = publish_index

    missing_keys = sorted(export_asset_keys.difference(publish_order_index))
    if missing_keys:
        raise ValueError(
            f"Canonical web package {package.component_key} publish_order must cover all exported web assets: {', '.join(missing_keys)}"
        )
    return publish_order_index


def _resolve_common_sync_packages(
    entries: list[CommonSyncEntry],
    common_root: str | Path | None,
) -> list[tuple[CommonSyncEntry, CommonComponentPackage]]:
    by_key = {entry.component_key for entry in entries}
    resolved_by_key: dict[str, tuple[CommonSyncEntry, CommonComponentPackage]] = {}
    for entry in entries:
        if entry.component_key in resolved_by_key:
            raise ValueError(f"Duplicate common sync component entry: {entry.component_key}")
        package = resolve_common_component_package(common_root, entry.component_key)
        missing_dependencies = [dependency for dependency in package.dependencies if dependency not in by_key]
        if missing_dependencies:
            raise ValueError(
                f"Common component {entry.component_key} requires sync entries for: {', '.join(missing_dependencies)}"
            )
        resolved_by_key[entry.component_key] = (entry, package)

    ordered: list[tuple[CommonSyncEntry, CommonComponentPackage]] = []
    visit_state: dict[str, str] = {}

    def visit(component_key: str) -> None:
        state = visit_state.get(component_key, "")
        if state == "done":
            return
        if state == "visiting":
            raise ValueError(f"Cyclic common sync dependency detected at: {component_key}")
        visit_state[component_key] = "visiting"
        entry, package = resolved_by_key[component_key]
        for dependency_key in package.dependencies:
            visit(dependency_key)
        visit_state[component_key] = "done"
        ordered.append((entry, package))

    for entry in entries:
        visit(entry.component_key)
    return ordered


def build_common_sync_file_bindings(
    *,
    project_root: str | Path,
    common_root: str | Path | None = None,
    entries: list[CommonSyncEntry],
) -> list[CommonSyncFileBinding]:
    """Build dependency-ordered file bindings for a consumer sync pass."""
    consumer_root = Path(project_root)
    bindings: list[CommonSyncFileBinding] = []
    owned_targets: dict[str, str] = {}
    for entry, package in _resolve_common_sync_packages(entries, common_root):
        source_root = package.source_root
        target_root = consumer_root / entry.target_relative
        relative_exports = _iter_export_relative_files(source_root, package.exports)
        publish_order_index = _build_publish_order_index(package, relative_exports)

        if entry.mode == "file" and len(relative_exports) != 1:
            raise ValueError(
                f"Common component {entry.component_key} cannot sync as file with {len(relative_exports)} exports"
            )

        for source_relative in relative_exports:
            target_relative = entry.target_relative if entry.mode == "file" else entry.target_relative / source_relative
            target_key = target_relative.as_posix()
            owner = owned_targets.get(target_key)
            if owner and owner != entry.component_key:
                raise ValueError(f"Common sync target collision for {target_key}: {owner} vs {entry.component_key}")
            owned_targets[target_key] = entry.component_key
            bindings.append(
                CommonSyncFileBinding(
                    component_key=entry.component_key,
                    title=package.title,
                    language=package.language,
                    status=package.status,
                    mode=entry.mode,
                    prune=entry.prune,
                    source_root=source_root,
                    target_root=target_root if entry.mode == "tree" else target_root.parent,
                    source_relative=source_relative,
                    target_relative=target_relative,
                    publish_order_index=publish_order_index.get(source_relative.as_posix()),
                )
            )
    return bindings


def _sync_file(source_path: Path, target_path: Path) -> bool:
    if not source_path.is_file():
        raise FileNotFoundError(f"Common source file not found: {source_path}")
    target_path.parent.mkdir(parents=True, exist_ok=True)
    source_bytes = source_path.read_bytes()
    if target_path.exists() and target_path.read_bytes() == source_bytes:
        return False
    shutil.copy2(source_path, target_path)
    return True


def _prune_tree_from_files(target_root: Path, relative_files: list[Path]) -> int:
    if not target_root.exists():
        return 0
    keep = {relative_path.as_posix() for relative_path in relative_files}
    removed = 0
    for target_relative in _iter_relative_files(target_root):
        if target_relative.as_posix() in keep:
            continue
        (target_root / target_relative).unlink()
        removed += 1
    return removed


def _ensure_python_namespace(project_root: Path, target_relative: Path) -> None:
    if target_relative.parts[:2] != ("src", "odoo_common"):
        return
    namespace_root = project_root / "src" / "odoo_common"
    namespace_root.mkdir(parents=True, exist_ok=True)
    init_path = namespace_root / "__init__.py"
    if not init_path.exists():
        init_path.write_text('"""Generated namespace for canonical Odoo common packages."""\n', encoding="utf-8")


def sync_common_packages(
    *,
    project_root: str | Path,
    common_root: str | Path | None = None,
    entries: list[CommonSyncEntry],
) -> list[dict[str, Any]]:
    """Copy declared common package exports into a consumer repo."""
    consumer_root = Path(project_root)
    bindings = build_common_sync_file_bindings(project_root=consumer_root, common_root=common_root, entries=entries)
    results: list[dict[str, Any]] = []
    result_index_by_component: dict[str, int] = {}
    tree_keep_files: dict[Path, list[Path]] = {}
    tree_prune: dict[Path, bool] = {}
    tree_result_indexes: dict[Path, list[int]] = {}

    for binding in bindings:
        if binding.language == "python":
            _ensure_python_namespace(consumer_root, binding.target_relative.parent)
        result_index = result_index_by_component.get(binding.component_key)
        if result_index is None:
            results.append(
                {
                    "component_key": binding.component_key,
                    "mode": binding.mode,
                    "copied": 0,
                    "removed": 0,
                    "source": str(binding.source_root),
                    "target": str(binding.target_root if binding.mode == "tree" else consumer_root / binding.target_relative),
                    "language": binding.language,
                    "status": binding.status,
                }
            )
            result_index = len(results) - 1
            result_index_by_component[binding.component_key] = result_index

        if _sync_file(binding.source_root / binding.source_relative, consumer_root / binding.target_relative):
            results[result_index]["copied"] += 1

        if binding.mode == "tree":
            keep_files = tree_keep_files.setdefault(binding.target_root, [])
            if binding.source_relative.as_posix() not in {path.as_posix() for path in keep_files}:
                keep_files.append(binding.source_relative)
            tree_prune[binding.target_root] = tree_prune.get(binding.target_root, False) or binding.prune
            tree_result_indexes.setdefault(binding.target_root, []).append(result_index)

    for target_root, keep_files in tree_keep_files.items():
        if not tree_prune.get(target_root):
            continue
        removed = _prune_tree_from_files(target_root, keep_files)
        if removed > 0:
            result_indexes = tree_result_indexes.get(target_root) or []
            if result_indexes:
                results[result_indexes[-1]]["removed"] = removed
    return results


__all__ = [
    "CommonComponentPackage",
    "CommonSyncEntry",
    "CommonSyncFileBinding",
    "build_common_sync_file_bindings",
    "load_common_component_catalog",
    "load_common_sync_entries",
    "resolve_common_component_package",
    "resolve_common_component_source_root",
    "resolve_default_common_root",
    "sync_common_packages",
]
