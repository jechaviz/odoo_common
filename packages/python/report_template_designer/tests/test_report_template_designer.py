from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path


SOURCE_ROOT = Path(__file__).resolve().parents[1] / "sources"


def _load_designer_module():
    spec = importlib.util.spec_from_file_location(
        "report_template_designer",
        SOURCE_ROOT / "__init__.py",
        submodule_search_locations=[str(SOURCE_ROOT)],
    )
    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load report_template_designer test module")
    module = importlib.util.module_from_spec(spec)
    sys.modules["report_template_designer"] = module
    spec.loader.exec_module(module)
    return module


designer = _load_designer_module()


class ReportTemplateDesignerPreviewTest(unittest.TestCase):
    def test_preview_html_uses_inline_canvas_styles_safe_for_odoo_html_fields(self):
        preview = designer.build_preview_html(
            {
                "page": {"width": 200, "height": 120},
                "bands": [
                    {
                        "name": "title",
                        "height": 40,
                        "elements": [
                            {
                                "type": "staticText",
                                "text": "Factura",
                                "geometry": {"x": 10, "y": 5, "width": 80, "height": 20},
                            },
                            {
                                "type": "textField",
                                "expression": {"source": "$F{total}"},
                                "geometry": {"x": 100, "y": 5, "width": 80, "height": 20},
                            },
                        ],
                    }
                ],
            }
        )

        self.assertNotIn("<style", preview)
        self.assertIn("position:relative", preview)
        self.assertIn("position:absolute", preview)
        self.assertIn("left:10px;top:5px;width:80px;height:20px", preview)
        self.assertIn("background:#eff6ff", preview)
        self.assertIn("$F{total}", preview)


if __name__ == "__main__":
    unittest.main()
