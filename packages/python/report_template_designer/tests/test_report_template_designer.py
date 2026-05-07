from __future__ import annotations

import importlib.util
import json
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

    def test_stretching_long_text_fields_wrap_without_clipping(self):
        preview = designer.build_preview_html(
            {
                "page": {"width": 300, "height": 120},
                "bands": [
                    {
                        "name": "detail",
                        "height": 40,
                        "elements": [
                            {
                                "type": "textField",
                                "stretch_with_overflow": "true",
                                "geometry": {"x": 10, "y": 10, "width": 120, "height": 10},
                                "text_style": {
                                    "textAlignment": "Left",
                                    "verticalAlignment": "Middle",
                                    "font": {"size": "6"},
                                },
                                "expression": {"source": "$F{cadenaOriginal}"},
                            },
                        ],
                    }
                ],
            },
            sample_values={
                "cadenaOriginal": "||1.1|5803EB8D-81CD-4557-8719-26632D2FA434|LONGTOKENWITHOUTSPACES0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ||",
            },
            scale=1,
        )

        self.assertIn("overflow-wrap:anywhere", preview)
        self.assertIn("word-break:break-word", preview)
        self.assertIn("height:auto", preview)
        self.assertIn("min-height:10px", preview)
        self.assertIn("overflow:visible", preview)
        self.assertNotIn("display:flex;align-items:center", preview)

    def test_stretched_text_pushes_float_frames_down(self):
        preview = designer.build_preview_html(
            {
                "page": {"width": 300, "height": 160},
                "bands": [
                    {
                        "name": "detail",
                        "height": 80,
                        "elements": [
                            {
                                "type": "frame",
                                "geometry": {"x": 0, "y": 0, "width": 250, "height": 38},
                                "children": [
                                    {
                                        "type": "textField",
                                        "stretch_with_overflow": "true",
                                        "geometry": {"x": 5, "y": 18, "width": 80, "height": 15},
                                        "text_style": {"font": {"size": "6"}},
                                        "expression": {"source": "$F{cadenaOriginal}"},
                                    },
                                ],
                            },
                            {
                                "type": "frame",
                                "geometry": {"x": 0, "y": 39, "width": 250, "height": 20},
                                "report_element": {"positionType": "Float"},
                                "children": [
                                    {
                                        "type": "staticText",
                                        "geometry": {"x": 0, "y": 0, "width": 100, "height": 10},
                                        "text": "NEXT",
                                    },
                                ],
                            },
                        ],
                    }
                ],
            },
            sample_values={"cadenaOriginal": "X" * 240},
            scale=1,
        )

        self.assertIn("height:94px;overflow:visible", preview)
        self.assertIn("top:94px;width:250px;height:20px", preview)

    def test_relative_band_decoration_does_not_float_into_empty_gap(self):
        preview = designer.build_preview_html(
            {
                "page": {"width": 300, "height": 160},
                "bands": [
                    {
                        "name": "detail",
                        "height": 56,
                        "elements": [
                            {
                                "type": "frame",
                                "geometry": {"x": 0, "y": 0, "width": 250, "height": 56},
                                "children": [
                                    {
                                        "type": "textField",
                                        "stretch_with_overflow": "true",
                                        "geometry": {"x": 5, "y": 16, "width": 90, "height": 23},
                                        "text_style": {"font": {"size": "7"}},
                                        "expression": {"source": "$F{paymentBlock}"},
                                    },
                                    {
                                        "type": "textField",
                                        "geometry": {"x": 5, "y": 39, "width": 160, "height": 11},
                                        "report_element": {"positionType": "Float"},
                                        "expression": {"source": "$F{amountLetters}"},
                                    },
                                    {
                                        "type": "rectangle",
                                        "geometry": {"x": 0, "y": 0, "width": 250, "height": 53},
                                        "report_element": {
                                            "positionType": "Float",
                                            "stretchType": "RelativeToBandHeight",
                                        },
                                    },
                                ],
                            },
                        ],
                    }
                ],
            },
            sample_values={
                "paymentBlock": "Metodo de Pago:\nForma de pago:\nUso CFDI: P01\nTipo de Comprobante: T - Traslado",
                "amountLetters": "Importe con letra: CERO EUROS 00/100 EUR",
            },
            scale=1,
        )

        self.assertIn("oc_report_designer_preview__rectangle", preview)
        self.assertIn("left:0px;top:0px;width:250px;height:53px", preview)
        self.assertNotIn("left:0px;top:67px;width:250px;height:53px", preview)

    def test_design_sample_records_expose_original_and_translated_test_data(self):
        sample_xml = """
        <Comprobante Total="0.00" Moneda="EUR">
            <Receptor Rfc="XEXX010101000" UsoCFDI="P01"/>
            <Complemento><TimbreFiscalDigital UUID="3D696462-B13B-49BA-81ED-1F34FE4C60A0"/></Complemento>
        </Comprobante>
        """
        jrxml = """
            <jasperReport name="sample" pageWidth="200" pageHeight="120" columnWidth="200">
                <field name="UUID" class="java.lang.String"><fieldDescription>TimbreFiscalDigital/@UUID</fieldDescription></field>
                <field name="totalCFDi" class="java.math.BigDecimal"><fieldDescription>@Total</fieldDescription></field>
                <field name="usoCfdi" class="java.lang.String"><fieldDescription>Receptor/@UsoCFDI</fieldDescription></field>
                <detail><band height="20"/></detail>
            </jasperReport>
        """
        temp_dir = Path(__file__).resolve().parent
        jrxml_path = temp_dir / "_sample_report.jrxml"
        sample_path = temp_dir / "_sample_cfdi.xml"
        jrxml_path.write_text(jrxml, encoding="utf-8")
        with self.subTest("sample child records"):
            records = designer.build_design_sample_record_values(jrxml_path, sample_xml_paths=())
            self.assertEqual((), records)

        sample_path.write_text(sample_xml, encoding="utf-8")
        try:
            records = designer.build_design_sample_record_values(jrxml_path, sample_xml_paths=(sample_path,))
            commands = designer.build_design_sample_create_commands(jrxml_path, sample_xml_paths=(sample_path,))
            parent_values = designer.build_design_record_values(jrxml_path, sample_xml_paths=(sample_path,))
        finally:
            sample_path.unlink(missing_ok=True)
            jrxml_path.unlink(missing_ok=True)

        self.assertEqual(["original_xml", "translated"], [record["x_kind"] for record in records])
        self.assertTrue(all(record["x_active"] is True for record in records))
        self.assertEqual("xml", records[0]["x_source_format"])
        self.assertEqual("json", records[1]["x_source_format"])
        self.assertIn("<Comprobante", records[0]["x_content"])
        self.assertIn('"field_values"', records[1]["x_content"])
        self.assertIn("3D696462-B13B-49BA-81ED-1F34FE4C60A0", records[1]["x_content"])
        self.assertEqual((5, 0, 0), commands[0])
        self.assertEqual((0, 0), commands[1][:2])
        self.assertEqual("original_xml", commands[1][2]["x_kind"])
        self.assertEqual(2, parent_values["x_active_sample_count"])
        self.assertEqual("_sample_cfdi.xml", parent_values["x_preview_sample_name"])
        payload = json.loads(parent_values["x_data_schema_json"])
        self.assertEqual(2, payload["active_sample_count"])
        self.assertIn("field_values", payload)
        self.assertFalse(
            hasattr(designer, "build_test_data_html"),
            "test data must stay in native child records; hidden HTML indexes are not supported",
        )

    def test_uploaded_test_data_can_recompute_preview_runtime_values(self):
        sample_xml = """
        <Comprobante Total="0.00" Moneda="EUR">
            <Complemento><TimbreFiscalDigital UUID="XML-UUID"/></Complemento>
        </Comprobante>
        """
        blueprint = designer.parse_jrxml_document(
            """
            <jasperReport name="sample" pageWidth="200" pageHeight="120" columnWidth="200">
                <field name="UUID" class="java.lang.String"><fieldDescription>TimbreFiscalDigital/@UUID</fieldDescription></field>
                <detail><band height="20">
                    <textField><reportElement x="0" y="0" width="100" height="20"/><textFieldExpression>$F{UUID}</textFieldExpression></textField>
                </band></detail>
            </jasperReport>
            """,
            source_name="sample.jrxml",
        )
        xml_upload = designer.normalize_design_sample_upload_values(
            "uploaded.xml",
            content_bytes=sample_xml.encode("utf-8"),
            mimetype="application/xml",
            active=False,
        )
        json_upload = designer.normalize_design_sample_upload_values(
            "uploaded.translated.json",
            content_text=json.dumps({"field_values": {"UUID": "JSON-UUID"}}),
            mimetype="application/json",
            sequence=20,
        )

        self.assertEqual("xml", xml_upload["x_source_format"])
        self.assertEqual("uploaded.xml", xml_upload["x_file_name"])
        self.assertIn("<Comprobante", xml_upload["x_content"])
        self.assertTrue(xml_upload["x_file"])

        normalized = designer.normalize_design_sample_records([xml_upload, json_upload])
        self.assertEqual(["uploaded.xml", "uploaded.translated.json"], [record["x_source_filename"] for record in normalized])
        payload = designer.build_design_sample_data_payload(blueprint, normalized)
        self.assertEqual(1, payload["active_sample_count"])
        self.assertEqual("uploaded.translated.json", payload["preview_sample_name"])
        self.assertEqual("JSON-UUID", payload["field_values"]["UUID"])
        runtime = designer.build_design_runtime_values_from_samples(blueprint, normalized)
        self.assertEqual(1, runtime["x_active_sample_count"])
        self.assertIn("JSON-UUID", runtime["x_preview_html"])

    def test_designer_view_exposes_native_upload_and_lifecycle_fields(self):
        field_names = {(field.model, field.name) for field in designer.REPORT_DESIGNER_FIELDS}
        self.assertIn(("x_odoo_report_design", "x_active_sample_count"), field_names)
        self.assertIn(("x_odoo_report_design", "x_preview_sample_name"), field_names)
        self.assertIn(("x_odoo_report_design", "x_data_recomputed_at"), field_names)
        self.assertIn(("x_odoo_report_design", "x_data_recompute_error"), field_names)
        self.assertIn(("x_odoo_report_design_sample", "x_file"), field_names)
        self.assertIn(("x_odoo_report_design_sample", "x_file_name"), field_names)
        self.assertIn(("x_odoo_report_design_sample", "x_active"), field_names)
        form_arch = next(view.arch_db for view in designer.REPORT_DESIGNER_VIEW_BLUEPRINTS if view.view_type == "form")
        self.assertIn('<field name="x_sample_ids" nolabel="1" mode="list,form"', form_arch)
        self.assertIn('create="1" delete="1"', form_arch)
        self.assertIn('<field name="x_file" filename="x_file_name"', form_arch)
        self.assertIn('<field name="x_active"', form_arch)

    def test_jrxml_expressions_translate_to_a_safe_python_subset(self):
        ternary = designer.translate_jrxml_expression_to_python('$F{NumPosicion}!=null?$F{NumPosicion}:"-"')
        self.assertTrue(ternary["supported"], ternary)
        self.assertIn('field("NumPosicion")', ternary["python_source"])
        self.assertEqual(
            designer.evaluate_jrxml_python_expression(
                '$F{NumPosicion}!=null?$F{NumPosicion}:"-"',
                fields={"NumPosicion": "45844"},
            ),
            "45844",
        )
        self.assertEqual(
            designer.evaluate_jrxml_python_expression(
                '$F{NumPosicion}!=null?$F{NumPosicion}:"-"',
                fields={},
            ),
            "-",
        )
        self.assertEqual(
            designer.evaluate_jrxml_python_expression(
                '$F{idReceptor}.contains("802442")',
                fields={"idReceptor": "0000900301"},
            ),
            False,
        )
        self.assertEqual(
            designer.evaluate_jrxml_python_expression(
                '$F{serie}!=null?$F{serie}.toUpperCase():""',
                fields={"serie": "t"},
            ),
            "T",
        )
        self.assertEqual(
            designer.evaluate_jrxml_python_expression(
                'String.format(Locale.US,"%,.2f",$F{cantidad}.toDouble())',
                fields={"cantidad": "1"},
            ),
            "1.00",
        )
        self.assertEqual(
            designer.evaluate_jrxml_python_expression(
                '"~Pedido~OrderNo~".replaceAll("~(.+)~(.+)~",$F{es}?"\\\\$1":"\\\\$2")',
                fields={"es": True},
            ),
            "Pedido",
        )
        self.assertEqual(
            designer.evaluate_jrxml_python_expression("['MXN':'\\\\$ ','USD':'USD ']", fields={}),
            {"MXN": "$ ", "USD": "USD "},
        )
        self.assertEqual(
            designer.evaluate_jrxml_python_expression('new java.text.DecimalFormat("0000.00")', fields={}),
            {"type": "decimal_format", "pattern": "0000.00"},
        )

    def test_expression_index_includes_python_translation_without_executing(self):
        blueprint = designer.parse_jrxml_document(
            """
            <jasperReport name="sample" pageWidth="200" pageHeight="120" columnWidth="200">
                <field name="serie" class="java.lang.String"/>
                <detail><band height="20">
                    <textField><reportElement x="0" y="0" width="100" height="20"/><textFieldExpression>$F{serie}!=null?$F{serie}.toUpperCase():""</textFieldExpression></textField>
                </band></detail>
            </jasperReport>
            """,
            source_name="sample.jrxml",
        )
        expression_index = blueprint["expression_index"]
        self.assertEqual(expression_index["unsupported_policy"], "stored-not-executed")
        self.assertGreater(expression_index["count"], 0)
        self.assertIn('"target_language": "python"', designer.dumps_canonical_json(expression_index))
        self.assertIn(
            'to_upper(field("serie"))',
            expression_index["items"][0]["python"]["python_source"],
        )


if __name__ == "__main__":
    unittest.main()
