from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from module_scaffold import (
    FieldScaffoldSpec,
    ModelScaffoldSpec,
    ModuleScaffoldSpec,
    build_module_scaffold_files,
    normalize_model_name,
    normalize_module_name,
    write_module_scaffold,
)


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

    def test_write_refuses_overwrite_by_default(self) -> None:
        spec = ModuleScaffoldSpec(
            technical_name="acme_minimal",
            summary="Minimal module",
        )

        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            written = write_module_scaffold(root, spec)

            self.assertTrue((root / "acme_minimal" / "__manifest__.py").is_file())
            self.assertGreater(len(written), 0)
            with self.assertRaises(FileExistsError):
                write_module_scaffold(root, spec)


if __name__ == "__main__":
    unittest.main()
