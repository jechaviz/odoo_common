from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path
from urllib.parse import parse_qs, urlparse


SOURCE_ROOT = Path(__file__).resolve().parents[1] / "sources"


def _load_mapping_module():
    spec = importlib.util.spec_from_file_location(
        "report_template_mapping",
        SOURCE_ROOT / "__init__.py",
        submodule_search_locations=[str(SOURCE_ROOT)],
    )
    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load report_template_mapping test module")
    module = importlib.util.module_from_spec(spec)
    sys.modules["report_template_mapping"] = module
    spec.loader.exec_module(module)
    return module


mapping = _load_mapping_module()


class ReportTemplateMappingTest(unittest.TestCase):
    def test_build_mapping_plan_matches_jrxml_aliases_to_qweb_sources(self):
        expression_index = {
            "items": [
                {
                    "source": '"?re="+$F{rfcEmisor}+"&rr="+$F{rfcReceptor}+"&tt="+$F{totalCFDi}+"&id="+$F{UUID}',
                    "refs": {
                        "fields": ["rfcEmisor", "rfcReceptor", "totalCFDi", "UUID"],
                        "parameters": [],
                        "variables": [],
                    },
                },
                {
                    "source": "$P{logo}",
                    "refs": {"fields": [], "parameters": ["logo"], "variables": []},
                },
            ]
        }

        plan = mapping.build_report_template_mapping_plan(
            expression_index,
            mapping.DEFAULT_CFDI40_JRXML_FIELD_MAPPINGS,
            document_family="cfdi",
            target_model="account.move",
        )

        self.assertEqual(plan.schema_version, mapping.REPORT_TEMPLATE_MAPPING_SCHEMA_VERSION)
        self.assertEqual({reference.name for reference in plan.mapped}, {"UUID", "rfcEmisor", "rfcReceptor", "totalCFDi"})
        self.assertEqual([reference.token for reference in plan.missing], ["$P{logo}"])
        self.assertEqual(plan.qweb_context["rfcEmisor"], "o.company_id.vat or ''")

    def test_build_cfdi_qr_url_and_odoo_img_tag(self):
        url = mapping.build_cfdi_qr_verification_url(
            {
                "uuid": "5803EB8D-81CD-4557-8719-26632D2FA434",
                "emitter_rfc": "XOCD720319T86",
                "receiver_rfc": "CARR861127SB0",
                "total": "14300",
                "seal": "abcdefrH8/bw==",
            }
        )
        parsed = urlparse(url)
        query = parse_qs(parsed.query)

        self.assertEqual(parsed.scheme, "https")
        self.assertEqual(parsed.netloc, "verificacfdi.facturaelectronica.sat.gob.mx")
        self.assertEqual(query["id"], ["5803EB8D-81CD-4557-8719-26632D2FA434"])
        self.assertEqual(query["re"], ["XOCD720319T86"])
        self.assertEqual(query["rr"], ["CARR861127SB0"])
        self.assertEqual(query["tt"], ["14300.000000"])
        self.assertEqual(query["fe"], ["rH8/bw=="])

        image = mapping.build_cfdi_qr_img_tag(
            {
                "uuid": "5803EB8D-81CD-4557-8719-26632D2FA434",
                "emitter_rfc": "XOCD720319T86",
                "receiver_rfc": "CARR861127SB0",
                "total": "14300",
                "seal": "abcdefrH8/bw==",
            },
            width=180,
            height=180,
        )
        self.assertIn("/report/barcode/?barcode_type=QR", image)
        self.assertIn("width=\"180\"", image)
        self.assertIn("Codigo QR CFDI", image)


if __name__ == "__main__":
    unittest.main()
