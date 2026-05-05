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
            },
            sample_values={"total": "14300.00"},
        )

        self.assertNotIn("<style", preview)
        self.assertIn("position:relative", preview)
        self.assertIn("position:absolute", preview)
        self.assertIn("left:13.33px;top:6.67px;width:106.67px;height:26.67px", preview)
        self.assertNotIn("rgba(59,130,246", preview)
        self.assertIn("14300.00", preview)

    def test_sample_xml_values_hydrate_preview_fields_and_cfdi_qr(self):
        blueprint = designer.parse_jrxml_document(
            """
            <jasperReport name="sample" pageWidth="200" pageHeight="120" columnWidth="200">
                <field name="UUID" class="java.lang.String"><fieldDescription>TimbreFiscalDigital/@UUID</fieldDescription></field>
                <field name="rfcEmisor" class="java.lang.String"><fieldDescription>Emisor/@Rfc</fieldDescription></field>
                <field name="rfcReceptor" class="java.lang.String"><fieldDescription>Receptor/@Rfc</fieldDescription></field>
                <field name="totalCFDi" class="java.math.BigDecimal"><fieldDescription>@Total</fieldDescription></field>
                <field name="selloCFD" class="java.lang.String"><fieldDescription>@Sello</fieldDescription></field>
                <field name="moneda" class="java.lang.String"><fieldDescription>/*/@Moneda</fieldDescription></field>
                <field name="usoCfdi" class="java.lang.String"><fieldDescription>*[contains(name(),'Receptor')]/@UsoCFDI</fieldDescription></field>
                <detail><band height="80">
                    <textField><reportElement x="0" y="0" width="100" height="20"/><textFieldExpression>$F{UUID}</textFieldExpression></textField>
                    <image><reportElement x="0" y="25" width="50" height="50"/><imageExpression>"?re="+$F{rfcEmisor}+"&amp;rr="+$F{rfcReceptor}+"&amp;tt="+$F{totalCFDi}+"&amp;id="+$F{UUID}</imageExpression></image>
                </band></detail>
            </jasperReport>
            """,
            source_name="sample.jrxml",
        )
        sample_values = designer.build_sample_field_values(
            blueprint,
            """
            <Comprobante Total="14300.00" Moneda="MXN" Sello="abcdefrH8/bw==">
                <Emisor Rfc="XOCD720319T86"/>
                <Receptor Rfc="CARR861127SB0" UsoCFDI="G03"/>
                <Complemento><TimbreFiscalDigital UUID="5803EB8D-81CD-4557-8719-26632D2FA434"/></Complemento>
            </Comprobante>
            """,
        )
        preview = designer.build_preview_html(blueprint, sample_values=sample_values)

        self.assertEqual(sample_values["UUID"], "5803EB8D-81CD-4557-8719-26632D2FA434")
        self.assertEqual(sample_values["moneda"], "MXN")
        self.assertEqual(sample_values["usoCfdi"], "G03")
        self.assertIn("5803EB8D-81CD-4557-8719-26632D2FA434", preview)
        self.assertIn("/report/barcode/?barcode_type=QR", preview)
        self.assertIn("verificacfdi.facturaelectronica.sat.gob.mx", preview)


if __name__ == "__main__":
    unittest.main()
