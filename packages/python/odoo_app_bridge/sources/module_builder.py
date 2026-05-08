"""Generate complete Odoo addons from app bridge contracts."""

from __future__ import annotations

from dataclasses import dataclass
import json
from pathlib import Path, PurePosixPath
from pprint import pformat
import textwrap
import zipfile
from typing import Any, Iterable, Mapping

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
from .contracts import OdooAppBridgeSpec, app_bridge_spec_from_mapping, load_app_bridge_spec
from .documents import build_asyncapi_document, build_openapi_document
from .security_scanner import evaluate_app_bridge_security_release, scan_app_bridge_security


@dataclass(frozen=True)
class AppBridgeModuleFile:
    """One generated addon file."""

    relative_path: Path
    content: str
    layer: str

    def __post_init__(self) -> None:
        object.__setattr__(self, "relative_path", _normalize_relative_path(self.relative_path))
        object.__setattr__(self, "layer", str(self.layer or "").strip() or "root")


def build_app_bridge_module_files(
    spec: OdooAppBridgeSpec | Mapping[str, Any],
    *,
    public_html: str | None = None,
    login_html: str | None = None,
    extra_files: Iterable[AppBridgeModuleFile | Mapping[str, Any]] = (),
) -> tuple[AppBridgeModuleFile, ...]:
    """Return all files for a base-only Odoo app module.

    The generated addon owns its controller, public shell, admin log model,
    service runtime, static client assets and contract documents. It does not
    depend on `website`, `sale`, `purchase`, or any other vertical Odoo module.
    """
    bridge_spec = spec if isinstance(spec, OdooAppBridgeSpec) else app_bridge_spec_from_mapping(spec)
    module_root = Path(bridge_spec.app.module)
    base_prefix = f"/{bridge_spec.app.public_prefix}/{bridge_spec.app.slug}"
    resolved_public_html = _ensure_newline(public_html) if public_html is not None else build_public_app_html(
        bridge_spec,
        base_prefix=base_prefix,
    )
    resolved_login_html = _ensure_newline(login_html) if login_html is not None else build_login_html(
        bridge_spec,
        base_prefix=base_prefix,
    )
    files = [
        AppBridgeModuleFile(module_root / "__init__.py", _render_root_init(), "root"),
        AppBridgeModuleFile(module_root / "__manifest__.py", _render_manifest(bridge_spec), "root"),
        AppBridgeModuleFile(module_root / "README.md", _render_readme(bridge_spec), "docs"),
        AppBridgeModuleFile(module_root / "controllers" / "__init__.py", "from . import main\n", "controllers"),
        AppBridgeModuleFile(
            module_root / "controllers" / "main.py",
            _render_controller(bridge_spec, public_html=resolved_public_html, login_html=resolved_login_html),
            "controllers",
        ),
        AppBridgeModuleFile(
            module_root / "services" / "__init__.py",
            "from .bridge_runtime import BridgeRuntime\nfrom .bridge_hooks import BridgeHooks\n",
            "services",
        ),
        AppBridgeModuleFile(module_root / "services" / "bridge_functions.py", _render_function_handlers(bridge_spec), "services"),
        AppBridgeModuleFile(module_root / "services" / "bridge_hooks.py", _render_hooks(bridge_spec), "services"),
        AppBridgeModuleFile(module_root / "services" / "bridge_runtime.py", _render_service_runtime(bridge_spec), "services"),
        AppBridgeModuleFile(
            module_root / "models" / "__init__.py",
            (
                "from . import bridge_app_session\n"
                "from . import bridge_app_user\n"
                "from . import bridge_auth_state\n"
                "from . import bridge_auth_provider\n"
                "from . import bridge_api_key\n"
                "from . import bridge_cron\n"
                "from . import bridge_external_auth\n"
                "from . import bridge_log\n"
                "from . import bridge_operation\n"
                "from . import bridge_rate_limit\n"
                "from . import bridge_security_gate\n"
                "from . import bridge_security_finding\n"
                "from . import bridge_security_wizard\n"
            ),
            "models",
        ),
        AppBridgeModuleFile(
            module_root / "models" / "bridge_app_user.py",
            _render_app_user_model(bridge_spec),
            "models",
        ),
        AppBridgeModuleFile(
            module_root / "models" / "bridge_app_session.py",
            _render_app_session_model(bridge_spec),
            "models",
        ),
        AppBridgeModuleFile(
            module_root / "models" / "bridge_auth_provider.py",
            _render_auth_provider_model(bridge_spec),
            "models",
        ),
        AppBridgeModuleFile(
            module_root / "models" / "bridge_auth_state.py",
            _render_auth_state_model(bridge_spec),
            "models",
        ),
        AppBridgeModuleFile(
            module_root / "models" / "bridge_api_key.py",
            _render_api_key_model(bridge_spec),
            "models",
        ),
        AppBridgeModuleFile(module_root / "models" / "bridge_cron.py", _render_cron_model(bridge_spec), "models"),
        AppBridgeModuleFile(
            module_root / "models" / "bridge_external_auth.py",
            _render_external_auth_model(bridge_spec),
            "models",
        ),
        AppBridgeModuleFile(module_root / "models" / "bridge_log.py", _render_log_model(bridge_spec), "models"),
        AppBridgeModuleFile(
            module_root / "models" / "bridge_operation.py",
            _render_operation_model(bridge_spec),
            "models",
        ),
        AppBridgeModuleFile(
            module_root / "models" / "bridge_rate_limit.py",
            _render_rate_limit_model(bridge_spec),
            "models",
        ),
        AppBridgeModuleFile(
            module_root / "models" / "bridge_security_finding.py",
            _render_security_finding_model(bridge_spec),
            "models",
        ),
        AppBridgeModuleFile(
            module_root / "models" / "bridge_security_gate.py",
            _render_security_gate_model(bridge_spec),
            "models",
        ),
        AppBridgeModuleFile(
            module_root / "models" / "bridge_security_wizard.py",
            _render_security_wizard_model(bridge_spec),
            "models",
        ),
        AppBridgeModuleFile(module_root / "security" / "ir.model.access.csv", _render_security_csv(bridge_spec), "security"),
        AppBridgeModuleFile(
            module_root / "data" / "bridge_operation_data.xml",
            _render_operation_data_xml(bridge_spec),
            "data",
        ),
        AppBridgeModuleFile(module_root / "data" / "bridge_cron_data.xml", _render_cron_data_xml(bridge_spec), "data"),
        AppBridgeModuleFile(
            module_root / "views" / "bridge_operation_views.xml",
            _render_operation_views_xml(bridge_spec),
            "views",
        ),
        AppBridgeModuleFile(
            module_root / "views" / "bridge_app_user_views.xml",
            _render_app_user_views_xml(bridge_spec),
            "views",
        ),
        AppBridgeModuleFile(
            module_root / "views" / "bridge_auth_views.xml",
            _render_auth_views_xml(bridge_spec),
            "views",
        ),
        AppBridgeModuleFile(
            module_root / "views" / "bridge_security_views.xml",
            _render_security_views_xml(bridge_spec),
            "views",
        ),
        AppBridgeModuleFile(module_root / "views" / "bridge_cron_views.xml", _render_cron_views_xml(bridge_spec), "views"),
        AppBridgeModuleFile(module_root / "views" / "bridge_log_views.xml", _render_views_xml(bridge_spec), "views"),
        AppBridgeModuleFile(
            module_root / "static" / "src" / "js" / "bridge_client.js",
            build_browser_client_js(bridge_spec, base_prefix=base_prefix),
            "static",
        ),
        AppBridgeModuleFile(
            module_root / "static" / "src" / "js" / "bridge_contract.js",
            build_contract_js_text(bridge_spec),
            "static",
        ),
        AppBridgeModuleFile(
            module_root / "static" / "src" / "json" / "bridge_contract.json",
            build_contract_json_text(bridge_spec),
            "static",
        ),
        AppBridgeModuleFile(
            module_root / "static" / "src" / "json" / "bridge_openapi.json",
            build_openapi_json_text(bridge_spec),
            "static",
        ),
        AppBridgeModuleFile(
            module_root / "static" / "src" / "json" / "bridge_asyncapi.json",
            build_asyncapi_json_text(bridge_spec),
            "static",
        ),
        AppBridgeModuleFile(
            module_root / "static" / "src" / "json" / "bridge_security_report.json",
            json.dumps(_security_report_seed(bridge_spec), indent=2, sort_keys=True) + "\n",
            "static",
        ),
        AppBridgeModuleFile(
            module_root / "static" / "src" / "html" / "app.html",
            resolved_public_html,
            "static",
        ),
        AppBridgeModuleFile(
            module_root / "static" / "src" / "html" / "login.html",
            resolved_login_html,
            "static",
        ),
        AppBridgeModuleFile(module_root / "static" / "src" / "css" / "app.css", build_public_app_css(), "static"),
        AppBridgeModuleFile(module_root / "tests" / "__init__.py", "", "tests"),
        AppBridgeModuleFile(module_root / "tests" / f"test_{bridge_spec.app.module}.py", _render_odoo_test(bridge_spec), "tests"),
    ]
    files.extend(_coerce_extra_module_files(extra_files))
    _reject_duplicate_paths(files)
    return tuple(files)


def write_app_bridge_module(
    target_root: str | Path,
    spec: OdooAppBridgeSpec | Mapping[str, Any],
    *,
    extra_files: Iterable[AppBridgeModuleFile | Mapping[str, Any]] = (),
    overwrite: bool = False,
) -> tuple[Path, ...]:
    """Write generated addon files below target_root."""
    root = Path(target_root)
    written: list[Path] = []
    for file in build_app_bridge_module_files(spec, extra_files=extra_files):
        target = root / file.relative_path
        if target.exists() and not overwrite:
            raise FileExistsError(f"App bridge target already exists: {target}")
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(_ensure_newline(file.content), encoding="utf-8")
        written.append(target)
    return tuple(written)


def write_app_bridge_module_zip(
    target_root: str | Path,
    spec: OdooAppBridgeSpec | Mapping[str, Any] | str | Path,
    *,
    extra_files: Iterable[AppBridgeModuleFile | Mapping[str, Any]] = (),
    overwrite: bool = False,
) -> Path:
    """Write the addon and package it as an importable zip."""
    if isinstance(spec, (str, Path)):
        bridge_spec = load_app_bridge_spec(spec)
    else:
        bridge_spec = spec if isinstance(spec, OdooAppBridgeSpec) else app_bridge_spec_from_mapping(spec)
    root = Path(target_root)
    write_app_bridge_module(root, bridge_spec, extra_files=extra_files, overwrite=overwrite)
    zip_path = root / f"{bridge_spec.app.module}.zip"
    if zip_path.exists() and not overwrite:
        raise FileExistsError(f"App bridge zip already exists: {zip_path}")
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        module_root = root / bridge_spec.app.module
        for path in sorted(module_root.rglob("*")):
            if path.is_file():
                archive.write(path, arcname=str(path.relative_to(root)).replace("\\", "/"))
    return zip_path


def _render_root_init() -> str:
    return "from . import controllers\nfrom . import models\nfrom . import services\n"


def _render_manifest(spec: OdooAppBridgeSpec) -> str:
    manifest = {
        "name": spec.app.name,
        "version": spec.app.version,
        "category": "Customizations",
        "summary": spec.app.summary,
        "description": spec.app.description,
        "depends": list(spec.app.depends),
        "data": [
            "security/ir.model.access.csv",
            "data/bridge_operation_data.xml",
            "data/bridge_cron_data.xml",
            "views/bridge_operation_views.xml",
            "views/bridge_app_user_views.xml",
            "views/bridge_auth_views.xml",
            "views/bridge_security_views.xml",
            "views/bridge_cron_views.xml",
            "views/bridge_log_views.xml",
        ],
        "license": spec.app.license,
        "installable": True,
        "application": spec.app.application,
    }
    if not manifest["description"]:
        manifest.pop("description")
    return pformat(manifest, sort_dicts=False, width=120)


def _render_readme(spec: OdooAppBridgeSpec) -> str:
    return textwrap.dedent(
        f"""
        # {spec.app.name}

        {spec.app.summary}

        ## Architecture

        This addon is generated by `odoo-app-bridge` as a complete base-only Odoo app.

        - `controllers`: public HTTP transport and static public shell.
        - `services`: contract runtime, validation, role checks and Odoo IO orchestration.
        - `models`: app-local users, sessions, social auth links, operation catalog and request log.
        - `views` and `security`: backend admin surface.
        - `static`: browser client, public page, OpenAPI, AsyncAPI and contract snapshots.

        Public entrypoint: `/{spec.app.public_prefix}/{spec.app.slug}`
        API prefix: `/{spec.app.public_prefix}/{spec.app.slug}/<operation>`
        Contract digest: `{spec.contract_digest()}`

        ## Admin Surface

        - Operation Catalog: generated immutable inventory for queries, commands, events and meta endpoints.
        - App Users: local users that exist only for this mounted app, independent from the global Odoo login.
        - App Sessions: revocable app-local login sessions stored as hashed tokens.
        - Release Gate: generated security score, blocking findings and archived evidence for the contract digest.
        - Readiness and Metrics: operational meta endpoints for promotion, CI and lightweight monitoring.
        - Request Logs: append-only execution trail for API calls and idempotency replay checks.

        The operation catalog is data, not code. It lets admins inspect routes, roles, models, risk tags and the public URL
        without reading generated Python.
        """
    ).strip() + "\n"


def _render_function_handlers(spec: OdooAppBridgeSpec) -> str:
    handlers = sorted({item.handler for item in spec.functions} | {item.handler for item in spec.crons})
    defs = []
    registry_items = []
    for handler in handlers:
        symbol = _handler_symbol(handler)
        defs.append(
            textwrap.dedent(
                f'''
                def {symbol}(context):
                    """Generated handler placeholder for {handler}."""
                    return {{
                        "handled": True,
                        "handler": {handler!r},
                        "params": context.get("params") or {{}},
                        "context": context.get("context") or {{}},
                    }}
                '''
            ).strip()
        )
        registry_items.append(f"    {handler!r}: {symbol},")
    body = "\n\n".join(defs)
    registry = "\n".join(registry_items)
    chunks = [
        f'"""Function and cron handlers for {spec.app.module}."""',
        "from __future__ import annotations",
    ]
    if body:
        chunks.append(body)
    chunks.append("FUNCTION_HANDLERS = {\n" + registry + "\n}")
    return "\n\n\n".join(chunks).strip() + "\n"


def _render_hooks(spec: OdooAppBridgeSpec) -> str:
    return textwrap.dedent(
        f'''
        """Typed hook surface for {spec.app.module}.

        Hook methods may mutate and return the context dict. To stop a request,
        return {{"deny": True, "error": "code", "status": 403, "details": []}}.
        To replace a successful response, return {{"replace": True, "data": ...}}.
        """

        from __future__ import annotations


        class BridgeHooks:
            def __init__(self, env):
                self.env = env

            def before_login(self, context):
                return context

            def after_login(self, context):
                return context

            def before_oauth_link(self, context):
                return context

            def after_oauth_link(self, context):
                return context

            def before_query(self, context):
                return context

            def after_query(self, context):
                return context

            def before_command(self, context):
                return context

            def after_command(self, context):
                return context

            def before_function(self, context):
                return context

            def after_function(self, context):
                return context

            def before_cron(self, context):
                return context

            def after_cron(self, context):
                return context
        '''
    ).strip() + "\n"


def _render_controller(spec: OdooAppBridgeSpec, *, public_html: str | None = None, login_html: str | None = None) -> str:
    public_base = f"/{spec.app.public_prefix}/{spec.app.slug}".replace("//", "/")
    resolved_public_html = _ensure_newline(public_html) if public_html is not None else build_public_app_html(
        spec,
        base_prefix=public_base,
    )
    resolved_login_html = _ensure_newline(login_html) if login_html is not None else build_login_html(
        spec,
        base_prefix=public_base,
    )
    return textwrap.dedent(
        f'''
        """Public HTTP controller for {spec.app.module}."""

        from __future__ import annotations

        import json

        from odoo import http
        from odoo.http import request

        from ..services.bridge_runtime import BRIDGE_DIGEST, CONTRACT, SESSION_COOKIE_NAME, BridgeRuntime


        PUBLIC_HTML = {resolved_public_html!r}
        LOGIN_HTML = {resolved_login_html!r}


        class OdooAppBridgeController(http.Controller):
            @http.route({[public_base, public_base + "/"]!r}, type="http", auth="public", methods=["GET"], csrf=False)
            def app_bridge_public_app(self, **_params):
                return request.make_response(
                    PUBLIC_HTML,
                    headers=[
                        ("Content-Type", "text/html; charset=utf-8"),
                    ] + self._response_headers(content_type=False),
                )

            @http.route({[public_base + "/login", public_base + "/login/"]!r}, type="http", auth="public", methods=["GET"], csrf=False)
            def app_bridge_login(self, **_params):
                return request.make_response(
                    LOGIN_HTML,
                    headers=[
                        ("Content-Type", "text/html; charset=utf-8"),
                    ] + self._response_headers(content_type=False),
                )

            @http.route({[public_base + "/<path:bridge_path>"]!r}, type="http", auth="public", methods=["GET", "POST", "OPTIONS"], csrf=False)
            def app_bridge_dispatch(self, bridge_path=None, **params):
                origin = request.httprequest.headers.get("Origin") or ""
                if origin and not self._origin_allowed(origin):
                    return request.make_json_response(
                        {{"ok": False, "error": "cors_origin_forbidden", "details": [], "meta": {{"digest": BRIDGE_DIGEST}}}},
                        headers=self._response_headers(origin=origin),
                        status=403,
                    )
                if request.httprequest.method == "OPTIONS":
                    return request.make_response("", headers=self._response_headers(origin=origin))
                try:
                    payload = self._read_payload(params)
                except ValueError as exc:
                    return request.make_json_response(
                        {{"ok": False, "error": str(exc), "details": [], "meta": {{"digest": BRIDGE_DIGEST}}}},
                        headers=self._response_headers(origin=origin),
                        status=413 if str(exc) == "payload_too_large" else 400,
                    )
                csrf_value = request.httprequest.headers.get("X-Bridge-CSRF") or payload.get("csrf_token")
                csrf_valid = True
                if csrf_value:
                    csrf_valid = bool(request.validate_csrf(csrf_value))
                runtime = BridgeRuntime(request.env)
                status, envelope = runtime.dispatch(
                    str(bridge_path or "").strip("/"),
                    payload=payload,
                    headers=dict(request.httprequest.headers),
                    method=request.httprequest.method,
                    user=request.env.user,
                    csrf_token=request.csrf_token(),
                    csrf_valid=csrf_valid,
                    cookies=dict(request.httprequest.cookies),
                    remote_addr=request.httprequest.remote_addr or "",
                    user_agent=request.httprequest.headers.get("User-Agent", ""),
                )
                cookie_value = envelope.get("meta", {{}}).pop("set_cookie", None)
                clear_cookie = envelope.get("meta", {{}}).pop("clear_cookie", False)
                response = request.make_json_response(envelope, headers=self._response_headers(origin=origin), status=status)
                if cookie_value:
                    response.set_cookie(
                        SESSION_COOKIE_NAME,
                        cookie_value,
                        max_age=int(runtime.security.get("app_session_ttl_hours", 12)) * 3600,
                        httponly=True,
                        samesite="Lax",
                        secure=bool(request.httprequest.is_secure),
                    )
                if clear_cookie:
                    response.delete_cookie(SESSION_COOKIE_NAME)
                return response

            def _read_payload(self, params):
                raw_payload = {{}}
                if request.httprequest.method == "POST":
                    max_bytes = int(CONTRACT["security"].get("max_payload_bytes") or 1048576)
                    content_length = request.httprequest.content_length
                    if content_length is not None and int(content_length) > max_bytes:
                        raise ValueError("payload_too_large")
                    body = request.httprequest.get_data(as_text=True) or ""
                    if len(body.encode("utf-8")) > max_bytes:
                        raise ValueError("payload_too_large")
                    if body.strip():
                        try:
                            raw_payload = json.loads(body)
                        except Exception:
                            raise ValueError("invalid_json")
                if not isinstance(raw_payload, dict):
                    raw_payload = {{}}
                if params:
                    raw_payload.update(params)
                return raw_payload

            def _origin_allowed(self, origin):
                allowed = list(CONTRACT["security"].get("allowed_cors_origins") or [])
                return bool(origin and ("*" in allowed or origin in allowed))

            def _response_headers(self, origin="", content_type=True):
                headers = [
                    ("Cache-Control", "no-store"),
                    ("X-Bridge-Contract-Digest", BRIDGE_DIGEST),
                    ("X-Content-Type-Options", "nosniff"),
                    ("X-Frame-Options", "DENY"),
                    ("Referrer-Policy", "no-referrer"),
                    ("Permissions-Policy", "geolocation=(), microphone=(), camera=()"),
                    ("Content-Security-Policy", "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"),
                    ("Access-Control-Allow-Headers", "Content-Type, X-Bridge-CSRF, X-Bridge-API-Key, Idempotency-Key"),
                    ("Access-Control-Allow-Methods", "GET, POST, OPTIONS"),
                ]
                if content_type:
                    headers.append(("Content-Type", "application/json; charset=utf-8"))
                if request.httprequest.is_secure and CONTRACT["security"].get("require_https"):
                    headers.append(("Strict-Transport-Security", "max-age=31536000; includeSubDomains"))
                if origin and self._origin_allowed(origin):
                    allowed = list(CONTRACT["security"].get("allowed_cors_origins") or [])
                    headers.append(("Access-Control-Allow-Origin", "*" if "*" in allowed else origin))
                    headers.append(("Vary", "Origin"))
                    if "*" not in allowed:
                        headers.append(("Access-Control-Allow-Credentials", "true"))
                return headers
        '''
    ).strip() + "\n"


def _render_service_runtime(spec: OdooAppBridgeSpec) -> str:
    contract_data = spec.to_contract()
    contract_data["_openapi"] = build_openapi_document(spec)
    contract_data["_asyncapi"] = build_asyncapi_document(spec)
    contract_data["_security_report"] = _security_report_seed(spec)
    contract = repr(contract_data)
    log_model = _log_model_name(spec)
    app_user_model = _app_user_model_name(spec)
    app_session_model = _app_session_model_name(spec)
    api_key_model = _api_key_model_name(spec)
    rate_limit_model = _rate_limit_model_name(spec)
    auth_provider_model = _auth_provider_model_name(spec)
    auth_state_model = _auth_state_model_name(spec)
    external_auth_model = _external_auth_model_name(spec)
    return textwrap.dedent(
        f'''
        """Contract runtime for {spec.app.module}.

        Controllers own HTTP. This service owns validation, role checks and Odoo IO.
        """

        from __future__ import annotations

        import base64
        import datetime
        import hashlib
        import json
        import secrets
        import time
        import urllib.parse
        import urllib.request

        from .bridge_functions import FUNCTION_HANDLERS
        from .bridge_hooks import BridgeHooks


        CONTRACT = {contract}
        BRIDGE_DIGEST = {spec.contract_digest()!r}
        LOG_MODEL = {log_model!r}
        APP_USER_MODEL = {app_user_model!r}
        APP_SESSION_MODEL = {app_session_model!r}
        API_KEY_MODEL = {api_key_model!r}
        RATE_LIMIT_MODEL = {rate_limit_model!r}
        AUTH_PROVIDER_MODEL = {auth_provider_model!r}
        AUTH_STATE_MODEL = {auth_state_model!r}
        EXTERNAL_AUTH_MODEL = {external_auth_model!r}
        SESSION_COOKIE_NAME = CONTRACT["security"].get("app_session_cookie_name") or "oab_session"


        class BridgeRuntime:
            def __init__(self, env):
                self.env = env
                self.security = CONTRACT["security"]
                self.roles = {{item["name"]: item for item in CONTRACT.get("roles", [])}}
                self.queries = {{item["path"]: item for item in CONTRACT.get("queries", [])}}
                self.commands = {{item["path"]: item for item in CONTRACT.get("commands", [])}}
                self.functions = {{item["path"]: item for item in CONTRACT.get("functions", [])}}
                self.crons = {{item["name"]: item for item in CONTRACT.get("crons", [])}}
                self.hooks = BridgeHooks(env)

            def dispatch(self, path, *, payload, headers, method, user, csrf_token, csrf_valid, remote_addr, cookies=None, user_agent=""):
                request_id = self._request_id()
                cookies = cookies or {{}}
                app_session = self._current_app_session(cookies, headers)
                app_user = app_session.x_user_id if app_session else None
                api_key = self._current_api_key(headers)
                rate_ok, rate_retry_after = self._check_rate_limit(path, remote_addr, app_user, api_key)
                if not rate_ok:
                    return self._error("rate_limit_exceeded", 429, details=["retry_after:" + str(rate_retry_after)], request_id=request_id)
                if path == "health":
                    return self._ok(self._health_payload(), request_id=request_id)
                if path == "readiness":
                    return self._meta(self._readiness_payload(), user, api_key, request_id)
                if path == "metrics":
                    return self._meta(self._metrics_payload(), user, api_key, request_id)
                if path == "security_report":
                    return self._meta(CONTRACT.get("_security_report", {{}}), user, api_key, request_id)
                if path == "csrf":
                    return self._ok({{"csrf_token": csrf_token}}, request_id=request_id)
                if path == "auth/login":
                    return self._login(payload, request_id, remote_addr, user_agent)
                if path == "auth/logout":
                    return self._logout(app_session, request_id)
                if path == "auth/me":
                    return self._me(app_user, request_id)
                if path == "auth/oauth2/providers":
                    return self._oauth2_providers(request_id)
                if path == "auth/oauth2/start":
                    return self._oauth2_start(payload, app_user, request_id, remote_addr, user_agent, link_current_user=False)
                if path == "auth/oauth2/link":
                    return self._oauth2_start(payload, app_user, request_id, remote_addr, user_agent, link_current_user=True)
                if path == "auth/oauth2/callback":
                    return self._oauth2_callback(payload, request_id, remote_addr, user_agent)
                if path == "auth/oauth2/unlink":
                    return self._oauth2_unlink(payload, app_user, request_id)
                if path == "contract" and self.security.get("expose_contract_endpoint"):
                    return self._meta(CONTRACT, user, api_key, request_id)
                if path == "openapi" and self.security.get("expose_openapi_endpoint"):
                    return self._meta(CONTRACT.get("_openapi", {{}}), user, api_key, request_id)
                if path == "asyncapi" and self.security.get("expose_asyncapi_endpoint"):
                    return self._meta(CONTRACT.get("_asyncapi", {{}}), user, api_key, request_id)
                if path in self.queries:
                    return self._run_query(self.queries[path], payload, method, user, app_user, api_key, request_id, remote_addr)
                if path in self.commands:
                    return self._run_command(self.commands[path], payload, headers, method, user, app_user, api_key, csrf_valid, request_id, remote_addr)
                if path in self.functions:
                    return self._run_function(self.functions[path], payload, headers, method, user, app_user, api_key, csrf_valid, request_id, remote_addr)
                return self._error("unknown_path", 404, request_id=request_id)

            def _login(self, payload, request_id, remote_addr, user_agent):
                if not self.security.get("enable_app_login"):
                    return self._error("app_login_disabled", 404, request_id=request_id)
                login = str(payload.get("login") or payload.get("email") or "").strip().lower()
                password = str(payload.get("password") or "")
                if not login or not password:
                    return self._error("invalid_login", 400, details=["login_and_password_required"], request_id=request_id)
                app_user = self.env[APP_USER_MODEL].sudo().search([("x_login", "=", login), ("x_active", "=", True)], limit=1)
                if not app_user or not app_user.check_password(password):
                    return self._error("invalid_login", 401, request_id=request_id)
                raw_token, session = self.env[APP_SESSION_MODEL].sudo().create_for_user(
                    app_user,
                    ttl_hours=int(self.security.get("app_session_ttl_hours") or 12),
                    remote_addr=remote_addr,
                    user_agent=user_agent,
                )
                app_user.sudo().write({{"x_last_login_at": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")}})
                status, envelope = self._ok(self._app_user_payload(app_user), request_id=request_id, meta={{"type": "auth", "name": "login", "set_cookie": raw_token}})
                return status, envelope

            def _logout(self, app_session, request_id):
                if app_session:
                    app_session.sudo().write({{"x_revoked": True}})
                return self._ok({{"logged_out": True}}, request_id=request_id, meta={{"type": "auth", "name": "logout", "clear_cookie": True}})

            def _me(self, app_user, request_id):
                if not app_user:
                    return self._error("app_login_required", 401, request_id=request_id)
                return self._ok(self._app_user_payload(app_user), request_id=request_id, meta={{"type": "auth", "name": "me"}})

            def _oauth2_providers(self, request_id):
                if not self.security.get("enable_app_login"):
                    return self._error("app_login_disabled", 404, request_id=request_id)
                providers = self.env[AUTH_PROVIDER_MODEL].sudo().search([("x_active", "=", True)], order="x_sequence, x_name")
                data = []
                for provider in providers:
                    data.append({{
                        "key": provider.x_key,
                        "name": provider.x_name,
                        "auth_url": provider.x_auth_url,
                        "scope": provider.x_scope,
                        "pkce_required": bool(provider.x_pkce_required),
                    }})
                return self._ok(data, request_id=request_id, meta={{"type": "auth", "name": "oauth2_providers"}})

            def _oauth2_start(self, payload, app_user, request_id, remote_addr, user_agent, link_current_user=False):
                if not self.security.get("enable_app_login"):
                    return self._error("app_login_disabled", 404, request_id=request_id)
                if link_current_user and not app_user:
                    return self._error("app_login_required", 401, request_id=request_id)
                provider_key = str(payload.get("provider") or payload.get("provider_key") or "").strip().lower()
                if not provider_key:
                    return self._error("invalid_oauth_provider", 400, details=["provider_required"], request_id=request_id)
                provider = self.env[AUTH_PROVIDER_MODEL].sudo().search([("x_key", "=", provider_key), ("x_active", "=", True)], limit=1)
                if not provider:
                    return self._error("invalid_oauth_provider", 404, request_id=request_id)
                if not provider.x_auth_url or not provider.x_client_id:
                    return self._error("oauth_provider_not_configured", 400, details=["auth_url_and_client_id_required"], request_id=request_id)
                redirect_uri = str(payload.get("redirect_uri") or provider.x_redirect_uri or "").strip()
                if not redirect_uri:
                    return self._error("oauth_redirect_uri_required", 400, request_id=request_id)
                state = secrets.token_urlsafe(32)
                code_verifier = secrets.token_urlsafe(64)
                code_challenge = self._pkce_challenge(code_verifier)
                link_user_id = app_user.id if link_current_user and app_user else False
                auth_state = self.env[AUTH_STATE_MODEL].sudo().create_state(
                    provider,
                    state=state,
                    code_verifier=code_verifier,
                    redirect_uri=redirect_uri,
                    next_url=str(payload.get("next_url") or ""),
                    link_user_id=link_user_id,
                    ttl_minutes=int(self.security.get("oauth_state_ttl_minutes") or 10),
                    remote_addr=remote_addr,
                    user_agent=user_agent,
                )
                query = {{
                    "response_type": "code",
                    "client_id": provider.x_client_id,
                    "redirect_uri": redirect_uri,
                    "state": state,
                    "scope": provider.x_scope or "",
                }}
                if provider.x_pkce_required:
                    query["code_challenge"] = code_challenge
                    query["code_challenge_method"] = "S256"
                authorize_url = provider.x_auth_url + ("&" if "?" in provider.x_auth_url else "?") + urllib.parse.urlencode(query)
                return self._ok({{
                    "provider": provider.x_key,
                    "authorize_url": authorize_url,
                    "state_id": auth_state.id,
                    "pkce_required": bool(provider.x_pkce_required),
                }}, request_id=request_id, meta={{"type": "auth", "name": "oauth2_start", "link": bool(link_current_user)}})

            def _oauth2_callback(self, payload, request_id, remote_addr, user_agent):
                if not self.security.get("enable_app_login"):
                    return self._error("app_login_disabled", 404, request_id=request_id)
                code = str(payload.get("code") or "").strip()
                state = str(payload.get("state") or "").strip()
                if not code or not state:
                    return self._error("invalid_oauth_callback", 400, details=["code_and_state_required"], request_id=request_id)
                auth_state = self.env[AUTH_STATE_MODEL].sudo().consume_state(state)
                if not auth_state:
                    return self._error("invalid_oauth_state", 401, request_id=request_id)
                provider = auth_state.x_provider_id
                try:
                    token = self._oauth2_token(provider, code, auth_state.x_redirect_uri, auth_state.x_code_verifier)
                    profile = self._oauth2_profile(provider, token)
                except Exception as exc:
                    return self._error("oauth_exchange_failed", 502, details=[str(exc)], request_id=request_id)
                provider_user_id = str(profile.get("sub") or profile.get("id") or profile.get("user_id") or "").strip()
                if not provider_user_id:
                    return self._error("oauth_profile_missing_id", 502, request_id=request_id)
                email = str(profile.get("email") or "").strip().lower()
                name = str(profile.get("name") or profile.get("display_name") or email or provider_user_id).strip()
                avatar_url = str(profile.get("picture") or profile.get("avatar_url") or profile.get("avatar") or "").strip()
                before_context, denied = self._before_hook("before_oauth_link", {{
                    "provider": provider,
                    "profile": profile,
                    "provider_user_id": provider_user_id,
                    "email": email,
                    "auth_state": auth_state,
                    "request_id": request_id,
                }}, request_id)
                if denied:
                    return denied
                external = self.env[EXTERNAL_AUTH_MODEL].sudo().search([
                    ("x_provider_key", "=", provider.x_key),
                    ("x_provider_user_id", "=", provider_user_id),
                    ("x_active", "=", True),
                ], limit=1)
                app_user = external.x_user_id if external else auth_state.x_link_user_id
                if not app_user and provider.x_allow_email_link and email:
                    app_user = self.env[APP_USER_MODEL].sudo().search([("x_login", "=", email), ("x_active", "=", True)], limit=1)
                if not app_user:
                    if not provider.x_auto_create_users:
                        return self._error("oauth_user_not_linked", 403, request_id=request_id)
                    app_user = self.env[APP_USER_MODEL].sudo().create({{
                        "x_login": email or (provider.x_key + "_" + provider_user_id.lower()),
                        "x_name": name,
                        "x_role": self._default_app_role(),
                        "x_active": True,
                    }})
                values = {{
                    "x_name": provider.x_key + ":" + provider_user_id,
                    "x_user_id": app_user.id,
                    "x_provider_key": provider.x_key,
                    "x_provider_user_id": provider_user_id,
                    "x_provider_email": email,
                    "x_provider_name": name,
                    "x_provider_avatar_url": avatar_url,
                    "x_active": True,
                    "x_last_login_at": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
                }}
                if external:
                    external.sudo().write(values)
                else:
                    external = self.env[EXTERNAL_AUTH_MODEL].sudo().create(values)
                raw_token, session = self.env[APP_SESSION_MODEL].sudo().create_for_user(
                    app_user,
                    ttl_hours=int(self.security.get("app_session_ttl_hours") or 12),
                    remote_addr=remote_addr,
                    user_agent=user_agent,
                )
                app_user.sudo().write({{"x_last_login_at": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")}})
                self._after_hook("after_oauth_link", {{
                    "provider": provider,
                    "external_auth": external,
                    "app_user": app_user,
                    "profile": profile,
                    "before": before_context,
                    "request_id": request_id,
                }})
                return self._ok(self._app_user_payload(app_user), request_id=request_id, meta={{
                    "type": "auth",
                    "name": "oauth2_callback",
                    "provider": provider.x_key,
                    "set_cookie": raw_token,
                    "next_url": auth_state.x_next_url or "",
                }})

            def _oauth2_unlink(self, payload, app_user, request_id):
                if not app_user:
                    return self._error("app_login_required", 401, request_id=request_id)
                provider_key = str(payload.get("provider") or payload.get("provider_key") or "").strip().lower()
                provider_user_id = str(payload.get("provider_user_id") or "").strip()
                domain = [("x_user_id", "=", app_user.id), ("x_active", "=", True)]
                if provider_key:
                    domain.append(("x_provider_key", "=", provider_key))
                if provider_user_id:
                    domain.append(("x_provider_user_id", "=", provider_user_id))
                links = self.env[EXTERNAL_AUTH_MODEL].sudo().search(domain)
                links.sudo().write({{"x_active": False}})
                return self._ok({{"unlinked": len(links)}}, request_id=request_id, meta={{"type": "auth", "name": "oauth2_unlink"}})

            def _oauth2_token(self, provider, code, redirect_uri, code_verifier):
                if not provider.x_token_url:
                    raise RuntimeError("token_url_required")
                form = {{
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": redirect_uri,
                    "client_id": provider.x_client_id,
                }}
                if provider.x_client_secret:
                    form["client_secret"] = provider.x_client_secret
                if provider.x_pkce_required:
                    form["code_verifier"] = code_verifier
                return self._http_json(provider.x_token_url, form=form, headers={{"Accept": "application/json"}})

            def _oauth2_profile(self, provider, token):
                if not provider.x_userinfo_url:
                    raise RuntimeError("userinfo_url_required")
                access_token = token.get("access_token")
                if not access_token:
                    raise RuntimeError("access_token_missing")
                return self._http_json(provider.x_userinfo_url, headers={{"Authorization": "Bearer " + str(access_token), "Accept": "application/json"}})

            def _http_json(self, url, form=None, headers=None):
                headers = dict(headers or {{}})
                data = None
                if form is not None:
                    data = urllib.parse.urlencode(form).encode("utf-8")
                    headers.setdefault("Content-Type", "application/x-www-form-urlencoded")
                req = urllib.request.Request(str(url), data=data, headers=headers)
                with urllib.request.urlopen(req, timeout=20) as response:
                    raw = response.read().decode("utf-8")
                return json.loads(raw or "{{}}")

            def _pkce_challenge(self, code_verifier):
                digest = hashlib.sha256(str(code_verifier).encode("ascii")).digest()
                return base64.urlsafe_b64encode(digest).decode("ascii").rstrip("=")

            def _meta(self, data, user, api_key, request_id):
                role = {{"name": "internal_meta", "auth": "internal", "required_groups": []}}
                if not self._role_ok(role, user, api_key=api_key):
                    return self._error("forbidden", 403, request_id=request_id)
                return self._ok(data, request_id=request_id)

            def _run_query(self, spec, payload, method, user, app_user, api_key, request_id, remote_addr):
                role = self.roles.get(spec["role"])
                status = 200
                ok = False
                error = None
                details = None
                data = None
                if method not in ("GET", "POST"):
                    status, error = 405, "method_not_allowed"
                elif not self._role_ok(role, user, app_user, api_key):
                    status, error = 403, "forbidden"
                else:
                    errors = []
                    filters_in = payload.get("filters") or {{}}
                    if not isinstance(filters_in, dict):
                        errors.append("filters_must_be_object")
                        filters_in = {{}}
                    context_ok, context, context_errors = self._safe_context(payload.get("context") or {{}}, spec.get("allowed_context_keys") or [])
                    if not context_ok:
                        errors.extend(context_errors)
                    limit = self._int(payload.get("limit", spec.get("default_limit") or 20), spec.get("default_limit") or 20)
                    limit = max(1, min(limit, int(spec.get("max_limit") or 50), int(self.security.get("max_page_size") or 100)))
                    offset = max(0, self._int(payload.get("offset", 0), 0))
                    order = self._order(spec, payload.get("sort"), errors)
                    domain = list(spec.get("fixed_domain") or [])
                    filter_specs = {{item["name"]: item for item in spec.get("filters") or []}}
                    for key in filters_in:
                        if key not in filter_specs:
                            errors.append("unknown_filter:" + str(key))
                    for item in spec.get("filters") or []:
                        if item["name"] not in filters_in:
                            if item.get("required"):
                                errors.append("missing_filter:" + item["name"])
                            continue
                        valid, value, value_error = self._coerce(item["type"], filters_in.get(item["name"]))
                        if not valid:
                            errors.append("invalid_filter:" + item["name"] + ":" + value_error)
                        else:
                            domain.append([item["field"], item["operator"], value])
                    if errors:
                        status, error, details = 400, "invalid_request", errors
                    else:
                        model = self.env[spec["model"]]
                        if context:
                            model = model.with_context(**context)
                        if spec.get("use_sudo"):
                            model = model.sudo()
                        rows = model.search_read(domain=domain, fields=spec["fields"], limit=limit, offset=offset, order=order)
                        response_map = spec.get("response_map") or {{}}
                        data = [{{alias: row.get(field) for alias, field in response_map.items()}} for row in rows] if response_map else rows
                        ok = True
                self._log(request_id, ok, status, error, payload, data if ok else details, None, "query", spec["path"], user, method, remote_addr)
                if ok:
                    return self._ok(data, request_id=request_id, meta={{"type": "query", "name": spec["name"], "path": spec["path"], "limit": limit, "offset": offset}})
                return self._error(error or "query_failed", status, details=details, request_id=request_id)

            def _run_command(self, spec, payload, headers, method, user, app_user, api_key, csrf_valid, request_id, remote_addr):
                role = self.roles.get(spec["role"])
                status = 200
                ok = False
                error = None
                details = None
                data = None
                idempotency_key = headers.get("Idempotency-Key") or payload.get("idempotency_key")
                if method != "POST":
                    status, error = 405, "method_not_allowed"
                elif not self._role_ok(role, user, app_user, api_key):
                    status, error = 403, "forbidden"
                else:
                    csrf_required = spec.get("csrf_required")
                    if csrf_required is None:
                        csrf_required = bool(self.security.get("force_csrf_for_session_commands")) and role and role.get("auth") in ("portal", "internal", "app_user")
                    if csrf_required and not csrf_valid:
                        status, error = 403, "invalid_csrf"
                    else:
                        errors = []
                        ids = self._ids(payload.get("ids") or [], spec, errors)
                        params = self._params(payload.get("params") or payload.get("kwargs") or {{}}, spec, errors)
                        context_ok, context, context_errors = self._safe_context(payload.get("context") or {{}}, spec.get("allowed_context_keys") or [])
                        if not context_ok:
                            errors.extend(context_errors)
                        if spec.get("require_idempotency_key") and not idempotency_key:
                            errors.append("idempotency_key_required")
                        if errors:
                            status, error, details = 400, "invalid_request", errors
                        else:
                            replay = self._find_idempotent_replay(spec, user, idempotency_key)
                            if replay:
                                ok = True
                                data = {{"idempotent_replay": True, "request_id": replay.x_request_id}}
                            else:
                                model = self.env[spec["model"]]
                                if context:
                                    model = model.with_context(**context)
                                if spec.get("use_sudo"):
                                    model = model.sudo()
                                target = model.browse(ids) if ids else model
                                method_name = spec["method"]
                                if method_name == "create":
                                    result = model.create(params)
                                elif method_name == "write":
                                    result = target.write(params)
                                elif method_name == "unlink":
                                    result = target.unlink()
                                else:
                                    result = getattr(target, method_name)(**params)
                                data = result if isinstance(result, (dict, list, str, int, float, bool)) or result is None else {{"repr": str(result)}}
                                ok = True
                self._log(request_id, ok, status, error, payload, data if ok else details, idempotency_key, "command", spec["path"], user, method, remote_addr)
                if ok:
                    return self._ok(data, request_id=request_id, meta={{"type": "command", "name": spec["name"], "path": spec["path"], "idempotent_replay": bool(data and isinstance(data, dict) and data.get("idempotent_replay"))}})
                return self._error(error or "command_failed", status, details=details, request_id=request_id)

            def _run_function(self, spec, payload, headers, method, user, app_user, api_key, csrf_valid, request_id, remote_addr):
                role = self.roles.get(spec["role"])
                status = 200
                ok = False
                error = None
                details = None
                data = None
                idempotency_key = headers.get("Idempotency-Key") or payload.get("idempotency_key")
                if method != "POST":
                    status, error = 405, "method_not_allowed"
                elif not self._role_ok(role, user, app_user, api_key):
                    status, error = 403, "forbidden"
                else:
                    csrf_required = spec.get("csrf_required")
                    if csrf_required is None:
                        csrf_required = bool(self.security.get("force_csrf_for_session_commands")) and role and role.get("auth") in ("portal", "internal", "app_user")
                    if csrf_required and not csrf_valid:
                        status, error = 403, "invalid_csrf"
                    else:
                        errors = []
                        params = self._params(payload.get("params") or payload.get("kwargs") or {{}}, spec, errors)
                        context_ok, context, context_errors = self._safe_context(payload.get("context") or {{}}, spec.get("allowed_context_keys") or [])
                        if not context_ok:
                            errors.extend(context_errors)
                        if spec.get("require_idempotency_key") and not idempotency_key:
                            errors.append("idempotency_key_required")
                        if errors:
                            status, error, details = 400, "invalid_request", errors
                        else:
                            replay = self._find_idempotent_replay(spec, user, idempotency_key, endpoint_type="function")
                            if replay:
                                ok = True
                                data = {{"idempotent_replay": True, "request_id": replay.x_request_id}}
                            else:
                                handler = FUNCTION_HANDLERS.get(spec["handler"])
                                if not handler:
                                    status, error, details = 501, "function_handler_missing", [spec["handler"]]
                                else:
                                    hook_context, denied = self._before_hook("before_function", {{
                                        "env": self.env,
                                        "spec": spec,
                                        "params": params,
                                        "context": context,
                                        "payload": payload,
                                        "user": user,
                                        "app_user": app_user,
                                        "request_id": request_id,
                                    }}, request_id)
                                    if denied:
                                        return denied
                                    data = handler(hook_context)
                                    replacement = self._after_hook("after_function", {{
                                        "env": self.env,
                                        "spec": spec,
                                        "params": params,
                                        "context": context,
                                        "payload": payload,
                                        "result": data,
                                        "user": user,
                                        "app_user": app_user,
                                        "request_id": request_id,
                                    }})
                                    if replacement is not None:
                                        data = replacement
                                    ok = True
                self._log(request_id, ok, status, error, payload, data if ok else details, idempotency_key, "function", spec["path"], user, method, remote_addr)
                if ok:
                    return self._ok(data, request_id=request_id, meta={{"type": "function", "name": spec["name"], "path": spec["path"], "handler": spec["handler"], "idempotent_replay": bool(data and isinstance(data, dict) and data.get("idempotent_replay"))}})
                return self._error(error or "function_failed", status, details=details, request_id=request_id)

            def run_cron(self, name):
                request_id = self._request_id()
                spec = self.crons.get(name)
                if not spec:
                    return False
                ok = False
                error = None
                data = None
                try:
                    handler = FUNCTION_HANDLERS.get(spec["handler"])
                    if not handler:
                        raise RuntimeError("cron_handler_missing:" + spec["handler"])
                    params = {{item["name"]: item.get("default") for item in spec.get("params") or [] if item.get("default") is not None}}
                    hook_context, denied = self._before_hook("before_cron", {{"env": self.env, "spec": spec, "params": params, "request_id": request_id}}, request_id)
                    if denied:
                        raise RuntimeError(denied[1].get("error") or "cron_denied")
                    data = handler(hook_context)
                    replacement = self._after_hook("after_cron", {{"env": self.env, "spec": spec, "params": params, "result": data, "request_id": request_id}})
                    if replacement is not None:
                        data = replacement
                    ok = True
                    return True
                except Exception as exc:
                    error = str(exc)
                    return False
                finally:
                    self._log(request_id, ok, 200 if ok else 500, error, {{"cron": name}}, data, None, "cron", name, self.env.user, "CRON", "")

            def _role_ok(self, role, user, app_user=None, api_key=None):
                if not role:
                    return False
                auth = role.get("auth")
                if auth == "app_user":
                    return bool(app_user and app_user.x_active and app_user.x_role == role.get("name"))
                if api_key and api_key.x_active and api_key.x_role in (role.get("name"), auth, "internal"):
                    return True
                if self.security.get("api_key_required") and auth in ("bot", "internal") and not api_key:
                    return False
                is_internal = user.has_group("base.group_user")
                is_portal = user.has_group("base.group_portal")
                if auth == "internal" and not is_internal:
                    return False
                if auth == "portal" and not (is_portal or is_internal):
                    return False
                if auth == "bot" and not api_key:
                    return not self.security.get("api_key_required") and is_internal
                for group in role.get("required_groups") or []:
                    if not user.has_group(group):
                        return False
                return True

            def _current_app_session(self, cookies, headers):
                raw_token = (
                    (cookies or {{}}).get(SESSION_COOKIE_NAME)
                    or headers.get("X-App-Session")
                    or str(headers.get("Authorization") or "").removeprefix("Bearer ").strip()
                )
                if not raw_token:
                    return None
                return self.env[APP_SESSION_MODEL].sudo().find_valid(raw_token)

            def _current_api_key(self, headers):
                raw_key = (
                    headers.get("X-Bridge-API-Key")
                    or headers.get("X-App-API-Key")
                    or str(headers.get("Authorization") or "").removeprefix("ApiKey ").removeprefix("Token ").strip()
                )
                if not raw_key:
                    return None
                key = self.env[API_KEY_MODEL].sudo().find_valid(raw_key)
                if key:
                    key.sudo().touch_usage()
                return key

            def _check_rate_limit(self, path, remote_addr, app_user=None, api_key=None):
                if not self.security.get("rate_limit_enabled"):
                    return True, 0
                limit = int(self.security.get("rate_limit_per_minute") or 60)
                if limit <= 0:
                    return True, 0
                subject = "anonymous:" + str(remote_addr or "")
                if app_user:
                    subject = "app_user:" + str(app_user.id)
                if api_key:
                    subject = "api_key:" + str(api_key.id)
                window = datetime.datetime.utcnow().strftime("%Y%m%d%H%M")
                return self.env[RATE_LIMIT_MODEL].sudo().hit(subject, str(path or ""), window, limit)

            def _app_user_payload(self, app_user):
                return {{
                    "id": app_user.id,
                    "login": app_user.x_login,
                    "name": app_user.x_name,
                    "role": app_user.x_role,
                }}

            def _safe_context(self, raw, allowed):
                if not raw:
                    return True, {{}}, []
                if not isinstance(raw, dict):
                    return False, {{}}, ["context_must_be_object"]
                unknown = sorted(set(raw) - set(allowed or []))
                if unknown:
                    return False, {{}}, ["unknown_context:" + key for key in unknown]
                return True, dict(raw), []

            def _int(self, value, default):
                try:
                    return int(value)
                except Exception:
                    return int(default)

            def _order(self, spec, raw_sort, errors):
                order = spec.get("order") or ""
                if not raw_sort:
                    return order
                if not isinstance(raw_sort, dict):
                    errors.append("sort_must_be_object")
                    return order
                field = raw_sort.get("field")
                direction = str(raw_sort.get("dir") or "asc").lower()
                allowed = spec.get("sortable_fields") or spec.get("fields") or []
                if field and field not in allowed:
                    errors.append("invalid_sort_field:" + str(field))
                elif field and direction not in ("asc", "desc"):
                    errors.append("invalid_sort_dir:" + direction)
                elif field:
                    order = str(field) + " " + direction
                return order

            def _ids(self, raw, spec, errors):
                if not isinstance(raw, list):
                    errors.append("ids_must_be_list")
                    raw = []
                max_ids = min(int(spec.get("max_ids") or self.security.get("max_batch_ids") or 100), int(self.security.get("max_batch_ids") or 100))
                if len(raw) > max_ids:
                    errors.append("too_many_ids")
                ids = []
                for item in raw:
                    try:
                        value = int(item)
                    except Exception:
                        errors.append("invalid_id:" + str(item))
                        continue
                    if value <= 0:
                        errors.append("invalid_id:" + str(item))
                    else:
                        ids.append(value)
                if spec.get("ids_required") and not ids:
                    errors.append("ids_required")
                return ids

            def _params(self, raw, spec, errors):
                if not isinstance(raw, dict):
                    errors.append("params_must_be_object")
                    raw = {{}}
                param_specs = {{item["name"]: item for item in spec.get("params") or []}}
                for key in raw:
                    if key not in param_specs:
                        errors.append("unknown_param:" + str(key))
                out = {{}}
                for item in spec.get("params") or []:
                    name = item["name"]
                    if name in raw:
                        valid, value, value_error = self._coerce(item["type"], raw.get(name))
                        if valid:
                            out[name] = value
                        else:
                            errors.append("invalid_param:" + name + ":" + value_error)
                    elif item.get("required"):
                        errors.append("missing_param:" + name)
                    elif item.get("default") is not None:
                        out[name] = item.get("default")
                return out

            def _coerce(self, type_name, value):
                if type_name == "json":
                    return True, value, ""
                if type_name == "str":
                    return True, str(value), ""
                if type_name == "int":
                    try:
                        return True, int(value), ""
                    except Exception:
                        return False, None, "must_be_int"
                if type_name == "float":
                    try:
                        return True, float(value), ""
                    except Exception:
                        return False, None, "must_be_float"
                if type_name == "bool":
                    if value in (True, 1, "1", "true", "True", "yes", "on"):
                        return True, True, ""
                    if value in (False, 0, "0", "false", "False", "no", "off"):
                        return True, False, ""
                    return False, None, "must_be_bool"
                if type_name == "date":
                    try:
                        datetime.date.fromisoformat(str(value))
                        return True, str(value), ""
                    except Exception:
                        return False, None, "must_be_iso_date"
                if type_name == "datetime":
                    try:
                        datetime.datetime.fromisoformat(str(value).replace("Z", "+00:00"))
                        return True, str(value), ""
                    except Exception:
                        return False, None, "must_be_iso_datetime"
                if type_name.startswith("list[") and type_name.endswith("]"):
                    if not isinstance(value, list):
                        return False, None, "must_be_list"
                    subtype = type_name[5:-1]
                    out = []
                    for item in value:
                        valid, coerced, error = self._coerce(subtype, item)
                        if not valid:
                            return False, None, error
                        out.append(coerced)
                    return True, out, ""
                return False, None, "unsupported_type"

            def _find_idempotent_replay(self, spec, user, idempotency_key, endpoint_type="command"):
                if not (spec.get("idempotent") and self.security.get("enable_idempotency") and idempotency_key):
                    return None
                cutoff = datetime.datetime.utcnow() - datetime.timedelta(hours=int(self.security.get("idempotency_ttl_hours") or 72))
                return self.env[LOG_MODEL].sudo().search([
                    ("x_endpoint_type", "=", endpoint_type),
                    ("x_route", "=", spec["path"]),
                    ("x_user_id", "=", user.id),
                    ("x_idempotency_key", "=", idempotency_key),
                    ("x_ok", "=", True),
                    ("create_date", ">=", cutoff.strftime("%Y-%m-%d %H:%M:%S")),
                ], order="id desc", limit=1)

            def _log(self, request_id, ok, status, error, payload, result, idempotency_key, endpoint_type, route, user, method, remote_addr):
                if not self.security.get("log_requests"):
                    return
                try:
                    self.env[LOG_MODEL].sudo().create({{
                        "x_name": request_id,
                        "x_request_id": request_id,
                        "x_route": route,
                        "x_endpoint_type": endpoint_type,
                        "x_user_id": user.id,
                        "x_http_method": method or "",
                        "x_idempotency_key": idempotency_key or "",
                        "x_ok": bool(ok),
                        "x_status_code": int(status),
                        "x_error_code": error or "",
                        "x_payload_text": str(payload)[:4000],
                        "x_response_text": str(result)[:4000],
                        "x_remote_addr": (remote_addr or "")[:128],
                    }})
                except Exception:
                    pass

            def _ok(self, data, *, request_id, meta=None):
                envelope = {{"ok": True, "data": data, "meta": meta or {{}}}}
                envelope["meta"]["request_id"] = request_id
                envelope["meta"]["digest"] = BRIDGE_DIGEST
                return 200, envelope

            def _error(self, error, status, *, details=None, request_id):
                return int(status), {{"ok": False, "error": error, "details": details, "meta": {{"request_id": request_id, "digest": BRIDGE_DIGEST}}}}

            def _request_id(self):
                return CONTRACT["app"]["slug"] + "-" + str(int(time.time() * 1000000))

            def _health_payload(self):
                return {{
                    "status": "ok",
                    "app": CONTRACT["app"],
                    "digest": BRIDGE_DIGEST,
                    "counts": self._counts(),
                    "public_entrypoint": "/" + CONTRACT["app"]["public_prefix"].strip("/") + "/" + CONTRACT["app"]["slug"],
                    "operations": self._operation_catalog(),
                }}

            def _readiness_payload(self):
                security_report = CONTRACT.get("_security_report", {{}})
                checks = [
                    {{"name": "contract_loaded", "ok": bool(CONTRACT.get("app") and BRIDGE_DIGEST)}},
                    {{"name": "operation_catalog", "ok": bool(self._operation_catalog())}},
                    {{"name": "database_log_model", "ok": self._model_count_ok(LOG_MODEL)}},
                    {{"name": "security_release_gate", "ok": bool(security_report.get("release_ready", security_report.get("passed", True)))}},
                ]
                if self.security.get("enable_app_login"):
                    checks.append({{"name": "app_user_model", "ok": self._model_count_ok(APP_USER_MODEL)}})
                    checks.append({{"name": "auth_provider_model", "ok": self._model_count_ok(AUTH_PROVIDER_MODEL)}})
                ready = all(item["ok"] for item in checks)
                return {{
                    "ready": ready,
                    "checks": checks,
                    "digest": BRIDGE_DIGEST,
                    "security": {{
                        "score": security_report.get("score"),
                        "release_ready": security_report.get("release_ready", security_report.get("passed")),
                        "blocking_count": security_report.get("blocking_count", 0),
                    }},
                }}

            def _metrics_payload(self):
                security_report = CONTRACT.get("_security_report", {{}})
                return {{
                    "contract_digest": BRIDGE_DIGEST,
                    "operations": self._counts(),
                    "requests_logged": self._safe_count(LOG_MODEL, []),
                    "recent_errors": self._safe_count(LOG_MODEL, [("x_ok", "=", False)]),
                    "rate_limit_enabled": bool(self.security.get("rate_limit_enabled")),
                    "rate_limit_per_minute": int(self.security.get("rate_limit_per_minute") or 0),
                    "security_score": security_report.get("score"),
                    "security_release_ready": security_report.get("release_ready", security_report.get("passed")),
                    "security_blocking_findings": security_report.get("blocking_count", 0),
                }}

            def _model_count_ok(self, model_name):
                try:
                    self.env[model_name].sudo().search([], limit=1)
                    return True
                except Exception:
                    return False

            def _safe_count(self, model_name, domain):
                try:
                    return int(self.env[model_name].sudo().search_count(domain or []))
                except Exception:
                    return 0

            def _counts(self):
                return {{
                    "queries": len(CONTRACT.get("queries", [])),
                    "commands": len(CONTRACT.get("commands", [])),
                    "functions": len(CONTRACT.get("functions", [])),
                    "crons": len(CONTRACT.get("crons", [])),
                    "events": len(CONTRACT.get("events", [])),
                }}

            def _default_app_role(self):
                for role in CONTRACT.get("roles", []):
                    if role.get("auth") == "app_user":
                        return role.get("name")
                return "app_user"

            def _before_hook(self, name, context, request_id):
                hook = getattr(self.hooks, name, None)
                if not hook:
                    return context, None
                result = hook(dict(context)) or context
                if isinstance(result, dict) and result.get("deny"):
                    status = int(result.get("status") or 403)
                    return result, self._error(result.get("error") or "hook_denied", status, details=result.get("details"), request_id=request_id)
                return result, None

            def _after_hook(self, name, context):
                hook = getattr(self.hooks, name, None)
                if not hook:
                    return None
                result = hook(dict(context)) or context
                if isinstance(result, dict) and result.get("replace"):
                    return result.get("data")
                return None

            def _operation_catalog(self):
                operations = []
                public_root = "/" + CONTRACT["app"]["public_prefix"].strip("/") + "/" + CONTRACT["app"]["slug"]
                meta = [
                    ("health", "Health"),
                    ("readiness", "Readiness"),
                    ("metrics", "Metrics"),
                    ("security_report", "Security Report"),
                    ("csrf", "CSRF"),
                ]
                if self.security.get("enable_app_login"):
                    meta.extend([
                        ("auth/login", "Login"),
                        ("auth/me", "Me"),
                        ("auth/logout", "Logout"),
                        ("auth/oauth2/providers", "OAuth2 Providers"),
                        ("auth/oauth2/start", "OAuth2 Start"),
                        ("auth/oauth2/callback", "OAuth2 Callback"),
                        ("auth/oauth2/link", "OAuth2 Link"),
                        ("auth/oauth2/unlink", "OAuth2 Unlink"),
                    ])
                if self.security.get("expose_contract_endpoint"):
                    meta.append(("contract", "Contract"))
                if self.security.get("expose_openapi_endpoint"):
                    meta.append(("openapi", "OpenAPI"))
                if self.security.get("expose_asyncapi_endpoint"):
                    meta.append(("asyncapi", "AsyncAPI"))
                for path, title in meta:
                    operations.append({{"name": path, "kind": "meta", "path": path, "public_url": public_root + "/" + path, "title": title}})
                for query in CONTRACT.get("queries", []):
                    operations.append({{"name": query["name"], "kind": "query", "path": query["path"], "public_url": public_root + "/" + query["path"], "role": query["role"], "model": query["model"], "risk_tags": query.get("risk_tags") or []}})
                for command in CONTRACT.get("commands", []):
                    operations.append({{"name": command["name"], "kind": "command", "path": command["path"], "public_url": public_root + "/" + command["path"], "role": command["role"], "model": command["model"], "method": command["method"], "risk_tags": command.get("risk_tags") or []}})
                for function in CONTRACT.get("functions", []):
                    operations.append({{"name": function["name"], "kind": "function", "path": function["path"], "public_url": public_root + "/" + function["path"], "role": function["role"], "method": function["handler"], "risk_tags": function.get("risk_tags") or []}})
                for cron in CONTRACT.get("crons", []):
                    operations.append({{"name": cron["name"], "kind": "cron", "path": cron["name"], "public_url": "", "role": "system", "method": cron["handler"], "risk_tags": []}})
                for event in CONTRACT.get("events", []):
                    operations.append({{"name": event["name"], "kind": "event", "path": event["channel"], "public_url": event["channel"], "role": event.get("role") or "", "method": event["direction"], "risk_tags": []}})
                return operations
        '''
    ).strip() + "\n"


def _render_log_model(spec: OdooAppBridgeSpec) -> str:
    return textwrap.dedent(
        f'''
        """Admin request log for {spec.app.module}."""

        from __future__ import annotations

        from odoo import fields, models


        class {_class_name(spec.app.module, "BridgeLog")}(models.Model):
            _name = {_log_model_name(spec)!r}
            _description = "{spec.app.name} Bridge Request Log"
            _order = "create_date desc, id desc"

            x_name = fields.Char(required=True, index=True)
            x_request_id = fields.Char(string="Request ID", index=True)
            x_route = fields.Char(index=True)
            x_endpoint_type = fields.Selection([("auth", "Auth"), ("query", "Query"), ("command", "Command"), ("function", "Function"), ("cron", "Cron"), ("meta", "Meta")], index=True)
            x_user_id = fields.Integer(string="User ID")
            x_http_method = fields.Char(string="HTTP Method")
            x_idempotency_key = fields.Char(index=True)
            x_ok = fields.Boolean(string="OK", index=True)
            x_status_code = fields.Integer(string="Status Code")
            x_error_code = fields.Char(string="Error Code")
            x_payload_text = fields.Text(string="Payload")
            x_response_text = fields.Text(string="Response")
            x_remote_addr = fields.Char(string="Remote Address")
        '''
    ).strip() + "\n"


def _render_operation_model(spec: OdooAppBridgeSpec) -> str:
    return textwrap.dedent(
        f'''
        """Admin operation catalog for {spec.app.module}."""

        from __future__ import annotations

        from odoo import fields, models


        class {_class_name(spec.app.module, "BridgeOperation")}(models.Model):
            _name = {_operation_model_name(spec)!r}
            _description = "{spec.app.name} Bridge Operation"
            _order = "x_sequence, x_kind, x_name"

            x_name = fields.Char(required=True, index=True)
            x_kind = fields.Selection(
                [("meta", "Meta"), ("query", "Query"), ("command", "Command"), ("function", "Function"), ("cron", "Cron"), ("event", "Event")],
                required=True,
                index=True,
            )
            x_path = fields.Char(required=True, index=True)
            x_public_url = fields.Char(string="Public URL", readonly=True)
            x_role = fields.Char(index=True)
            x_auth = fields.Char(string="Auth Mode", index=True)
            x_model = fields.Char(string="Odoo Model", index=True)
            x_method = fields.Char(string="Method")
            x_tags = fields.Char(string="Tags")
            x_risk_tags = fields.Char(string="Risk Tags")
            x_summary = fields.Text(string="Summary")
            x_contract_digest = fields.Char(string="Contract Digest", index=True)
            x_sequence = fields.Integer(default=100)
            x_active = fields.Boolean(default=True)
        '''
    ).strip() + "\n"


def _render_security_finding_model(spec: OdooAppBridgeSpec) -> str:
    return textwrap.dedent(
        f'''
        """Security Center findings for {spec.app.module}."""

        from __future__ import annotations

        from odoo import fields, models


        class {_class_name(spec.app.module, "BridgeSecurityFinding")}(models.Model):
            _name = {_security_finding_model_name(spec)!r}
            _description = "{spec.app.name} Security Finding"
            _order = "x_severity_rank desc, x_code, x_path"

            x_severity = fields.Selection(
                [("critical", "Critical"), ("high", "High"), ("medium", "Medium"), ("low", "Low"), ("info", "Info")],
                required=True,
                default="info",
                index=True,
            )
            x_severity_rank = fields.Integer(default=10, index=True)
            x_code = fields.Char(required=True, index=True)
            x_path = fields.Char(index=True)
            x_message = fields.Text(required=True)
            x_recommendation = fields.Text(string="Recommendation")
            x_owasp = fields.Char(string="OWASP")
            x_contract_digest = fields.Char(string="Contract Digest", index=True)
            x_active = fields.Boolean(default=True)

            _sql_constraints = [
                ("x_code_path_unique", "unique(x_code, x_path)", "Security finding code and path must be unique."),
            ]
        '''
    ).strip() + "\n"


def _render_security_gate_model(spec: OdooAppBridgeSpec) -> str:
    return textwrap.dedent(
        f'''
        """Persisted release-gate evidence for {spec.app.module}."""

        from __future__ import annotations

        from odoo import fields, models


        class {_class_name(spec.app.module, "BridgeSecurityGate")}(models.Model):
            _name = {_security_gate_model_name(spec)!r}
            _description = "{spec.app.name} Security Release Gate"
            _order = "create_date desc, id desc"

            x_name = fields.Char(required=True, default="Security Release Gate")
            x_contract_digest = fields.Char(string="Contract Digest", required=True, index=True)
            x_score = fields.Integer(string="Score", index=True)
            x_release_ready = fields.Boolean(string="Release Ready", index=True)
            x_blocking_count = fields.Integer(string="Blocking Findings")
            x_findings_count = fields.Integer(string="Total Findings")
            x_failure_reasons = fields.Text(string="Failure Reasons")
            x_counts_text = fields.Text(string="Severity Counts")
            x_report_text = fields.Text(string="Evidence Report")
            x_generated_at = fields.Datetime(string="Generated At", default=fields.Datetime.now, readonly=True)

            _sql_constraints = [
                ("x_contract_digest_unique", "unique(x_contract_digest)", "Release gate evidence already exists for this contract digest."),
            ]
        '''
    ).strip() + "\n"


def _render_security_wizard_model(spec: OdooAppBridgeSpec) -> str:
    seed = _security_finding_seed(spec)
    report = _security_report_seed(spec)
    return textwrap.dedent(
        f'''
        """Security Center refresh wizard for {spec.app.module}."""

        from __future__ import annotations

        import json

        from odoo import fields, models


        SECURITY_FINDING_SEED = {seed!r}
        SECURITY_REPORT_SEED = {report!r}
        SEVERITY_RANK = {{"critical": 50, "high": 40, "medium": 30, "low": 20, "info": 10}}


        class {_class_name(spec.app.module, "BridgeSecurityWizard")}(models.TransientModel):
            _name = {_security_wizard_model_name(spec)!r}
            _description = "{spec.app.name} Security Center Wizard"

            x_note = fields.Text(
                string="Refresh Note",
                default="Load or update generated Security Center findings from the embedded bridge contract seed.",
                readonly=True,
            )
            x_loaded_count = fields.Integer(string="Loaded Findings", readonly=True)
            x_score = fields.Integer(string="Release Score", readonly=True, default=lambda self: int(SECURITY_REPORT_SEED.get("score") or 0))
            x_release_ready = fields.Boolean(string="Release Ready", readonly=True, default=lambda self: bool(SECURITY_REPORT_SEED.get("release_ready")))
            x_blocking_count = fields.Integer(string="Blocking Findings", readonly=True, default=lambda self: int(SECURITY_REPORT_SEED.get("blocking_count") or 0))

            def action_refresh_findings(self):
                self.ensure_one()
                finding_model = self.env[{_security_finding_model_name(spec)!r}].sudo()
                gate_model = self.env[{_security_gate_model_name(spec)!r}].sudo()
                loaded_count = 0
                digest = {spec.contract_digest()!r}
                for item in SECURITY_FINDING_SEED:
                    code = item.get("code") or "BRIDGE_SECURITY_NOTE"
                    path = item.get("path") or ""
                    severity = item.get("severity") or "info"
                    values = {{
                        "x_severity": severity,
                        "x_severity_rank": SEVERITY_RANK.get(severity, 10),
                        "x_code": code,
                        "x_path": path,
                        "x_message": item.get("message") or "",
                        "x_recommendation": item.get("recommendation") or "",
                        "x_owasp": item.get("owasp") or "",
                        "x_contract_digest": digest,
                        "x_active": True,
                    }}
                    finding = finding_model.search([("x_code", "=", code), ("x_path", "=", path)], limit=1)
                    if finding:
                        finding.write(values)
                    else:
                        finding_model.create(values)
                    loaded_count += 1
                gate_values = {{
                    "x_name": {(spec.app.name + " Release Gate")!r},
                    "x_contract_digest": digest,
                    "x_score": int(SECURITY_REPORT_SEED.get("score") or 0),
                    "x_release_ready": bool(SECURITY_REPORT_SEED.get("release_ready")),
                    "x_blocking_count": int(SECURITY_REPORT_SEED.get("blocking_count") or 0),
                    "x_findings_count": int(SECURITY_REPORT_SEED.get("findings_count") or 0),
                    "x_failure_reasons": "\\n".join(SECURITY_REPORT_SEED.get("failure_reasons") or []),
                    "x_counts_text": json.dumps(SECURITY_REPORT_SEED.get("counts_by_severity") or {{}}, indent=2, sort_keys=True),
                    "x_report_text": json.dumps(SECURITY_REPORT_SEED, indent=2, sort_keys=True),
                }}
                gate = gate_model.search([("x_contract_digest", "=", digest)], limit=1)
                if gate:
                    gate.write(gate_values)
                else:
                    gate_model.create(gate_values)
                self.write({{
                    "x_loaded_count": loaded_count,
                    "x_score": int(SECURITY_REPORT_SEED.get("score") or 0),
                    "x_release_ready": bool(SECURITY_REPORT_SEED.get("release_ready")),
                    "x_blocking_count": int(SECURITY_REPORT_SEED.get("blocking_count") or 0),
                    "x_note": "Loaded or updated %s findings. Release score: %s. Ready: %s." % (
                        loaded_count,
                        SECURITY_REPORT_SEED.get("score"),
                        "yes" if SECURITY_REPORT_SEED.get("release_ready") else "no",
                    ),
                }})
                return {{
                    "type": "ir.actions.act_window",
                    "name": "Refresh Security Findings",
                    "res_model": self._name,
                    "res_id": self.id,
                    "view_mode": "form",
                    "target": "new",
                }}
        '''
    ).strip() + "\n"


def _render_app_user_model(spec: OdooAppBridgeSpec) -> str:
    role_options = tuple((role.name, role.name.replace("_", " ").title()) for role in spec.roles if role.auth == "app_user")
    if not role_options:
        role_options = (("app_user", "App User"),)
    return textwrap.dedent(
        f'''
        """App-local users for {spec.app.module}."""

        from __future__ import annotations

        import base64
        import hashlib
        import hmac
        import secrets

        from odoo import api, fields, models


        PASSWORD_ITERATIONS = {int(spec.security.app_password_iterations)}


        class {_class_name(spec.app.module, "BridgeAppUser")}(models.Model):
            _name = {_app_user_model_name(spec)!r}
            _description = "{spec.app.name} App User"
            _order = "x_login"

            x_name = fields.Char(string="Name", required=True)
            x_login = fields.Char(string="Login", required=True, index=True)
            x_role = fields.Selection({role_options!r}, string="App Role", required=True)
            x_active = fields.Boolean(default=True)
            x_password_input = fields.Char(string="Set Password", copy=False)
            x_password_salt = fields.Char(copy=False, readonly=True)
            x_password_hash = fields.Char(copy=False, readonly=True)
            x_password_iterations = fields.Integer(default=PASSWORD_ITERATIONS, readonly=True)
            x_last_login_at = fields.Datetime(readonly=True)

            _sql_constraints = [
                ("x_login_unique", "unique(x_login)", "App login must be unique."),
            ]

            @api.model_create_multi
            def create(self, vals_list):
                passwords = []
                clean_vals_list = []
                for vals in vals_list:
                    vals = dict(vals)
                    vals["x_login"] = str(vals.get("x_login") or "").strip().lower()
                    passwords.append(vals.pop("x_password_input", ""))
                    clean_vals_list.append(vals)
                records = super().create(clean_vals_list)
                for record, password in zip(records, passwords):
                    if password:
                        record.set_password(password)
                return records

            def write(self, vals):
                vals = dict(vals)
                password = vals.pop("x_password_input", "")
                if "x_login" in vals:
                    vals["x_login"] = str(vals.get("x_login") or "").strip().lower()
                result = super().write(vals)
                if password:
                    for record in self:
                        record.set_password(password)
                return result

            def set_password(self, raw_password):
                password = str(raw_password or "")
                if len(password) < 8:
                    raise ValueError("App user password must be at least 8 characters.")
                salt = base64.urlsafe_b64encode(secrets.token_bytes(24)).decode("ascii")
                password_hash = self._hash_secret(password, salt, PASSWORD_ITERATIONS)
                self.sudo().write({{
                    "x_password_salt": salt,
                    "x_password_hash": password_hash,
                    "x_password_iterations": PASSWORD_ITERATIONS,
                    "x_password_input": False,
                }})

            def check_password(self, raw_password):
                self.ensure_one()
                if not self.x_password_hash or not self.x_password_salt:
                    return False
                candidate = self._hash_secret(str(raw_password or ""), self.x_password_salt, int(self.x_password_iterations or PASSWORD_ITERATIONS))
                return hmac.compare_digest(candidate, self.x_password_hash)

            @staticmethod
            def _hash_secret(secret, salt, iterations):
                digest = hashlib.pbkdf2_hmac(
                    "sha256",
                    str(secret).encode("utf-8"),
                    str(salt).encode("utf-8"),
                    int(iterations),
                )
                return base64.urlsafe_b64encode(digest).decode("ascii")
        '''
    ).strip() + "\n"


def _render_app_session_model(spec: OdooAppBridgeSpec) -> str:
    return textwrap.dedent(
        f'''
        """App-local sessions for {spec.app.module}."""

        from __future__ import annotations

        import base64
        import datetime
        import hashlib
        import hmac
        import secrets

        from odoo import api, fields, models


        class {_class_name(spec.app.module, "BridgeAppSession")}(models.Model):
            _name = {_app_session_model_name(spec)!r}
            _description = "{spec.app.name} App Session"
            _order = "create_date desc, id desc"

            x_name = fields.Char(required=True, index=True)
            x_user_id = fields.Many2one({_app_user_model_name(spec)!r}, string="App User", required=True, ondelete="cascade", index=True)
            x_token_hash = fields.Char(required=True, index=True, copy=False)
            x_expires_at = fields.Datetime(required=True, index=True)
            x_revoked = fields.Boolean(default=False, index=True)
            x_remote_addr = fields.Char(string="Remote Address")
            x_user_agent = fields.Char(string="User Agent")

            @api.model
            def create_for_user(self, app_user, *, ttl_hours, remote_addr="", user_agent=""):
                raw_token = secrets.token_urlsafe(48)
                token_hash = self.hash_token(raw_token)
                expires_at = datetime.datetime.utcnow() + datetime.timedelta(hours=int(ttl_hours))
                session = self.create({{
                    "x_name": app_user.x_login,
                    "x_user_id": app_user.id,
                    "x_token_hash": token_hash,
                    "x_expires_at": expires_at.strftime("%Y-%m-%d %H:%M:%S"),
                    "x_remote_addr": (remote_addr or "")[:128],
                    "x_user_agent": (user_agent or "")[:255],
                }})
                return raw_token, session

            @api.model
            def find_valid(self, raw_token):
                token_hash = self.hash_token(raw_token)
                now = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
                return self.search([
                    ("x_token_hash", "=", token_hash),
                    ("x_revoked", "=", False),
                    ("x_expires_at", ">=", now),
                    ("x_user_id.x_active", "=", True),
                ], limit=1)

            @staticmethod
            def hash_token(raw_token):
                digest = hashlib.sha256(str(raw_token or "").encode("utf-8")).digest()
                return base64.urlsafe_b64encode(digest).decode("ascii")
        '''
    ).strip() + "\n"


def _render_auth_provider_model(spec: OdooAppBridgeSpec) -> str:
    return textwrap.dedent(
        f'''
        """App-local OAuth2 provider configuration for {spec.app.module}."""

        from __future__ import annotations

        import re

        from odoo import api, fields, models
        from odoo.exceptions import ValidationError


        class {_class_name(spec.app.module, "BridgeAuthProvider")}(models.Model):
            _name = {_auth_provider_model_name(spec)!r}
            _description = "{spec.app.name} Auth Provider"
            _order = "x_sequence, x_name"

            x_name = fields.Char(string="Name", required=True)
            x_key = fields.Char(string="Provider Key", required=True, index=True)
            x_active = fields.Boolean(default=True, index=True)
            x_sequence = fields.Integer(default=100)
            x_client_id = fields.Char(string="Client ID")
            x_client_secret = fields.Char(string="Client Secret", copy=False, groups="base.group_system")
            x_auth_url = fields.Char(string="Authorization URL")
            x_redirect_uri = fields.Char(string="Redirect URI")
            x_token_url = fields.Char(string="Token URL", groups="base.group_system")
            x_userinfo_url = fields.Char(string="User Info URL", groups="base.group_system")
            x_scope = fields.Char(default="openid email profile")
            x_pkce_required = fields.Boolean(default=True)
            x_auto_create_users = fields.Boolean(string="Auto Create App Users", default=True)
            x_allow_email_link = fields.Boolean(string="Allow Email Fallback Link", default=False)

            _sql_constraints = [
                ("x_key_unique", "unique(x_key)", "Provider key must be unique."),
            ]

            @api.model_create_multi
            def create(self, vals_list):
                return super().create([self._clean_vals(vals) for vals in vals_list])

            def write(self, vals):
                return super().write(self._clean_vals(vals))

            @staticmethod
            def _clean_key(value):
                key = re.sub(r"[^a-z0-9_]+", "_", str(value or "").strip().lower()).strip("_")
                if not key:
                    raise ValidationError("Provider key is required.")
                return key

            @classmethod
            def _clean_vals(cls, vals):
                vals = dict(vals)
                if "x_key" in vals:
                    vals["x_key"] = cls._clean_key(vals.get("x_key"))
                return vals
        '''
    ).strip() + "\n"


def _render_auth_state_model(spec: OdooAppBridgeSpec) -> str:
    return textwrap.dedent(
        f'''
        """Short-lived OAuth2 state records for {spec.app.module}."""

        from __future__ import annotations

        import datetime

        from odoo import api, fields, models


        class {_class_name(spec.app.module, "BridgeAuthState")}(models.Model):
            _name = {_auth_state_model_name(spec)!r}
            _description = "{spec.app.name} Auth State"
            _order = "create_date desc, id desc"

            x_name = fields.Char(required=True, index=True)
            x_provider_id = fields.Many2one({_auth_provider_model_name(spec)!r}, required=True, ondelete="cascade", index=True)
            x_state = fields.Char(required=True, index=True, copy=False)
            x_code_verifier = fields.Char(required=True, copy=False)
            x_redirect_uri = fields.Char(required=True)
            x_next_url = fields.Char()
            x_link_user_id = fields.Many2one({_app_user_model_name(spec)!r}, string="Link App User", ondelete="cascade")
            x_expires_at = fields.Datetime(required=True, index=True)
            x_consumed = fields.Boolean(default=False, index=True)
            x_remote_addr = fields.Char()
            x_user_agent = fields.Char()

            @api.model
            def create_state(self, provider, *, state, code_verifier, redirect_uri, next_url="", link_user_id=False, ttl_minutes=10, remote_addr="", user_agent=""):
                expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=int(ttl_minutes))
                return self.create({{
                    "x_name": provider.x_key,
                    "x_provider_id": provider.id,
                    "x_state": state,
                    "x_code_verifier": code_verifier,
                    "x_redirect_uri": redirect_uri,
                    "x_next_url": next_url,
                    "x_link_user_id": link_user_id or False,
                    "x_expires_at": expires_at.strftime("%Y-%m-%d %H:%M:%S"),
                    "x_remote_addr": (remote_addr or "")[:128],
                    "x_user_agent": (user_agent or "")[:255],
                }})

            @api.model
            def consume_state(self, state):
                now = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
                record = self.search([
                    ("x_state", "=", state),
                    ("x_consumed", "=", False),
                    ("x_expires_at", ">=", now),
                ], limit=1)
                if record:
                    record.write({{"x_consumed": True}})
                return record
        '''
    ).strip() + "\n"


def _render_api_key_model(spec: OdooAppBridgeSpec) -> str:
    role_options = tuple((role.name, role.name.replace("_", " ").title()) for role in spec.roles if role.auth in {"bot", "internal"})
    if not role_options:
        role_options = (("internal", "Internal"), ("bot", "Bot"))
    return textwrap.dedent(
        f'''
        """Hashed API keys for {spec.app.module} bot and internal API access."""

        from __future__ import annotations

        import base64
        import datetime
        import hashlib
        import hmac
        import secrets

        from odoo import api, fields, models


        class {_class_name(spec.app.module, "BridgeApiKey")}(models.Model):
            _name = {_api_key_model_name(spec)!r}
            _description = "{spec.app.name} API Key"
            _order = "create_date desc, id desc"

            x_name = fields.Char(required=True, index=True)
            x_role = fields.Selection({role_options!r}, string="Role", required=True, index=True)
            x_key_prefix = fields.Char(string="Key Prefix", readonly=True, index=True)
            x_key_hash = fields.Char(string="Key Hash", required=True, copy=False, readonly=True, index=True)
            x_active = fields.Boolean(default=True, index=True)
            x_expires_at = fields.Datetime(index=True)
            x_last_used_at = fields.Datetime(readonly=True)

            @api.model
            def create_key(self, name, role, *, expires_at=False):
                raw_key = "oab_" + secrets.token_urlsafe(36)
                record = self.create({{
                    "x_name": str(name or role or "API Key"),
                    "x_role": str(role or "internal"),
                    "x_key_prefix": raw_key[:12],
                    "x_key_hash": self.hash_key(raw_key),
                    "x_expires_at": expires_at or False,
                    "x_active": True,
                }})
                return raw_key, record

            @api.model
            def find_valid(self, raw_key):
                key_hash = self.hash_key(raw_key)
                now = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
                candidates = self.search([("x_active", "=", True), ("x_key_prefix", "=", str(raw_key or "")[:12])], limit=5)
                for candidate in candidates:
                    if candidate.x_expires_at and str(candidate.x_expires_at) < now:
                        continue
                    if hmac.compare_digest(candidate.x_key_hash or "", key_hash):
                        return candidate
                return self.browse()

            def touch_usage(self):
                self.write({{"x_last_used_at": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")}})

            @staticmethod
            def hash_key(raw_key):
                digest = hashlib.sha256(str(raw_key or "").encode("utf-8")).digest()
                return base64.urlsafe_b64encode(digest).decode("ascii")
        '''
    ).strip() + "\n"


def _render_cron_model(spec: OdooAppBridgeSpec) -> str:
    return textwrap.dedent(
        f'''
        """Cron bridge for {spec.app.module}."""

        from __future__ import annotations

        from odoo import models


        class {_class_name(spec.app.module, "BridgeCron")}(models.AbstractModel):
            _name = {_cron_model_name(spec)!r}
            _description = "{spec.app.name} Cron Bridge"

            def _run_bridge_cron(self, name):
                from ..services import BridgeRuntime

                return BridgeRuntime(self.env).run_cron(name)
        '''
    ).strip() + "\n"


def _render_rate_limit_model(spec: OdooAppBridgeSpec) -> str:
    return textwrap.dedent(
        f'''
        """Dependency-free fixed-window rate limit counters for {spec.app.module}."""

        from __future__ import annotations

        from odoo import api, fields, models


        class {_class_name(spec.app.module, "BridgeRateLimit")}(models.Model):
            _name = {_rate_limit_model_name(spec)!r}
            _description = "{spec.app.name} Rate Limit Counter"
            _order = "write_date desc, id desc"

            x_name = fields.Char(required=True, index=True)
            x_subject = fields.Char(required=True, index=True)
            x_route = fields.Char(required=True, index=True)
            x_window = fields.Char(required=True, index=True)
            x_count = fields.Integer(default=0)

            _sql_constraints = [
                ("x_subject_route_window_unique", "unique(x_subject, x_route, x_window)", "Rate limit window must be unique."),
            ]

            @api.model
            def hit(self, subject, route, window, limit):
                subject = str(subject or "anonymous")[:160]
                route = str(route or "")[:200]
                window = str(window or "")[:32]
                record = self.search([("x_subject", "=", subject), ("x_route", "=", route), ("x_window", "=", window)], limit=1)
                if not record:
                    record = self.create({{"x_name": subject + ":" + route, "x_subject": subject, "x_route": route, "x_window": window, "x_count": 0}})
                count = int(record.x_count or 0) + 1
                record.write({{"x_count": count}})
                if count > int(limit):
                    return False, 60
                return True, 0
        '''
    ).strip() + "\n"


def _render_external_auth_model(spec: OdooAppBridgeSpec) -> str:
    return textwrap.dedent(
        f'''
        """External identity links for {spec.app.module} app users."""

        from __future__ import annotations

        from odoo import fields, models


        class {_class_name(spec.app.module, "BridgeExternalAuth")}(models.Model):
            _name = {_external_auth_model_name(spec)!r}
            _description = "{spec.app.name} External Auth Link"
            _order = "write_date desc, id desc"

            x_name = fields.Char(required=True, index=True)
            x_user_id = fields.Many2one({_app_user_model_name(spec)!r}, string="App User", required=True, ondelete="cascade", index=True)
            x_provider_key = fields.Char(required=True, index=True)
            x_provider_user_id = fields.Char(required=True, index=True)
            x_provider_email = fields.Char(index=True)
            x_provider_name = fields.Char()
            x_provider_avatar_url = fields.Char()
            x_active = fields.Boolean(default=True, index=True)
            x_last_login_at = fields.Datetime(readonly=True)

            _sql_constraints = [
                ("x_provider_user_unique", "unique(x_provider_key, x_provider_user_id)", "External auth identity must be unique per provider."),
            ]
        '''
    ).strip() + "\n"


def _render_security_csv(spec: OdooAppBridgeSpec) -> str:
    log_model_id = f"model_{_log_model_name(spec).replace('.', '_')}"
    operation_model_id = f"model_{_operation_model_name(spec).replace('.', '_')}"
    app_user_model_id = f"model_{_app_user_model_name(spec).replace('.', '_')}"
    app_session_model_id = f"model_{_app_session_model_name(spec).replace('.', '_')}"
    api_key_model_id = f"model_{_api_key_model_name(spec).replace('.', '_')}"
    rate_limit_model_id = f"model_{_rate_limit_model_name(spec).replace('.', '_')}"
    auth_provider_model_id = f"model_{_auth_provider_model_name(spec).replace('.', '_')}"
    auth_state_model_id = f"model_{_auth_state_model_name(spec).replace('.', '_')}"
    external_auth_model_id = f"model_{_external_auth_model_name(spec).replace('.', '_')}"
    security_finding_model_id = f"model_{_security_finding_model_name(spec).replace('.', '_')}"
    security_gate_model_id = f"model_{_security_gate_model_name(spec).replace('.', '_')}"
    security_wizard_model_id = f"model_{_security_wizard_model_name(spec).replace('.', '_')}"
    return (
        "id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink\n"
        f"access_{spec.app.module}_bridge_app_user_admin,{spec.app.name} app user admin,{app_user_model_id},base.group_system,1,1,1,1\n"
        f"access_{spec.app.module}_bridge_app_session_admin,{spec.app.name} app session admin,{app_session_model_id},base.group_system,1,1,0,1\n"
        f"access_{spec.app.module}_bridge_api_key_admin,{spec.app.name} api key admin,{api_key_model_id},base.group_system,1,1,1,1\n"
        f"access_{spec.app.module}_bridge_auth_provider_admin,{spec.app.name} auth provider admin,{auth_provider_model_id},base.group_system,1,1,1,1\n"
        f"access_{spec.app.module}_bridge_auth_state_admin,{spec.app.name} auth state admin,{auth_state_model_id},base.group_system,1,1,0,1\n"
        f"access_{spec.app.module}_bridge_external_auth_admin,{spec.app.name} external auth admin,{external_auth_model_id},base.group_system,1,1,1,1\n"
        f"access_{spec.app.module}_bridge_log_admin,{spec.app.name} bridge log admin,{log_model_id},base.group_system,1,1,1,1\n"
        f"access_{spec.app.module}_bridge_operation_admin,{spec.app.name} bridge operation admin,{operation_model_id},base.group_system,1,1,0,0\n"
        f"access_{spec.app.module}_bridge_rate_limit_admin,{spec.app.name} rate limit admin,{rate_limit_model_id},base.group_system,1,1,0,1\n"
        f"access_{spec.app.module}_bridge_security_finding_admin,{spec.app.name} security finding admin,{security_finding_model_id},base.group_system,1,1,1,1\n"
        f"access_{spec.app.module}_bridge_security_gate_admin,{spec.app.name} security gate admin,{security_gate_model_id},base.group_system,1,1,1,1\n"
        f"access_{spec.app.module}_bridge_security_wizard_admin,{spec.app.name} security wizard admin,{security_wizard_model_id},base.group_system,1,1,1,1\n"
    )


def _render_operation_data_xml(spec: OdooAppBridgeSpec) -> str:
    records = []
    for index, operation in enumerate(_operation_catalog(spec), start=1):
        xml_id = f"bridge_operation_{operation['kind']}_{_xml_id_token(operation['name'])}"
        fields = "\n".join(
            f'        <field name="{field_name}">{_xml_escape(value)}</field>'
            for field_name, value in (
                ("x_name", operation["name"]),
                ("x_kind", operation["kind"]),
                ("x_path", operation["path"]),
                ("x_public_url", operation["public_url"]),
                ("x_role", operation["role"]),
                ("x_auth", operation["auth"]),
                ("x_model", operation["model"]),
                ("x_method", operation["method"]),
                ("x_tags", operation["tags"]),
                ("x_risk_tags", operation["risk_tags"]),
                ("x_summary", operation["summary"]),
                ("x_contract_digest", spec.contract_digest()),
                ("x_sequence", str(index * 10)),
            )
        )
        records.append(
            f"""    <record id="{xml_id}" model="{_operation_model_name(spec)}">
{fields}
        <field name="x_active">True</field>
    </record>"""
        )
    return "<odoo>\n" + "\n\n".join(records) + "\n</odoo>\n"


def _render_cron_data_xml(spec: OdooAppBridgeSpec) -> str:
    records = []
    model_ref = f"model_{_cron_model_name(spec).replace('.', '_')}"
    for cron in spec.crons:
        token = _xml_id_token(cron.name)
        active = "True" if cron.active else "False"
        records.append(
            textwrap.dedent(
                f"""
                <record id="ir_cron_{token}" model="ir.cron">
                    <field name="name">{_xml_escape(spec.app.name)}: {_xml_escape(cron.name)}</field>
                    <field name="model_id" ref="{model_ref}"/>
                    <field name="state">code</field>
                    <field name="code">model._run_bridge_cron('{_xml_escape(cron.name)}')</field>
                    <field name="interval_number">{int(cron.interval_number)}</field>
                    <field name="interval_type">{_xml_escape(cron.interval_type)}</field>
                    <field name="active" eval="{active}"/>
                </record>
                """
            ).strip()
        )
    return "<odoo>\n" + "\n\n".join(records) + "\n</odoo>\n"


def _render_operation_views_xml(spec: OdooAppBridgeSpec) -> str:
    token = spec.app.module
    model_name = _operation_model_name(spec)
    public_entrypoint = f"/{spec.app.public_prefix}/{spec.app.slug}"
    return textwrap.dedent(
        f"""
        <odoo>
            <record id="view_{token}_bridge_operation_list" model="ir.ui.view">
                <field name="name">{spec.app.name} bridge operation list</field>
                <field name="model">{model_name}</field>
                <field name="arch" type="xml">
                    <list create="false" edit="false" delete="false">
                        <field name="x_sequence" optional="hide"/>
                        <field name="x_name"/>
                        <field name="x_kind"/>
                        <field name="x_path"/>
                        <field name="x_auth"/>
                        <field name="x_role"/>
                        <field name="x_model"/>
                        <field name="x_method"/>
                        <field name="x_risk_tags"/>
                    </list>
                </field>
            </record>

            <record id="view_{token}_bridge_operation_form" model="ir.ui.view">
                <field name="name">{spec.app.name} bridge operation form</field>
                <field name="model">{model_name}</field>
                <field name="arch" type="xml">
                    <form create="false" edit="false" delete="false">
                        <sheet>
                            <group>
                                <group>
                                    <field name="x_name"/>
                                    <field name="x_kind"/>
                                    <field name="x_path"/>
                                    <field name="x_public_url"/>
                                    <field name="x_active"/>
                                </group>
                                <group>
                                    <field name="x_auth"/>
                                    <field name="x_role"/>
                                    <field name="x_model"/>
                                    <field name="x_method"/>
                                    <field name="x_contract_digest"/>
                                </group>
                            </group>
                            <group>
                                <field name="x_tags"/>
                                <field name="x_risk_tags"/>
                            </group>
                            <field name="x_summary" nolabel="1"/>
                        </sheet>
                    </form>
                </field>
            </record>

            <record id="view_{token}_bridge_operation_search" model="ir.ui.view">
                <field name="name">{spec.app.name} bridge operation search</field>
                <field name="model">{model_name}</field>
                <field name="arch" type="xml">
                    <search>
                        <field name="x_name"/>
                        <field name="x_path"/>
                        <field name="x_model"/>
                        <filter name="kind_query" string="Queries" domain="[('x_kind', '=', 'query')]"/>
                        <filter name="kind_command" string="Commands" domain="[('x_kind', '=', 'command')]"/>
                        <filter name="kind_event" string="Events" domain="[('x_kind', '=', 'event')]"/>
                        <group expand="0" string="Group By">
                            <filter name="group_kind" string="Kind" context="{{'group_by': 'x_kind'}}"/>
                            <filter name="group_auth" string="Auth" context="{{'group_by': 'x_auth'}}"/>
                        </group>
                    </search>
                </field>
            </record>

            <record id="action_{token}_bridge_operation" model="ir.actions.act_window">
                <field name="name">{spec.app.name} Operation Catalog</field>
                <field name="res_model">{model_name}</field>
                <field name="view_mode">list,form</field>
            </record>

            <record id="action_{token}_public_app" model="ir.actions.act_url">
                <field name="name">Open Public App</field>
                <field name="url">{public_entrypoint}</field>
                <field name="target">self</field>
            </record>

            <menuitem id="menu_{token}_root" name="{spec.app.name}" groups="base.group_system" sequence="80"/>
            <menuitem id="menu_{token}_public_app" name="Open Public App" parent="menu_{token}_root" action="action_{token}_public_app" groups="base.group_system" sequence="5"/>
            <menuitem id="menu_{token}_bridge_operations" name="Operation Catalog" parent="menu_{token}_root" action="action_{token}_bridge_operation" groups="base.group_system" sequence="10"/>
        </odoo>
        """
    ).strip() + "\n"


def _render_security_views_xml(spec: OdooAppBridgeSpec) -> str:
    token = spec.app.module
    finding_model = _security_finding_model_name(spec)
    gate_model = _security_gate_model_name(spec)
    wizard_model = _security_wizard_model_name(spec)
    return textwrap.dedent(
        f"""
        <odoo>
            <record id="view_{token}_bridge_security_gate_list" model="ir.ui.view">
                <field name="name">{spec.app.name} security gate list</field>
                <field name="model">{gate_model}</field>
                <field name="arch" type="xml">
                    <list create="false" edit="false">
                        <field name="x_name"/>
                        <field name="x_score"/>
                        <field name="x_release_ready"/>
                        <field name="x_blocking_count"/>
                        <field name="x_findings_count"/>
                        <field name="x_contract_digest"/>
                    </list>
                </field>
            </record>

            <record id="view_{token}_bridge_security_gate_form" model="ir.ui.view">
                <field name="name">{spec.app.name} security gate form</field>
                <field name="model">{gate_model}</field>
                <field name="arch" type="xml">
                    <form create="false" edit="false">
                        <sheet>
                            <group>
                                <group>
                                    <field name="x_score"/>
                                    <field name="x_release_ready"/>
                                    <field name="x_blocking_count"/>
                                    <field name="x_findings_count"/>
                                </group>
                                <group>
                                    <field name="x_contract_digest"/>
                                    <field name="x_generated_at"/>
                                </group>
                            </group>
                            <notebook>
                                <page string="Failure Reasons">
                                    <field name="x_failure_reasons" nolabel="1"/>
                                </page>
                                <page string="Severity Counts">
                                    <field name="x_counts_text" nolabel="1"/>
                                </page>
                                <page string="Evidence Report">
                                    <field name="x_report_text" nolabel="1"/>
                                </page>
                            </notebook>
                        </sheet>
                    </form>
                </field>
            </record>

            <record id="view_{token}_bridge_security_finding_list" model="ir.ui.view">
                <field name="name">{spec.app.name} security finding list</field>
                <field name="model">{finding_model}</field>
                <field name="arch" type="xml">
                    <list create="false">
                        <field name="x_severity"/>
                        <field name="x_code"/>
                        <field name="x_path"/>
                        <field name="x_message"/>
                        <field name="x_owasp"/>
                        <field name="x_active"/>
                    </list>
                </field>
            </record>

            <record id="view_{token}_bridge_security_finding_form" model="ir.ui.view">
                <field name="name">{spec.app.name} security finding form</field>
                <field name="model">{finding_model}</field>
                <field name="arch" type="xml">
                    <form>
                        <sheet>
                            <group>
                                <group>
                                    <field name="x_severity"/>
                                    <field name="x_code"/>
                                    <field name="x_path"/>
                                    <field name="x_owasp"/>
                                </group>
                                <group>
                                    <field name="x_contract_digest" readonly="1"/>
                                    <field name="x_active"/>
                                </group>
                            </group>
                            <group string="Message">
                                <field name="x_message" nolabel="1"/>
                            </group>
                            <group string="Recommendation">
                                <field name="x_recommendation" nolabel="1"/>
                            </group>
                        </sheet>
                    </form>
                </field>
            </record>

            <record id="view_{token}_bridge_security_finding_search" model="ir.ui.view">
                <field name="name">{spec.app.name} security finding search</field>
                <field name="model">{finding_model}</field>
                <field name="arch" type="xml">
                    <search>
                        <field name="x_code"/>
                        <field name="x_path"/>
                        <field name="x_message"/>
                        <filter name="severity_high" string="High+" domain="[('x_severity', 'in', ['critical', 'high'])]"/>
                        <filter name="active" string="Active" domain="[('x_active', '=', True)]"/>
                        <group expand="0" string="Group By">
                            <filter name="group_severity" string="Severity" context="{{'group_by': 'x_severity'}}"/>
                            <filter name="group_owasp" string="OWASP" context="{{'group_by': 'x_owasp'}}"/>
                        </group>
                    </search>
                </field>
            </record>

            <record id="view_{token}_bridge_security_wizard_form" model="ir.ui.view">
                <field name="name">{spec.app.name} security wizard form</field>
                <field name="model">{wizard_model}</field>
                <field name="arch" type="xml">
                    <form string="Security Center">
                        <group>
                            <field name="x_note" nolabel="1"/>
                            <field name="x_score" readonly="1"/>
                            <field name="x_release_ready" readonly="1"/>
                            <field name="x_blocking_count" readonly="1"/>
                            <field name="x_loaded_count" readonly="1"/>
                        </group>
                        <footer>
                            <button name="action_refresh_findings" string="Load / Update Findings" type="object" class="btn-primary"/>
                            <button string="Close" special="cancel"/>
                        </footer>
                    </form>
                </field>
            </record>

            <record id="action_{token}_bridge_security_gate" model="ir.actions.act_window">
                <field name="name">{spec.app.name} Release Gate</field>
                <field name="res_model">{gate_model}</field>
                <field name="view_mode">list,form</field>
            </record>

            <record id="action_{token}_bridge_security_finding" model="ir.actions.act_window">
                <field name="name">{spec.app.name} Security Center</field>
                <field name="res_model">{finding_model}</field>
                <field name="view_mode">list,form</field>
            </record>

            <record id="action_{token}_bridge_security_wizard" model="ir.actions.act_window">
                <field name="name">Refresh Security Findings</field>
                <field name="res_model">{wizard_model}</field>
                <field name="view_mode">form</field>
                <field name="target">new</field>
            </record>

            <menuitem id="menu_{token}_bridge_security_gate" name="Release Gate" parent="menu_{token}_root" action="action_{token}_bridge_security_gate" groups="base.group_system" sequence="11"/>
            <menuitem id="menu_{token}_bridge_security" name="Security Center" parent="menu_{token}_root" action="action_{token}_bridge_security_finding" groups="base.group_system" sequence="12"/>
            <menuitem id="menu_{token}_bridge_security_refresh" name="Refresh Findings" parent="menu_{token}_root" action="action_{token}_bridge_security_wizard" groups="base.group_system" sequence="14"/>
        </odoo>
        """
    ).strip() + "\n"


def _render_app_user_views_xml(spec: OdooAppBridgeSpec) -> str:
    token = spec.app.module
    user_model = _app_user_model_name(spec)
    session_model = _app_session_model_name(spec)
    return textwrap.dedent(
        f"""
        <odoo>
            <record id="view_{token}_app_user_list" model="ir.ui.view">
                <field name="name">{spec.app.name} app user list</field>
                <field name="model">{user_model}</field>
                <field name="arch" type="xml">
                    <list>
                        <field name="x_login"/>
                        <field name="x_name"/>
                        <field name="x_role"/>
                        <field name="x_active"/>
                        <field name="x_last_login_at"/>
                    </list>
                </field>
            </record>

            <record id="view_{token}_app_user_form" model="ir.ui.view">
                <field name="name">{spec.app.name} app user form</field>
                <field name="model">{user_model}</field>
                <field name="arch" type="xml">
                    <form>
                        <sheet>
                            <group>
                                <group>
                                    <field name="x_login"/>
                                    <field name="x_name"/>
                                    <field name="x_role"/>
                                    <field name="x_active"/>
                                </group>
                                <group>
                                    <field name="x_password_input" password="1"/>
                                    <field name="x_last_login_at" readonly="1"/>
                                    <field name="x_password_iterations" readonly="1"/>
                                </group>
                            </group>
                        </sheet>
                    </form>
                </field>
            </record>

            <record id="action_{token}_app_user" model="ir.actions.act_window">
                <field name="name">{spec.app.name} App Users</field>
                <field name="res_model">{user_model}</field>
                <field name="view_mode">list,form</field>
            </record>

            <record id="view_{token}_app_session_list" model="ir.ui.view">
                <field name="name">{spec.app.name} app session list</field>
                <field name="model">{session_model}</field>
                <field name="arch" type="xml">
                    <list create="false" edit="false">
                        <field name="x_user_id"/>
                        <field name="x_expires_at"/>
                        <field name="x_revoked"/>
                        <field name="x_remote_addr"/>
                        <field name="create_date"/>
                    </list>
                </field>
            </record>

            <record id="view_{token}_app_session_form" model="ir.ui.view">
                <field name="name">{spec.app.name} app session form</field>
                <field name="model">{session_model}</field>
                <field name="arch" type="xml">
                    <form create="false" edit="false">
                        <sheet>
                            <group>
                                <field name="x_user_id"/>
                                <field name="x_expires_at"/>
                                <field name="x_revoked"/>
                                <field name="x_remote_addr"/>
                                <field name="x_user_agent"/>
                            </group>
                        </sheet>
                    </form>
                </field>
            </record>

            <record id="action_{token}_app_session" model="ir.actions.act_window">
                <field name="name">{spec.app.name} App Sessions</field>
                <field name="res_model">{session_model}</field>
                <field name="view_mode">list,form</field>
            </record>

            <menuitem id="menu_{token}_app_users" name="App Users" parent="menu_{token}_root" action="action_{token}_app_user" groups="base.group_system" sequence="12"/>
            <menuitem id="menu_{token}_app_sessions" name="App Sessions" parent="menu_{token}_root" action="action_{token}_app_session" groups="base.group_system" sequence="14"/>
        </odoo>
        """
    ).strip() + "\n"


def _render_auth_views_xml(spec: OdooAppBridgeSpec) -> str:
    token = spec.app.module
    provider_model = _auth_provider_model_name(spec)
    external_model = _external_auth_model_name(spec)
    return textwrap.dedent(
        f"""
        <odoo>
            <record id="view_{token}_auth_provider_list" model="ir.ui.view">
                <field name="name">{spec.app.name} auth provider list</field>
                <field name="model">{provider_model}</field>
                <field name="arch" type="xml">
                    <list>
                        <field name="x_sequence" widget="handle"/>
                        <field name="x_name"/>
                        <field name="x_key"/>
                        <field name="x_active"/>
                        <field name="x_pkce_required"/>
                    </list>
                </field>
            </record>

            <record id="view_{token}_auth_provider_form" model="ir.ui.view">
                <field name="name">{spec.app.name} auth provider form</field>
                <field name="model">{provider_model}</field>
                <field name="arch" type="xml">
                    <form>
                        <sheet>
                            <group>
                                <group>
                                    <field name="x_name"/>
                                    <field name="x_key"/>
                                    <field name="x_active"/>
                                    <field name="x_sequence"/>
                                </group>
                                <group>
                                    <field name="x_client_id"/>
                                    <field name="x_client_secret" password="1"/>
                                    <field name="x_pkce_required"/>
                                    <field name="x_auto_create_users"/>
                                    <field name="x_allow_email_link"/>
                                </group>
                            </group>
                            <group>
                                <field name="x_auth_url"/>
                                <field name="x_redirect_uri"/>
                                <field name="x_token_url"/>
                                <field name="x_userinfo_url"/>
                                <field name="x_scope"/>
                            </group>
                        </sheet>
                    </form>
                </field>
            </record>

            <record id="action_{token}_auth_provider" model="ir.actions.act_window">
                <field name="name">{spec.app.name} Auth Providers</field>
                <field name="res_model">{provider_model}</field>
                <field name="view_mode">list,form</field>
            </record>

            <record id="view_{token}_external_auth_list" model="ir.ui.view">
                <field name="name">{spec.app.name} external auth list</field>
                <field name="model">{external_model}</field>
                <field name="arch" type="xml">
                    <list>
                        <field name="x_user_id"/>
                        <field name="x_provider_key"/>
                        <field name="x_provider_user_id"/>
                        <field name="x_provider_email"/>
                        <field name="x_active"/>
                        <field name="x_last_login_at"/>
                    </list>
                </field>
            </record>

            <record id="view_{token}_external_auth_form" model="ir.ui.view">
                <field name="name">{spec.app.name} external auth form</field>
                <field name="model">{external_model}</field>
                <field name="arch" type="xml">
                    <form>
                        <sheet>
                            <group>
                                <group>
                                    <field name="x_user_id"/>
                                    <field name="x_provider_key"/>
                                    <field name="x_provider_user_id"/>
                                    <field name="x_active"/>
                                </group>
                                <group>
                                    <field name="x_provider_email"/>
                                    <field name="x_provider_name"/>
                                    <field name="x_provider_avatar_url"/>
                                    <field name="x_last_login_at" readonly="1"/>
                                </group>
                            </group>
                        </sheet>
                    </form>
                </field>
            </record>

            <record id="action_{token}_external_auth" model="ir.actions.act_window">
                <field name="name">{spec.app.name} External Auth Links</field>
                <field name="res_model">{external_model}</field>
                <field name="view_mode">list,form</field>
            </record>

            <menuitem id="menu_{token}_auth_providers" name="Auth Providers" parent="menu_{token}_root" action="action_{token}_auth_provider" groups="base.group_system" sequence="16"/>
            <menuitem id="menu_{token}_external_auths" name="External Auth Links" parent="menu_{token}_root" action="action_{token}_external_auth" groups="base.group_system" sequence="18"/>
        </odoo>
        """
    ).strip() + "\n"


def _render_cron_views_xml(spec: OdooAppBridgeSpec) -> str:
    token = spec.app.module
    cron_model = "ir.cron"
    domain = "[('code', 'ilike', \"model._run_bridge_cron\")]"
    return textwrap.dedent(
        f"""
        <odoo>
            <record id="action_{token}_bridge_crons" model="ir.actions.act_window">
                <field name="name">{spec.app.name} Scheduled Jobs</field>
                <field name="res_model">{cron_model}</field>
                <field name="view_mode">list,form</field>
                <field name="domain">{_xml_escape(domain)}</field>
            </record>

            <menuitem id="menu_{token}_bridge_crons" name="Scheduled Jobs" parent="menu_{token}_root" action="action_{token}_bridge_crons" groups="base.group_system" sequence="19"/>
        </odoo>
        """
    ).strip() + "\n"


def _render_views_xml(spec: OdooAppBridgeSpec) -> str:
    token = spec.app.module
    model_name = _log_model_name(spec)
    return textwrap.dedent(
        f"""
        <odoo>
            <record id="view_{token}_bridge_log_list" model="ir.ui.view">
                <field name="name">{spec.app.name} bridge log list</field>
                <field name="model">{model_name}</field>
                <field name="arch" type="xml">
                    <list create="false" edit="false" delete="false">
                        <field name="x_request_id"/>
                        <field name="x_route"/>
                        <field name="x_endpoint_type"/>
                        <field name="x_ok"/>
                        <field name="x_status_code"/>
                        <field name="x_error_code"/>
                        <field name="x_user_id"/>
                        <field name="x_http_method"/>
                        <field name="x_idempotency_key"/>
                        <field name="create_date"/>
                    </list>
                </field>
            </record>

            <record id="view_{token}_bridge_log_form" model="ir.ui.view">
                <field name="name">{spec.app.name} bridge log form</field>
                <field name="model">{model_name}</field>
                <field name="arch" type="xml">
                    <form create="false" delete="false">
                        <sheet>
                            <group>
                                <group>
                                    <field name="x_request_id" readonly="1"/>
                                    <field name="x_route" readonly="1"/>
                                    <field name="x_endpoint_type" readonly="1"/>
                                    <field name="x_ok" readonly="1"/>
                                    <field name="x_status_code" readonly="1"/>
                                    <field name="x_error_code" readonly="1"/>
                                </group>
                                <group>
                                    <field name="x_user_id" readonly="1"/>
                                    <field name="x_http_method" readonly="1"/>
                                    <field name="x_idempotency_key" readonly="1"/>
                                    <field name="x_remote_addr" readonly="1"/>
                                    <field name="create_date" readonly="1"/>
                                </group>
                            </group>
                            <notebook>
                                <page string="Payload">
                                    <field name="x_payload_text" nolabel="1" readonly="1"/>
                                </page>
                                <page string="Response">
                                    <field name="x_response_text" nolabel="1" readonly="1"/>
                                </page>
                            </notebook>
                        </sheet>
                    </form>
                </field>
            </record>

            <record id="action_{token}_bridge_log" model="ir.actions.act_window">
                <field name="name">{spec.app.name} Request Logs</field>
                <field name="res_model">{model_name}</field>
                <field name="view_mode">list,form</field>
            </record>

            <menuitem id="menu_{token}_bridge_logs" name="Request Logs" parent="menu_{token}_root" action="action_{token}_bridge_log" groups="base.group_system" sequence="20"/>
        </odoo>
        """
    ).strip() + "\n"


def _render_odoo_test(spec: OdooAppBridgeSpec) -> str:
    return textwrap.dedent(
        f'''
        from __future__ import annotations

        from odoo.tests.common import TransactionCase


        class Test{_class_name(spec.app.module, "BridgeRuntime")}(TransactionCase):
            def test_runtime_health(self):
                from odoo.addons.{spec.app.module}.services import BridgeRuntime

                status, envelope = BridgeRuntime(self.env).dispatch(
                    "health",
                    payload={{}},
                    headers={{}},
                    method="GET",
                    user=self.env.user,
                    csrf_token="test",
                    csrf_valid=True,
                    cookies={{}},
                    remote_addr="127.0.0.1",
                    user_agent="unit-test",
                )

                self.assertEqual(status, 200)
                self.assertTrue(envelope["ok"])
        '''
    ).strip() + "\n"


def _operation_catalog(spec: OdooAppBridgeSpec) -> list[dict[str, str]]:
    public_root = f"/{spec.app.public_prefix}/{spec.app.slug}".replace("//", "/")
    operations: list[dict[str, str]] = [
        _operation_item(
            name="health",
            kind="meta",
            path="health",
            public_url=f"{public_root}/health",
            role="public",
            auth="public",
            summary="Runtime health, contract digest and operation counts.",
        ),
        _operation_item(
            name="readiness",
            kind="meta",
            path="readiness",
            public_url=f"{public_root}/readiness",
            role="internal_meta",
            auth="internal",
            summary="Release readiness checks for registry, generated models and security gate state.",
        ),
        _operation_item(
            name="metrics",
            kind="meta",
            path="metrics",
            public_url=f"{public_root}/metrics",
            role="internal_meta",
            auth="internal",
            summary="Operational metrics summary for logs, route counts, rate limits and security gate status.",
        ),
        _operation_item(
            name="security_report",
            kind="meta",
            path="security_report",
            public_url=f"{public_root}/security_report",
            role="internal_meta",
            auth="internal",
            summary="Auditable generated security release report for CI and admin review.",
        ),
        _operation_item(
            name="csrf",
            kind="meta",
            path="csrf",
            public_url=f"{public_root}/csrf",
            role="session",
            auth="portal",
            summary="Session CSRF token for commands that require CSRF.",
        ),
    ]
    if spec.security.enable_app_login:
        operations.extend(
            [
                _operation_item(
                    name="auth_login",
                    kind="meta",
                    path="auth/login",
                    public_url=f"{public_root}/auth/login",
                    role="app_local",
                    auth="public",
                    summary="App-local username/password login that issues an HttpOnly app session cookie.",
                ),
                _operation_item(
                    name="auth_me",
                    kind="meta",
                    path="auth/me",
                    public_url=f"{public_root}/auth/me",
                    role="app_local",
                    auth="app_user",
                    summary="Current app-local user session payload.",
                ),
                _operation_item(
                    name="auth_logout",
                    kind="meta",
                    path="auth/logout",
                    public_url=f"{public_root}/auth/logout",
                    role="app_local",
                    auth="app_user",
                    summary="Revokes the current app-local session.",
                ),
                _operation_item(
                    name="auth_oauth2_providers",
                    kind="meta",
                    path="auth/oauth2/providers",
                    public_url=f"{public_root}/auth/oauth2/providers",
                    role="app_local",
                    auth="public",
                    summary="Public social login provider discovery without provider secrets.",
                ),
                _operation_item(
                    name="auth_oauth2_start",
                    kind="meta",
                    path="auth/oauth2/start",
                    public_url=f"{public_root}/auth/oauth2/start",
                    role="app_local",
                    auth="public",
                    summary="Starts OAuth2 login with state and PKCE verifier storage.",
                ),
                _operation_item(
                    name="auth_oauth2_callback",
                    kind="meta",
                    path="auth/oauth2/callback",
                    public_url=f"{public_root}/auth/oauth2/callback",
                    role="app_local",
                    auth="public",
                    summary="Completes OAuth2 login, links identity and issues an app session.",
                ),
                _operation_item(
                    name="auth_oauth2_link",
                    kind="meta",
                    path="auth/oauth2/link",
                    public_url=f"{public_root}/auth/oauth2/link",
                    role="app_local",
                    auth="app_user",
                    summary="Starts OAuth2 link flow for the current app user.",
                ),
                _operation_item(
                    name="auth_oauth2_unlink",
                    kind="meta",
                    path="auth/oauth2/unlink",
                    public_url=f"{public_root}/auth/oauth2/unlink",
                    role="app_local",
                    auth="app_user",
                    summary="Disables social identity links for the current app user.",
                ),
            ]
        )
    if spec.security.expose_contract_endpoint:
        operations.append(
            _operation_item(
                name="contract",
                kind="meta",
                path="contract",
                public_url=f"{public_root}/contract",
                role="internal_meta",
                auth="internal",
                summary="Full bridge contract snapshot.",
            )
        )
    if spec.security.expose_openapi_endpoint:
        operations.append(
            _operation_item(
                name="openapi",
                kind="meta",
                path="openapi",
                public_url=f"{public_root}/openapi",
                role="internal_meta",
                auth="internal",
                summary="OpenAPI 3.1 document generated from the bridge contract.",
            )
        )
    if spec.security.expose_asyncapi_endpoint:
        operations.append(
            _operation_item(
                name="asyncapi",
                kind="meta",
                path="asyncapi",
                public_url=f"{public_root}/asyncapi",
                role="internal_meta",
                auth="internal",
                summary="AsyncAPI 3.0 document generated from event contracts.",
            )
        )
    for query in spec.queries:
        role = spec.role_by_name(query.role)
        operations.append(
            _operation_item(
                name=query.name,
                kind="query",
                path=query.path,
                public_url=f"{public_root}/{query.path}",
                role=query.role,
                auth=role.auth,
                model=query.model,
                tags=", ".join(query.tags),
                risk_tags=", ".join(query.risk_tags),
                summary=query.notes or f"Query {query.name}.",
            )
        )
    for command in spec.commands:
        role = spec.role_by_name(command.role)
        operations.append(
            _operation_item(
                name=command.name,
                kind="command",
                path=command.path,
                public_url=f"{public_root}/{command.path}",
                role=command.role,
                auth=role.auth,
                model=command.model,
                method=command.method,
                tags=", ".join(command.tags),
                risk_tags=", ".join(command.risk_tags),
                summary=command.notes or f"Command {command.name}.",
            )
        )
    for function in spec.functions:
        role = spec.role_by_name(function.role)
        operations.append(
            _operation_item(
                name=function.name,
                kind="function",
                path=function.path,
                public_url=f"{public_root}/{function.path}",
                role=function.role,
                auth=role.auth,
                method=function.handler,
                tags=", ".join(function.tags),
                risk_tags=", ".join(function.risk_tags),
                summary=function.notes or f"Function {function.name}.",
            )
        )
    for cron in spec.crons:
        operations.append(
            _operation_item(
                name=cron.name,
                kind="cron",
                path=cron.name,
                public_url="",
                role="system",
                auth="internal",
                method=cron.handler,
                tags=", ".join(cron.tags),
                summary=cron.notes or f"Scheduled job {cron.name}.",
            )
        )
    for event in spec.events:
        role_name = event.role or ""
        auth = spec.role_by_name(role_name).auth if role_name else ""
        operations.append(
            _operation_item(
                name=event.name,
                kind="event",
                path=event.channel,
                public_url=event.channel,
                role=role_name,
                auth=auth,
                method=event.direction,
                tags=", ".join(event.tags),
                summary=event.summary or event.description or f"Event {event.name}.",
            )
        )
    return operations


def _operation_item(**values: str) -> dict[str, str]:
    keys = (
        "name",
        "kind",
        "path",
        "public_url",
        "role",
        "auth",
        "model",
        "method",
        "tags",
        "risk_tags",
        "summary",
    )
    return {key: str(values.get(key) or "") for key in keys}


def _security_finding_seed(spec: OdooAppBridgeSpec) -> list[dict[str, str]]:
    findings: list[dict[str, str]] = [
        {
            "severity": "info",
            "code": "BRIDGE_CONTRACT_EMBEDDED",
            "path": "/",
            "message": "Generated addon includes a static Security Center seed derived from the bridge contract.",
            "recommendation": "Refresh findings after install and after each generated contract update.",
            "owasp": "A05:2021 Security Misconfiguration",
        }
    ]
    findings.extend(finding.as_dict() for finding in scan_app_bridge_security(spec))
    for operation in _operation_catalog(spec):
        path = operation["path"] or operation["name"]
        if operation["risk_tags"]:
            findings.append(
                {
                    "severity": "medium",
                    "code": f"BRIDGE_RISK_TAGS_{_xml_id_token(operation['name']).upper()}",
                    "path": path,
                    "message": f"Operation {operation['name']} declares risk tags: {operation['risk_tags']}.",
                    "recommendation": "Review role, auth mode and generated hook policy before exposing this operation.",
                    "owasp": "A01:2021 Broken Access Control",
                }
            )
        if operation["kind"] in {"command", "function"} and operation["auth"] == "public":
            findings.append(
                {
                    "severity": "high",
                    "code": f"BRIDGE_PUBLIC_MUTATION_{_xml_id_token(operation['name']).upper()}",
                    "path": path,
                    "message": f"State-changing operation {operation['name']} is reachable with public auth.",
                    "recommendation": "Require an internal or app-local role unless this endpoint is intentionally anonymous.",
                    "owasp": "A01:2021 Broken Access Control",
                }
            )
        if operation["kind"] == "meta" and operation["name"] in {"contract", "openapi", "asyncapi"}:
            findings.append(
                {
                    "severity": "low",
                    "code": f"BRIDGE_META_EXPOSURE_{operation['name'].upper()}",
                    "path": path,
                    "message": f"Generated metadata endpoint {operation['name']} can expose contract structure to allowed users.",
                    "recommendation": "Keep metadata endpoints internal unless contract discovery is required operationally.",
                    "owasp": "A05:2021 Security Misconfiguration",
                }
            )
    return findings


def _security_report_seed(spec: OdooAppBridgeSpec) -> dict[str, Any]:
    findings = _security_finding_seed(spec)
    scanner_report = evaluate_app_bridge_security_release(spec).as_dict()
    counts = _security_counts(findings)
    score = _security_score(findings)
    blocking = [item for item in findings if item.get("severity") in {"critical", "high"}]
    failure_reasons: list[str] = []
    if not scanner_report.get("passed"):
        failure_reasons.extend(str(item) for item in scanner_report.get("failure_reasons", ()))
    if score < 90:
        failure_reasons.append(f"generated security score {score} is below minimum 90")
    if blocking:
        failure_reasons.append("blocking generated security findings are present")
    return {
        "passed": not failure_reasons,
        "release_ready": not failure_reasons,
        "score": score,
        "blocking_count": len(blocking),
        "findings_count": len(findings),
        "counts_by_severity": counts,
        "failure_reasons": failure_reasons,
        "blocking_findings": blocking,
        "findings": findings,
        "scanner": scanner_report,
        "contract_digest": spec.contract_digest(),
        "app": {
            "name": spec.app.name,
            "slug": spec.app.slug,
            "module": spec.app.module,
            "version": spec.app.version,
        },
        "thresholds": {
            "min_score": 90,
            "block_severities": ["critical", "high"],
        },
    }


def _security_counts(findings: list[dict[str, str]]) -> dict[str, int]:
    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
    for item in findings:
        severity = item.get("severity") or "info"
        counts[severity] = counts.get(severity, 0) + 1
    return counts


def _security_score(findings: list[dict[str, str]]) -> int:
    penalties = {"critical": 40, "high": 15, "medium": 5, "low": 2, "info": 0}
    penalty = sum(penalties.get(item.get("severity") or "info", 0) for item in findings)
    return max(0, 100 - penalty)


def _log_model_name(spec: OdooAppBridgeSpec) -> str:
    return f"{spec.app.module}.bridge_log"


def _operation_model_name(spec: OdooAppBridgeSpec) -> str:
    return f"{spec.app.module}.bridge_operation"


def _rate_limit_model_name(spec: OdooAppBridgeSpec) -> str:
    return f"{spec.app.module}.rate_limit"


def _security_finding_model_name(spec: OdooAppBridgeSpec) -> str:
    return f"{spec.app.module}.bridge_security_finding"


def _security_gate_model_name(spec: OdooAppBridgeSpec) -> str:
    return f"{spec.app.module}.bridge_security_gate"


def _security_wizard_model_name(spec: OdooAppBridgeSpec) -> str:
    return f"{spec.app.module}.bridge_security_wizard"


def _app_user_model_name(spec: OdooAppBridgeSpec) -> str:
    return f"{spec.app.module}.app_user"


def _app_session_model_name(spec: OdooAppBridgeSpec) -> str:
    return f"{spec.app.module}.app_session"


def _api_key_model_name(spec: OdooAppBridgeSpec) -> str:
    return f"{spec.app.module}.api_key"


def _auth_provider_model_name(spec: OdooAppBridgeSpec) -> str:
    return f"{spec.app.module}.auth_provider"


def _auth_state_model_name(spec: OdooAppBridgeSpec) -> str:
    return f"{spec.app.module}.auth_state"


def _cron_model_name(spec: OdooAppBridgeSpec) -> str:
    return f"{spec.app.module}.bridge_cron"


def _external_auth_model_name(spec: OdooAppBridgeSpec) -> str:
    return f"{spec.app.module}.external_auth"


def _class_name(module: str, suffix: str) -> str:
    return "".join(part.capitalize() for part in module.split("_") if part) + suffix


def _handler_symbol(handler: str) -> str:
    token = "".join(char if char.isalnum() else "_" for char in handler).strip("_").lower() or "handler"
    if token[:1].isdigit():
        token = "handler_" + token
    return "handle_" + token


def _xml_id_token(value: str) -> str:
    return "".join(char if char.isalnum() else "_" for char in value.lower()).strip("_") or "operation"


def _xml_escape(value: Any) -> str:
    return (
        str(value)
        .replace("&", "&amp;")
        .replace('"', "&quot;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def _normalize_relative_path(value: Any) -> Path:
    raw = str(value or "").strip().replace("\\", "/").lstrip("/")
    if not raw:
        raise ValueError("App bridge relative path is required")
    path = PurePosixPath(raw)
    if path.is_absolute() or any(part in {"", ".", ".."} for part in path.parts):
        raise ValueError(f"App bridge path must be relative and normalized: {value!r}")
    if path.parts and ":" in path.parts[0]:
        raise ValueError(f"App bridge path must not include drive prefix: {value!r}")
    return Path(path.as_posix())


def _reject_duplicate_paths(files: list[AppBridgeModuleFile]) -> None:
    seen: set[str] = set()
    duplicates: set[str] = set()
    for file in files:
        key = file.relative_path.as_posix()
        if key in seen:
            duplicates.add(key)
        seen.add(key)
    if duplicates:
        raise ValueError(f"Duplicate generated app bridge files: {', '.join(sorted(duplicates))}")


def _coerce_extra_module_files(extra_files: Iterable[AppBridgeModuleFile | Mapping[str, Any]]) -> list[AppBridgeModuleFile]:
    coerced: list[AppBridgeModuleFile] = []
    for raw_file in extra_files:
        if isinstance(raw_file, AppBridgeModuleFile):
            coerced.append(raw_file)
            continue
        data = dict(raw_file)
        coerced.append(
            AppBridgeModuleFile(
                relative_path=Path(str(data.get("relative_path") or "")),
                content=str(data.get("content") or ""),
                layer=str(data.get("layer") or "extra"),
            )
        )
    return coerced


def _ensure_newline(value: str) -> str:
    return value if value.endswith("\n") else f"{value}\n"


__all__ = [
    "AppBridgeModuleFile",
    "build_app_bridge_module_files",
    "write_app_bridge_module",
    "write_app_bridge_module_zip",
]
