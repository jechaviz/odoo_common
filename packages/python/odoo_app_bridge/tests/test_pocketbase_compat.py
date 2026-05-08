from __future__ import annotations

import importlib
import importlib.util
import json
import sys
import tempfile
import unittest
import zipfile
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


bridge = _load_package_module(
    "odoo_app_bridge",
    Path(__file__).resolve().parents[1] / "sources",
)
pocketbase_compat = importlib.import_module("odoo_app_bridge.pocketbase_compat")

OdooAppBridgeSpec = bridge.OdooAppBridgeSpec
AppBridgeModuleFile = bridge.AppBridgeModuleFile
build_app_bridge_module_files = bridge.build_app_bridge_module_files

load_pocketbase_export = pocketbase_compat.load_pocketbase_export
pocketbase_export_to_app_bridge_spec = pocketbase_compat.pocketbase_export_to_app_bridge_spec
build_pocketbase_compat_extra_files = pocketbase_compat.build_pocketbase_compat_extra_files
write_pocketbase_compat_module_zip = pocketbase_compat.write_pocketbase_compat_module_zip


def sample_pocketbase_export() -> dict[str, object]:
    return {
        "collections": [
            {
                "id": "_pb_users_auth_",
                "name": "users",
                "type": "auth",
                "system": False,
                "listRule": "@request.auth.id != ''",
                "viewRule": "@request.auth.id = id",
                "createRule": "",
                "updateRule": "@request.auth.id = id",
                "deleteRule": None,
                "fields": [
                    {"id": "email", "name": "email", "type": "email", "required": True, "system": True},
                    {"id": "name", "name": "name", "type": "text", "required": False},
                    {
                        "id": "role",
                        "name": "role",
                        "type": "select",
                        "required": False,
                        "options": {"values": ["customer", "operator"]},
                    },
                ],
            },
            {
                "id": "pb_tasks",
                "name": "tasks",
                "type": "base",
                "system": False,
                "listRule": "published = true",
                "viewRule": "published = true || owner = @request.auth.id",
                "createRule": "@request.auth.id != ''",
                "updateRule": "owner = @request.auth.id",
                "deleteRule": "owner = @request.auth.id",
                "fields": [
                    {"id": "title", "name": "title", "type": "text", "required": True},
                    {
                        "id": "status",
                        "name": "status",
                        "type": "select",
                        "required": True,
                        "options": {"values": ["todo", "done"]},
                    },
                    {"id": "estimate", "name": "estimate", "type": "number", "required": False},
                    {"id": "published", "name": "published", "type": "bool", "required": False},
                    {"id": "due", "name": "due", "type": "date", "required": False},
                    {
                        "id": "owner",
                        "name": "owner",
                        "type": "relation",
                        "required": True,
                        "options": {"collectionId": "_pb_users_auth_", "maxSelect": 1},
                    },
                ],
            },
        ]
    }


class PocketBaseCompatTest(unittest.TestCase):
    def test_loads_pocketbase_export_with_auth_and_base_collections(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            export_path = Path(tmpdir) / "pb_schema.json"
            export_path.write_text(json.dumps(sample_pocketbase_export()), encoding="utf-8")

            loaded = load_pocketbase_export(export_path)

        self.assertEqual([collection["name"] for collection in loaded["collections"]], ["users", "tasks"])
        self.assertEqual(loaded["collections"][0]["type"], "auth")
        self.assertEqual(loaded["collections"][1]["type"], "base")

    def test_maps_pocketbase_fields_and_rules_to_bridge_spec(self) -> None:
        spec = pocketbase_export_to_app_bridge_spec(
            sample_pocketbase_export(),
            app={
                "name": "Pocket Tasks",
                "slug": "pocket-tasks",
                "module": "x_pocket_tasks",
                "summary": "PocketBase-compatible task app.",
            },
        )

        self.assertIsInstance(spec, OdooAppBridgeSpec)
        self.assertEqual(spec.app.module, "x_pocket_tasks")
        self.assertEqual(spec.security.default_role, "public")
        self.assertTrue(spec.security.enable_app_login)
        self.assertIn(("public", "public"), {(role.name, role.auth) for role in spec.roles})
        self.assertIn(("app_user", "app_user"), {(role.name, role.auth) for role in spec.roles})

        tasks = spec.query_by_name("tasks")
        self.assertEqual(tasks.path, "collections/tasks/records")
        self.assertEqual(tasks.role, "public")
        self.assertEqual(
            tasks.fields,
            ("id", "title", "status", "estimate", "published", "due", "owner", "create_date", "write_date"),
        )
        self.assertEqual(tasks.response_map["created"], "create_date")
        self.assertEqual(tasks.response_map["updated"], "write_date")
        self.assertIn("pocketbase", tasks.tags)
        self.assertIn(("published", "=", True), tasks.fixed_domain)

        create_task = spec.command_by_name("create_tasks")
        self.assertEqual(create_task.path, "collections/tasks/records/create")
        self.assertEqual(create_task.role, "app_user")
        self.assertFalse(create_task.ids_required)
        self.assertTrue(create_task.idempotent)
        self.assertEqual({param.name: param.type for param in create_task.params}, {
            "title": "str",
            "status": "str",
            "estimate": "float",
            "published": "bool",
            "due": "datetime",
            "owner": "str",
        })
        self.assertEqual({param.name for param in create_task.params if param.required}, {"title", "status", "owner"})

        update_task = spec.command_by_name("update_tasks")
        delete_task = spec.command_by_name("delete_tasks")
        self.assertEqual(update_task.method, "write")
        self.assertEqual(delete_task.method, "unlink")
        self.assertEqual(update_task.role, "app_user")
        self.assertEqual(delete_task.role, "app_user")
        self.assertIn("PB updateRule: owner = @request.auth.id", update_task.notes)

    def test_generates_extra_js_shim_and_collections_json_for_module_builder(self) -> None:
        spec = pocketbase_export_to_app_bridge_spec(
            sample_pocketbase_export(),
            app={
                "name": "Pocket Tasks",
                "slug": "pocket-tasks",
                "module": "x_pocket_tasks",
                "summary": "PocketBase-compatible task app.",
            },
        )
        extra_files = build_pocketbase_compat_extra_files(sample_pocketbase_export(), spec)

        self.assertTrue(all(isinstance(item, AppBridgeModuleFile) for item in extra_files))
        files = {
            item.relative_path.as_posix(): item.content
            for item in build_app_bridge_module_files(spec, extra_files=extra_files)
        }

        shim_path = "x_pocket_tasks/static/src/js/pocketbase_compat.js"
        collections_path = "x_pocket_tasks/static/src/json/pocketbase_collections.json"
        self.assertIn(shim_path, files)
        self.assertIn(collections_path, files)
        self.assertIn("class PocketBaseCompat", files[shim_path])
        self.assertIn("collection(name)", files[shim_path])
        self.assertIn("getList(page = 1, perPage = 30, query = {})", files[shim_path])
        self.assertIn("authStore", files[shim_path])
        self.assertEqual(json.loads(files[collections_path])["collections"][1]["name"], "tasks")

    def test_one_line_helper_writes_importable_zip_with_pocketbase_assets(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            zip_path = write_pocketbase_compat_module_zip(
                Path(tmpdir),
                sample_pocketbase_export(),
                app={
                    "name": "Pocket Tasks",
                    "slug": "pocket-tasks",
                    "module": "x_pocket_tasks",
                    "summary": "PocketBase-compatible task app.",
                },
                overwrite=True,
            )

            self.assertTrue(zip_path.is_file())
            with zipfile.ZipFile(zip_path) as archive:
                names = set(archive.namelist())

        self.assertIn("x_pocket_tasks/__manifest__.py", names)
        self.assertIn("x_pocket_tasks/static/src/js/pocketbase_compat.js", names)
        self.assertIn("x_pocket_tasks/static/src/json/pocketbase_collections.json", names)


if __name__ == "__main__":
    unittest.main()
