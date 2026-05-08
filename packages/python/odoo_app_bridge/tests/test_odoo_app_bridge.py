from __future__ import annotations

import tempfile
import unittest
import importlib.util
import sys
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

BridgeCommandSpec = bridge.BridgeCommandSpec
BridgeCronSpec = bridge.BridgeCronSpec
BridgeEventSpec = bridge.BridgeEventSpec
BridgeFunctionSpec = bridge.BridgeFunctionSpec
BridgeParamSpec = bridge.BridgeParamSpec
BridgeQuerySpec = bridge.BridgeQuerySpec
BridgeRoleSpec = bridge.BridgeRoleSpec
BridgeSecuritySpec = bridge.BridgeSecuritySpec
OdooAppBridgeSpec = bridge.OdooAppBridgeSpec
OdooAppSpec = bridge.OdooAppSpec
SecurityReleaseThresholds = bridge.SecurityReleaseThresholds
build_app_bridge_module_files = bridge.build_app_bridge_module_files
build_asyncapi_document = bridge.build_asyncapi_document
build_browser_client_js = bridge.build_browser_client_js
build_odoobase_blueprint = bridge.build_odoobase_blueprint
build_openapi_document = bridge.build_openapi_document
evaluate_app_bridge_security_release = bridge.evaluate_app_bridge_security_release
lint_app_bridge_spec = bridge.lint_app_bridge_spec
scan_app_bridge_security = bridge.scan_app_bridge_security
write_app_bridge_module = bridge.write_app_bridge_module
write_app_bridge_module_zip = bridge.write_app_bridge_module_zip


def sample_spec() -> OdooAppBridgeSpec:
    return OdooAppBridgeSpec(
        app=OdooAppSpec(
            name="Acme Public Desk",
            slug="acme-desk",
            module="x_acme_public_desk",
            summary="Public service desk with admin logs.",
        ),
        security=BridgeSecuritySpec(default_role="public", max_page_size=50, max_batch_ids=20),
        roles=(
            BridgeRoleSpec(name="public", auth="public"),
            BridgeRoleSpec(name="operator", auth="internal", required_groups=("base.group_user",)),
        ),
        queries=(
            BridgeQuerySpec(
                name="tickets",
                path="queries/tickets",
                model="res.partner",
                role="public",
                fields=("id", "name", "email"),
                response_map={"id": "id", "title": "name"},
                default_limit=5,
                max_limit=20,
                tags=("desk",),
            ),
        ),
        commands=(
            BridgeCommandSpec(
                name="activate_partners",
                path="commands/activate_partners",
                model="res.partner",
                method="write",
                role="operator",
                ids_required=True,
                max_ids=10,
                params=(BridgeParamSpec(name="active", type="bool", default=True),),
                idempotent=True,
                require_idempotency_key=True,
                tags=("desk",),
            ),
        ),
        functions=(
            BridgeFunctionSpec(
                name="quote",
                path="functions/quote",
                handler="quote",
                role="operator",
                params=(BridgeParamSpec(name="symbol", type="str", default="XAUUSD"),),
                idempotent=True,
                require_idempotency_key=True,
                tags=("desk",),
            ),
        ),
        crons=(
            BridgeCronSpec(
                name="nightly_digest",
                handler="nightly_digest",
                interval_number=1,
                interval_type="days",
                tags=("desk",),
            ),
        ),
        events=(
            BridgeEventSpec(
                name="ticket_created",
                direction="outbound",
                channel="events/ticket_created",
                cloudevent_type="acme.ticket.created.v1",
                fields=(BridgeParamSpec(name="id", type="int", required=True),),
                tags=("desk",),
            ),
        ),
    )


class OdooAppBridgeTest(unittest.TestCase):
    def test_rejects_non_base_dependencies_by_default(self) -> None:
        with self.assertRaises(ValueError):
            OdooAppSpec(
                name="Bad App",
                slug="bad",
                module="x_bad_app",
                summary="Bad dependency",
                depends=("base", "website"),
            )

    def test_builds_base_only_complete_module(self) -> None:
        files = {item.relative_path.as_posix(): item.content for item in build_app_bridge_module_files(sample_spec())}

        self.assertIn("x_acme_public_desk/__manifest__.py", files)
        self.assertIn("x_acme_public_desk/controllers/main.py", files)
        self.assertIn("x_acme_public_desk/services/bridge_runtime.py", files)
        self.assertIn("x_acme_public_desk/services/bridge_functions.py", files)
        self.assertIn("x_acme_public_desk/services/bridge_hooks.py", files)
        self.assertIn("x_acme_public_desk/models/bridge_app_user.py", files)
        self.assertIn("x_acme_public_desk/models/bridge_app_session.py", files)
        self.assertIn("x_acme_public_desk/models/bridge_auth_state.py", files)
        self.assertIn("x_acme_public_desk/models/bridge_auth_provider.py", files)
        self.assertIn("x_acme_public_desk/models/bridge_api_key.py", files)
        self.assertIn("x_acme_public_desk/models/bridge_cron.py", files)
        self.assertIn("x_acme_public_desk/models/bridge_external_auth.py", files)
        self.assertIn("x_acme_public_desk/models/bridge_log.py", files)
        self.assertIn("x_acme_public_desk/models/bridge_operation.py", files)
        self.assertIn("x_acme_public_desk/models/bridge_rate_limit.py", files)
        self.assertIn("x_acme_public_desk/models/bridge_security_finding.py", files)
        self.assertIn("x_acme_public_desk/models/bridge_security_gate.py", files)
        self.assertIn("x_acme_public_desk/models/bridge_security_wizard.py", files)
        self.assertIn("x_acme_public_desk/data/bridge_operation_data.xml", files)
        self.assertIn("x_acme_public_desk/data/bridge_cron_data.xml", files)
        self.assertIn("x_acme_public_desk/views/bridge_operation_views.xml", files)
        self.assertIn("x_acme_public_desk/views/bridge_app_user_views.xml", files)
        self.assertIn("x_acme_public_desk/views/bridge_auth_views.xml", files)
        self.assertIn("x_acme_public_desk/views/bridge_security_views.xml", files)
        self.assertIn("x_acme_public_desk/views/bridge_cron_views.xml", files)
        self.assertIn("x_acme_public_desk/static/src/js/bridge_client.js", files)
        self.assertIn("x_acme_public_desk/static/src/json/bridge_security_report.json", files)
        self.assertIn("x_acme_public_desk/static/src/html/login.html", files)
        self.assertIn("'depends': ['base']", files["x_acme_public_desk/__manifest__.py"])
        self.assertNotIn("website", files["x_acme_public_desk/__manifest__.py"])
        self.assertIn('@http.route([\'/apps/acme-desk\'', files["x_acme_public_desk/controllers/main.py"])
        self.assertIn("class BridgeRuntime", files["x_acme_public_desk/services/bridge_runtime.py"])
        self.assertIn("model_x_acme_public_desk_bridge_log", files["x_acme_public_desk/security/ir.model.access.csv"])
        self.assertIn("model_x_acme_public_desk_bridge_operation", files["x_acme_public_desk/security/ir.model.access.csv"])
        self.assertIn("model_x_acme_public_desk_app_user", files["x_acme_public_desk/security/ir.model.access.csv"])
        self.assertIn("model_x_acme_public_desk_app_session", files["x_acme_public_desk/security/ir.model.access.csv"])
        self.assertIn("model_x_acme_public_desk_auth_provider", files["x_acme_public_desk/security/ir.model.access.csv"])
        self.assertIn("model_x_acme_public_desk_auth_state", files["x_acme_public_desk/security/ir.model.access.csv"])
        self.assertIn("model_x_acme_public_desk_api_key", files["x_acme_public_desk/security/ir.model.access.csv"])
        self.assertIn("model_x_acme_public_desk_external_auth", files["x_acme_public_desk/security/ir.model.access.csv"])
        self.assertIn("model_x_acme_public_desk_rate_limit", files["x_acme_public_desk/security/ir.model.access.csv"])
        self.assertIn("model_x_acme_public_desk_bridge_security_finding", files["x_acme_public_desk/security/ir.model.access.csv"])
        self.assertIn("model_x_acme_public_desk_bridge_security_gate", files["x_acme_public_desk/security/ir.model.access.csv"])
        self.assertIn("model_x_acme_public_desk_bridge_security_wizard", files["x_acme_public_desk/security/ir.model.access.csv"])
        self.assertIn("bridge_operation_query_tickets", files["x_acme_public_desk/data/bridge_operation_data.xml"])
        self.assertIn("auth/login", files["x_acme_public_desk/data/bridge_operation_data.xml"])
        self.assertIn("readiness", files["x_acme_public_desk/data/bridge_operation_data.xml"])
        self.assertIn("metrics", files["x_acme_public_desk/data/bridge_operation_data.xml"])
        self.assertIn("security_report", files["x_acme_public_desk/data/bridge_operation_data.xml"])
        self.assertIn("auth/oauth2/providers", files["x_acme_public_desk/data/bridge_operation_data.xml"])
        self.assertIn("functions/quote", files["x_acme_public_desk/data/bridge_operation_data.xml"])
        self.assertIn("nightly_digest", files["x_acme_public_desk/data/bridge_cron_data.xml"])
        self.assertIn("Operation Catalog", files["x_acme_public_desk/views/bridge_operation_views.xml"])
        self.assertIn("App Users", files["x_acme_public_desk/views/bridge_app_user_views.xml"])
        self.assertIn("Auth Providers", files["x_acme_public_desk/views/bridge_auth_views.xml"])
        self.assertIn("Security Center", files["x_acme_public_desk/views/bridge_security_views.xml"])
        self.assertIn("action_refresh_findings", files["x_acme_public_desk/views/bridge_security_views.xml"])
        self.assertIn("x_severity", files["x_acme_public_desk/models/bridge_security_finding.py"])
        self.assertIn("x_recommendation", files["x_acme_public_desk/models/bridge_security_finding.py"])
        self.assertIn("x_owasp", files["x_acme_public_desk/models/bridge_security_finding.py"])
        self.assertIn("x_release_ready", files["x_acme_public_desk/models/bridge_security_gate.py"])
        self.assertIn("x_report_text", files["x_acme_public_desk/models/bridge_security_gate.py"])
        self.assertIn("SECURITY_FINDING_SEED", files["x_acme_public_desk/models/bridge_security_wizard.py"])
        self.assertIn("SECURITY_REPORT_SEED", files["x_acme_public_desk/models/bridge_security_wizard.py"])
        self.assertIn("BRIDGE_CONTRACT_EMBEDDED", files["x_acme_public_desk/models/bridge_security_wizard.py"])
        self.assertIn("Release Gate", files["x_acme_public_desk/views/bridge_security_views.xml"])
        self.assertIn('"release_ready": true', files["x_acme_public_desk/static/src/json/bridge_security_report.json"])

    def test_generated_runtime_enforces_base_security_controls(self) -> None:
        files = {item.relative_path.as_posix(): item.content for item in build_app_bridge_module_files(sample_spec())}
        controller = files["x_acme_public_desk/controllers/main.py"]
        runtime = files["x_acme_public_desk/services/bridge_runtime.py"]
        api_key_model = files["x_acme_public_desk/models/bridge_api_key.py"]
        rate_limit_model = files["x_acme_public_desk/models/bridge_rate_limit.py"]

        self.assertIn("allowed_cors_origins", controller)
        self.assertIn("payload_too_large", controller)
        self.assertIn("X-Content-Type-Options", controller)
        self.assertIn("X-Frame-Options", controller)
        self.assertIn("Referrer-Policy", controller)
        self.assertIn("Permissions-Policy", controller)
        self.assertIn("Content-Security-Policy", controller)
        self.assertIn("Strict-Transport-Security", controller)
        self.assertIn("X-Bridge-API-Key", controller)
        self.assertIn("API_KEY_MODEL", runtime)
        self.assertIn("RATE_LIMIT_MODEL", runtime)
        self.assertIn("_current_api_key", runtime)
        self.assertIn("_check_rate_limit", runtime)
        self.assertIn("rate_limit_exceeded", runtime)
        self.assertIn("_readiness_payload", runtime)
        self.assertIn("_metrics_payload", runtime)
        self.assertIn("security_report", runtime)
        self.assertIn("hash_key", api_key_model)
        self.assertIn("hmac.compare_digest", api_key_model)
        self.assertIn("def hit", rate_limit_model)

    def test_public_html_can_be_customized_without_controller_patching(self) -> None:
        files = {
            item.relative_path.as_posix(): item.content
            for item in build_app_bridge_module_files(sample_spec(), public_html="<main id='custom-app'></main>")
        }

        self.assertIn("<main id='custom-app'></main>", files["x_acme_public_desk/static/src/html/app.html"])
        self.assertIn("<main id='custom-app'></main>", files["x_acme_public_desk/controllers/main.py"])

    def test_documents_and_browser_client_include_operations(self) -> None:
        spec = sample_spec()
        openapi = build_openapi_document(spec)
        asyncapi = build_asyncapi_document(spec)
        client = build_browser_client_js(spec)

        self.assertEqual(openapi["openapi"], "3.1.0")
        self.assertIn("/queries/tickets", openapi["paths"])
        self.assertIn("/readiness", openapi["paths"])
        self.assertIn("/metrics", openapi["paths"])
        self.assertIn("/security_report", openapi["paths"])
        self.assertIn("/functions/quote", openapi["paths"])
        self.assertEqual(asyncapi["asyncapi"], "3.0.0")
        self.assertIn("ticket_created", asyncapi["channels"])
        self.assertIn("async tickets", client)
        self.assertIn("oauth2Providers", client)
        self.assertIn("readiness", client)
        self.assertIn("securityReport", client)
        self.assertIn("bridgeSecurityReport", client)
        self.assertIn("callFunction", client)
        self.assertIn("createSimulatorTransport", client)
        self.assertFalse(any(issue.severity == "error" for issue in lint_app_bridge_spec(spec)))

    def test_security_scanner_reports_owasp_findings_for_risky_contract(self) -> None:
        spec = OdooAppBridgeSpec(
            app=OdooAppSpec(
                name="Risk Desk",
                slug="risk-desk",
                module="x_risk_desk",
                summary="Risky public bridge.",
            ),
            security=BridgeSecuritySpec(
                default_role="public",
                deny_public_commands=False,
                force_csrf_for_session_commands=False,
                allowed_cors_origins=("*",),
                api_key_required=False,
                rate_limit_enabled=False,
                require_https=False,
                max_payload_bytes=5 * 1024 * 1024,
                oauth_allow_email_fallback=True,
                expose_provider_secrets=True,
                expose_static_provider_config=True,
            ),
            roles=(
                BridgeRoleSpec(name="public", auth="public"),
                BridgeRoleSpec(name="bot", auth="bot"),
            ),
            queries=(
                BridgeQuerySpec(
                    name="contacts",
                    path="queries/contacts",
                    model="res.partner",
                    role="public",
                    fields=("id", "name"),
                    use_sudo=True,
                ),
            ),
            commands=(
                BridgeCommandSpec(
                    name="delete_contacts",
                    path="commands/delete_contacts",
                    model="res.partner",
                    method="unlink",
                    role="public",
                    csrf_required=False,
                    risk_tags=("admin",),
                ),
            ),
            functions=(
                BridgeFunctionSpec(
                    name="admin_task",
                    path="functions/admin_task",
                    handler="admin_task",
                    role="public",
                    csrf_required=False,
                    risk_tags=("identity",),
                ),
            ),
        )

        findings = scan_app_bridge_security(spec)
        codes = {finding.code for finding in findings}

        self.assertIn("OAB-SEC-001", codes)
        self.assertIn("OAB-SEC-009", codes)
        self.assertIn("OAB-SEC-101", codes)
        self.assertIn("OAB-SEC-201", codes)
        self.assertIn("OAB-SEC-301", codes)
        self.assertTrue(all(finding.owasp.startswith("OWASP API") for finding in findings))
        self.assertTrue(all(finding.recommendation for finding in findings))

    def test_security_scanner_allows_hardened_sample(self) -> None:
        self.assertEqual(scan_app_bridge_security(sample_spec()), ())

    def test_security_release_gate_passes_hardened_sample(self) -> None:
        spec = sample_spec()
        report = evaluate_app_bridge_security_release(spec)

        self.assertTrue(report.passed)
        self.assertEqual(report.score, 100)
        self.assertEqual(report.blocking_findings, ())
        self.assertEqual(report.as_dict()["contract_digest"], spec.contract_digest())
        self.assertEqual(report.as_json(), report.as_json())

    def test_security_release_gate_blocks_risky_contract(self) -> None:
        spec = OdooAppBridgeSpec(
            app=OdooAppSpec(
                name="Risk Desk",
                slug="risk-desk",
                module="x_risk_desk",
                summary="Risky public bridge.",
            ),
            security=BridgeSecuritySpec(
                default_role="public",
                deny_public_commands=False,
                force_csrf_for_session_commands=False,
                allowed_cors_origins=("*",),
                api_key_required=False,
                rate_limit_enabled=False,
                require_https=False,
                max_payload_bytes=5 * 1024 * 1024,
            ),
            roles=(
                BridgeRoleSpec(name="public", auth="public"),
            ),
            commands=(
                BridgeCommandSpec(
                    name="delete_contacts",
                    path="commands/delete_contacts",
                    model="res.partner",
                    method="unlink",
                    role="public",
                    csrf_required=False,
                    risk_tags=("admin",),
                ),
            ),
        )

        report = evaluate_app_bridge_security_release(spec)

        self.assertFalse(report.passed)
        self.assertLess(report.score, 90)
        self.assertTrue(report.blocking_findings)
        self.assertIn("blocking severity findings are present", report.failure_reasons)

    def test_security_release_gate_honors_custom_thresholds(self) -> None:
        thresholds = SecurityReleaseThresholds(min_score=100, block_severities=("critical",))
        report = evaluate_app_bridge_security_release(sample_spec(), thresholds)

        self.assertTrue(report.passed)
        self.assertEqual(report.thresholds.min_score, 100)

    def test_odoobase_blueprint_maps_generated_and_next_goodies(self) -> None:
        blueprint = build_odoobase_blueprint(sample_spec())
        mapping = blueprint.to_mapping()

        self.assertEqual(mapping["module"], "x_acme_public_desk")
        self.assertIn("app-local auth controller routes", mapping["generated_layers"])
        self.assertEqual(blueprint.goodie_by_key("app_local_auth").status, "generated")
        self.assertEqual(blueprint.goodie_by_key("external_auth_links").status, "generated")
        self.assertIn("function_routes", {item["key"] for item in mapping["goodies"]})

    def test_write_module_and_zip(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            written = write_app_bridge_module(root, sample_spec())
            self.assertTrue((root / "x_acme_public_desk" / "__manifest__.py").is_file())
            self.assertGreater(len(written), 10)
            with self.assertRaises(FileExistsError):
                write_app_bridge_module(root, sample_spec())
            zip_path = write_app_bridge_module_zip(root, sample_spec(), overwrite=True)
            self.assertTrue(zip_path.is_file())


if __name__ == "__main__":
    unittest.main()
