"""PocketBase-inspired blueprint helpers for generated Odoo apps."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Mapping

from .contracts import OdooAppBridgeSpec, app_bridge_spec_from_mapping


@dataclass(frozen=True)
class OdooBaseGoodie:
    """A portable feature idea mapped from PocketBase into Odoo App Bridge."""

    key: str
    title: str
    status: str
    pocketbase_signal: str
    odoo_translation: str
    generated_files: tuple[str, ...] = ()
    next_steps: tuple[str, ...] = ()

    def to_mapping(self) -> dict[str, Any]:
        return {
            "key": self.key,
            "title": self.title,
            "status": self.status,
            "pocketbase_signal": self.pocketbase_signal,
            "odoo_translation": self.odoo_translation,
            "generated_files": list(self.generated_files),
            "next_steps": list(self.next_steps),
        }


@dataclass(frozen=True)
class OdooBaseBlueprint:
    """The OdooBase product surface for one generated app."""

    app_slug: str
    module: str
    dependency_policy: str
    generated_layers: tuple[str, ...]
    goodies: tuple[OdooBaseGoodie, ...]

    def to_mapping(self) -> dict[str, Any]:
        return {
            "app_slug": self.app_slug,
            "module": self.module,
            "dependency_policy": self.dependency_policy,
            "generated_layers": list(self.generated_layers),
            "goodies": [goodie.to_mapping() for goodie in self.goodies],
        }

    def goodie_by_key(self, key: str) -> OdooBaseGoodie:
        for goodie in self.goodies:
            if goodie.key == key:
                return goodie
        raise KeyError(key)


def build_odoobase_blueprint(spec: OdooAppBridgeSpec | Mapping[str, Any]) -> OdooBaseBlueprint:
    """Return the current OdooBase map for a bridge spec.

    OdooBase is the opinionated direction layered on top of Odoo App Bridge:
    an Odoo-mounted app runtime that borrows PocketBase's compact product
    grammar while keeping generated addons base-only and admin friendly.
    """
    bridge_spec = spec if isinstance(spec, OdooAppBridgeSpec) else app_bridge_spec_from_mapping(spec)
    return OdooBaseBlueprint(
        app_slug=bridge_spec.app.slug,
        module=bridge_spec.app.module,
        dependency_policy="base-only generated addon; no website, sale, mail, portal, or vertical dependency by default",
        generated_layers=(
            "public controller",
            "app-local auth controller routes",
            "service runtime",
            "app users",
            "hashed app sessions",
            "auth provider records",
            "external auth links",
            "oauth state records",
            "function routes",
            "scheduled jobs",
            "hook surface",
            "release gate",
            "readiness and metrics endpoints",
            "operation catalog",
            "request log",
            "browser SDK",
            "OpenAPI and AsyncAPI documents",
        ),
        goodies=(
            OdooBaseGoodie(
                key="app_local_auth",
                title="App-local users",
                status="generated",
                pocketbase_signal="Auth collections keep app users separate from administrative operators.",
                odoo_translation="Generated app users live in the mounted module namespace and are not res.users.",
                generated_files=(
                    "models/bridge_app_user.py",
                    "models/bridge_app_session.py",
                    "views/bridge_app_user_views.xml",
                    "static/src/html/login.html",
                ),
            ),
            OdooBaseGoodie(
                key="session_tokens",
                title="Revocable app sessions",
                status="generated",
                pocketbase_signal="Clients authenticate once and carry a compact app token.",
                odoo_translation="The generated runtime issues HttpOnly app cookies and stores only token hashes in Odoo.",
                generated_files=("models/bridge_app_session.py", "services/bridge_runtime.py", "controllers/main.py"),
            ),
            OdooBaseGoodie(
                key="external_auth_links",
                title="Social identity links",
                status="generated",
                pocketbase_signal="OAuth2 users are linked through provider and provider id external-auth records.",
                odoo_translation="Generated provider and external-auth models keep social identities scoped to app users.",
                generated_files=(
                    "models/bridge_auth_provider.py",
                    "models/bridge_external_auth.py",
                    "views/bridge_auth_views.xml",
                ),
                next_steps=(
                    "add provider-specific profile normalizers",
                    "add encrypted-at-rest secret storage adapter when the host Odoo instance provides one",
                    "add auth/oauth2/link and auth/oauth2/unlink endpoints for logged app users",
                ),
            ),
            OdooBaseGoodie(
                key="function_routes",
                title="Function routes",
                status="generated",
                pocketbase_signal="JSVM routerAdd exposes small server-side functions without a full module rewrite.",
                odoo_translation="Generate declared function endpoints that call whitelisted service handlers under bridge_runtime.",
                generated_files=("services/bridge_functions.py", "services/bridge_runtime.py"),
                next_steps=(
                    "add optional typed return schemas",
                    "add optional JS execution only behind an explicit adapter",
                ),
            ),
            OdooBaseGoodie(
                key="cron_functions",
                title="Scheduled functions",
                status="generated",
                pocketbase_signal="JSVM cronAdd registers compact scheduled tasks next to hooks.",
                odoo_translation="Generate ir.cron records for declared jobs while keeping job code in services.",
                generated_files=("models/bridge_cron.py", "data/bridge_cron_data.xml", "services/bridge_functions.py"),
                next_steps=(
                    "add retry policy",
                    "add dead-letter dashboard",
                ),
            ),
            OdooBaseGoodie(
                key="hook_pipeline",
                title="Hook pipeline",
                status="generated",
                pocketbase_signal="Auth and record lifecycle hooks can alter the flow before persistence.",
                odoo_translation="Expose before/after hooks around auth, query and command execution as typed service extension points.",
                generated_files=("services/bridge_hooks.py", "services/bridge_runtime.py"),
                next_steps=(
                    "wire hooks to query and command replacement paths",
                    "add hook audit events",
                ),
            ),
            OdooBaseGoodie(
                key="release_gate",
                title="Security release gate",
                status="generated",
                pocketbase_signal="Small apps are fast to ship, so production promotion needs machine-readable guardrails.",
                odoo_translation="Generate an auditable security score, blocking findings, admin gate evidence and CI JSON.",
                generated_files=(
                    "models/bridge_security_gate.py",
                    "models/bridge_security_wizard.py",
                    "static/src/json/bridge_security_report.json",
                ),
            ),
            OdooBaseGoodie(
                key="operability_probes",
                title="Health, readiness and metrics",
                status="generated",
                pocketbase_signal="Apps need compact operational endpoints for health and automation.",
                odoo_translation="Generate health, readiness, metrics and security_report routes under the app prefix.",
                generated_files=("services/bridge_runtime.py", "data/bridge_operation_data.xml", "static/src/js/bridge_client.js"),
            ),
            OdooBaseGoodie(
                key="operation_catalog",
                title="Admin operation catalog",
                status="generated",
                pocketbase_signal="Collections, routes and auth methods are discoverable from a compact admin surface.",
                odoo_translation="The generated module ships a backend catalog for health, auth, query, command and event endpoints.",
                generated_files=("models/bridge_operation.py", "data/bridge_operation_data.xml", "views/bridge_operation_views.xml"),
            ),
            OdooBaseGoodie(
                key="contract_sdk",
                title="Contract and browser SDK",
                status="generated",
                pocketbase_signal="The client SDK mirrors server operations and can work against a stable API contract.",
                odoo_translation="Generated static assets include contract JSON, OpenAPI, AsyncAPI and a browser ESM client.",
                generated_files=(
                    "static/src/js/bridge_client.js",
                    "static/src/json/bridge_contract.json",
                    "static/src/json/bridge_openapi.json",
                    "static/src/json/bridge_asyncapi.json",
                ),
            ),
        ),
    )


__all__ = ["OdooBaseBlueprint", "OdooBaseGoodie", "build_odoobase_blueprint"]
