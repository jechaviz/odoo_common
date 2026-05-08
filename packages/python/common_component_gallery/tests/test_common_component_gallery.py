from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path
from types import ModuleType


def _load_package_module(module_name: str, source_root: Path) -> ModuleType:
    if module_name in sys.modules:
        return sys.modules[module_name]
    spec = importlib.util.spec_from_file_location(
        module_name,
        source_root / "__init__.py",
        submodule_search_locations=[str(source_root)],
    )
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load module spec for {module_name}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module


gallery = _load_package_module(
    "common_component_gallery",
    Path(__file__).resolve().parents[1] / "sources",
)
_load_package_module(
    "odoo_app_bridge",
    Path(__file__).resolve().parents[2] / "odoo_app_bridge" / "sources",
)

build_component_gallery_app_files = gallery.build_component_gallery_app_files
build_component_gallery_app_model = gallery.build_component_gallery_app_model
ComponentInstallTarget = gallery.ComponentInstallTarget
build_component_gallery_entries = gallery.build_component_gallery_entries
build_component_install_plan = gallery.build_component_install_plan
build_component_storybook_model = gallery.build_component_storybook_model
group_component_gallery_entries = gallery.group_component_gallery_entries


CATALOG = (
    {
        "key": "surface-workspace-shell",
        "title": "Native Surface Workspace Shell",
        "runtime": "web",
        "status": "canonical",
        "package_path": "packages/web/surface_workspace_shell",
        "origins": [{"project": "odoo_fiax", "path": "web_assets/odoo_surface_layers"}],
        "features": ["workspace runtime", "collapsible ledger rows"],
    },
    {
        "key": "common-component-sync",
        "title": "Common Component Sync",
        "runtime": "python",
        "status": "canonical",
        "package_path": "packages/python/common_component_sync",
        "origins": [{"project": "odoo_fiax", "path": "common_sync.py"}],
        "features": ["sync manifest"],
    },
    {
        "key": "old-rental-widget",
        "title": "Old Rental Widget",
        "runtime": "web",
        "status": "source-derived",
        "package_path": "references/projects/rp-rental-mock/old",
        "origins": [{"project": "rp-rental-mock", "path": "old"}],
        "features": ["legacy trace"],
    },
)


class CommonComponentGalleryTest(unittest.TestCase):
    def test_gallery_filters_to_canonical_components_by_default(self) -> None:
        entries = build_component_gallery_entries(CATALOG)
        keys = {entry.key for entry in entries}

        self.assertIn("surface-workspace-shell", keys)
        self.assertIn("common-component-sync", keys)
        self.assertNotIn("old-rental-widget", keys)

    def test_storybook_model_groups_by_runtime(self) -> None:
        entries = build_component_gallery_entries(CATALOG)
        model = build_component_storybook_model(entries)
        section_keys = [section["key"] for section in model["sections"]]

        self.assertIn("web", section_keys)
        self.assertIn("python", section_keys)
        self.assertEqual(model["wizard"]["modes"], ("dry-run", "live"))

    def test_web_component_plan_includes_asset_audit_and_ai_steps(self) -> None:
        plan = build_component_install_plan(
            "surface-workspace-shell",
            ComponentInstallTarget(consumer_key="odoo_fiax", target_root="C:/git/customers/yo/odoo_fiax"),
            CATALOG,
        )
        step_keys = [step.key for step in plan.steps]

        self.assertIn("sync-common-package", step_keys)
        self.assertIn("publish-backend-assets", step_keys)
        self.assertIn("run-design-audit", step_keys)
        self.assertIn("ai-preview-review", step_keys)
        self.assertEqual(plan.target.mode, "dry-run")

    def test_python_component_plan_keeps_runtime_contract_step(self) -> None:
        plan = build_component_install_plan(
            "common-component-sync",
            {"consumer_key": "odoo_fiax", "target_root": "C:/git/customers/yo/odoo_fiax", "mode": "live"},
            CATALOG,
        )
        step_keys = [step.key for step in plan.steps]

        self.assertIn("run-python-contracts", step_keys)
        self.assertIn("install-on-target", step_keys)
        self.assertNotIn("publish-backend-assets", step_keys)

    def test_rejects_non_canonical_install(self) -> None:
        with self.assertRaises(ValueError):
            build_component_install_plan(
                "old-rental-widget",
                ComponentInstallTarget(consumer_key="odoo_fiax", target_root="C:/git/customers/yo/odoo_fiax"),
                CATALOG,
            )

    def test_rejects_unknown_component(self) -> None:
        with self.assertRaises(KeyError):
            build_component_install_plan(
                "missing-component",
                ComponentInstallTarget(consumer_key="odoo_fiax", target_root="C:/git/customers/yo/odoo_fiax"),
                CATALOG,
            )

    def test_marks_package_existence_when_catalog_path_is_used(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            package = root / "packages" / "web" / "surface_workspace_shell"
            package.mkdir(parents=True)
            catalog_path = root / "catalog" / "components.json"
            catalog_path.parent.mkdir()
            catalog_path.write_text(
                "["
                "{\"key\":\"surface-workspace-shell\",\"title\":\"Native Surface Workspace Shell\","
                "\"runtime\":\"web\",\"status\":\"canonical\","
                "\"package_path\":\"packages/web/surface_workspace_shell\","
                "\"origins\":[{\"project\":\"odoo_fiax\",\"path\":\"web\"}],"
                "\"features\":[\"workspace\"]}"
                "]",
                encoding="utf-8",
            )

            entries = build_component_gallery_entries(catalog_path)

        self.assertEqual(entries[0].package_exists, True)

    def test_builds_installable_gallery_app_files(self) -> None:
        surface_root = Path(__file__).resolve().parents[3] / "web" / "surface_component_gallery"

        files = {
            file.relative_path.as_posix(): file.content
            for file in build_component_gallery_app_files(CATALOG, surface_package_path=surface_root)
        }

        self.assertIn("x_odoo_common_gallery/controllers/main.py", files)
        self.assertIn("x_odoo_common_gallery/static/src/js/common_component_gallery.js", files)
        self.assertIn("x_odoo_common_gallery/static/src/js/common_component_gallery_boot.js", files)
        self.assertIn("x_odoo_common_gallery/static/src/css/common_component_gallery.css", files)
        self.assertIn("x_odoo_common_gallery/static/src/json/common_component_gallery_model.json", files)
        self.assertIn("odoo-common-component-gallery", files["x_odoo_common_gallery/controllers/main.py"])

        app_model = json_loads(files["x_odoo_common_gallery/static/src/json/common_component_gallery_model.json"])
        self.assertIn("storybook", app_model)
        self.assertIn("plans", app_model)
        self.assertIn("surface-workspace-shell", app_model["plans"])
        self.assertIn("dry-run", app_model["plans"]["surface-workspace-shell"])

    def test_gallery_app_model_contains_live_and_dry_run_templates(self) -> None:
        model = build_component_gallery_app_model(CATALOG)

        self.assertIn("dry-run", model["plans"]["surface-workspace-shell"])
        self.assertIn("live", model["plans"]["surface-workspace-shell"])
        self.assertEqual(model["plans"]["surface-workspace-shell"]["live"]["target"]["mode"], "live")


def json_loads(value: str):
    import json

    return json.loads(value)


if __name__ == "__main__":
    unittest.main()
