from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path
from types import ModuleType


COMMON_ROOT = Path(__file__).resolve().parents[4]
PYTHON_PACKAGES_ROOT = COMMON_ROOT / "packages" / "python"


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


def _load_builder_modules() -> ModuleType:
    root_package = sys.modules.setdefault("odoo_common", ModuleType("odoo_common"))
    root_package.__path__ = []  # type: ignore[attr-defined]
    for package_name in (
        "record_upserts",
        "report_template_designer",
        "report_upserts",
        "text_templates",
        "view_upserts",
    ):
        _load_package_module(
            f"odoo_common.{package_name}",
            PYTHON_PACKAGES_ROOT / package_name / "sources",
        )
    return _load_package_module(
        "report_template_builder",
        PYTHON_PACKAGES_ROOT / "report_template_builder" / "sources",
    )


builder = _load_builder_modules()
PaperformatSpec = sys.modules["odoo_common.report_upserts"].PaperformatSpec


class ReportTemplateBuilderTest(unittest.TestCase):
    def test_build_report_template_plan_returns_publication_specs_without_rpc(self):
        paperformat = PaperformatSpec(
            name="Neutral PDF",
            margin_top=58,
            margin_bottom=14,
            header_spacing=45,
        )
        plan = builder.build_report_template_plan(
            publication=builder.ReportTemplatePublicationSpec(
                target_model="account.move",
                qweb_template_key="oc.report.invoice",
                qweb_template_name="Neutral Invoice",
                report_action_name="Print Neutral Invoice",
                report_name="oc.report_invoice",
                paperformat=paperformat,
                paperformat_id=99,
                class_prefix="oc_report",
            ),
            bands=[
                builder.ReportTemplateBandSpec(
                    key="lines",
                    label="Lines",
                    role="line_table",
                    sequence=20,
                    qweb="<table><tr><td>Line</td></tr></table>",
                ),
                builder.ReportTemplateBandSpec(
                    key="summary",
                    label="Summary",
                    role="totals",
                    sequence=30,
                    html="<p>Total</p>",
                ),
            ],
            toolbar=builder.PreviewToolbarSpec(
                title="Factura",
                reference="A-1",
                brand="FIAX",
                actions=("back", "print"),
            ),
            terms=builder.TermsDocumentSpec(
                source_text="1. Alcance\n1.1 Se paga a tiempo\n- Conserva evidencia",
                title="Terminos",
            ),
            reserved_layout=builder.ReservedPdfLayoutSpec(
                template_key="oc.external_layout",
                template_name="Neutral PDF Layout",
                model_names=("account.move",),
                header_height_mm=58,
                footer_height_mm=14,
            ),
            metadata={"document_family": "invoice"},
        )

        self.assertEqual(plan.schema_version, builder.REPORT_TEMPLATE_BUILDER_SCHEMA_VERSION)
        self.assertEqual(len(plan.qweb_template_specs), 1)
        self.assertEqual(len(plan.qweb_view_specs), 1)
        self.assertEqual(plan.paperformat_specs, (paperformat,))
        self.assertEqual(len(plan.report_action_specs), 1)
        self.assertEqual([band.key for band in plan.bands], ["lines", "summary"])
        self.assertIn("paperformat and paperformat_id", plan.warnings[0])

        arch = plan.qweb_template_specs[0].arch_db
        self.assertIn("report_type != 'pdf'", arch)
        self.assertIn('data-report-band="lines"', arch)
        self.assertIn("oc_report-toolbar", arch)
        self.assertIn("Se paga a tiempo", arch)

        layout_arch = plan.qweb_view_specs[0].arch_db
        self.assertIn("'account.move'", layout_arch)
        self.assertIn("oc_uses_reserved_pdf_bands", layout_arch)
        self.assertIn('<span class="page"/> of <span class="topage"/>', layout_arch)

    def test_render_template_registry_is_strict_and_rejects_duplicate_keys(self):
        with tempfile.TemporaryDirectory() as tmp:
            templates_dir = Path(tmp)
            (templates_dir / "toolbar.xml.tmpl").write_text(
                "<div>{{TITLE}}</div>",
                encoding="utf-8",
            )

            rendered = builder.render_template_registry(
                templates_dir,
                [
                    builder.TemplateRegistryEntry(
                        key="toolbar",
                        filename="toolbar.xml.tmpl",
                        replacements={"{{TITLE}}": "Preview"},
                    )
                ],
            )
            self.assertEqual(rendered, {"toolbar": "<div>Preview</div>"})

            with self.assertRaisesRegex(ValueError, "Duplicate report template registry key"):
                builder.render_template_registry(
                    templates_dir,
                    [
                        {"key": "toolbar", "filename": "toolbar.xml.tmpl", "replacements": {"{{TITLE}}": "One"}},
                        {"key": "toolbar", "filename": "toolbar.xml.tmpl", "replacements": {"{{TITLE}}": "Two"}},
                    ],
                )

            with self.assertRaisesRegex(ValueError, "missing replacement token"):
                builder.render_template_registry(
                    templates_dir,
                    [
                        {
                            "key": "missing",
                            "filename": "toolbar.xml.tmpl",
                            "replacements": {"{{MISSING}}": "Nope"},
                        }
                    ],
                )


if __name__ == "__main__":
    unittest.main()
