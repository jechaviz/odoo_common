"""Pure builders for layered Odoo addon scaffolds."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path, PurePosixPath
from pprint import pformat
from typing import Any, Iterable, Mapping, Sequence


MODULE_NAME_RE = re.compile(r"^[a-z][a-z0-9_]*$")
MODEL_SEGMENT_RE = re.compile(r"^[a-z_][a-z0-9_]*$")
FIELD_NAME_RE = re.compile(r"^[a-z_][a-z0-9_]*$")
CLASS_NAME_RE = re.compile(r"^[A-Z][A-Za-z0-9]*$")
FILE_STEM_RE = re.compile(r"^[a-z][a-z0-9_]*$")
SUPPORTED_FIELD_TYPES = frozenset(
    {
        "Binary",
        "Boolean",
        "Char",
        "Date",
        "Datetime",
        "Float",
        "Html",
        "Integer",
        "Json",
        "Many2many",
        "Many2one",
        "Monetary",
        "One2many",
        "Selection",
        "Text",
    }
)
RELATIONAL_FIELD_TYPES = frozenset({"Many2many", "Many2one", "One2many"})
DEFAULT_LAYERS = ("contracts", "adapters", "services", "models", "security", "views", "tests")


@dataclass(frozen=True)
class FieldScaffoldSpec:
    """Declare one Odoo field for a generated model file."""

    name: str
    field_type: str = "Char"
    string: str = ""
    required: bool = False
    readonly: bool = False
    index: bool = False
    help: str = ""
    relation: str = ""
    inverse_name: str = ""
    default_literal: str = ""
    selection: tuple[tuple[str, str], ...] = ()
    tracking: bool = False
    copy: bool | None = None

    def __post_init__(self) -> None:
        field_name = _clean_field_name(self.name)
        field_type = _clean_required_text(self.field_type, field_name="field_type")
        if field_type not in SUPPORTED_FIELD_TYPES:
            raise ValueError(f"Unsupported Odoo field type: {field_type}")
        relation = _clean_optional_text(self.relation)
        inverse_name = _clean_optional_text(self.inverse_name)
        if field_type in RELATIONAL_FIELD_TYPES and not relation:
            raise ValueError(f"Field {field_name!r} requires relation for {field_type}")
        if field_type == "One2many" and not inverse_name:
            raise ValueError(f"One2many field {field_name!r} requires inverse_name")
        if field_type == "Selection" and not self.selection:
            raise ValueError(f"Selection field {field_name!r} requires selection values")
        object.__setattr__(self, "name", field_name)
        object.__setattr__(self, "field_type", field_type)
        object.__setattr__(self, "string", _clean_optional_text(self.string))
        object.__setattr__(self, "help", _clean_optional_text(self.help))
        object.__setattr__(self, "relation", relation)
        object.__setattr__(self, "inverse_name", inverse_name)
        object.__setattr__(self, "default_literal", _clean_optional_text(self.default_literal))
        object.__setattr__(self, "selection", _clean_selection(self.selection))

    def render(self) -> str:
        """Render a single Python field declaration."""
        args: list[str] = []
        kwargs: list[str] = []
        if self.field_type in RELATIONAL_FIELD_TYPES:
            args.append(repr(self.relation))
        if self.field_type == "One2many":
            args.append(repr(self.inverse_name))
        if self.field_type == "Selection":
            args.append(repr(tuple(self.selection)))
        if self.string:
            kwargs.append(f"string={self.string!r}")
        if self.required:
            kwargs.append("required=True")
        if self.readonly:
            kwargs.append("readonly=True")
        if self.index:
            kwargs.append("index=True")
        if self.help:
            kwargs.append(f"help={self.help!r}")
        if self.default_literal:
            kwargs.append(f"default={self.default_literal}")
        if self.tracking:
            kwargs.append("tracking=True")
        if self.copy is not None:
            kwargs.append(f"copy={bool(self.copy)}")
        joined_args = ", ".join([*args, *kwargs])
        return f"    {self.name} = fields.{self.field_type}({joined_args})"


@dataclass(frozen=True)
class ModelAccessScaffoldSpec:
    """Declare one access row for generated `ir.model.access.csv`."""

    group_xml_id: str = "base.group_user"
    perm_read: bool = True
    perm_write: bool = True
    perm_create: bool = True
    perm_unlink: bool = False
    suffix: str = "user"

    def __post_init__(self) -> None:
        object.__setattr__(self, "group_xml_id", _clean_required_text(self.group_xml_id, field_name="group_xml_id"))
        object.__setattr__(self, "suffix", _clean_file_stem(self.suffix, field_name="access suffix"))


@dataclass(frozen=True)
class ModelScaffoldSpec:
    """Declare one model and its generated Odoo surface."""

    technical_name: str
    description: str
    class_name: str = ""
    file_stem: str = ""
    fields: tuple[FieldScaffoldSpec, ...] = ()
    access: tuple[ModelAccessScaffoldSpec, ...] = field(default_factory=lambda: (ModelAccessScaffoldSpec(),))
    rec_name: str = ""
    order: str = ""
    parent_menu_xml_id: str = ""
    menu_sequence: int = 10

    def __post_init__(self) -> None:
        technical_name = normalize_model_name(self.technical_name)
        field_specs = _coerce_field_specs(self.fields)
        _reject_duplicate_values((field_spec.name for field_spec in field_specs), "field")
        access_specs = _coerce_access_specs(self.access)
        class_name = _clean_optional_text(self.class_name) or _model_name_to_class_name(technical_name)
        if not CLASS_NAME_RE.match(class_name):
            raise ValueError(f"Model class_name must be PascalCase: {class_name!r}")
        file_stem = _clean_optional_text(self.file_stem) or technical_name.replace(".", "_")
        object.__setattr__(self, "technical_name", technical_name)
        object.__setattr__(self, "description", _clean_required_text(self.description, field_name="model description"))
        object.__setattr__(self, "class_name", class_name)
        object.__setattr__(self, "file_stem", _clean_file_stem(file_stem, field_name="model file_stem"))
        object.__setattr__(self, "fields", field_specs)
        object.__setattr__(self, "access", access_specs)
        object.__setattr__(self, "rec_name", _clean_optional_text(self.rec_name))
        object.__setattr__(self, "order", _clean_optional_text(self.order))
        object.__setattr__(self, "parent_menu_xml_id", _clean_optional_text(self.parent_menu_xml_id))
        object.__setattr__(self, "menu_sequence", int(self.menu_sequence))


@dataclass(frozen=True)
class ModuleScaffoldSpec:
    """Declare one generated Odoo addon with explicit architectural layers."""

    technical_name: str
    summary: str
    description: str = ""
    version: str = "18.0.1.0.0"
    category: str = "Customizations"
    author: str = ""
    website: str = ""
    license: str = "LGPL-3"
    depends: tuple[str, ...] = ("base",)
    models: tuple[ModelScaffoldSpec, ...] = ()
    data_files: tuple[str, ...] = ()
    demo_files: tuple[str, ...] = ()
    assets: Mapping[str, Sequence[str]] = field(default_factory=dict)
    installable: bool = True
    application: bool = False
    layers: tuple[str, ...] = DEFAULT_LAYERS

    def __post_init__(self) -> None:
        technical_name = normalize_module_name(self.technical_name)
        model_specs = _coerce_model_specs(self.models)
        _reject_duplicate_values((model.technical_name for model in model_specs), "model")
        _reject_duplicate_values((model.file_stem for model in model_specs), "model file")
        layers = tuple(_clean_file_stem(layer, field_name="layer") for layer in self.layers)
        if not layers:
            raise ValueError("Module scaffold requires at least one layer")
        object.__setattr__(self, "technical_name", technical_name)
        object.__setattr__(self, "summary", _clean_required_text(self.summary, field_name="module summary"))
        object.__setattr__(self, "description", _clean_optional_text(self.description))
        object.__setattr__(self, "version", _clean_required_text(self.version, field_name="version"))
        object.__setattr__(self, "category", _clean_required_text(self.category, field_name="category"))
        object.__setattr__(self, "author", _clean_optional_text(self.author))
        object.__setattr__(self, "website", _clean_optional_text(self.website))
        object.__setattr__(self, "license", _clean_required_text(self.license, field_name="license"))
        object.__setattr__(self, "depends", _clean_text_tuple(self.depends, field_name="depends"))
        object.__setattr__(self, "models", model_specs)
        object.__setattr__(self, "data_files", _clean_path_tuple(self.data_files, field_name="data_files"))
        object.__setattr__(self, "demo_files", _clean_path_tuple(self.demo_files, field_name="demo_files"))
        object.__setattr__(self, "assets", _clean_assets(self.assets))
        object.__setattr__(self, "layers", layers)


@dataclass(frozen=True)
class ModuleScaffoldFile:
    """One generated file for an addon scaffold."""

    relative_path: Path
    content: str
    layer: str

    def __post_init__(self) -> None:
        object.__setattr__(self, "relative_path", _normalize_relative_path(self.relative_path))
        object.__setattr__(self, "layer", _clean_required_text(self.layer, field_name="file layer"))


def normalize_module_name(value: Any) -> str:
    """Normalize and validate an Odoo addon technical name."""
    clean_value = _clean_required_text(value, field_name="module technical_name").lower()
    if not MODULE_NAME_RE.match(clean_value):
        raise ValueError(f"Module technical_name must match {MODULE_NAME_RE.pattern}: {clean_value!r}")
    return clean_value


def normalize_model_name(value: Any) -> str:
    """Normalize and validate an Odoo model technical name."""
    clean_value = _clean_required_text(value, field_name="model technical_name").lower()
    segments = tuple(clean_value.split("."))
    if len(segments) < 2 or any(not MODEL_SEGMENT_RE.match(segment) for segment in segments):
        raise ValueError(f"Model technical_name must use dot-separated Odoo segments: {clean_value!r}")
    return clean_value


def build_module_scaffold_files(spec: ModuleScaffoldSpec | Mapping[str, Any]) -> tuple[ModuleScaffoldFile, ...]:
    """Render all files for one layered Odoo addon scaffold."""
    module_spec = spec if isinstance(spec, ModuleScaffoldSpec) else ModuleScaffoldSpec(**dict(spec))
    module_root = Path(module_spec.technical_name)
    files: list[ModuleScaffoldFile] = [
        ModuleScaffoldFile(module_root / "__init__.py", _render_root_init(module_spec), "root"),
        ModuleScaffoldFile(module_root / "__manifest__.py", _render_manifest(module_spec), "root"),
        ModuleScaffoldFile(module_root / "README.md", _render_module_readme(module_spec), "docs"),
    ]

    if "contracts" in module_spec.layers:
        files.extend(
            [
                ModuleScaffoldFile(module_root / "contracts" / "__init__.py", _render_contracts_init(), "contracts"),
                ModuleScaffoldFile(
                    module_root / "contracts" / "module_contract.py",
                    _render_module_contract(module_spec),
                    "contracts",
                ),
            ]
        )
    if "adapters" in module_spec.layers:
        files.extend(
            [
                ModuleScaffoldFile(module_root / "adapters" / "__init__.py", _render_adapters_init(module_spec), "adapters"),
                ModuleScaffoldFile(
                    module_root / "adapters" / "odoo_environment.py",
                    _render_odoo_environment_adapter(module_spec),
                    "adapters",
                ),
            ]
        )
    if "services" in module_spec.layers:
        files.extend(
            [
                ModuleScaffoldFile(module_root / "services" / "__init__.py", _render_services_init(module_spec), "services"),
                ModuleScaffoldFile(
                    module_root / "services" / f"{module_spec.technical_name}_service.py",
                    _render_service(module_spec),
                    "services",
                ),
            ]
        )
    if "models" in module_spec.layers:
        files.append(ModuleScaffoldFile(module_root / "models" / "__init__.py", _render_models_init(module_spec), "models"))
        for model_spec in module_spec.models:
            files.append(
                ModuleScaffoldFile(
                    module_root / "models" / f"{model_spec.file_stem}.py",
                    _render_model_file(module_spec, model_spec),
                    "models",
                )
            )
    if "security" in module_spec.layers and module_spec.models:
        files.append(
            ModuleScaffoldFile(
                module_root / "security" / "ir.model.access.csv",
                _render_security_access(module_spec),
                "security",
            )
        )
    if "views" in module_spec.layers:
        for model_spec in module_spec.models:
            files.append(
                ModuleScaffoldFile(
                    module_root / "views" / f"{model_spec.file_stem}_views.xml",
                    _render_model_views(module_spec, model_spec),
                    "views",
                )
            )
    if "tests" in module_spec.layers:
        files.extend(
            [
                ModuleScaffoldFile(module_root / "tests" / "__init__.py", "", "tests"),
                ModuleScaffoldFile(
                    module_root / "tests" / f"test_{module_spec.technical_name}.py",
                    _render_test_file(module_spec),
                    "tests",
                ),
            ]
        )
    _reject_duplicate_values((file.relative_path.as_posix() for file in files), "scaffold file")
    return tuple(files)


def write_module_scaffold(
    target_root: str | Path,
    spec: ModuleScaffoldSpec | Mapping[str, Any],
    *,
    overwrite: bool = False,
) -> tuple[Path, ...]:
    """Write scaffold files under an explicit target root.

    Existing files are protected by default so the helper can be used safely in
    templates and migration tooling without destructive cleanup.
    """
    root = Path(target_root)
    written_paths: list[Path] = []
    for scaffold_file in build_module_scaffold_files(spec):
        target_path = root / scaffold_file.relative_path
        if target_path.exists() and not overwrite:
            raise FileExistsError(f"Scaffold target already exists: {target_path}")
        target_path.parent.mkdir(parents=True, exist_ok=True)
        target_path.write_text(_ensure_trailing_newline(scaffold_file.content), encoding="utf-8")
        written_paths.append(target_path)
    return tuple(written_paths)


def _render_root_init(spec: ModuleScaffoldSpec) -> str:
    imports = []
    for layer in ("contracts", "adapters", "services", "models"):
        if layer in spec.layers:
            imports.append(f"from . import {layer}")
    return "\n".join([*imports, ""])


def _render_manifest(spec: ModuleScaffoldSpec) -> str:
    data_files = list(spec.data_files)
    if "security" in spec.layers and spec.models:
        data_files.insert(0, "security/ir.model.access.csv")
    if "views" in spec.layers:
        data_files.extend(f"views/{model.file_stem}_views.xml" for model in spec.models)
    manifest: dict[str, Any] = {
        "name": _title_from_module_name(spec.technical_name),
        "version": spec.version,
        "category": spec.category,
        "summary": spec.summary,
        "depends": list(spec.depends),
        "data": data_files,
        "installable": spec.installable,
        "application": spec.application,
        "license": spec.license,
    }
    if spec.description:
        manifest["description"] = spec.description
    if spec.author:
        manifest["author"] = spec.author
    if spec.website:
        manifest["website"] = spec.website
    if spec.demo_files:
        manifest["demo"] = list(spec.demo_files)
    if spec.assets:
        manifest["assets"] = {bundle: list(paths) for bundle, paths in spec.assets.items()}
    return pformat(manifest, sort_dicts=False, width=120)


def _render_module_readme(spec: ModuleScaffoldSpec) -> str:
    model_lines = "\n".join(f"- `{model.technical_name}`: {model.description}" for model in spec.models) or "- No models declared yet."
    layers = ", ".join(f"`{layer}`" for layer in spec.layers)
    return f"""# {_title_from_module_name(spec.technical_name)}

{spec.summary}

## Architecture

Layers: {layers}

- `contracts`: stable feature and payload contracts.
- `adapters`: Odoo-specific IO and environment access.
- `services`: orchestration with dependencies injected by adapters.
- `models`: ORM declarations only.
- `views` and `security`: declarative Odoo integration.

## Models

{model_lines}
"""


def _render_contracts_init() -> str:
    return "from .module_contract import MODULE_FEATURES, ModuleFeatureContract\n"


def _render_module_contract(spec: ModuleScaffoldSpec) -> str:
    model_entries = ",\n".join(
        f"    ModuleFeatureContract(key={model.technical_name!r}, title={model.description!r}, layer='models')"
        for model in spec.models
    )
    if model_entries:
        model_entries += ","
    return f'''"""Stable contracts for {spec.technical_name}."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ModuleFeatureContract:
    key: str
    title: str
    layer: str


MODULE_FEATURES = (
    ModuleFeatureContract(key={spec.technical_name!r}, title={spec.summary!r}, layer="module"),
{model_entries}
)
'''


def _render_adapters_init(spec: ModuleScaffoldSpec) -> str:
    return f"from .odoo_environment import OdooEnvironmentRepository, build_{spec.technical_name}_service\n"


def _render_odoo_environment_adapter(spec: ModuleScaffoldSpec) -> str:
    service_class = _module_service_class_name(spec)
    return f'''"""Odoo adapters for {spec.technical_name}.

Adapters own Odoo-specific IO. Services receive this adapter instead of
reaching into `env` directly, keeping business orchestration testable.
"""

from __future__ import annotations

from ..services import {service_class}


class OdooEnvironmentRepository:
    def __init__(self, env):
        self.env = env

    def search_read(self, model_name, domain=None, fields=None, limit=None):
        return self.env[model_name].search_read(domain or [], fields=fields, limit=limit)


def build_{spec.technical_name}_service(env):
    return {service_class}(repository=OdooEnvironmentRepository(env))
'''


def _render_services_init(spec: ModuleScaffoldSpec) -> str:
    service_class = _module_service_class_name(spec)
    return f"from .{spec.technical_name}_service import {service_class}\n"


def _render_service(spec: ModuleScaffoldSpec) -> str:
    service_class = _module_service_class_name(spec)
    return f'''"""Service layer for {spec.technical_name}."""

from __future__ import annotations


class {service_class}:
    def __init__(self, repository):
        self._repository = repository

    def list_records(self, model_name, domain=None, fields=None, limit=None):
        return self._repository.search_read(model_name, domain=domain or [], fields=fields, limit=limit)
'''


def _render_models_init(spec: ModuleScaffoldSpec) -> str:
    imports = [f"from . import {model.file_stem}" for model in spec.models]
    return "\n".join([*imports, ""])


def _render_model_file(module_spec: ModuleScaffoldSpec, model_spec: ModelScaffoldSpec) -> str:
    optional_attrs = []
    if model_spec.rec_name:
        optional_attrs.append(f"    _rec_name = {model_spec.rec_name!r}")
    if model_spec.order:
        optional_attrs.append(f"    _order = {model_spec.order!r}")
    rendered_fields = [field_spec.render() for field_spec in model_spec.fields]
    if not rendered_fields:
        rendered_fields = ["    # Add business fields through FieldScaffoldSpec declarations."]
    attrs = "\n".join(optional_attrs)
    if attrs:
        attrs = f"\n{attrs}"
    return f'''"""ORM model for {model_spec.technical_name}."""

from __future__ import annotations

from odoo import fields, models


class {model_spec.class_name}(models.Model):
    _name = {model_spec.technical_name!r}
    _description = {model_spec.description!r}{attrs}

{chr(10).join(rendered_fields)}

    def _get_{module_spec.technical_name}_service(self):
        from ..adapters import build_{module_spec.technical_name}_service

        return build_{module_spec.technical_name}_service(self.env)
'''


def _render_security_access(spec: ModuleScaffoldSpec) -> str:
    lines = ["id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink"]
    for model in spec.models:
        model_xml_id = f"model_{model.technical_name.replace('.', '_')}"
        access_stem = model.technical_name.replace(".", "_")
        for access in model.access:
            lines.append(
                ",".join(
                    [
                        f"access_{access_stem}_{access.suffix}",
                        f"{model.technical_name} {access.suffix}",
                        model_xml_id,
                        access.group_xml_id,
                        _csv_bool(access.perm_read),
                        _csv_bool(access.perm_write),
                        _csv_bool(access.perm_create),
                        _csv_bool(access.perm_unlink),
                    ]
                )
            )
    return "\n".join(lines)


def _render_model_views(module_spec: ModuleScaffoldSpec, model_spec: ModelScaffoldSpec) -> str:
    xml_stem = model_spec.technical_name.replace(".", "_")
    list_fields = _view_field_names(model_spec)
    list_field_xml = "\n".join(f'                <field name="{field_name}"/>' for field_name in list_fields)
    form_field_xml = "\n".join(f'                            <field name="{field_name}"/>' for field_name in list_fields)
    parent_attr = f' parent="{model_spec.parent_menu_xml_id}"' if model_spec.parent_menu_xml_id else ""
    return f'''<odoo>
    <record id="{xml_stem}_view_list" model="ir.ui.view">
        <field name="name">{model_spec.technical_name}.view.list</field>
        <field name="model">{model_spec.technical_name}</field>
        <field name="arch" type="xml">
            <list>
{list_field_xml}
            </list>
        </field>
    </record>

    <record id="{xml_stem}_view_form" model="ir.ui.view">
        <field name="name">{model_spec.technical_name}.view.form</field>
        <field name="model">{model_spec.technical_name}</field>
        <field name="arch" type="xml">
            <form>
                <sheet>
                    <group>
{form_field_xml}
                    </group>
                </sheet>
            </form>
        </field>
    </record>

    <record id="{xml_stem}_action" model="ir.actions.act_window">
        <field name="name">{_xml_escape(model_spec.description)}</field>
        <field name="res_model">{model_spec.technical_name}</field>
        <field name="view_mode">list,form</field>
    </record>

    <menuitem id="{xml_stem}_menu" name="{_xml_escape(model_spec.description)}" action="{xml_stem}_action"{parent_attr} sequence="{model_spec.menu_sequence}"/>
</odoo>
'''


def _render_test_file(spec: ModuleScaffoldSpec) -> str:
    return f'''from __future__ import annotations

from odoo.tests.common import TransactionCase


class Test{_module_service_class_name(spec)}(TransactionCase):
    def test_service_can_be_built(self):
        from odoo.addons.{spec.technical_name}.adapters import build_{spec.technical_name}_service

        service = build_{spec.technical_name}_service(self.env)

        self.assertIsNotNone(service)
'''


def _view_field_names(model_spec: ModelScaffoldSpec) -> tuple[str, ...]:
    if model_spec.fields:
        return tuple(field_spec.name for field_spec in model_spec.fields[:8])
    return ("id",)


def _module_service_class_name(spec: ModuleScaffoldSpec) -> str:
    return f"{_module_name_to_class_name(spec.technical_name)}Service"


def _module_name_to_class_name(value: str) -> str:
    return "".join(part.capitalize() for part in value.split("_") if part)


def _model_name_to_class_name(value: str) -> str:
    return "".join(part.capitalize() for part in value.replace(".", "_").split("_") if part)


def _title_from_module_name(value: str) -> str:
    return " ".join(part.capitalize() for part in value.split("_") if part)


def _clean_required_text(value: Any, *, field_name: str) -> str:
    clean_value = str(value or "").strip()
    if not clean_value:
        raise ValueError(f"Module scaffold {field_name} is required")
    return clean_value


def _clean_optional_text(value: Any) -> str:
    return str(value or "").strip()


def _clean_field_name(value: Any) -> str:
    clean_value = _clean_required_text(value, field_name="field name").lower()
    if not FIELD_NAME_RE.match(clean_value):
        raise ValueError(f"Field name must match {FIELD_NAME_RE.pattern}: {clean_value!r}")
    return clean_value


def _clean_file_stem(value: Any, *, field_name: str) -> str:
    clean_value = _clean_required_text(value, field_name=field_name).lower()
    if not FILE_STEM_RE.match(clean_value):
        raise ValueError(f"{field_name} must match {FILE_STEM_RE.pattern}: {clean_value!r}")
    return clean_value


def _clean_text_tuple(values: Iterable[Any], *, field_name: str) -> tuple[str, ...]:
    if isinstance(values, (str, bytes)):
        raise TypeError(f"Module scaffold {field_name} must be a sequence")
    cleaned = tuple(_clean_required_text(value, field_name=field_name) for value in values)
    _reject_duplicate_values(cleaned, field_name)
    return cleaned


def _clean_path_tuple(values: Iterable[Any], *, field_name: str) -> tuple[str, ...]:
    if isinstance(values, (str, bytes)):
        raise TypeError(f"Module scaffold {field_name} must be a sequence")
    return tuple(_normalize_relative_path(value).as_posix() for value in values)


def _clean_assets(values: Mapping[str, Sequence[str]]) -> dict[str, tuple[str, ...]]:
    cleaned: dict[str, tuple[str, ...]] = {}
    for raw_bundle, raw_paths in dict(values or {}).items():
        bundle = _clean_required_text(raw_bundle, field_name="asset bundle")
        cleaned[bundle] = _clean_path_tuple(raw_paths, field_name=f"asset paths for {bundle}")
    return cleaned


def _clean_selection(values: Iterable[tuple[Any, Any]]) -> tuple[tuple[str, str], ...]:
    cleaned = tuple(
        (
            _clean_required_text(value, field_name="selection value"),
            _clean_required_text(label, field_name="selection label"),
        )
        for value, label in values
    )
    _reject_duplicate_values((value for value, _label in cleaned), "selection value")
    return cleaned


def _coerce_field_specs(values: Iterable[FieldScaffoldSpec | Mapping[str, Any]]) -> tuple[FieldScaffoldSpec, ...]:
    return tuple(value if isinstance(value, FieldScaffoldSpec) else FieldScaffoldSpec(**dict(value)) for value in values)


def _coerce_access_specs(
    values: Iterable[ModelAccessScaffoldSpec | Mapping[str, Any]],
) -> tuple[ModelAccessScaffoldSpec, ...]:
    return tuple(
        value if isinstance(value, ModelAccessScaffoldSpec) else ModelAccessScaffoldSpec(**dict(value))
        for value in values
    )


def _coerce_model_specs(values: Iterable[ModelScaffoldSpec | Mapping[str, Any]]) -> tuple[ModelScaffoldSpec, ...]:
    return tuple(value if isinstance(value, ModelScaffoldSpec) else ModelScaffoldSpec(**dict(value)) for value in values)


def _normalize_relative_path(value: Any) -> Path:
    raw = str(value or "").strip().replace("\\", "/").lstrip("/")
    if not raw:
        raise ValueError("Module scaffold relative path is required")
    path = PurePosixPath(raw)
    if path.is_absolute() or any(part in {"", ".", ".."} for part in path.parts):
        raise ValueError(f"Module scaffold path must be relative and normalized: {value!r}")
    if path.parts and ":" in path.parts[0]:
        raise ValueError(f"Module scaffold path must not include a drive prefix: {value!r}")
    return Path(path.as_posix())


def _reject_duplicate_values(values: Iterable[str], label: str) -> None:
    seen: set[str] = set()
    duplicates: list[str] = []
    for value in values:
        if value in seen:
            duplicates.append(value)
        seen.add(value)
    if duplicates:
        raise ValueError(f"Duplicate {label}: {', '.join(sorted(set(duplicates)))}")


def _csv_bool(value: bool) -> str:
    return "1" if bool(value) else "0"


def _xml_escape(value: str) -> str:
    return (
        str(value)
        .replace("&", "&amp;")
        .replace('"', "&quot;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def _ensure_trailing_newline(value: str) -> str:
    return value if value.endswith("\n") else f"{value}\n"


__all__ = [
    "FieldScaffoldSpec",
    "ModelAccessScaffoldSpec",
    "ModelScaffoldSpec",
    "ModuleScaffoldFile",
    "ModuleScaffoldSpec",
    "build_module_scaffold_files",
    "normalize_model_name",
    "normalize_module_name",
    "write_module_scaffold",
]
