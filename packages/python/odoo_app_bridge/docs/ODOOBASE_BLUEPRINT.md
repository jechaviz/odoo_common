# OdooBase Blueprint

OdooBase is the next layer over Odoo App Bridge: generate PocketBase-like apps that mount on Odoo as standalone base-only addons.

## Research Inputs

Local research clone:

- `C:\git\odoo\_research\pocketbase\apis\record_auth_with_oauth2.go`
- `C:\git\odoo\_research\pocketbase\core\external_auth_model.go`
- `C:\git\odoo\_research\pocketbase\plugins\jsvm\binds.go`

Relevant PocketBase behaviors studied:

- OAuth2 exchanges the provider code, fetches the provider user, looks up an external auth relation by provider and provider id, falls back to the logged auth record or matching email, then creates or updates the auth record.
- External auth relations are first-class records with collection, record, provider and provider id references.
- JSVM exposes route functions and scheduled functions through small declarative helpers.
- Auth flows are hookable before final persistence, which gives the host app a deliberate place to alter creation, linking and validation.

## Generated Now

Odoo App Bridge already emits these OdooBase pieces:

- `models/bridge_app_user.py`: users scoped only to the generated app.
- `models/bridge_app_session.py`: revocable sessions with hashed tokens.
- `models/bridge_auth_provider.py`: admin-owned OAuth2 provider configuration.
- `models/bridge_external_auth.py`: app-scoped social identity links.
- `models/bridge_auth_state.py`: short-lived OAuth2 PKCE state records.
- `services/bridge_functions.py`: function and scheduled-job handlers.
- `services/bridge_hooks.py`: explicit extension points.
- `data/bridge_cron_data.xml`: generated scheduled jobs.
- `models/bridge_api_key.py`: hashed API keys for automation routes.
- `models/bridge_rate_limit.py`: dependency-free fixed-window counters.
- `models/bridge_security_finding.py`: OWASP-first security findings.
- `models/bridge_security_gate.py`: persisted release-gate score and evidence.
- `models/bridge_security_wizard.py`: visual refresh wizard for findings.
- `views/bridge_security_views.xml`: admin Security Center.
- `static/src/json/bridge_security_report.json`: CI-friendly security evidence.
- `static/src/html/login.html`: app-local login page under `/apps/<slug>/login`.
- `services/bridge_runtime.py`: `/auth/login`, `/auth/me`, `/auth/logout`, `/readiness`, `/metrics` and `/security_report`.
- `services/bridge_runtime.py`: OAuth2 providers/start/callback/link/unlink.
- `models/bridge_operation.py`: backend catalog of app endpoints.
- `static/src/js/bridge_client.js`: browser SDK and simulator.

This gives an app a separate door into Odoo: the Odoo admin remains `res.users`, while the mounted app can authenticate its own users without requiring the website or portal module.

## Release Gate And Operability

OdooBase now treats generation as a release pipeline:

- scanner output becomes a deterministic release report with score, thresholds and blocking findings.
- the generated addon persists the report in `bridge_security_gate`.
- `/readiness` checks contract loading, generated models and security release state.
- `/metrics` exposes request-log counts, route counts, rate-limit settings and security gate status.
- `/security_report` returns the same evidence shape expected by CI.

This makes "ready to hang on Odoo" a measurable state instead of a subjective scaffold milestone.

## PocketBase Goodies To Carry Forward

### Social Identity Links

PocketBase keeps OAuth2 identity links separate from the user record. OdooBase mirrors that with generated provider and link models:

- provider key
- provider user id
- app user reference
- provider email/name/avatar metadata
- last login timestamp
- disabled/revoked flag

The auth callback should never trust email alone when a provider id link already exists. Email matching is only a controlled fallback for first-link behavior.

Generated now:

- provider records with client metadata owned by admins
- external auth link records tied to app users
- short-lived state and PKCE verifier records
- public provider discovery that omits secrets
- start, callback, link and unlink routes

### PKCE OAuth2 Flow

Generated endpoints:

- `auth/oauth2/start`
- `auth/oauth2/callback`
- `auth/oauth2/link`
- `auth/oauth2/unlink`

Provider secrets should be admin-managed Odoo records, not embedded in static assets or generated source.

### Function Routes

PocketBase `routerAdd` is valuable because a small app function can be shipped without inventing a full controller. OdooBase models this as `BridgeFunctionSpec`, and route execution passes through:

- role checks
- CSRF policy
- input coercion
- idempotency
- request logging
- response envelopes

The first supported handler target is Python service callables in `bridge_functions.py`. JS execution can be a later adapter, not the default runtime.

### Scheduled Functions

PocketBase `cronAdd` maps naturally to generated `ir.cron` records plus service methods. Generated crons log into the same bridge request log so admin users can inspect scheduled function runs beside HTTP runs.

### Hook Pipeline

Hooks should be explicit extension points, not monkey patches:

- `before_login`
- `after_login`
- `before_oauth_link`
- `after_oauth_link`
- `before_query`
- `after_query`
- `before_command`
- `after_command`

Each hook receives a typed context and returns a typed decision: continue, deny, mutate payload, or replace response.

## Guardrails

- Default dependency stays `base`.
- No dependency on `website`, `portal`, `mail`, `sale`, `auth_oauth` or vertical modules unless the spec opts in.
- Public app users are not `res.users`.
- Generated app code remains layered: controller, service, model, static, views, security.
- Social auth provider secrets are admin data, never public static data.
- Tokens are stored hashed and sessions are revocable.
- Production promotion is blocked by critical/high security findings or a failing release gate.
