"""PocketBase compatibility helpers for OdooBase app bridges."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
import json
from pathlib import Path
import re
import sqlite3
import zipfile
from typing import Any, Iterable, Mapping

from .contracts import (
    BridgeCommandSpec,
    BridgeFilterSpec,
    BridgeParamSpec,
    BridgeQuerySpec,
    BridgeRoleSpec,
    BridgeSecuritySpec,
    OdooAppBridgeSpec,
    OdooAppSpec,
    ValueType,
)
from .module_builder import AppBridgeModuleFile, build_app_bridge_module_files, write_app_bridge_module


PB_COLLECTION_TYPES = frozenset({"base", "auth", "view"})
PB_FIELD_TYPES = frozenset(
    {
        "autodate",
        "bool",
        "date",
        "editor",
        "email",
        "file",
        "geoPoint",
        "json",
        "number",
        "password",
        "relation",
        "select",
        "text",
        "url",
    }
)


@dataclass(frozen=True)
class PocketBaseFieldSpec:
    """A normalized PocketBase field definition."""

    id: str
    name: str
    type: str
    required: bool = False
    system: bool = False
    hidden: bool = False
    presentable: bool = False
    options: Mapping[str, Any] = field(default_factory=dict)
    raw: Mapping[str, Any] = field(default_factory=dict)

    @classmethod
    def from_mapping(cls, raw: Mapping[str, Any]) -> "PocketBaseFieldSpec":
        data = dict(raw)
        field_type = str(data.get("type") or "text")
        options = _field_options(data)
        return cls(
            id=str(data.get("id") or data.get("name") or ""),
            name=_safe_identifier(str(data.get("name") or data.get("id") or "field")),
            type=field_type if field_type in PB_FIELD_TYPES else "text",
            required=bool(data.get("required")),
            system=bool(data.get("system")),
            hidden=bool(data.get("hidden")),
            presentable=bool(data.get("presentable")),
            options=options,
            raw=data,
        )

    def to_mapping(self) -> dict[str, Any]:
        data = asdict(self)
        data["options"] = dict(self.options)
        data["raw"] = dict(self.raw)
        return data


@dataclass(frozen=True)
class PocketBaseCollectionSpec:
    """A normalized PocketBase collection definition."""

    id: str
    name: str
    type: str = "base"
    system: bool = False
    fields: tuple[PocketBaseFieldSpec, ...] = ()
    indexes: tuple[str, ...] = ()
    list_rule: str | None = None
    view_rule: str | None = None
    create_rule: str | None = None
    update_rule: str | None = None
    delete_rule: str | None = None
    options: Mapping[str, Any] = field(default_factory=dict)
    raw: Mapping[str, Any] = field(default_factory=dict)

    @classmethod
    def from_mapping(cls, raw: Mapping[str, Any]) -> "PocketBaseCollectionSpec":
        data = dict(raw)
        collection_type = str(data.get("type") or "base")
        fields_raw = data.get("fields")
        if fields_raw is None:
            fields_raw = data.get("schema") or ()
        return cls(
            id=str(data.get("id") or data.get("name") or ""),
            name=_safe_operation(str(data.get("name") or data.get("id") or "collection")),
            type=collection_type if collection_type in PB_COLLECTION_TYPES else "base",
            system=bool(data.get("system")),
            fields=tuple(PocketBaseFieldSpec.from_mapping(item) for item in fields_raw or ()),
            indexes=tuple(str(item) for item in data.get("indexes") or ()),
            list_rule=_nullable_rule(data.get("listRule")),
            view_rule=_nullable_rule(data.get("viewRule")),
            create_rule=_nullable_rule(data.get("createRule")),
            update_rule=_nullable_rule(data.get("updateRule")),
            delete_rule=_nullable_rule(data.get("deleteRule")),
            options=_collection_options(data),
            raw=data,
        )

    def to_mapping(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "system": self.system,
            "fields": [item.to_mapping() for item in self.fields],
            "indexes": list(self.indexes),
            "listRule": self.list_rule,
            "viewRule": self.view_rule,
            "createRule": self.create_rule,
            "updateRule": self.update_rule,
            "deleteRule": self.delete_rule,
            "options": dict(self.options),
            "raw": dict(self.raw),
        }


@dataclass(frozen=True)
class PocketBaseCompatSpec:
    """Normalized compatibility plan generated from a PocketBase project/export."""

    collections: tuple[PocketBaseCollectionSpec, ...]
    app: OdooAppSpec
    security: BridgeSecuritySpec
    warnings: tuple[str, ...] = ()

    def to_mapping(self) -> dict[str, Any]:
        return {
            "app": asdict(self.app),
            "security": asdict(self.security),
            "collections": [item.to_mapping() for item in self.collections],
            "warnings": list(self.warnings),
            "compatibility": compatibility_matrix(),
        }


def load_pocketbase_export(source: str | Path | Mapping[str, Any] | Iterable[Mapping[str, Any]]) -> dict[str, Any]:
    """Load a PocketBase schema export from JSON, a project directory or pb_data/data.db."""

    if isinstance(source, Mapping):
        return _normalize_export(source)
    if not isinstance(source, (str, Path)):
        return _normalize_export({"collections": list(source)})

    path = Path(source)
    if path.is_dir():
        json_candidate = _first_existing(
            path / "pb_schema.json",
            path / "collections.json",
            path / "pocketbase_collections.json",
        )
        if json_candidate:
            return load_pocketbase_export(json_candidate)
        db_candidate = _first_existing(path / "pb_data" / "data.db", path / "data.db")
        if db_candidate:
            return _load_pocketbase_sqlite(db_candidate)
        raise FileNotFoundError(f"PocketBase project export not found below {path}")

    if path.suffix.lower() == ".db":
        return _load_pocketbase_sqlite(path)
    raw = json.loads(path.read_text(encoding="utf-8"))
    return _normalize_export(raw)


def pocketbase_export_to_app_bridge_spec(
    source: str | Path | Mapping[str, Any] | Iterable[Mapping[str, Any]],
    *,
    app: OdooAppSpec | Mapping[str, Any] | None = None,
    security: BridgeSecuritySpec | Mapping[str, Any] | None = None,
    model_prefix: str | None = None,
    allow_public_mutations: bool = False,
) -> OdooAppBridgeSpec:
    """Translate a PocketBase export into an OdooBase app bridge contract."""

    export = load_pocketbase_export(source)
    collections = tuple(PocketBaseCollectionSpec.from_mapping(item) for item in export["collections"])
    bridge_app = _coerce_app(app, collections)
    bridge_security = _coerce_security(security, allow_public_mutations=allow_public_mutations)
    prefix = model_prefix or bridge_app.module
    roles = (
        BridgeRoleSpec(name="public", auth="public", description="Anonymous PocketBase-compatible read access."),
        BridgeRoleSpec(name="app_user", auth="app_user", description="App-local authenticated PocketBase user."),
        BridgeRoleSpec(
            name="operator",
            auth="internal",
            required_groups=("base.group_user",),
            description="Odoo backend operator for private compatibility operations.",
        ),
    )
    queries: list[BridgeQuerySpec] = []
    commands: list[BridgeCommandSpec] = []

    for collection in collections:
        if collection.type == "view":
            queries.append(_query_for_collection(collection, bridge_security, prefix))
            continue
        queries.append(_query_for_collection(collection, bridge_security, prefix))
        commands.extend(
            _commands_for_collection(
                collection,
                bridge_security,
                prefix,
                allow_public_mutations=allow_public_mutations,
            )
        )

    return OdooAppBridgeSpec(
        app=bridge_app,
        security=bridge_security,
        roles=roles,
        queries=tuple(queries),
        commands=tuple(commands),
    )


def build_pocketbase_compat_extra_files(
    source: str | Path | Mapping[str, Any] | Iterable[Mapping[str, Any]],
    spec: OdooAppBridgeSpec,
) -> tuple[AppBridgeModuleFile, ...]:
    """Return PocketBase compatibility static assets for a generated module."""

    export = load_pocketbase_export(source)
    collections = tuple(PocketBaseCollectionSpec.from_mapping(item) for item in export["collections"])
    module_root = Path(spec.app.module)
    compat_payload = {
        "collections": [item.raw or _collection_wire_mapping(item) for item in collections],
        "normalized": [item.to_mapping() for item in collections],
        "compatibility": compatibility_matrix(),
        "routes": _route_map(spec),
    }
    return (
        AppBridgeModuleFile(
            module_root / "static" / "src" / "js" / "pocketbase_compat.js",
            build_pocketbase_compat_js(spec, collections),
            "static",
        ),
        AppBridgeModuleFile(
            module_root / "static" / "src" / "json" / "pocketbase_collections.json",
            json.dumps(compat_payload, indent=2, ensure_ascii=False) + "\n",
            "static",
        ),
    )


def build_pocketbase_compat_js(spec: OdooAppBridgeSpec, collections: Iterable[PocketBaseCollectionSpec]) -> str:
    """Build a small PocketBase JS SDK-compatible shim over the generated bridge client."""

    route_map = _route_map(spec)
    collection_payload = [_collection_wire_mapping(item) for item in collections]
    base_prefix = f"/{spec.app.public_prefix}/{spec.app.slug}".replace("//", "/")
    routes_json = json.dumps(route_map, indent=2, ensure_ascii=False)
    collections_json = json.dumps(collection_payload, indent=2, ensure_ascii=False)
    return (
        f"import {{ OdooAppBridgeClient }} from './bridge_client.js';\n\n"
        f"export const pocketbaseCollections = {collections_json};\n"
        f"export const pocketbaseRoutes = {routes_json};\n\n"
        "class PocketBaseAuthStore {\n"
        "  constructor() {\n"
        "    this.token = '';\n"
        "    this.record = null;\n"
        "    this._listeners = new Set();\n"
        "  }\n\n"
        "  get isValid() { return Boolean(this.record); }\n\n"
        "  save(token, record) {\n"
        "    this.token = token || '';\n"
        "    this.record = record || null;\n"
        "    this._emit();\n"
        "  }\n\n"
        "  clear() {\n"
        "    this.token = '';\n"
        "    this.record = null;\n"
        "    this._emit();\n"
        "  }\n\n"
        "  onChange(callback, fireImmediately = false) {\n"
        "    this._listeners.add(callback);\n"
        "    if (fireImmediately) callback(this.token, this.record);\n"
        "    return () => this._listeners.delete(callback);\n"
        "  }\n\n"
        "  _emit() {\n"
        "    for (const callback of this._listeners) callback(this.token, this.record);\n"
        "  }\n"
        "}\n\n"
        "class PocketBaseCollectionService {\n"
        "  constructor(client, name) {\n"
        "    this.client = client;\n"
        "    this.name = name;\n"
        "    this.routes = pocketbaseRoutes[name] || null;\n"
        "  }\n\n"
        "  async getList(page = 1, perPage = 30, query = {}) {\n"
        "    if (!this.routes?.query) throw new Error(`unknown_collection:${this.name}`);\n"
        "    const safePage = Math.max(1, Number(page || 1));\n"
        "    const safePerPage = Math.max(1, Number(perPage || 30));\n"
        "    const response = await this.client.bridge.query(this.routes.query, {\n"
        "      filters: this._filters(query),\n"
        "      limit: safePerPage,\n"
        "      offset: (safePage - 1) * safePerPage,\n"
        "      sort: this._sort(query),\n"
        "      context: query.context || {},\n"
        "    });\n"
        "    const items = response.data || [];\n"
        "    const totalItems = Number(response.meta?.totalItems || items.length);\n"
        "    return { page: safePage, perPage: safePerPage, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / safePerPage)), items };\n"
        "  }\n\n"
        "  async getFullList(options = {}) {\n"
        "    const batch = Number(options.batch || options.perPage || 200);\n"
        "    const result = await this.getList(1, batch, options);\n"
        "    return result.items;\n"
        "  }\n\n"
        "  async getFirstListItem(filter, options = {}) {\n"
        "    const result = await this.getList(1, 1, {...options, filter});\n"
        "    if (!result.items.length) throw new Error('record_not_found');\n"
        "    return result.items[0];\n"
        "  }\n\n"
        "  async getOne(id, options = {}) {\n"
        "    const result = await this.getList(1, 1, {...options, filters: {...(options.filters || {}), id}});\n"
        "    if (!result.items.length) throw new Error('record_not_found');\n"
        "    return result.items[0];\n"
        "  }\n\n"
        "  async create(body = {}, options = {}) {\n"
        "    if (!this.routes?.create) throw new Error(`create_not_supported:${this.name}`);\n"
        "    const response = await this.client.bridge.command(this.routes.create, {\n"
        "      params: body,\n"
        "      context: options.context || {},\n"
        "      idempotencyKey: options.idempotencyKey || this.client.createIdempotencyKey(`pb-${this.name}-create`),\n"
        "    });\n"
        "    return response.data;\n"
        "  }\n\n"
        "  async update(id, body = {}, options = {}) {\n"
        "    if (!this.routes?.update) throw new Error(`update_not_supported:${this.name}`);\n"
        "    const response = await this.client.bridge.command(this.routes.update, {\n"
        "      ids: [id],\n"
        "      params: body,\n"
        "      context: options.context || {},\n"
        "      idempotencyKey: options.idempotencyKey || this.client.createIdempotencyKey(`pb-${this.name}-update`),\n"
        "    });\n"
        "    return response.data;\n"
        "  }\n\n"
        "  async delete(id, options = {}) {\n"
        "    if (!this.routes?.delete) throw new Error(`delete_not_supported:${this.name}`);\n"
        "    await this.client.bridge.command(this.routes.delete, {\n"
        "      ids: [id],\n"
        "      context: options.context || {},\n"
        "      idempotencyKey: options.idempotencyKey || this.client.createIdempotencyKey(`pb-${this.name}-delete`),\n"
        "    });\n"
        "    return true;\n"
        "  }\n\n"
        "  async authWithPassword(identity, password, options = {}) {\n"
        "    const response = await this.client.bridge.login(identity, password, options);\n"
        "    const record = response.data || null;\n"
        "    const token = response.token || response.data?.token || '';\n"
        "    this.client.authStore.save(token, record);\n"
        "    return { token, record };\n"
        "  }\n\n"
        "  async authRefresh() {\n"
        "    const response = await this.client.bridge.me();\n"
        "    const record = response.data || null;\n"
        "    this.client.authStore.save(this.client.authStore.token, record);\n"
        "    return { token: this.client.authStore.token, record };\n"
        "  }\n\n"
        "  async listAuthMethods() {\n"
        "    const response = await this.client.bridge.oauth2Providers();\n"
        "    return { password: { enabled: true }, oauth2: { enabled: true, providers: response.data || [] } };\n"
        "  }\n\n"
        "  async authWithOAuth2Code(provider, code, codeVerifier, redirectUrl, createData = {}) {\n"
        "    const response = await this.client.bridge.oauth2Callback({provider, code, code_verifier: codeVerifier, redirect_url: redirectUrl, createData});\n"
        "    const record = response.data || null;\n"
        "    const token = response.token || response.data?.token || '';\n"
        "    this.client.authStore.save(token, record);\n"
        "    return { token, record };\n"
        "  }\n\n"
        "  subscribe(topic, callback) {\n"
        "    return this.client._subscribe(`${this.name}/${topic}`, callback);\n"
        "  }\n\n"
        "  unsubscribe(topic = '') {\n"
        "    return this.client._unsubscribe(topic ? `${this.name}/${topic}` : '');\n"
        "  }\n\n"
        "  _filters(query) {\n"
        "    if (query.filters) return query.filters;\n"
        "    if (query.filter && typeof query.filter === 'object') return query.filter;\n"
        "    return {};\n"
        "  }\n\n"
        "  _sort(query) {\n"
        "    if (!query.sort || typeof query.sort !== 'string') return null;\n"
        "    const first = query.sort.split(',')[0].trim();\n"
        "    if (!first) return null;\n"
        "    return first.startsWith('-') ? {field: first.slice(1), dir: 'desc'} : {field: first, dir: 'asc'};\n"
        "  }\n"
        "}\n\n"
        "export class PocketBaseCompat {\n"
        f"  constructor(baseUrl = {base_prefix!r}, options = {{}}) {{\n"
        "    this.baseUrl = String(baseUrl || '').replace(/[/]$/, '');\n"
        "    this.bridge = options.bridge || new OdooAppBridgeClient({basePrefix: this.baseUrl, mode: options.mode || 'network', transport: options.transport || null});\n"
        "    this.authStore = options.authStore || new PocketBaseAuthStore();\n"
        "    this.collections = {\n"
        "      getFullList: async () => pocketbaseCollections,\n"
        "      import: async () => { throw new Error('collection_import_requires_regeneration'); },\n"
        "    };\n"
        "    this.health = { check: () => this.bridge.health() };\n"
        "    this.files = { getURL: (record, filename) => filename || record?.url || '' };\n"
        "    this._subscriptions = new Map();\n"
        "  }\n\n"
        "  collection(name) { return new PocketBaseCollectionService(this, name); }\n\n"
        "  createIdempotencyKey(prefix) {\n"
        "    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;\n"
        "  }\n\n"
        "  filter(expression, params = {}) {\n"
        "    return String(expression || '').replace(/\\{:\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*\\}/g, (_match, key) => JSON.stringify(params[key]));\n"
        "  }\n\n"
        "  _subscribe(topic, callback) {\n"
        "    const key = topic || '*';\n"
        "    if (!this._subscriptions.has(key)) this._subscriptions.set(key, new Set());\n"
        "    this._subscriptions.get(key).add(callback);\n"
        "    return () => this._unsubscribe(key, callback);\n"
        "  }\n\n"
        "  _unsubscribe(topic = '', callback = null) {\n"
        "    if (!topic) {\n"
        "      this._subscriptions.clear();\n"
        "      return Promise.resolve();\n"
        "    }\n"
        "    const listeners = this._subscriptions.get(topic);\n"
        "    if (listeners && callback) listeners.delete(callback);\n"
        "    else this._subscriptions.delete(topic);\n"
        "    return Promise.resolve();\n"
        "  }\n"
        "}\n\n"
        "export { PocketBaseCompat as PocketBase };\n"
        "export default PocketBaseCompat;\n"
    )


def build_pocketbase_compatible_module_files(
    source: str | Path | Mapping[str, Any] | Iterable[Mapping[str, Any]],
    *,
    app: OdooAppSpec | Mapping[str, Any] | None = None,
    security: BridgeSecuritySpec | Mapping[str, Any] | None = None,
    model_prefix: str | None = None,
    allow_public_mutations: bool = False,
) -> tuple[AppBridgeModuleFile, ...]:
    """Build all generated Odoo addon files plus PocketBase compatibility assets."""

    spec = pocketbase_export_to_app_bridge_spec(
        source,
        app=app,
        security=security,
        model_prefix=model_prefix,
        allow_public_mutations=allow_public_mutations,
    )
    extra_files = build_pocketbase_compat_extra_files(source, spec)
    return build_app_bridge_module_files(spec, extra_files=extra_files)


def write_pocketbase_compat_module_zip(
    target_root: str | Path,
    source: str | Path | Mapping[str, Any] | Iterable[Mapping[str, Any]],
    *,
    app: OdooAppSpec | Mapping[str, Any] | None = None,
    security: BridgeSecuritySpec | Mapping[str, Any] | None = None,
    model_prefix: str | None = None,
    allow_public_mutations: bool = False,
    overwrite: bool = False,
) -> Path:
    """One-line helper: export a PocketBase project as an importable OdooBase module zip."""

    bridge_spec = pocketbase_export_to_app_bridge_spec(
        source,
        app=app,
        security=security,
        model_prefix=model_prefix,
        allow_public_mutations=allow_public_mutations,
    )
    extra_files = build_pocketbase_compat_extra_files(source, bridge_spec)
    root = Path(target_root)
    write_app_bridge_module(root, bridge_spec, extra_files=extra_files, overwrite=overwrite)
    zip_path = root / f"{bridge_spec.app.module}.zip"
    if zip_path.exists() and not overwrite:
        raise FileExistsError(f"PocketBase compat zip already exists: {zip_path}")
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        module_root = root / bridge_spec.app.module
        for path in sorted(module_root.rglob("*")):
            if path.is_file():
                archive.write(path, arcname=str(path.relative_to(root)).replace("\\", "/"))
    return zip_path


write_odoobase_from_pocketbase_zip = write_pocketbase_compat_module_zip


def compatibility_matrix() -> dict[str, dict[str, str]]:
    return {
        "collections": {"status": "generated", "notes": "base/auth/view exports become OdooBase query and command contracts."},
        "record_crud": {"status": "generated", "notes": "list/get/create/update/delete map to bridge query/command routes."},
        "auth_password": {"status": "generated", "notes": "authWithPassword maps to app-local login and authStore."},
        "oauth2": {"status": "partial", "notes": "PKCE provider start/callback routes are generated; provider normalization stays hook-owned."},
        "files": {"status": "adapter", "notes": "file fields are represented as string/list values; storage policy remains Odoo-owned."},
        "realtime": {"status": "adapter", "notes": "subscribe/unsubscribe are local stubs until an Odoo bus/SSE adapter is enabled."},
        "hooks": {"status": "translated", "notes": "PocketBase JS hooks are not executed; OdooBase exposes typed hooks and functions."},
        "migrations": {"status": "translated", "notes": "PocketBase collection export regenerates an Odoo module; destructive imports are avoided."},
    }


def _normalize_export(raw: Any) -> dict[str, Any]:
    if isinstance(raw, list):
        collections = raw
    elif isinstance(raw, Mapping):
        collections = raw.get("collections")
        if collections is None and "items" in raw:
            collections = raw.get("items")
        if collections is None and {"id", "name", "type"} <= set(raw):
            collections = [raw]
    else:
        collections = None
    if not isinstance(collections, list):
        raise ValueError("PocketBase export must be a collection array or an object with collections")
    return {"collections": [dict(item) for item in collections]}


def _load_pocketbase_sqlite(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise FileNotFoundError(path)
    with sqlite3.connect(path) as db:
        db.row_factory = sqlite3.Row
        tables = {
            str(row["name"])
            for row in db.execute("select name from sqlite_master where type = 'table'").fetchall()
        }
        table = "_collections" if "_collections" in tables else "collections" if "collections" in tables else ""
        if not table:
            raise ValueError(f"PocketBase collections table not found in {path}")
        rows = [dict(row) for row in db.execute(f'select * from "{table}"').fetchall()]
    collections = [_sqlite_collection_to_mapping(row) for row in rows]
    return _normalize_export({"collections": collections})


def _sqlite_collection_to_mapping(row: Mapping[str, Any]) -> dict[str, Any]:
    data = dict(row)
    for key in ("fields", "schema", "indexes", "options"):
        if isinstance(data.get(key), str):
            try:
                data[key] = json.loads(data[key] or "null")
            except json.JSONDecodeError:
                pass
    fields = data.get("fields", data.get("schema")) or []
    if isinstance(fields, Mapping):
        fields = list(fields.values())
    return {
        "id": data.get("id") or data.get("name"),
        "name": data.get("name") or data.get("id"),
        "type": data.get("type") or "base",
        "system": bool(data.get("system")),
        "fields": fields,
        "indexes": data.get("indexes") or [],
        "listRule": data.get("listRule", data.get("list_rule")),
        "viewRule": data.get("viewRule", data.get("view_rule")),
        "createRule": data.get("createRule", data.get("create_rule")),
        "updateRule": data.get("updateRule", data.get("update_rule")),
        "deleteRule": data.get("deleteRule", data.get("delete_rule")),
    }


def _query_for_collection(
    collection: PocketBaseCollectionSpec,
    security: BridgeSecuritySpec,
    model_prefix: str,
) -> BridgeQuerySpec:
    role = _read_rule_role(collection.list_rule)
    fields = _query_fields(collection)
    response_map = {field: field for field in fields}
    if "create_date" in fields:
        response_map["created"] = "create_date"
    if "write_date" in fields:
        response_map["updated"] = "write_date"
    return BridgeQuerySpec(
        name=collection.name,
        path=f"collections/{collection.name}/records",
        model=_model_name(model_prefix, collection.name),
        role=role,
        fields=fields,
        fixed_domain=tuple(_simple_rule_domain(collection.list_rule)),
        default_limit=min(30, security.max_page_size),
        max_limit=min(100, security.max_page_size),
        order="write_date desc",
        sortable_fields=fields,
        filters=tuple(_filters_for_collection(collection)),
        response_map=response_map,
        tags=("pocketbase", "collection"),
        risk_tags=_rule_risk_tags(collection.list_rule),
        notes=_rule_note("PB listRule", collection.list_rule),
    )


def _commands_for_collection(
    collection: PocketBaseCollectionSpec,
    security: BridgeSecuritySpec,
    model_prefix: str,
    *,
    allow_public_mutations: bool,
) -> tuple[BridgeCommandSpec, ...]:
    params = tuple(_params_for_collection(collection))
    model = _model_name(model_prefix, collection.name)
    return (
        BridgeCommandSpec(
            name=f"create_{collection.name}",
            path=f"collections/{collection.name}/records/create",
            model=model,
            method="create",
            role=_mutation_rule_role(collection.create_rule, allow_public_mutations=allow_public_mutations),
            ids_required=False,
            max_ids=1,
            params=params,
            idempotent=True,
            require_idempotency_key=False,
            tags=("pocketbase", "collection"),
            risk_tags=_rule_risk_tags(collection.create_rule),
            notes=_rule_note("PB createRule", collection.create_rule),
        ),
        BridgeCommandSpec(
            name=f"update_{collection.name}",
            path=f"collections/{collection.name}/records/update",
            model=model,
            method="write",
            role=_mutation_rule_role(collection.update_rule, allow_public_mutations=allow_public_mutations),
            ids_required=True,
            max_ids=1,
            params=params,
            idempotent=True,
            require_idempotency_key=False,
            tags=("pocketbase", "collection"),
            risk_tags=_rule_risk_tags(collection.update_rule),
            notes=_rule_note("PB updateRule", collection.update_rule),
        ),
        BridgeCommandSpec(
            name=f"delete_{collection.name}",
            path=f"collections/{collection.name}/records/delete",
            model=model,
            method="unlink",
            role=_mutation_rule_role(collection.delete_rule, allow_public_mutations=allow_public_mutations),
            ids_required=True,
            max_ids=1,
            params=(),
            idempotent=True,
            require_idempotency_key=False,
            tags=("pocketbase", "collection"),
            risk_tags=_rule_risk_tags(collection.delete_rule),
            notes=_rule_note("PB deleteRule", collection.delete_rule),
        ),
    )


def _query_fields(collection: PocketBaseCollectionSpec) -> tuple[str, ...]:
    fields: list[str] = ["id"]
    for field_spec in collection.fields:
        if field_spec.hidden or field_spec.type == "password":
            continue
        if field_spec.name not in fields:
            fields.append(field_spec.name)
    for system_field in ("create_date", "write_date"):
        if system_field not in fields:
            fields.append(system_field)
    return tuple(fields)


def _filters_for_collection(collection: PocketBaseCollectionSpec) -> list[BridgeFilterSpec]:
    filters = [BridgeFilterSpec(name="id", field="id", operator="=", type="int", required=False)]
    for field_spec in collection.fields:
        if field_spec.hidden or field_spec.type in {"password", "file", "json", "geoPoint"}:
            continue
        filters.append(
            BridgeFilterSpec(
                name=field_spec.name,
                field=field_spec.name,
                operator="=",
                type=_bridge_value_type(field_spec),
                required=False,
                notes=f"PocketBase {field_spec.type} filter.",
            )
        )
    return filters


def _params_for_collection(collection: PocketBaseCollectionSpec) -> list[BridgeParamSpec]:
    params: list[BridgeParamSpec] = []
    for field_spec in collection.fields:
        if field_spec.system or field_spec.hidden or field_spec.type in {"autodate", "password"}:
            continue
        params.append(
            BridgeParamSpec(
                name=field_spec.name,
                type=_bridge_value_type(field_spec),
                required=field_spec.required,
                notes=f"PocketBase {field_spec.type} field.",
            )
        )
    return params


def _bridge_value_type(field_spec: PocketBaseFieldSpec) -> ValueType:
    max_select = _max_select(field_spec)
    if field_spec.type in {"file", "relation", "select"} and max_select > 1:
        return "list[str]"
    if field_spec.type == "number":
        return "float"
    if field_spec.type == "bool":
        return "bool"
    if field_spec.type in {"date", "autodate"}:
        return "datetime"
    if field_spec.type in {"json", "geoPoint"}:
        return "json"
    return "str"


def _simple_rule_domain(rule: str | None) -> list[tuple[str, str, Any]]:
    text = (rule or "").strip()
    if not text or "@request." in text or "||" in text or "&&" in text:
        return []
    match = re.fullmatch(r"([A-Za-z_][A-Za-z0-9_]*)\s*(=|!=)\s*(true|false|'[^']*'|\"[^\"]*\"|-?\d+(?:\.\d+)?)", text)
    if not match:
        return []
    field_name, operator, raw_value = match.groups()
    if raw_value == "true":
        value: Any = True
    elif raw_value == "false":
        value = False
    elif raw_value.startswith(("'", '"')):
        value = raw_value[1:-1]
    elif "." in raw_value:
        value = float(raw_value)
    else:
        value = int(raw_value)
    return [(field_name, operator, value)]


def _read_rule_role(rule: str | None) -> str:
    if rule is None:
        return "app_user"
    text = rule.strip()
    if not text:
        return "public"
    if "@request.auth" in text:
        return "app_user"
    return "public"


def _mutation_rule_role(rule: str | None, *, allow_public_mutations: bool) -> str:
    if rule is None:
        return "operator"
    text = rule.strip()
    if not text and allow_public_mutations:
        return "public"
    if "@request.auth" in text or not text:
        return "app_user"
    return "app_user"


def _rule_risk_tags(rule: str | None) -> tuple[str, ...]:
    if rule is None:
        return ("private",)
    if not rule.strip():
        return ("public",)
    if "@" in rule or "||" in rule or "&&" in rule:
        return ("translated-rule",)
    return ()


def _rule_note(prefix: str, rule: str | None) -> str:
    if rule is None:
        return f"{prefix}: null"
    if not rule.strip():
        return f"{prefix}: public empty rule"
    return f"{prefix}: {rule}"


def _route_map(spec: OdooAppBridgeSpec) -> dict[str, dict[str, str]]:
    routes: dict[str, dict[str, str]] = {}
    for query in spec.queries:
        collection = _collection_from_path(query.path)
        routes.setdefault(collection, {})["query"] = query.name
    for command in spec.commands:
        collection = _collection_from_path(command.path)
        action = command.name.split("_", 1)[0]
        routes.setdefault(collection, {})[action] = command.name
    return routes


def _collection_from_path(path: str) -> str:
    parts = path.split("/")
    if len(parts) >= 2 and parts[0] == "collections":
        return parts[1]
    return _safe_operation(path.replace("/", "_"))


def _coerce_app(app: OdooAppSpec | Mapping[str, Any] | None, collections: tuple[PocketBaseCollectionSpec, ...]) -> OdooAppSpec:
    if isinstance(app, OdooAppSpec):
        return app
    if app:
        return OdooAppSpec(**dict(app))
    first = collections[0].name if collections else "app"
    return OdooAppSpec(
        name=f"OdooBase {first.title()}",
        slug=first.replace("_", "-"),
        module=f"x_{_safe_operation(first)}",
        summary="PocketBase-compatible OdooBase app.",
    )


def _coerce_security(
    security: BridgeSecuritySpec | Mapping[str, Any] | None,
    *,
    allow_public_mutations: bool,
) -> BridgeSecuritySpec:
    if isinstance(security, BridgeSecuritySpec):
        return security
    data = dict(security or {})
    data.setdefault("default_role", "public")
    data.setdefault("enable_app_login", True)
    data.setdefault("max_page_size", 100)
    if allow_public_mutations:
        data.setdefault("deny_public_commands", False)
    return BridgeSecuritySpec(**data)


def _collection_wire_mapping(collection: PocketBaseCollectionSpec) -> dict[str, Any]:
    if collection.raw:
        return dict(collection.raw)
    return {
        "id": collection.id,
        "name": collection.name,
        "type": collection.type,
        "system": collection.system,
        "fields": [field_spec.raw or field_spec.to_mapping() for field_spec in collection.fields],
        "indexes": list(collection.indexes),
        "listRule": collection.list_rule,
        "viewRule": collection.view_rule,
        "createRule": collection.create_rule,
        "updateRule": collection.update_rule,
        "deleteRule": collection.delete_rule,
    }


def _field_options(data: Mapping[str, Any]) -> dict[str, Any]:
    options = dict(data.get("options") or {})
    for key in (
        "values",
        "min",
        "max",
        "pattern",
        "maxSize",
        "maxSelect",
        "collectionId",
        "cascadeDelete",
        "mimeTypes",
        "thumbs",
        "exceptDomains",
        "onlyDomains",
    ):
        if key in data and key not in options:
            options[key] = data[key]
    return options


def _collection_options(data: Mapping[str, Any]) -> dict[str, Any]:
    ignored = {
        "id",
        "name",
        "type",
        "system",
        "fields",
        "schema",
        "indexes",
        "listRule",
        "viewRule",
        "createRule",
        "updateRule",
        "deleteRule",
    }
    return {str(key): value for key, value in data.items() if key not in ignored}


def _nullable_rule(value: Any) -> str | None:
    if value is None:
        return None
    return str(value)


def _max_select(field_spec: PocketBaseFieldSpec) -> int:
    raw = field_spec.options.get("maxSelect", field_spec.raw.get("maxSelect", 1))
    try:
        return int(raw or 1)
    except (TypeError, ValueError):
        return 1


def _model_name(prefix: str, collection: str) -> str:
    model_prefix = ".".join(_safe_operation(part) for part in str(prefix).split(".") if part)
    if "." not in model_prefix:
        model_prefix = f"{model_prefix}.pb"
    return f"{model_prefix}_{_safe_operation(collection)}"


def _safe_identifier(value: str) -> str:
    token = re.sub(r"[^A-Za-z0-9_]+", "_", str(value or "")).strip("_")
    if not token:
        token = "field"
    if token[:1].isdigit():
        token = f"x_{token}"
    return token


def _safe_operation(value: str) -> str:
    token = re.sub(r"[^a-zA-Z0-9_]+", "_", str(value or "").lower()).strip("_")
    if not token:
        token = "item"
    if token[:1].isdigit():
        token = f"x_{token}"
    return token


def _first_existing(*paths: Path) -> Path | None:
    for path in paths:
        if path.exists():
            return path
    return None


__all__ = [
    "PocketBaseCollectionSpec",
    "PocketBaseCompatSpec",
    "PocketBaseFieldSpec",
    "build_pocketbase_compat_extra_files",
    "build_pocketbase_compat_js",
    "build_pocketbase_compatible_module_files",
    "compatibility_matrix",
    "load_pocketbase_export",
    "pocketbase_export_to_app_bridge_spec",
    "write_odoobase_from_pocketbase_zip",
    "write_pocketbase_compat_module_zip",
]
