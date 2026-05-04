"""Canonical helpers for declarative feature catalogs."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any, Iterable, Mapping


@dataclass(frozen=True)
class FeatureSpec:
    """Declare one reusable or installable feature."""

    key: str
    title: str
    description: str
    layer: str
    runner_name: str = ""
    installable: bool = True
    depends_on: tuple[str, ...] = ()
    tags: tuple[str, ...] = ()

    def __post_init__(self) -> None:
        object.__setattr__(self, "key", _clean_required_text(self.key, field_name="key"))
        object.__setattr__(self, "title", _clean_required_text(self.title, field_name="title"))
        object.__setattr__(self, "description", _clean_required_text(self.description, field_name="description"))
        object.__setattr__(self, "layer", _clean_required_text(self.layer, field_name="layer"))
        object.__setattr__(self, "runner_name", str(self.runner_name or "").strip())
        object.__setattr__(self, "installable", bool(self.installable))
        object.__setattr__(self, "depends_on", _clean_text_tuple(self.depends_on, field_name="depends_on"))
        object.__setattr__(self, "tags", _clean_text_tuple(self.tags, field_name="tags"))
        if self.installable and not self.runner_name:
            raise ValueError(f"Installable feature {self.key!r} requires runner_name")
        if not self.installable and self.runner_name:
            raise ValueError(f"Non-installable feature {self.key!r} must not declare runner_name")


def index_features(features: Iterable[FeatureSpec | Mapping[str, Any]]) -> dict[str, FeatureSpec]:
    """Index features by key and reject duplicates early."""
    indexed: dict[str, FeatureSpec] = {}
    for raw_feature in features:
        feature = raw_feature if isinstance(raw_feature, FeatureSpec) else FeatureSpec(**dict(raw_feature))
        if feature.key in indexed:
            raise ValueError(f"Duplicate feature key: {feature.key}")
        indexed[feature.key] = feature
    return indexed


def serialize_features(features: Iterable[FeatureSpec | Mapping[str, Any]]) -> tuple[dict[str, Any], ...]:
    """Return a JSON-friendly representation of the declared feature catalog."""
    return tuple(asdict(feature) for feature in index_features(features).values())


def validate_install_list(
    features: Iterable[FeatureSpec | Mapping[str, Any]],
    install_list: Iterable[str],
) -> tuple[FeatureSpec, ...]:
    """Resolve an install list against the declared catalog and validate dependencies."""
    indexed = index_features(features)
    install_keys = tuple(_clean_required_text(key, field_name="install key") for key in install_list)
    if len(set(install_keys)) != len(install_keys):
        raise ValueError("Install list contains duplicate feature keys")
    install_key_set = set(install_keys)
    resolved: list[FeatureSpec] = []

    for key in install_keys:
        feature = indexed.get(key)
        if feature is None:
            raise KeyError(f"Unknown feature: {key}")
        if not feature.installable:
            raise ValueError(f"Feature is not installable: {key}")
        missing_dependencies = [
            dependency_key
            for dependency_key in feature.depends_on
            if _dependency_requires_install(indexed, dependency_key) and dependency_key not in install_key_set
        ]
        if missing_dependencies:
            raise ValueError(
                f"Install list for {key!r} is missing dependencies: {', '.join(sorted(missing_dependencies))}"
            )
        resolved.append(feature)
    return tuple(resolved)


def _dependency_requires_install(indexed: Mapping[str, FeatureSpec], dependency_key: str) -> bool:
    dependency = indexed.get(dependency_key)
    if dependency is None:
        raise KeyError(f"Unknown dependency feature: {dependency_key}")
    return dependency.installable


def _clean_required_text(value: Any, *, field_name: str) -> str:
    clean_value = str(value or "").strip()
    if not clean_value:
        raise ValueError(f"Feature catalog {field_name} is required")
    return clean_value


def _clean_text_tuple(values: Iterable[Any], *, field_name: str) -> tuple[str, ...]:
    if isinstance(values, (str, bytes)):
        raise TypeError(f"Feature catalog {field_name} must be a sequence")
    cleaned = tuple(str(value or "").strip() for value in values if str(value or "").strip())
    if len(set(cleaned)) != len(cleaned):
        raise ValueError(f"Feature catalog {field_name} contains duplicates")
    return cleaned
