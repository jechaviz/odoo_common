"""Canonical Odoo app bridge package."""

from .client_assets import (
    build_asyncapi_json_text,
    build_browser_client_js,
    build_contract_json_text,
    build_contract_js_text,
    build_login_html,
    build_openapi_json_text,
    build_public_app_css,
    build_public_app_html,
)
from .contracts import (
    BridgeCommandSpec,
    BridgeCronSpec,
    BridgeEventSpec,
    BridgeFilterSpec,
    BridgeFunctionSpec,
    BridgeParamSpec,
    BridgeQuerySpec,
    BridgeRoleSpec,
    BridgeSecuritySpec,
    OdooAppBridgeSpec,
    OdooAppSpec,
    app_bridge_spec_from_mapping,
    load_app_bridge_spec,
    validate_app_bridge_spec,
)
from .documents import build_asyncapi_document, build_openapi_document, json_schema_for_type, schema_for_params
from .lint import BridgeLintIssue, lint_app_bridge_spec
from .module_builder import (
    AppBridgeModuleFile,
    build_app_bridge_module_files,
    write_app_bridge_module,
    write_app_bridge_module_zip,
)
from .odoobase import OdooBaseBlueprint, OdooBaseGoodie, build_odoobase_blueprint
from .security_scanner import (
    SecurityReleaseGateReport,
    SecurityReleaseThresholds,
    SecurityScanFinding,
    evaluate_app_bridge_security_release,
    scan_app_bridge_security,
)


__all__ = [
    "AppBridgeModuleFile",
    "BridgeLintIssue",
    "BridgeCommandSpec",
    "BridgeCronSpec",
    "BridgeEventSpec",
    "BridgeFilterSpec",
    "BridgeFunctionSpec",
    "BridgeParamSpec",
    "BridgeQuerySpec",
    "BridgeRoleSpec",
    "BridgeSecuritySpec",
    "OdooBaseBlueprint",
    "OdooBaseGoodie",
    "OdooAppBridgeSpec",
    "OdooAppSpec",
    "SecurityReleaseGateReport",
    "SecurityReleaseThresholds",
    "SecurityScanFinding",
    "app_bridge_spec_from_mapping",
    "build_app_bridge_module_files",
    "build_asyncapi_document",
    "build_asyncapi_json_text",
    "build_browser_client_js",
    "build_contract_json_text",
    "build_contract_js_text",
    "build_odoobase_blueprint",
    "build_login_html",
    "build_openapi_document",
    "build_openapi_json_text",
    "build_public_app_css",
    "build_public_app_html",
    "evaluate_app_bridge_security_release",
    "json_schema_for_type",
    "lint_app_bridge_spec",
    "load_app_bridge_spec",
    "schema_for_params",
    "scan_app_bridge_security",
    "validate_app_bridge_spec",
    "write_app_bridge_module",
    "write_app_bridge_module_zip",
]
