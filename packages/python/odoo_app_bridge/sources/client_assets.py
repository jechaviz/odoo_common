"""Browser-facing assets for generated app bridge modules."""

from __future__ import annotations

import json
import textwrap

from .contracts import OdooAppBridgeSpec
from .documents import build_asyncapi_document, build_openapi_document
from .security_scanner import evaluate_app_bridge_security_release


def build_contract_json_text(spec: OdooAppBridgeSpec) -> str:
    return json.dumps(spec.to_contract(), indent=2, ensure_ascii=False) + "\n"


def build_openapi_json_text(spec: OdooAppBridgeSpec) -> str:
    return json.dumps(build_openapi_document(spec), indent=2, ensure_ascii=False) + "\n"


def build_asyncapi_json_text(spec: OdooAppBridgeSpec) -> str:
    return json.dumps(build_asyncapi_document(spec), indent=2, ensure_ascii=False) + "\n"


def build_contract_js_text(spec: OdooAppBridgeSpec) -> str:
    contract = json.dumps(spec.to_contract(), indent=2, ensure_ascii=False)
    return f"export const bridgeContract = {contract};\nexport const bridgeContractDigest = {spec.contract_digest()!r};\n"


def build_browser_client_js(spec: OdooAppBridgeSpec, *, base_prefix: str | None = None) -> str:
    """Build a zero-dependency ESM client with network and simulator transports."""
    base_prefix = (base_prefix or f"/{spec.app.public_prefix}/{spec.app.slug}").rstrip("/")
    contract = json.dumps(spec.to_contract(), indent=2, ensure_ascii=False)
    openapi = json.dumps(build_openapi_document(spec), indent=2, ensure_ascii=False)
    asyncapi = json.dumps(build_asyncapi_document(spec), indent=2, ensure_ascii=False)
    security_report_data = evaluate_app_bridge_security_release(spec).as_dict()
    security_report_data["release_ready"] = bool(security_report_data.get("passed"))
    security_report_data["blocking_count"] = len(security_report_data.get("blocking_findings") or [])
    security_report_data["findings_count"] = len(security_report_data.get("findings") or [])
    security_report = json.dumps(security_report_data, indent=2, ensure_ascii=False)
    query_methods = "\n\n  ".join(
        f"async {_camel(query.name)}(options = {{}}) {{ return this.query({query.name!r}, options); }}"
        for query in spec.queries
    )
    command_methods = "\n\n  ".join(
        f"async {_camel(command.name)}(options = {{}}) {{ return this.command({command.name!r}, options); }}"
        for command in spec.commands
    )
    function_methods = "\n\n  ".join(
        f"async {_camel(function.name)}(options = {{}}) {{ return this.callFunction({function.name!r}, options); }}"
        for function in spec.functions
    )
    methods = "\n\n  ".join(item for item in (query_methods, command_methods, function_methods) if item)
    return textwrap.dedent(
        f"""
        export const bridgeContract = {contract};
        export const bridgeContractDigest = {spec.contract_digest()!r};
        export const bridgeOpenAPI = {openapi};
        export const bridgeAsyncAPI = {asyncapi};
        export const bridgeSecurityReport = {security_report};

        const queryRoutes = new Map((bridgeContract.queries || []).map((item) => [item.name, item.path]));
        const commandRoutes = new Map((bridgeContract.commands || []).map((item) => [item.name, item.path]));
        const functionRoutes = new Map((bridgeContract.functions || []).map((item) => [item.name, item.path]));
        const eventSpecs = new Map((bridgeContract.events || []).map((item) => [item.name, item]));

        export function listOperations() {{
          return {{
            queries: (bridgeContract.queries || []).map((item) => item.name),
            commands: (bridgeContract.commands || []).map((item) => item.name),
            functions: (bridgeContract.functions || []).map((item) => item.name),
            events: (bridgeContract.events || []).map((item) => item.name),
          }};
        }}

        export function createIdempotencyKey(prefix = bridgeContract.app.slug) {{
          return `${{prefix}}-${{Date.now()}}-${{Math.random().toString(36).slice(2)}}`;
        }}

        function stableHash(text, seed = 17) {{
          let h = seed >>> 0;
          for (const char of String(text)) {{
            h = Math.imul(h ^ char.charCodeAt(0), 16777619) >>> 0;
          }}
          return h.toString(16).padStart(8, "0");
        }}

        function fakeValue(name, index) {{
          const lower = String(name).toLowerCase();
          if (lower === "id" || lower.endsWith("_id")) return index;
          if (lower.startsWith("is_") || lower.startsWith("has_") || ["active", "approved"].includes(lower)) return index % 2 === 0;
          if (lower.endsWith("date") && !lower.includes("datetime")) return new Date(Date.UTC(2026, 0, index)).toISOString().slice(0, 10);
          if (lower.endsWith("datetime") || lower.endsWith("at")) return new Date(Date.UTC(2026, 0, index, 12, 0, 0)).toISOString();
          if (["amount", "price", "cost", "total"].some((token) => lower.includes(token))) return index * 10 + 0.5;
          if (["qty", "quantity", "count", "sequence"].some((token) => lower.includes(token))) return index;
          if (lower === "email") return `user${{index}}@example.com`;
          if (lower === "state" || lower === "status") return ["draft", "pending", "done"][index % 3];
          return `${{name}}_${{String(index).padStart(3, "0")}}`;
        }}

        export function createCloudEvent(eventName, data = {{}}, overrides = {{}}) {{
          const spec = eventSpecs.get(eventName);
          if (!spec) throw new Error(`unknown_event:${{eventName}}`);
          const payload = Object.keys(data || {{}}).length
            ? data
            : Object.fromEntries((spec.fields || []).map((field, index) => [field.name, fakeValue(field.name, index + 1)]));
          return {{
            specversion: "1.0",
            id: overrides.id || stableHash(`${{eventName}}:${{JSON.stringify(payload)}}:${{Date.now()}}`),
            type: overrides.type || spec.cloudevent_type,
            source: overrides.source || spec.source || `/odoo/${{bridgeContract.app.slug}}`,
            subject: overrides.subject || spec.name,
            time: overrides.time || new Date().toISOString(),
            datacontenttype: "application/json",
            data: payload,
          }};
        }}

        export function createFetchTransport(basePrefix = {base_prefix!r}, {{ credentials = "same-origin" }} = {{}}) {{
          const root = String(basePrefix || {base_prefix!r}).replace(/[/]$/, "");
          return {{
            kind: "fetch",
            async request(path, payload = {{}}, options = {{}}) {{
              const headers = {{"Content-Type": "application/json", "Accept": "application/json"}};
              if (options.csrf) headers["X-Bridge-CSRF"] = options.csrf;
              if (options.idempotencyKey) headers["Idempotency-Key"] = options.idempotencyKey;
              const response = await fetch(`${{root}}/${{path}}`, {{
                method: "POST",
                credentials,
                headers,
                body: JSON.stringify(payload),
              }});
              let data = null;
              try {{
                data = await response.json();
              }} catch (_err) {{
                data = {{ok: false, error: "invalid_json_response"}};
              }}
              if (!response.ok) {{
                const error = new Error(data?.error || "bridge_request_failed");
                error.payload = data;
                error.status = response.status;
                throw error;
              }}
              return data;
            }},
          }};
        }}

        export function createSimulatorTransport(contract = bridgeContract, {{ seed = 17 }} = {{}}) {{
          const queryByPath = new Map((contract.queries || []).map((item) => [item.path, item]));
          const commandByPath = new Map((contract.commands || []).map((item) => [item.path, item]));
          const functionByPath = new Map((contract.functions || []).map((item) => [item.path, item]));
          const cache = new Map();
          return {{
            kind: "simulator",
            async request(path, payload = {{}}, options = {{}}) {{
              if (path === "health") return {{ok: true, data: {{status: "ok", app: contract.app, version: contract.app.version, digest: bridgeContractDigest}}}};
              if (path === "readiness") return {{ok: true, data: {{ready: bridgeSecurityReport.release_ready, digest: bridgeContractDigest, security: {{score: bridgeSecurityReport.score, release_ready: bridgeSecurityReport.release_ready, blocking_count: bridgeSecurityReport.blocking_count}}}}}};
              if (path === "metrics") return {{ok: true, data: {{contract_digest: bridgeContractDigest, operations: listOperations(), security_score: bridgeSecurityReport.score, security_release_ready: bridgeSecurityReport.release_ready, security_blocking_findings: bridgeSecurityReport.blocking_count}}}};
              if (path === "security_report") return {{ok: true, data: bridgeSecurityReport}};
              if (path === "contract") return {{ok: true, data: contract}};
              if (path === "openapi") return {{ok: true, data: bridgeOpenAPI}};
              if (path === "asyncapi") return {{ok: true, data: bridgeAsyncAPI}};
              if (path === "csrf") return {{ok: true, csrf_token: `sim-${{seed}}`}};
              if (path === "auth/oauth2/providers") return {{ok: true, data: [], meta: {{type: "auth", name: "oauth2_providers", simulated: true}}}};
              if (path === "auth/oauth2/start" || path === "auth/oauth2/link") return {{ok: true, data: {{provider: payload.provider || payload.provider_key || "demo", authorize_url: "#oauth2-simulated", pkce_required: true}}, meta: {{type: "auth", name: path.split("/").pop(), simulated: true}}}};
              if (path === "auth/oauth2/callback") return {{ok: true, data: {{id: 1, login: "oauth@example.com", name: "OAuth App User", role: "app_user"}}, meta: {{type: "auth", name: "oauth2_callback", simulated: true}}}};
              if (path === "auth/oauth2/unlink") return {{ok: true, data: {{unlinked: 1}}, meta: {{type: "auth", name: "oauth2_unlink", simulated: true}}}};
              if (path === "auth/login") return {{ok: true, data: {{id: 1, login: payload.login || "demo@example.com", name: "Demo App User", role: "app_user"}}, meta: {{type: "auth", name: "login", simulated: true}}}};
              if (path === "auth/me") return {{ok: false, error: "app_login_required", meta: {{simulated: true}}}};
              if (path === "auth/logout") return {{ok: true, data: {{logged_out: true}}, meta: {{type: "auth", name: "logout", simulated: true}}}};

              const query = queryByPath.get(path);
              if (query) {{
                const limit = Math.max(1, Math.min(Number(payload.limit || query.default_limit || 20), Number(query.max_limit || 50)));
                const offset = Math.max(0, Number(payload.offset || 0));
                const keys = Object.keys(query.response_map || {{}}).length ? Object.keys(query.response_map) : query.fields;
                const rows = Array.from({{length: limit}}, (_unused, index) => {{
                  const rowIndex = offset + index + 1;
                  return Object.fromEntries(keys.map((key) => [key, fakeValue(key, rowIndex)]));
                }});
                return {{ok: true, data: rows, meta: {{type: "query", name: query.name, simulated: true, limit, offset}}}};
              }}

              const command = commandByPath.get(path);
              if (command) {{
                const key = command.idempotent && options.idempotencyKey ? `${{command.name}}:${{options.idempotencyKey}}` : "";
                if (key && cache.has(key)) {{
                  const cached = cache.get(key);
                  return {{...cached, meta: {{...cached.meta, idempotent_replay: true}}}};
                }}
                const data = {{
                  accepted: true,
                  command: command.name,
                  model: command.model,
                  method: command.method,
                  ids: Array.isArray(payload.ids) ? payload.ids : [],
                  params: payload.params || {{}},
                  job_id: stableHash(`${{command.name}}:${{JSON.stringify(payload)}}`, seed),
                }};
                const envelope = {{ok: true, data, meta: {{type: "command", name: command.name, simulated: true, idempotent_replay: false}}}};
                if (key) cache.set(key, envelope);
                return envelope;
              }}

              const fn = functionByPath.get(path);
              if (fn) {{
                return {{ok: true, data: {{handled: true, function: fn.name, handler: fn.handler, params: payload.params || {{}}}}, meta: {{type: "function", name: fn.name, simulated: true}}}};
              }}
              throw new Error(`unknown_path:${{path}}`);
            }},
          }};
        }}

        export class OdooAppBridgeClient {{
          constructor({{basePrefix = {base_prefix!r}, mode = "network", transport = null}} = {{}}) {{
            this.basePrefix = String(basePrefix || {base_prefix!r}).replace(/[/]$/, "");
            this.transport = transport || (mode === "simulator" ? createSimulatorTransport() : createFetchTransport(this.basePrefix));
            this._csrf = null;
          }}

          async health() {{ return this.transport.request("health"); }}
          async readiness() {{ return this.transport.request("readiness"); }}
          async metrics() {{ return this.transport.request("metrics"); }}
          async securityReport() {{ return this.transport.request("security_report"); }}
          async login(login, password) {{ return this.transport.request("auth/login", {{login, password}}); }}
          async logout() {{ return this.transport.request("auth/logout"); }}
          async me() {{ return this.transport.request("auth/me"); }}
          async oauth2Providers() {{ return this.transport.request("auth/oauth2/providers"); }}
          async oauth2Start(options = {{}}) {{ return this.transport.request("auth/oauth2/start", options); }}
          async oauth2Callback(options = {{}}) {{ return this.transport.request("auth/oauth2/callback", options); }}
          async oauth2Link(options = {{}}) {{ return this.transport.request("auth/oauth2/link", options); }}
          async oauth2Unlink(options = {{}}) {{ return this.transport.request("auth/oauth2/unlink", options); }}
          async contractMeta() {{ return this.transport.request("contract"); }}
          async openapiSpec() {{ return this.transport.request("openapi"); }}
          async asyncapiSpec() {{ return this.transport.request("asyncapi"); }}

          async getCsrf(force = false) {{
            if (!force && this._csrf) return this._csrf;
            const response = await this.transport.request("csrf");
            this._csrf = response.csrf_token || response.data?.csrf_token || null;
            if (!this._csrf) throw new Error("csrf_missing");
            return this._csrf;
          }}

          async query(name, {{filters = {{}}, limit = undefined, offset = 0, sort = null, context = {{}}}} = {{}}) {{
            const route = queryRoutes.get(name);
            if (!route) throw new Error(`unknown_query:${{name}}`);
            const payload = {{filters, offset, context}};
            if (limit !== undefined) payload.limit = limit;
            if (sort) payload.sort = sort;
            return this.transport.request(route, payload);
          }}

          async command(name, {{ids = [], params = {{}}, context = {{}}, idempotencyKey = null}} = {{}}) {{
            const route = commandRoutes.get(name);
            if (!route) throw new Error(`unknown_command:${{name}}`);
            let csrf = null;
            if (this.transport.kind !== "simulator") csrf = await this.getCsrf();
            return this.transport.request(route, {{ids, params, context}}, {{csrf, idempotencyKey}});
          }}

          async callFunction(name, {{params = {{}}, context = {{}}, idempotencyKey = null}} = {{}}) {{
            const route = functionRoutes.get(name);
            if (!route) throw new Error(`unknown_function:${{name}}`);
            let csrf = null;
            if (this.transport.kind !== "simulator") csrf = await this.getCsrf();
            return this.transport.request(route, {{params, context}}, {{csrf, idempotencyKey}});
          }}

          eventEnvelope(name, data = {{}}, overrides = {{}}) {{
            return createCloudEvent(name, data, overrides);
          }}

          {methods}
        }}
        """
    ).strip() + "\n"


def build_public_app_html(spec: OdooAppBridgeSpec, *, base_prefix: str | None = None) -> str:
    """Build the public app shell served by the generated controller."""
    base_prefix = (base_prefix or f"/{spec.app.public_prefix}/{spec.app.slug}").rstrip("/")
    module = spec.app.module
    operation_count = len(spec.queries) + len(spec.commands) + len(spec.functions) + len(spec.events)
    return textwrap.dedent(
        f"""
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>{_html_escape(spec.app.name)}</title>
            <link rel="stylesheet" href="/{module}/static/src/css/app.css" />
          </head>
          <body>
            <main class="oab-shell">
              <section class="oab-topbar">
                <div>
                  <p class="oab-kicker">{_html_escape(spec.app.slug)}</p>
                  <h1>{_html_escape(spec.app.name)}</h1>
                  <p>{_html_escape(spec.app.summary)}</p>
                </div>
                <dl class="oab-metrics">
                  <div><dt>Queries</dt><dd>{len(spec.queries)}</dd></div>
                  <div><dt>Commands</dt><dd>{len(spec.commands)}</dd></div>
                  <div><dt>Events</dt><dd>{len(spec.events)}</dd></div>
                  <div><dt>Total</dt><dd>{operation_count}</dd></div>
                </dl>
              </section>
              <section class="oab-workspace">
                <aside class="oab-sidebar">
                  <div class="oab-controls">
                    <label>
                      <span>Mode</span>
                      <select id="oab-mode">
                        <option value="network" selected>network</option>
                        <option value="simulator">simulator</option>
                      </select>
                    </label>
                    <button data-meta="health">Health</button>
                    <button data-meta="readiness">Readiness</button>
                    <button data-meta="metrics">Metrics</button>
                    <button data-meta="security_report">Security</button>
                    <button data-meta="contract">Contract</button>
                    <button data-meta="openapi">OpenAPI</button>
                    <button data-meta="asyncapi">AsyncAPI</button>
                  </div>
                  <nav id="oab-operation-list" class="oab-operation-list"></nav>
                </aside>
                <div class="oab-main">
                  <div class="oab-output-header">
                    <strong id="oab-output-title">Health</strong>
                    <span>{_html_escape(base_prefix)}</span>
                  </div>
                  <pre id="oab-output"></pre>
                </div>
              </section>
            </main>
            <script type="module">
              import {{ OdooAppBridgeClient, bridgeContract, createIdempotencyKey }} from "/{module}/static/src/js/bridge_client.js";
              const out = document.getElementById("oab-output");
              const title = document.getElementById("oab-output-title");
              const mode = document.getElementById("oab-mode");
              const operationList = document.getElementById("oab-operation-list");

              function client() {{
                return new OdooAppBridgeClient({{basePrefix: {base_prefix!r}, mode: mode.value}});
              }}

              function print(label, value) {{
                title.textContent = label;
                out.textContent = JSON.stringify(value, null, 2);
              }}

              async function runMeta(action) {{
                try {{
                  const api = client();
                  const methods = {{
                    asyncapi: "asyncapiSpec",
                    contract: "contractMeta",
                    metrics: "metrics",
                    openapi: "openapiSpec",
                    readiness: "readiness",
                    security_report: "securityReport",
                  }};
                  const method = methods[action] || "health";
                  print(action, await api[method]());
                }} catch (err) {{
                  print(action, {{error: err.message, status: err.status || null, payload: err.payload || null}});
                }}
              }}

              async function runOperation(kind, name) {{
                try {{
                  const api = client();
                  if (kind === "query") {{
                    print(name, await api.query(name));
                  }} else if (kind === "command") {{
                    print(name, await api.command(name, {{idempotencyKey: createIdempotencyKey(name)}}));
                  }} else if (kind === "function") {{
                    print(name, await api.callFunction(name, {{idempotencyKey: createIdempotencyKey(name)}}));
                  }} else if (kind === "event") {{
                    print(name, api.eventEnvelope(name));
                  }}
                }} catch (err) {{
                  print(name, {{error: err.message, status: err.status || null, payload: err.payload || null}});
                }}
              }}

              function renderOperations() {{
                const operations = [
                  ...(bridgeContract.queries || []).map((item) => ({{kind: "query", ...item}})),
                  ...(bridgeContract.commands || []).map((item) => ({{kind: "command", ...item}})),
                  ...(bridgeContract.functions || []).map((item) => ({{kind: "function", ...item}})),
                  ...(bridgeContract.events || []).map((item) => ({{kind: "event", path: item.channel, role: item.role || "", ...item}})),
                ];
                operationList.textContent = "";
                for (const operation of operations) {{
                  const button = document.createElement("button");
                  button.className = "oab-operation";
                  button.type = "button";
                  button.innerHTML = `<span><b>${{operation.name}}</b><small>${{operation.kind}} - ${{operation.path || ""}}</small></span><em>${{operation.role || ""}}</em>`;
                  button.addEventListener("click", () => runOperation(operation.kind, operation.name));
                  operationList.appendChild(button);
                }}
              }}

              document.querySelectorAll("[data-meta]").forEach((button) => {{
                button.addEventListener("click", () => runMeta(button.dataset.meta));
              }});
              renderOperations();
              runMeta("health");
              client().me().then((result) => print("me", result)).catch(() => undefined);
            </script>
          </body>
        </html>
        """
    ).strip() + "\n"


def build_login_html(spec: OdooAppBridgeSpec, *, base_prefix: str | None = None) -> str:
    """Build the app-local login shell served by the generated controller."""
    base_prefix = (base_prefix or f"/{spec.app.public_prefix}/{spec.app.slug}").rstrip("/")
    module = spec.app.module
    return textwrap.dedent(
        f"""
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>{_html_escape(spec.app.name)} Login</title>
            <link rel="stylesheet" href="/{module}/static/src/css/app.css" />
          </head>
          <body>
            <main class="oab-shell oab-shell--login">
              <section class="oab-login-card">
                <p class="oab-kicker">{_html_escape(spec.app.slug)}</p>
                <h1>{_html_escape(spec.app.name)}</h1>
                <p>{_html_escape(spec.app.summary)}</p>
                <form id="oab-login-form" class="oab-login-form">
                  <label>
                    <span>Email</span>
                    <input name="login" type="email" autocomplete="username" required />
                  </label>
                  <label>
                    <span>Password</span>
                    <input name="password" type="password" autocomplete="current-password" required />
                  </label>
                  <button type="submit">Continue</button>
                </form>
                <pre id="oab-login-output"></pre>
              </section>
            </main>
            <script type="module">
              const form = document.getElementById("oab-login-form");
              const output = document.getElementById("oab-login-output");
              form.addEventListener("submit", async (event) => {{
                event.preventDefault();
                const data = Object.fromEntries(new FormData(form).entries());
                output.textContent = "Signing in...";
                try {{
                  const response = await fetch({(base_prefix + "/auth/login")!r}, {{
                    method: "POST",
                    headers: {{"Content-Type": "application/json"}},
                    body: JSON.stringify(data),
                  }});
                  const payload = await response.json();
                  output.textContent = JSON.stringify(payload, null, 2);
                  if (response.ok && payload && payload.ok !== false) {{
                    window.location.assign({base_prefix!r});
                  }}
                }} catch (error) {{
                  output.textContent = JSON.stringify({{error: error.message}}, null, 2);
                }}
              }});
            </script>
          </body>
        </html>
        """
    ).strip() + "\n"


def build_public_app_css() -> str:
    return textwrap.dedent(
        """
        :root {
          color-scheme: light;
          --oab-bg: #f6f7f9;
          --oab-surface: #ffffff;
          --oab-text: #18202a;
          --oab-muted: #5f6b7a;
          --oab-line: #d8dde5;
          --oab-accent: #1f7a6d;
          --oab-warm: #ad6b22;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        * { box-sizing: border-box; }
        body { margin: 0; min-height: 100vh; background: var(--oab-bg); color: var(--oab-text); }
        .oab-shell {
          min-height: 100vh;
          width: min(1180px, 100%);
          margin: 0 auto;
          display: grid;
          grid-template-rows: auto 1fr;
          gap: 20px;
          padding: 24px;
        }
        .oab-topbar {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 24px;
          align-items: end;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--oab-line);
        }
        .oab-shell--login {
          place-items: center;
        }
        .oab-login-card {
          width: min(420px, 100%);
          display: grid;
          gap: 16px;
          padding: 24px;
          background: var(--oab-surface);
          border: 1px solid var(--oab-line);
          border-radius: 12px;
          box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
        }
        .oab-login-form {
          display: grid;
          gap: 12px;
        }
        .oab-login-form input {
          min-height: 40px;
          padding: 0 12px;
          border: 1px solid var(--oab-line);
          border-radius: 6px;
          font: inherit;
        }
        .oab-login-form button {
          background: var(--oab-accent);
          color: #ffffff;
        }
        .oab-kicker {
          margin: 0 0 8px;
          color: var(--oab-accent);
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
        }
        h1 { margin: 0 0 8px; font-size: 38px; line-height: 1.08; letter-spacing: 0; }
        p { margin: 0; color: var(--oab-muted); max-width: 68ch; }
        .oab-metrics {
          display: grid;
          grid-template-columns: repeat(4, 88px);
          gap: 8px;
          margin: 0;
        }
        .oab-metrics div {
          min-height: 64px;
          padding: 10px;
          border: 1px solid var(--oab-line);
          border-radius: 8px;
          background: var(--oab-surface);
        }
        dt { margin: 0 0 4px; color: var(--oab-muted); font-size: 12px; font-weight: 700; }
        dd { margin: 0; color: var(--oab-text); font-size: 24px; font-weight: 750; }
        .oab-workspace {
          min-height: 560px;
          display: grid;
          grid-template-columns: 320px minmax(0, 1fr);
          gap: 16px;
        }
        .oab-sidebar, .oab-main {
          min-width: 0;
          background: var(--oab-surface);
          border: 1px solid var(--oab-line);
          border-radius: 8px;
        }
        .oab-sidebar {
          display: grid;
          grid-template-rows: auto minmax(0, 1fr);
          overflow: hidden;
        }
        .oab-controls {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          padding: 12px;
          border-bottom: 1px solid var(--oab-line);
        }
        label {
          display: grid;
          gap: 4px;
          grid-column: 1 / -1;
          color: var(--oab-muted);
          font-size: 12px;
          font-weight: 700;
        }
        input, select, button {
          min-height: 40px;
          padding: 0 14px;
          border: 1px solid var(--oab-line);
          border-radius: 6px;
          background: #ffffff;
          color: var(--oab-text);
          font-weight: 650;
          font: inherit;
        }
        button {
          cursor: pointer;
        }
        button:hover { border-color: var(--oab-accent); color: var(--oab-accent); }
        .oab-operation-list {
          min-height: 0;
          overflow: auto;
          padding: 8px;
        }
        .oab-operation {
          width: 100%;
          min-height: 58px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 8px;
          align-items: center;
          margin-bottom: 6px;
          text-align: left;
        }
        .oab-operation span {
          min-width: 0;
          display: grid;
          gap: 3px;
        }
        .oab-operation b {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .oab-operation small {
          color: var(--oab-muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .oab-operation em {
          color: var(--oab-warm);
          font-size: 12px;
          font-style: normal;
          font-weight: 750;
        }
        .oab-main {
          display: grid;
          grid-template-rows: auto minmax(0, 1fr);
          overflow: hidden;
        }
        .oab-output-header {
          min-height: 52px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 0 16px;
          border-bottom: 1px solid var(--oab-line);
        }
        .oab-output-header span {
          color: var(--oab-muted);
          font-size: 13px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        pre {
          min-height: 0;
          height: 100%;
          overflow: auto;
          margin: 0;
          padding: 16px;
          border-radius: 0;
          background: #101820;
          color: #eff6f4;
          font-size: 13px;
          line-height: 1.45;
        }
        @media (max-width: 820px) {
          .oab-shell { padding: 16px; }
          .oab-topbar { grid-template-columns: 1fr; }
          .oab-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .oab-workspace { grid-template-columns: 1fr; }
          h1 { font-size: 30px; }
        }
        """
    ).strip() + "\n"


def _camel(name: str) -> str:
    parts = [part for part in name.split("_") if part]
    return parts[0] + "".join(part[:1].upper() + part[1:] for part in parts[1:]) if parts else name


def _html_escape(value: str) -> str:
    return (
        str(value)
        .replace("&", "&amp;")
        .replace('"', "&quot;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


__all__ = [
    "build_asyncapi_json_text",
    "build_browser_client_js",
    "build_contract_json_text",
    "build_contract_js_text",
    "build_login_html",
    "build_openapi_json_text",
    "build_public_app_css",
    "build_public_app_html",
]
