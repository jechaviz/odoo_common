from __future__ import annotations

import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path

from module_scaffold import (
    FieldScaffoldSpec,
    ModelScaffoldSpec,
    ModuleScaffoldSpec,
    build_module_scaffold_files,
    load_module_scaffold_spec,
    normalize_model_name,
    normalize_module_name,
    plan_module_scaffold_write,
    write_module_scaffold,
)
from module_scaffold_cli import run_module_scaffold_cli


class ModuleScaffoldTest(unittest.TestCase):
    def test_names_are_strict_not_slugified(self) -> None:
        self.assertEqual(normalize_module_name("acme_sales"), "acme_sales")
        self.assertEqual(normalize_model_name("acme.sale.order"), "acme.sale.order")

        with self.assertRaises(ValueError):
            normalize_module_name("Acme Sales")
        with self.assertRaises(ValueError):
            normalize_model_name("sale")

    def test_builds_layered_module_files(self) -> None:
        spec = ModuleScaffoldSpec(
            technical_name="acme_desk",
            summary="Desk workflow",
            models=(
                ModelScaffoldSpec(
                    technical_name="acme.desk.ticket",
                    description="Desk Ticket",
                    fields=(
                        FieldScaffoldSpec("name", string="Reference", required=True),
                        FieldScaffoldSpec(
                            "priority",
                            field_type="Selection",
                            selection=(("0", "Low"), ("1", "High")),
                        ),
                    ),
                ),
            ),
        )

        files = {file.relative_path.as_posix(): file.content for file in build_module_scaffold_files(spec)}

        self.assertIn("acme_desk/__manifest__.py", files)
        self.assertIn("acme_desk/contracts/module_contract.py", files)
        self.assertIn("acme_desk/adapters/odoo_environment.py", files)
        self.assertIn("acme_desk/services/acme_desk_service.py", files)
        self.assertIn("acme_desk/models/acme_desk_ticket.py", files)
        self.assertIn("acme_desk/security/ir.model.access.csv", files)
        self.assertIn("acme_desk/views/acme_desk_ticket_views.xml", files)
        self.assertIn("build_acme_desk_service", files["acme_desk/adapters/odoo_environment.py"])
        self.assertIn("fields.Selection", files["acme_desk/models/acme_desk_ticket.py"])
        self.assertIn("access_acme_desk_ticket_user", files["acme_desk/security/ir.model.access.csv"])

    def test_write_is_idempotent_and_blocks_different_existing_files(self) -> None:
        spec = ModuleScaffoldSpec(
            technical_name="acme_minimal",
            summary="Minimal module",
        )

        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            written = write_module_scaffold(root, spec)

            self.assertTrue((root / "acme_minimal" / "__manifest__.py").is_file())
            self.assertGreater(len(written), 0)
            self.assertEqual(write_module_scaffold(root, spec), ())

            manifest_path = root / "acme_minimal" / "__manifest__.py"
            manifest_path.write_text("# local edits\n", encoding="utf-8")
            plan = plan_module_scaffold_write(root, spec)

            self.assertIn("blocked", {entry.action for entry in plan})
            with self.assertRaises(FileExistsError):
                write_module_scaffold(root, spec)

    def test_loads_json_spec_and_cli_dry_run_reports_plan(self) -> None:
        payload = {
            "technical_name": "acme_json",
            "summary": "JSON module",
            "models": [
                {
                    "technical_name": "acme.json.record",
                    "description": "JSON Record",
                    "fields": [{"name": "name", "string": "Name", "required": True}],
                }
            ],
        }

        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            spec_path = root / "spec.json"
            spec_path.write_text(json.dumps(payload), encoding="utf-8")

            spec = load_module_scaffold_spec(spec_path)
            plan = plan_module_scaffold_write(root / "addons", spec)

            self.assertEqual(spec.technical_name, "acme_json")
            self.assertIn("create", {entry.action for entry in plan})

            stdout = io.StringIO()
            with contextlib.redirect_stdout(stdout):
                exit_code = run_module_scaffold_cli(
                    [
                        "--spec",
                        str(spec_path),
                        "--target-root",
                        str(root / "addons"),
                        "--dry-run",
                    ]
                )

            self.assertEqual(exit_code, 0)
            self.assertIn("create", stdout.getvalue())
            self.assertFalse((root / "addons" / "acme_json").exists())


if __name__ == "__main__":
    unittest.main()
