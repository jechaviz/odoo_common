# Odoo App Bridge

Canonical package for creating complete Odoo apps from explicit contracts.

It absorbs the useful parts of `C:\git\odoo\odoo_bridge` and updates the architecture for generated addons that can be installed as new Odoo modules with:

- backend admin menu and request log
- public HTTP website shell served by an Odoo controller
- app-local login, app users and revocable app sessions
- query and command API endpoints
- release gate, readiness probes and operational metrics
- browser client with simulator mode
- OpenAPI, AsyncAPI and contract snapshots
- `base` as the only default Odoo dependency

## Architecture

- `contracts.py`: immutable specs and validation.
- `documents.py`: OpenAPI, AsyncAPI and JSON Schema builders.
- `client_assets.py`: public HTML/CSS and browser ESM client.
- `lint.py`: security and ergonomics lint before generation.
- `module_builder.py`: layered addon writer and zip packager.
- `pocketbase_compat.py`: PocketBase export/SQLite loader, OdooBase contract translator and JS SDK shim.

Generated modules keep SoC from the first file:

- `controllers` own HTTP and CORS only.
- `services` own validation, role checks, idempotency and Odoo IO.
- `models` own app users, app sessions, operation catalog and admin logs.
- `static` owns public assets and machine-readable contracts.
- `views` and `security` own backend admin integration.
- `odoobase.py` owns the PocketBase-inspired feature map for the next layers.

## OdooBase Direction

`OdooBase` is the product direction on top of this package: a PocketBase-like app runtime mounted inside Odoo, but still emitted as a clean base-only addon.

Already generated:

- app-local users that are separate from `res.users`
- HttpOnly app session cookies backed by hashed tokens
- `/apps/<slug>/login`, `/auth/login`, `/auth/me` and `/auth/logout`
- admin-managed OAuth2 provider records and app-scoped external auth links
- public `/auth/oauth2/providers` discovery without exposing secrets
- OAuth2 start/callback/link/unlink routes with short-lived PKCE state records
- contract-declared function routes and scheduled functions
- explicit generated hook surface for auth, functions and jobs
- OWASP-first scanner with generated Security Center and refresh wizard
- auditable release gate with score, blocking findings and CI JSON evidence
- `/readiness`, `/metrics` and `/security_report` meta endpoints
- CORS allowlist, payload limits, security headers, API keys and dependency-free rate limiting
- admin operation catalog for health, auth, queries, commands and events
- static browser SDK, simulator, OpenAPI, AsyncAPI and contract snapshots
- PocketBase collection export to OdooBase query/command contracts
- PocketBase-style JS client shim for `pb.collection(...).getList/create/update/delete` and authStore
- persistent `authStore`, simple PocketBase filter strings, sequential batch adapter and file URL builder
- one-line PocketBase project/export to importable Odoo addon zip

Release gate:

- `evaluate_app_bridge_security_release(spec)` returns a deterministic pass/fail report.
- Generated addons include `models/bridge_security_gate.py` and `static/src/json/bridge_security_report.json`.
- The Security Center wizard loads findings and persists the current release gate evidence.
- Production promotion should require contract lint, scanner pass, release-ready report, addon compile/install smoke and OpenAPI/AsyncAPI snapshots.

Mapped next:

- MFA, invitations, password reset and email verification
- provider-specific OAuth profile normalizers
- richer row-rule semantics, files, webhooks and realtime adapters
- migrations, upgrade plans and real-Odoo install tests

Use `build_odoobase_blueprint(spec)` to inspect what is generated now and what the next-generation surface should add.
See `docs/WORLD_CLASS_APP_ROADMAP.md` for the broader product roadmap.
See `docs/RELEASE_GATE_RUNBOOK.md` for production promotion evidence and smoke checks.
See `docs/POCKETBASE_COMPATIBILITY.md` for the local PocketBase -> OdooBase workflow, compatibility matrix, limits and official source links.

## Minimal Usage

```python
from pathlib import Path

from odoo_app_bridge import (
    BridgeQuerySpec,
    BridgeRoleSpec,
    BridgeSecuritySpec,
    OdooAppBridgeSpec,
    OdooAppSpec,
    write_app_bridge_module_zip,
)

spec = OdooAppBridgeSpec(
    app=OdooAppSpec(
        name="Acme Portal",
        slug="acme",
        module="x_acme_portal",
        summary="Public app shell with Odoo admin controls.",
    ),
    security=BridgeSecuritySpec(default_role="public"),
    roles=(BridgeRoleSpec(name="public", auth="public"),),
    queries=(
        BridgeQuerySpec(
            name="partners",
            path="queries/partners",
            model="res.partner",
            role="public",
            fields=("id", "name"),
            max_limit=20,
        ),
    ),
)

write_app_bridge_module_zip(Path("dist"), spec)
```

The generated addon can be copied or zipped into an Odoo addons path. Its public app is available at `/apps/acme` and it does not require the `website` module.

## PocketBase Compatibility

```python
from odoo_app_bridge import write_pocketbase_compat_module_zip

write_pocketbase_compat_module_zip(
    "dist",
    r"C:\path\to\pocketbase_project",  # pb_schema.json, collections JSON, or pb_data/data.db
    app={
        "name": "Pocket Tasks",
        "slug": "pocket-tasks",
        "module": "x_pocket_tasks",
        "summary": "PocketBase-compatible task app.",
    },
    overwrite=True,
)
```

This generates the normal base-only OdooBase addon plus `static/src/js/pocketbase_compat.js` and `static/src/json/pocketbase_collections.json`, so local PocketBase prototypes can move toward Odoo with a small client swap.
