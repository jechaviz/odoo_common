# OdooBase Release Gate Runbook

This runbook defines the minimum evidence required before a generated OdooBase app is treated as production-ready.

## Promotion Rule

A generated app can move from scaffold to production candidate only when:

- `evaluate_app_bridge_security_release(spec).passed` is true.
- the generated `static/src/json/bridge_security_report.json` has `release_ready: true`.
- the generated addon compiles and its XML parses.
- OpenAPI, AsyncAPI and bridge contract snapshots are archived with the zip.
- PocketBase compatibility assets, when present, are archived with `pocketbase_collections.json`.
- a smoke run checks `/health`, `/readiness`, `/metrics` and `/security_report`.

Critical or high security findings block promotion. A score below the release threshold also blocks promotion, even if no single finding is critical.

## Evidence Package

Keep these artifacts for each promoted contract digest:

- generated addon zip
- `bridge_contract.json`
- `bridge_openapi.json`
- `bridge_asyncapi.json`
- `bridge_security_report.json`
- unit test report
- generated-addon compile/XML smoke output
- PocketBase source export or `pocketbase_collections.json` when the addon was generated from PocketBase
- Odoo install or upgrade smoke log
- operator approval or deployment ticket reference

## Admin Workflow

After installing the generated addon:

1. Open the app admin menu.
2. Open `Refresh Findings` in the Security Center.
3. Run the wizard.
4. Review `Release Gate`.
5. Review active Security Center findings.
6. Check Request Logs after the first smoke call.

The wizard persists gate evidence in `bridge_security_gate`, keyed by the contract digest.

## Runtime Smoke

Call the generated app prefix:

- `/apps/<slug>/health`
- `/apps/<slug>/readiness`
- `/apps/<slug>/metrics`
- `/apps/<slug>/security_report`

`/health` is intentionally lightweight. `/readiness`, `/metrics` and `/security_report` use the internal metadata gate, so production callers should use an internal Odoo user context or a valid bridge API key according to the generated security policy.

## Operator Checks

Before release:

- rotate generated API keys away from test credentials
- verify OAuth providers have no secrets in static assets
- confirm CORS origins are explicit
- confirm rate limiting is enabled
- confirm app sessions can be revoked
- for PocketBase-derived apps, confirm public mutation rules were intentionally translated and no unexpected anonymous command is release-blocking
- confirm rollback uses the previous addon zip and contract digest

## CI Sketch

```powershell
uv run python -m unittest discover -s C:\git\odoo\common\packages\python\odoo_app_bridge\tests
uv run python -m compileall C:\git\odoo\common\packages\python\odoo_app_bridge\sources
powershell -ExecutionPolicy Bypass -File C:\git\odoo\common\catalog\validate_catalog.ps1
```

CI should also generate one representative addon, parse all emitted XML, parse all emitted Python with `ast.parse`, and fail if the security report is not release-ready.
