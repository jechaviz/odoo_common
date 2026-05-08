# World-Class OdooBase App Roadmap

This roadmap treats OdooBase as a product platform for complete apps mounted inside Odoo, not as a scaffold.

## P0: Serious App Core

Generated now:

- base-only Odoo addon with public controller and backend admin menu
- app-local users, password login, revocable sessions and hashed tokens
- OAuth2 provider records, external identity links and short-lived PKCE state records
- OAuth2 provider discovery, start, callback, link and unlink routes
- query, command and function routes through one validated runtime
- scheduled functions through generated `ir.cron`
- operation catalog, request log, OpenAPI, AsyncAPI, browser SDK and simulator
- explicit hooks file for auth, functions and jobs
- OWASP-first scanner with generated Security Center and refresh wizard
- release gate with score, blocking findings, persisted admin evidence and static CI JSON
- health, readiness, metrics and security-report endpoints under the generated app prefix
- CORS allowlists, max payload enforcement, security headers, API keys and rate limits

Remaining hardening:

- install test against a real Odoo instance
- Prometheus text format adapter for `/metrics`
- provider-specific OAuth profile normalizers
- secret encryption adapter when the target Odoo stack exposes a vault/KMS pattern
- brute-force protection and adaptive auth throttles
- migration tests between generated versions

## P1: Identity And Trust

- email verification
- password reset
- invitation flows
- MFA/TOTP
- device/session management UI
- account lockout policy
- audit trail for login, logout, link, unlink and password changes
- optional passkeys/WebAuthn adapter
- per-app roles, permissions and policy rules

## P2: Data Platform

- collection-like resource specs over Odoo models
- row-level rules by app role and ownership
- file attachments with quotas and virus-scan hook
- search indexes and saved views
- import/export jobs
- soft-delete and restore
- optimistic locking and conflict responses
- data residency and retention policies

## P3: App Experience

- generated admin dashboards
- public shell theming tokens
- navigation, layouts, forms, lists and detail pages from contracts
- notification center
- user profile and preferences
- localization/i18n contract
- accessibility baseline
- SEO and share metadata when an app opts into public pages

## P4: Integrations

- outbound webhooks with signing, retries and replay
- inbound webhooks with signature verification
- connector registry
- API keys and scoped service accounts
- event bus abstraction
- optional queue adapter
- optional realtime adapter

## P5: Operations

- richer health checks with external dependency probes
- Prometheus/OpenTelemetry export adapters
- trace/request correlation
- job retry dashboard
- dead-letter queue surface
- backup and restore playbooks
- upgrade/migration planner
- feature flags and rollout gates
- error budget and SLO definitions

## P6: Developer Experience

- app contract CLI
- local simulator server
- generated typed SDKs
- contract diff and breaking-change detector
- app template gallery
- visual smoke tests
- fixture/data factory
- test harness for generated Odoo addons

## P7: Enterprise Readiness

- multi-company policy model
- tenant isolation checklist
- consent and privacy center
- data processing export/delete flows
- license/entitlement gates
- compliance evidence pack
- admin delegation
- deployment checklist
- support bundle export

## Design Rules

- Keep `base` as the default dependency.
- Make every optional dependency explicit in the contract.
- Keep public app users separate from `res.users`.
- Keep controllers thin, services deterministic, models narrow and views/admin declarative.
- Prefer generated extension points over monkey patches.
- Never put provider secrets in static assets.
- Store tokens hashed, make sessions revocable and make every auth mutation auditable.
- A generated app is not production-ready until its release gate evidence is green and archived.
