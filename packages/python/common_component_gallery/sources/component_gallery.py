"""Pure plans for browsing and installing common components."""

from __future__ import annotations

import importlib.util
import json
import re
import sys
import zipfile
from dataclasses import asdict, dataclass
from pathlib import Path, PurePosixPath
from typing import Any, Iterable, Mapping, Sequence


SUPPORTED_RUNTIMES = frozenset({"web", "python", "schema"})
SUPPORTED_TARGET_MODES = frozenset({"dry-run", "live"})
DEFAULT_GALLERY_MODULE = "x_odoo_common_gallery"
DEFAULT_GALLERY_SLUG = "odoo-common-gallery"
MODULE_RE = re.compile(r"^x_[a-z][a-z0-9_]*$")
SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9_\-]*$")
PATH_TOKEN_RE = re.compile(r"^[a-z0-9][a-z0-9_\-/]*$")


@dataclass(frozen=True)
class ComponentGalleryEntry:
    """One normalized component row for a Storybook-like common gallery."""

    key: str
    title: str
    runtime: str
    status: str
    package_path: str
    features: tuple[str, ...] = ()
    origins: tuple[dict[str, str], ...] = ()
    package_exists: bool | None = None

    def __post_init__(self) -> None:
        object.__setattr__(self, "key", _clean_required_text(self.key, field_name="key"))
        object.__setattr__(self, "title", _clean_required_text(self.title, field_name="title"))
        runtime = _clean_required_text(self.runtime, field_name="runtime")
        if runtime not in SUPPORTED_RUNTIMES:
            raise ValueError(f"Unsupported component runtime: {runtime}")
        object.__setattr__(self, "runtime", runtime)
        object.__setattr__(self, "status", _clean_required_text(self.status, field_name="status"))
        object.__setattr__(self, "package_path", _clean_required_text(self.package_path, field_name="package_path"))
        object.__setattr__(self, "features", _clean_text_tuple(self.features, field_name="features"))
        object.__setattr__(self, "origins", _clean_origins(self.origins))
        if self.package_exists is not None:
            object.__setattr__(self, "package_exists", bool(self.package_exists))

    def to_dict(self) -> dict[str, Any]:
        """Return a JSON-friendly entry for browser clients."""
        return asdict(self)


@dataclass(frozen=True)
class ComponentInstallTarget:
    """Declare where a selected common component should be installed."""

    consumer_key: str
    target_root: str
    mode: str = "dry-run"
    base_url: str = ""
    profile_key: str = ""
    notes: str = ""

    def __post_init__(self) -> None:
        object.__setattr__(self, "consumer_key", _clean_required_text(self.consumer_key, field_name="consumer_key"))
        object.__setattr__(self, "target_root", _clean_required_text(self.target_root, field_name="target_root"))
        mode = _clean_required_text(self.mode, field_name="mode")
        if mode not in SUPPORTED_TARGET_MODES:
            raise ValueError(f"Unsupported target mode: {mode}")
        object.__setattr__(self, "mode", mode)
        object.__setattr__(self, "base_url", _clean_optional_text(self.base_url))
        object.__setattr__(self, "profile_key", _clean_optional_text(self.profile_key))
        object.__setattr__(self, "notes", _clean_optional_text(self.notes))

    def to_dict(self) -> dict[str, Any]:
        """Return a JSON-friendly target payload."""
        return asdict(self)


@dataclass(frozen=True)
class ComponentInstallPlanStep:
    """One explicit wizard step. Adapters decide how to execute it."""

    key: str
    title: str
    kind: str
    description: str
    required: bool = True
    component_keys: tuple[str, ...] = ()
    commands: tuple[str, ...] = ()
    evidence: tuple[str, ...] = ()

    def __post_init__(self) -> None:
        object.__setattr__(self, "key", _clean_required_text(self.key, field_name="step key"))
        object.__setattr__(self, "title", _clean_required_text(self.title, field_name="step title"))
        object.__setattr__(self, "kind", _clean_required_text(self.kind, field_name="step kind"))
        object.__setattr__(self, "description", _clean_required_text(self.description, field_name="step description"))
        object.__setattr__(self, "required", bool(self.required))
        object.__setattr__(self, "component_keys", _clean_text_tuple(self.component_keys, field_name="component_keys"))
        object.__setattr__(self, "commands", _clean_text_tuple(self.commands, field_name="commands"))
        object.__setattr__(self, "evidence", _clean_text_tuple(self.evidence, field_name="evidence"))

    def to_dict(self) -> dict[str, Any]:
        """Return a JSON-friendly step payload."""
        return asdict(self)


@dataclass(frozen=True)
class ComponentInstallPlan:
    """A deterministic plan for a component installation wizard."""

    component: ComponentGalleryEntry
    target: ComponentInstallTarget
    steps: tuple[ComponentInstallPlanStep, ...]
    warnings: tuple[str, ...] = ()

    def __post_init__(self) -> None:
        if not self.steps:
            raise ValueError("Component install plan requires at least one step")
        object.__setattr__(self, "steps", tuple(self.steps))
        object.__setattr__(self, "warnings", _clean_text_tuple(self.warnings, field_name="warnings"))

    def to_dict(self) -> dict[str, Any]:
        """Return a JSON-friendly install plan."""
        return {
            "component": self.component.to_dict(),
            "target": self.target.to_dict(),
            "steps": tuple(step.to_dict() for step in self.steps),
            "warnings": self.warnings,
        }


@dataclass(frozen=True)
class ComponentGalleryAppSpec:
    """Declare the installable Odoo gallery app emitted from common."""

    name: str = "Odoo Common Gallery"
    slug: str = DEFAULT_GALLERY_SLUG
    module: str = DEFAULT_GALLERY_MODULE
    summary: str = "Explore, preview and plan installation of canonical odoo_common components."
    version: str = "19.0.1.0.0"
    public_prefix: str = "apps"

    def __post_init__(self) -> None:
        object.__setattr__(self, "name", _clean_required_text(self.name, field_name="app.name"))
        object.__setattr__(self, "slug", _clean_slug(self.slug, field_name="app.slug"))
        object.__setattr__(self, "module", _clean_module_name(self.module, field_name="app.module"))
        object.__setattr__(self, "summary", _clean_required_text(self.summary, field_name="app.summary"))
        object.__setattr__(self, "version", _clean_required_text(self.version, field_name="app.version"))
        object.__setattr__(self, "public_prefix", _clean_path_token(self.public_prefix, field_name="app.public_prefix"))

    def to_dict(self) -> dict[str, Any]:
        """Return a JSON-friendly app spec."""
        return asdict(self)


@dataclass(frozen=True)
class ComponentGalleryAppFile:
    """One generated file for the installable gallery app."""

    relative_path: Path
    content: str
    layer: str = "gallery"

    def __post_init__(self) -> None:
        object.__setattr__(self, "relative_path", _normalize_relative_path(self.relative_path))
        object.__setattr__(self, "content", str(self.content or ""))
        object.__setattr__(self, "layer", _clean_required_text(self.layer, field_name="file.layer"))

    def to_dict(self) -> dict[str, Any]:
        """Return a JSON-friendly file summary without large content."""
        return {
            "relative_path": self.relative_path.as_posix(),
            "layer": self.layer,
            "size": len(self.content.encode("utf-8")),
        }


def load_component_catalog(path: str | Path) -> tuple[dict[str, Any], ...]:
    """Load the common component catalog from JSON."""
    catalog_path = Path(path)
    data = json.loads(catalog_path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValueError("Component catalog must be a JSON list")
    return tuple(_require_mapping(item, field_name="component") for item in data)


def build_component_gallery_entries(
    catalog_or_path: str | Path | Iterable[Mapping[str, Any]],
    *,
    package_root: str | Path | None = None,
    canonical_only: bool = True,
) -> tuple[ComponentGalleryEntry, ...]:
    """Normalize catalog rows for a dense gallery/storybook menu."""
    raw_components = _load_catalog_input(catalog_or_path)
    root = _resolve_package_root(catalog_or_path, package_root)
    entries: list[ComponentGalleryEntry] = []

    for raw_component in raw_components:
        status = _clean_required_text(raw_component.get("status"), field_name="status")
        if canonical_only and status != "canonical":
            continue
        package_path = _clean_required_text(raw_component.get("package_path"), field_name="package_path")
        package_exists = None if root is None else (root / package_path).exists()
        entries.append(
            ComponentGalleryEntry(
                key=raw_component.get("key", ""),
                title=raw_component.get("title", ""),
                runtime=raw_component.get("runtime", ""),
                status=status,
                package_path=package_path,
                features=_as_text_tuple(raw_component.get("features", ())),
                origins=tuple(_require_mapping(item, field_name="origin") for item in _as_sequence(raw_component.get("origins", ()))),
                package_exists=package_exists,
            )
        )

    return tuple(sorted(entries, key=lambda entry: (entry.runtime, entry.title.lower(), entry.key)))


def group_component_gallery_entries(entries: Iterable[ComponentGalleryEntry | Mapping[str, Any]]) -> dict[str, tuple[ComponentGalleryEntry, ...]]:
    """Group gallery entries by runtime for Storybook navigation."""
    grouped: dict[str, list[ComponentGalleryEntry]] = {runtime: [] for runtime in sorted(SUPPORTED_RUNTIMES)}
    for raw_entry in entries:
        entry = raw_entry if isinstance(raw_entry, ComponentGalleryEntry) else ComponentGalleryEntry(**dict(raw_entry))
        grouped.setdefault(entry.runtime, []).append(entry)
    return {
        runtime: tuple(sorted(runtime_entries, key=lambda entry: (entry.title.lower(), entry.key)))
        for runtime, runtime_entries in grouped.items()
        if runtime_entries
    }


def build_component_storybook_model(entries: Iterable[ComponentGalleryEntry | Mapping[str, Any]]) -> dict[str, Any]:
    """Build a pure model a browser gallery can render without knowing catalog internals."""
    grouped = group_component_gallery_entries(entries)
    return {
        "title": "Odoo Common Components",
        "sections": tuple(
            {
                "key": runtime,
                "title": _runtime_title(runtime),
                "components": tuple(entry.to_dict() for entry in runtime_entries),
            }
            for runtime, runtime_entries in grouped.items()
        ),
        "wizard": {
            "target_fields": ("consumer_key", "target_root", "mode", "base_url", "profile_key", "notes"),
            "modes": tuple(sorted(SUPPORTED_TARGET_MODES)),
        },
    }


def build_component_install_plan(
    component_key: str,
    target: ComponentInstallTarget | Mapping[str, Any],
    catalog_or_path: str | Path | Iterable[Mapping[str, Any]],
    *,
    package_root: str | Path | None = None,
    include_ai_preview: bool = True,
) -> ComponentInstallPlan:
    """Return a strict, executable-by-adapter install plan for one component."""
    clean_component_key = _clean_required_text(component_key, field_name="component_key")
    clean_target = target if isinstance(target, ComponentInstallTarget) else ComponentInstallTarget(**dict(target))
    entries = build_component_gallery_entries(catalog_or_path, package_root=package_root, canonical_only=False)
    index = _index_entries(entries)
    component = index.get(clean_component_key)
    if component is None:
        raise KeyError(f"Unknown common component: {clean_component_key}")
    if component.status != "canonical":
        raise ValueError(f"Only canonical components can be installed: {clean_component_key}")
    if component.package_exists is False:
        raise FileNotFoundError(f"Component package path does not exist: {component.package_path}")

    steps: list[ComponentInstallPlanStep] = [
        ComponentInstallPlanStep(
            key="inspect-component",
            title="Inspect component contract",
            kind="preflight",
            description="Read the component manifest, exported files and public capabilities before installation.",
            component_keys=(component.key,),
            commands=(f"catalog:inspect:{component.key}",),
            evidence=("manifest", "catalog-entry", "package-path"),
        ),
        ComponentInstallPlanStep(
            key="sync-common-package",
            title="Sync common package",
            kind="sync",
            description="Copy the canonical package into the consumer through the declared common sync manifest.",
            component_keys=_component_keys(component.key, "common-component-sync"),
            commands=("common-component-sync:plan", "common-component-sync:apply"),
            evidence=("sync-plan", "changed-files"),
        ),
    ]

    if component.runtime == "web":
        steps.extend(_web_runtime_steps(component, include_ai_preview=include_ai_preview))
    elif component.runtime == "python":
        steps.extend(_python_runtime_steps(component))
    elif component.runtime == "schema":
        steps.extend(_schema_runtime_steps(component))

    steps.append(_target_install_step(clean_target, component))
    steps.append(
        ComponentInstallPlanStep(
            key="verify-installed-surface",
            title="Verify installed surface",
            kind="verify",
            description="Run the consumer tests and capture visual evidence for the selected component.",
            component_keys=(component.key,),
            commands=("consumer:tests", "consumer:visual-audit"),
            evidence=("test-output", "screenshot", "design-audit"),
        )
    )

    warnings = ()
    if not clean_target.base_url:
        warnings = ("Live visual preview requires target base_url.",)

    return ComponentInstallPlan(component=component, target=clean_target, steps=tuple(steps), warnings=warnings)


def build_component_gallery_bridge_spec_mapping(app_spec: ComponentGalleryAppSpec | Mapping[str, Any] | None = None) -> dict[str, Any]:
    """Build the base-only Odoo app bridge contract for the gallery app."""
    spec = _coerce_gallery_app_spec(app_spec)
    return {
        "app": {
            "name": spec.name,
            "slug": spec.slug,
            "module": spec.module,
            "summary": spec.summary,
            "version": spec.version,
            "public_prefix": spec.public_prefix,
            "depends": ("base",),
            "base_only": True,
            "application": True,
        },
        "security": {
            "default_role": "public",
            "enable_app_login": True,
            "deny_public_commands": True,
            "expose_contract_endpoint": True,
            "expose_openapi_endpoint": True,
            "expose_asyncapi_endpoint": True,
        },
        "roles": (
            {"name": "public", "auth": "public", "description": "Read-only gallery viewer."},
            {
                "name": "operator",
                "auth": "internal",
                "required_groups": ("base.group_system",),
                "description": "Admin user allowed to execute target adapters outside the static gallery.",
            },
        ),
        "queries": (),
        "commands": (),
        "events": (),
        "functions": (),
        "crons": (),
    }


def build_component_gallery_app_model(
    catalog_or_path: str | Path | Iterable[Mapping[str, Any]],
    *,
    package_root: str | Path | None = None,
    include_ai_preview: bool = True,
) -> dict[str, Any]:
    """Build the static JSON model consumed by the installable gallery app."""
    entries = build_component_gallery_entries(catalog_or_path, package_root=package_root)
    storybook = build_component_storybook_model(entries)
    raw_catalog = _load_catalog_input(catalog_or_path)
    plans: dict[str, dict[str, Any]] = {}
    for entry in entries:
        mode_plans: dict[str, Any] = {}
        for mode in sorted(SUPPORTED_TARGET_MODES):
            plan = build_component_install_plan(
                entry.key,
                ComponentInstallTarget(
                    consumer_key="target_consumer",
                    target_root="/absolute/path/to/target",
                    mode=mode,
                    base_url="https://example.odoo.com",
                ),
                raw_catalog,
                package_root=package_root,
                include_ai_preview=include_ai_preview,
            )
            mode_plans[mode] = plan.to_dict()
        plans[entry.key] = mode_plans
    return {
        "storybook": storybook,
        "plans": plans,
        "generated_by": "common-component-gallery",
        "contract_version": 1,
    }


def build_component_gallery_app_html(app_spec: ComponentGalleryAppSpec | Mapping[str, Any] | None = None) -> str:
    """Build the public HTML shell for the installable gallery app."""
    spec = _coerce_gallery_app_spec(app_spec)
    module = spec.module
    title = _html_escape(spec.name)
    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <link rel="stylesheet" href="/{module}/static/src/css/app.css" />
    <link rel="stylesheet" href="/{module}/static/src/css/common_component_gallery.css" />
  </head>
  <body>
    <main id="odoo-common-component-gallery" class="ocg-app-root" data-gallery-model="/{module}/static/src/json/common_component_gallery_model.json"></main>
    <script src="/{module}/static/src/js/common_component_gallery.js"></script>
    <script src="/{module}/static/src/js/common_component_gallery_boot.js"></script>
  </body>
</html>
"""


def build_component_gallery_boot_js(app_spec: ComponentGalleryAppSpec | Mapping[str, Any] | None = None) -> str:
    """Build boot JS that wires the static gallery to precomputed plan templates."""
    spec = _coerce_gallery_app_spec(app_spec)
    storage_key = f"{spec.module}:target"
    return f"""(function () {{
  "use strict";

  var root = document.getElementById("odoo-common-component-gallery");
  var api = window.odooCommonComponentGallery;
  var storageKey = {storage_key!r};

  function readStoredTarget() {{
    try {{
      return JSON.parse(window.localStorage.getItem(storageKey) || "{{}}");
    }} catch (_error) {{
      return {{}};
    }}
  }}

  function writeStoredTarget(target) {{
    try {{
      window.localStorage.setItem(storageKey, JSON.stringify(target || {{}}));
    }} catch (_error) {{}}
  }}

  function clone(value) {{
    return JSON.parse(JSON.stringify(value || null));
  }}

  function applyTarget(plan, target) {{
    var next = clone(plan);
    next.target = Object.assign({{}}, next.target || {{}}, target || {{}});
    return next;
  }}

  function publishEvent(name, detail) {{
    window.dispatchEvent(new CustomEvent("odoo-common-gallery:" + name, {{detail: detail}}));
  }}

  if (!root || !api) {{
    return;
  }}

  fetch(root.dataset.galleryModel, {{credentials: "same-origin"}})
    .then(function (response) {{
      if (!response.ok) throw new Error("gallery_model_load_failed");
      return response.json();
    }})
    .then(function (payload) {{
      var model = payload.storybook || payload;
      var plans = payload.plans || {{}};
      api.mountCommonComponentGallery(root, {{
        model: model,
        state: {{target: readStoredTarget()}},
        onBuildPlan: function (context) {{
          var component = context.component || {{}};
          var target = Object.assign({{}}, context.target || {{}});
          var mode = target.mode || "dry-run";
          writeStoredTarget(target);
          if (!plans[component.key] || !plans[component.key][mode]) {{
            throw new Error("missing_plan_template:" + component.key + ":" + mode);
          }}
          var plan = applyTarget(plans[component.key][mode], target);
          publishEvent("plan-built", {{component: component, target: target, plan: plan}});
          return plan;
        }},
        onAiReview: function (context) {{
          publishEvent("ai-review", context);
          if (navigator.clipboard) {{
            navigator.clipboard.writeText(JSON.stringify(context, null, 2));
          }}
        }},
        onStepAction: function (context) {{
          publishEvent("step-action", context);
        }},
      }});
    }})
    .catch(function (error) {{
      root.innerHTML = '<section class="ocg-empty">No se pudo cargar la galeria: ' + String(error && error.message || error) + '</section>';
    }});
}}());
"""


def build_component_gallery_app_files(
    catalog_or_path: str | Path | Iterable[Mapping[str, Any]],
    *,
    common_root: str | Path | None = None,
    surface_package_path: str | Path | None = None,
    app_spec: ComponentGalleryAppSpec | Mapping[str, Any] | None = None,
) -> tuple[ComponentGalleryAppFile, ...]:
    """Build an installable Odoo addon containing the common component gallery."""
    spec = _coerce_gallery_app_spec(app_spec)
    root = _resolve_common_root(catalog_or_path, common_root)
    surface_root = _resolve_surface_package_root(root, surface_package_path)
    app_model = build_component_gallery_app_model(catalog_or_path, package_root=root)
    bridge_files = _build_bridge_files(spec, public_html=build_component_gallery_app_html(spec))
    files = [
        ComponentGalleryAppFile(file.relative_path, file.content, getattr(file, "layer", "bridge"))
        for file in bridge_files
    ]
    module_root = Path(spec.module)
    files.extend(
        (
            ComponentGalleryAppFile(
                module_root / "static" / "src" / "js" / "common_component_gallery.js",
                (surface_root / "sources" / "component_gallery.js").read_text(encoding="utf-8"),
                "static",
            ),
            ComponentGalleryAppFile(
                module_root / "static" / "src" / "js" / "common_component_gallery_boot.js",
                build_component_gallery_boot_js(spec),
                "static",
            ),
            ComponentGalleryAppFile(
                module_root / "static" / "src" / "css" / "common_component_gallery.css",
                (surface_root / "sources" / "component_gallery.css").read_text(encoding="utf-8"),
                "static",
            ),
            ComponentGalleryAppFile(
                module_root / "static" / "src" / "json" / "common_component_gallery_model.json",
                json.dumps(app_model, indent=2, ensure_ascii=False) + "\n",
                "static",
            ),
            ComponentGalleryAppFile(
                module_root / "docs" / "common_component_gallery_contract.json",
                json.dumps(
                    {
                        "app": spec.to_dict(),
                        "bridge": build_component_gallery_bridge_spec_mapping(spec),
                        "files": tuple(file.to_dict() for file in files),
                    },
                    indent=2,
                    ensure_ascii=False,
                )
                + "\n",
                "docs",
            ),
        )
    )
    _reject_duplicate_gallery_files(files)
    return tuple(files)


def write_component_gallery_app(
    target_root: str | Path,
    catalog_or_path: str | Path | Iterable[Mapping[str, Any]],
    *,
    common_root: str | Path | None = None,
    surface_package_path: str | Path | None = None,
    app_spec: ComponentGalleryAppSpec | Mapping[str, Any] | None = None,
    overwrite: bool = False,
) -> tuple[Path, ...]:
    """Write the generated gallery addon under target_root."""
    root = Path(target_root)
    written: list[Path] = []
    for file in build_component_gallery_app_files(
        catalog_or_path,
        common_root=common_root,
        surface_package_path=surface_package_path,
        app_spec=app_spec,
    ):
        target = root / file.relative_path
        content = _ensure_newline(file.content)
        if target.exists():
            current = target.read_text(encoding="utf-8")
            if current == content:
                continue
            if not overwrite:
                raise FileExistsError(f"Component gallery target already exists with different content: {target}")
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")
        written.append(target)
    return tuple(written)


def write_component_gallery_app_zip(
    target_root: str | Path,
    catalog_or_path: str | Path | Iterable[Mapping[str, Any]],
    *,
    common_root: str | Path | None = None,
    surface_package_path: str | Path | None = None,
    app_spec: ComponentGalleryAppSpec | Mapping[str, Any] | None = None,
    overwrite: bool = False,
) -> Path:
    """Write the generated gallery addon and package it as an importable zip."""
    spec = _coerce_gallery_app_spec(app_spec)
    root = Path(target_root)
    write_component_gallery_app(
        root,
        catalog_or_path,
        common_root=common_root,
        surface_package_path=surface_package_path,
        app_spec=spec,
        overwrite=overwrite,
    )
    zip_path = root / f"{spec.module}.zip"
    if zip_path.exists() and not overwrite:
        raise FileExistsError(f"Component gallery zip already exists: {zip_path}")
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        module_root = root / spec.module
        for path in sorted(module_root.rglob("*")):
            if path.is_file():
                archive.write(path, arcname=str(path.relative_to(root)).replace("\\", "/"))
    return zip_path


def _web_runtime_steps(component: ComponentGalleryEntry, *, include_ai_preview: bool) -> tuple[ComponentInstallPlanStep, ...]:
    steps = [
        ComponentInstallPlanStep(
            key="publish-backend-assets",
            title="Publish backend assets",
            kind="publish",
            description="Publish JS/CSS as managed backend assets with attachment-backed cache busting.",
            component_keys=_component_keys(component.key, "backend-web-assets"),
            commands=("backend-web-assets:plan", "backend-web-assets:publish"),
            evidence=("asset-manifest", "checksums"),
        ),
        ComponentInstallPlanStep(
            key="open-storybook-preview",
            title="Open gallery preview",
            kind="preview",
            description="Render the component in the common gallery shell before applying business adapters.",
            component_keys=_component_keys(component.key, "odoo-app-bridge"),
            commands=("odoo-app-bridge:build-preview", "browser:open-preview"),
            evidence=("preview-url", "screenshot"),
        ),
        ComponentInstallPlanStep(
            key="run-design-audit",
            title="Run design audit",
            kind="audit",
            description="Check spacing, density, contrast, row height, overlays, redundancy and responsive behavior.",
            component_keys=(component.key,),
            commands=("visual-audit:surface",),
            evidence=("audit-report", "desktop-screenshot", "mobile-screenshot"),
        ),
    ]
    if include_ai_preview:
        steps.append(
            ComponentInstallPlanStep(
                key="ai-preview-review",
                title="Review with AI co-designer",
                kind="ai-review",
                description="Send screenshot and component contract to the selected AI assistant for concrete UI refinements.",
                required=False,
                component_keys=(component.key,),
                commands=("codex-goal:review-preview",),
                evidence=("ai-review-notes", "accepted-patches"),
            )
        )
    return tuple(steps)


def _coerce_gallery_app_spec(app_spec: ComponentGalleryAppSpec | Mapping[str, Any] | None) -> ComponentGalleryAppSpec:
    if app_spec is None:
        return ComponentGalleryAppSpec()
    return app_spec if isinstance(app_spec, ComponentGalleryAppSpec) else ComponentGalleryAppSpec(**dict(app_spec))


def _build_bridge_files(spec: ComponentGalleryAppSpec, *, public_html: str) -> tuple[Any, ...]:
    odoo_app_bridge = _import_odoo_app_bridge_module()
    bridge_spec = build_component_gallery_bridge_spec_mapping(spec)
    return tuple(odoo_app_bridge.build_app_bridge_module_files(bridge_spec, public_html=public_html))


def _import_odoo_app_bridge_module() -> Any:
    try:
        import odoo_app_bridge  # type: ignore

        return odoo_app_bridge
    except ImportError as exc:
        source_root = Path(__file__).resolve().parents[2] / "odoo_app_bridge" / "sources"
        init_path = source_root / "__init__.py"
        if not init_path.is_file():
            raise ImportError("common-component-gallery app builds require odoo-app-bridge") from exc
        module_name = "odoo_app_bridge"
        spec = importlib.util.spec_from_file_location(
            module_name,
            init_path,
            submodule_search_locations=[str(source_root)],
        )
        if spec is None or spec.loader is None:
            raise ImportError("Cannot load sibling odoo-app-bridge package") from exc
        module = importlib.util.module_from_spec(spec)
        sys.modules[module_name] = module
        spec.loader.exec_module(module)
        return module


def _resolve_common_root(catalog_or_path: Any, common_root: str | Path | None) -> Path | None:
    if common_root is not None:
        return Path(common_root)
    if isinstance(catalog_or_path, (str, Path)):
        catalog_path = Path(catalog_or_path)
        if catalog_path.name == "components.json" and catalog_path.parent.name == "catalog":
            return catalog_path.parent.parent
    return None


def _resolve_surface_package_root(common_root: Path | None, surface_package_path: str | Path | None) -> Path:
    if surface_package_path is not None:
        surface_root = Path(surface_package_path)
    elif common_root is not None:
        surface_root = common_root / "packages" / "web" / "surface_component_gallery"
    else:
        surface_root = Path(__file__).resolve().parents[2] / "web" / "surface_component_gallery"
    if not (surface_root / "sources" / "component_gallery.js").is_file():
        raise FileNotFoundError(f"Missing surface component gallery JS: {surface_root}")
    if not (surface_root / "sources" / "component_gallery.css").is_file():
        raise FileNotFoundError(f"Missing surface component gallery CSS: {surface_root}")
    return surface_root


def _reject_duplicate_gallery_files(files: Iterable[ComponentGalleryAppFile]) -> None:
    seen: set[str] = set()
    duplicates: set[str] = set()
    for file in files:
        key = file.relative_path.as_posix()
        if key in seen:
            duplicates.add(key)
        seen.add(key)
    if duplicates:
        raise ValueError(f"Duplicate component gallery app files: {', '.join(sorted(duplicates))}")


def _normalize_relative_path(value: Any) -> Path:
    raw = str(value or "").strip().replace("\\", "/").lstrip("/")
    if not raw:
        raise ValueError("Component gallery relative path is required")
    path = PurePosixPath(raw)
    if path.is_absolute() or any(part in {"", ".", ".."} for part in path.parts):
        raise ValueError(f"Component gallery path must be relative and normalized: {value!r}")
    if path.parts and ":" in path.parts[0]:
        raise ValueError(f"Component gallery path must not include drive prefix: {value!r}")
    return Path(path.as_posix())


def _ensure_newline(value: str) -> str:
    return value if value.endswith("\n") else f"{value}\n"


def _html_escape(value: Any) -> str:
    return (
        str(value)
        .replace("&", "&amp;")
        .replace('"', "&quot;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def _python_runtime_steps(component: ComponentGalleryEntry) -> tuple[ComponentInstallPlanStep, ...]:
    return (
        ComponentInstallPlanStep(
            key="run-python-contracts",
            title="Run Python contracts",
            kind="test",
            description="Compile and run the package contract tests before exposing it to the consumer wizard.",
            component_keys=(component.key,),
            commands=("python:compileall", "python:unit-contracts"),
            evidence=("compile-output", "unit-test-output"),
        ),
    )


def _schema_runtime_steps(component: ComponentGalleryEntry) -> tuple[ComponentInstallPlanStep, ...]:
    return (
        ComponentInstallPlanStep(
            key="validate-schema-contract",
            title="Validate schema contract",
            kind="test",
            description="Validate the schema package and any declared examples before consumer installation.",
            component_keys=(component.key,),
            commands=("schema:validate",),
            evidence=("schema-validation-output",),
        ),
    )


def _target_install_step(target: ComponentInstallTarget, component: ComponentGalleryEntry) -> ComponentInstallPlanStep:
    if target.mode == "dry-run":
        return ComponentInstallPlanStep(
            key="dry-run-target-install",
            title="Dry-run target install",
            kind="dry-run",
            description="Generate the target installation diff without mutating the Odoo instance.",
            component_keys=(component.key,),
            commands=("target:plan-only",),
            evidence=("target-install-plan",),
        )
    return ComponentInstallPlanStep(
        key="install-on-target",
        title="Install on target",
        kind="install",
        description="Apply the reviewed plan to the selected Odoo target.",
        component_keys=(component.key,),
        commands=("target:install",),
        evidence=("install-log", "target-state"),
    )


def _index_entries(entries: Iterable[ComponentGalleryEntry]) -> dict[str, ComponentGalleryEntry]:
    indexed: dict[str, ComponentGalleryEntry] = {}
    for entry in entries:
        if entry.key in indexed:
            raise ValueError(f"Duplicate component key: {entry.key}")
        indexed[entry.key] = entry
    return indexed


def _component_keys(*keys: str) -> tuple[str, ...]:
    cleaned: list[str] = []
    seen: set[str] = set()
    for key in keys:
        clean_key = _clean_required_text(key, field_name="component key")
        if clean_key in seen:
            continue
        seen.add(clean_key)
        cleaned.append(clean_key)
    return tuple(cleaned)


def _load_catalog_input(catalog_or_path: str | Path | Iterable[Mapping[str, Any]]) -> tuple[Mapping[str, Any], ...]:
    if isinstance(catalog_or_path, (str, Path)):
        return load_component_catalog(catalog_or_path)
    return tuple(_require_mapping(item, field_name="component") for item in catalog_or_path)


def _resolve_package_root(catalog_or_path: Any, package_root: str | Path | None) -> Path | None:
    if package_root is not None:
        return Path(package_root)
    if isinstance(catalog_or_path, (str, Path)):
        catalog_path = Path(catalog_or_path)
        if catalog_path.name == "components.json" and catalog_path.parent.name == "catalog":
            return catalog_path.parent.parent
    return None


def _runtime_title(runtime: str) -> str:
    return {
        "python": "Python Contracts",
        "schema": "Schema Contracts",
        "web": "Web Surfaces",
    }.get(runtime, runtime.title())


def _clean_required_text(value: Any, *, field_name: str) -> str:
    clean_value = str(value or "").strip()
    if not clean_value:
        raise ValueError(f"Component gallery {field_name} is required")
    return clean_value


def _clean_module_name(value: Any, *, field_name: str) -> str:
    text = _clean_required_text(value, field_name=field_name).lower()
    if not MODULE_RE.match(text):
        raise ValueError(f"Component gallery {field_name} must match {MODULE_RE.pattern}: {text!r}")
    return text


def _clean_slug(value: Any, *, field_name: str) -> str:
    text = _clean_required_text(value, field_name=field_name).lower()
    if not SLUG_RE.match(text):
        raise ValueError(f"Component gallery {field_name} must match {SLUG_RE.pattern}: {text!r}")
    return text


def _clean_path_token(value: Any, *, field_name: str) -> str:
    text = _clean_required_text(value, field_name=field_name).strip("/")
    if not PATH_TOKEN_RE.match(text):
        raise ValueError(f"Component gallery {field_name} must match {PATH_TOKEN_RE.pattern}: {text!r}")
    return text


def _clean_optional_text(value: Any) -> str:
    return str(value or "").strip()


def _clean_text_tuple(values: Iterable[Any], *, field_name: str) -> tuple[str, ...]:
    cleaned = _as_text_tuple(values)
    if len(set(cleaned)) != len(cleaned):
        raise ValueError(f"Component gallery {field_name} contains duplicates")
    return cleaned


def _as_text_tuple(values: Any) -> tuple[str, ...]:
    if values is None:
        return ()
    if isinstance(values, (str, bytes)):
        raise TypeError("Expected a sequence of text values")
    return tuple(str(value or "").strip() for value in values if str(value or "").strip())


def _as_sequence(values: Any) -> Sequence[Any]:
    if values is None:
        return ()
    if isinstance(values, (str, bytes)):
        raise TypeError("Expected a sequence")
    if isinstance(values, Sequence):
        return values
    return tuple(values)


def _require_mapping(value: Any, *, field_name: str) -> Mapping[str, Any]:
    if not isinstance(value, Mapping):
        raise TypeError(f"Component gallery {field_name} must be a mapping")
    return value


def _clean_origins(origins: Iterable[Mapping[str, Any]]) -> tuple[dict[str, str], ...]:
    clean_origins: list[dict[str, str]] = []
    for origin in origins:
        mapping = _require_mapping(origin, field_name="origin")
        project = _clean_required_text(mapping.get("project"), field_name="origin.project")
        path = _clean_required_text(mapping.get("path"), field_name="origin.path")
        clean_origins.append({"project": project, "path": path})
    return tuple(clean_origins)
