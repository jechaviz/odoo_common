# PocketBase Compatibility For OdooBase

This document catalogs how the Odoo App Bridge/OdooBase direction maps PocketBase concepts into generated, base-only Odoo addons. The current package includes a compatibility layer that loads PocketBase collection exports or `pb_data/data.db`, generates OdooBase query/command contracts, and emits a small browser shim for common PocketBase JS SDK calls.

## Local Workflow

Prototype the app shape in local PocketBase, then generate an OdooBase module from the PocketBase project directory, exported JSON, or SQLite database:

```python
from odoo_app_bridge import write_pocketbase_compat_module_zip

write_pocketbase_compat_module_zip(
    "dist",
    r"C:\path\to\pocketbase_project",
    app={
        "name": "Pocket Tasks",
        "slug": "pocket-tasks",
        "module": "x_pocket_tasks",
        "summary": "PocketBase-compatible task app.",
    },
    overwrite=True,
)
```

Accepted inputs:

- a PocketBase project directory with `pb_schema.json`, `collections.json`, `pocketbase_collections.json`, or `pb_data/data.db`
- a JSON file containing either a collection array or `{ "collections": [...] }`
- a Python mapping/list with the same shape

Generated extras:

- `static/src/js/pocketbase_compat.js`
- `static/src/json/pocketbase_collections.json`

Browser handoff:

```js
import PocketBase from "/x_pocket_tasks/static/src/js/pocketbase_compat.js";

const pb = new PocketBase("/apps/pocket-tasks");
const page = await pb.collection("tasks").getList(1, 30);
```

## Compatibility Matrix

| PocketBase concept | OdooBase mapping | Current package status | Notes |
| --- | --- | --- | --- |
| App backend in one runtime | Generated Odoo addon with public controllers, models, services, views and static assets | Partial | OdooBase runs inside Odoo, so deployment, database ownership and upgrades follow Odoo module rules rather than a standalone PocketBase binary. |
| Collections | Contract-declared resource/query/command surface over Odoo models | Generated | `pocketbase_export_to_app_bridge_spec()` maps base/auth/view collections into OdooBase query and command specs. |
| Base collections | Odoo models or generated app-local models | Partial | Existing generated app users, sessions, providers, OAuth links, logs and catalog records are concrete generated models. Arbitrary CRUD collections are not yet a PocketBase-equivalent feature. |
| Auth collections | App-local users plus app sessions separate from `res.users` | Partial | Login, logout, current-user and revocable cookie-backed sessions are generated. MFA, invitations, password reset and email verification remain mapped next. |
| Superusers/admin UI | Odoo backend menus, groups, request log and Security Center | Partial | Admin operations are mediated by Odoo security and generated backend views, not by the PocketBase dashboard. |
| API rules: list/view/create/update/delete/manage | Contract security lint, Odoo ACLs/record rules and generated service role checks | Partial | PocketBase rule expressions are not interpreted directly. Rules must be translated into Odoo groups, record rules and service-level checks. |
| REST CRUD API | Generated HTTP query and command endpoints plus OpenAPI snapshot | Generated adapter | Routes are mounted under `/apps/<slug>/collections/<collection>/records...`; the JS shim maps common SDK methods to those routes. |
| Realtime subscriptions | AsyncAPI contract snapshots and future realtime adapters | Planned | README lists realtime adapters as mapped next. Odoo long-polling/bus integration is a future adapter concern. |
| Files | Odoo binary fields or `ir.attachment`-backed publication | Planned | File storage behavior differs from PocketBase, which stores file names in its database and serves managed files through its own APIs. |
| JavaScript/Go hooks | Explicit generated hook surface for auth, functions and jobs | Partial | OdooBase generates hook locations and function/job routes, but does not run PocketBase `pb_hooks` or Go extension code. |
| JavaScript/Go migrations | Odoo module install/upgrade data, generated manifests and future migration plans | Planned | PocketBase migrations are not executed by OdooBase. They should be translated into Odoo module data/model changes. |
| OAuth2 auth | Admin-managed OAuth2 providers, PKCE state flow and external auth links | Partial | Provider-specific profile normalizers are mapped next. |
| API keys | Hashed API keys and dependency-free rate limiting in generated endpoints | Partial | This is an OdooBase endpoint capability, not PocketBase token compatibility. |
| Dashboard schema builder | Contract-first specs, generated backend admin controls and catalog documentation | Partial | Schema editing is expected to happen in source contracts, then regenerate the addon. |
| Client SDK | Static browser SDK, simulator mode and PocketBase-compatible shim | Partial | Common `pb.collection(name)` record CRUD and auth methods are supported. Advanced realtime, batch and file APIs are adapter/future scope. |

## Honest Limits

- Compatibility is generated at the OdooBase app prefix, not by mounting PocketBase's exact `/api/...` server.
- Existing PocketBase migrations and JS hooks need translation into OdooBase contracts and Odoo security/services.
- Odoo remains the system of record. Transactions, permissions, computed fields, scheduled jobs, module upgrades and multi-company behavior follow Odoo semantics.
- PocketBase view collections, realtime events, file APIs and auth token behavior have no full one-to-one implementation in the current package.
- Record IDs are Odoo record IDs at runtime unless the target Odoo model deliberately stores PocketBase string IDs.
- Public PocketBase mutation rules default to app-user protected OdooBase commands. Use `allow_public_mutations=True` only when the security release gate findings are understood and accepted.
- For production, promote only after contract lint, security release gate evidence, addon compile/install smoke, and OpenAPI/AsyncAPI snapshot review.

## Translation Checklist

1. Inventory PocketBase collections, auth collections, fields, indexes, files, API rules, hooks, scheduled jobs and realtime consumers.
2. Decide which records should become native Odoo models, generated app-local models, query endpoints or command endpoints.
3. Translate PocketBase API rules into Odoo groups, ACLs, record rules and explicit service checks.
4. Translate hooks and scheduled jobs into contract-declared function routes or scheduled functions.
5. Replace PocketBase client SDK assumptions with the generated browser SDK or generated OpenAPI contract.
6. Run the generated security release gate and keep the evidence with the addon promotion record.

## Official Sources

- PocketBase collections documentation: https://pocketbase.io/docs/collections/
- PocketBase authentication documentation: https://pocketbase.io/docs/authentication/
- PocketBase "use as framework" documentation: https://pocketbase.io/docs/use-as-framework/
- PocketBase JavaScript migrations documentation: https://pocketbase.io/docs/js-migrations/
- Odoo ORM API documentation: https://www.odoo.com/documentation/18.0/developer/reference/backend/orm.html
- Odoo external RPC/API documentation: https://www.odoo.com/documentation/19.0/developer/reference/external_rpc_api.html
