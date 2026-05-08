"""Contract objects for complete base-only Odoo app bridges."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from hashlib import sha256
import json
from pathlib import Path
import re
import tomllib
from typing import Any, Literal, Mapping


AuthMode = Literal["public", "portal", "internal", "bot", "app_user"]
ValueType = Literal[
    "str",
    "int",
    "float",
    "bool",
    "date",
    "datetime",
    "json",
    "list[str]",
    "list[int]",
    "list[float]",
    "list[bool]",
]
EventDirection = Literal["outbound", "inbound"]
CronInterval = Literal["minutes", "hours", "days", "weeks", "months"]

ALLOWED_AUTH = frozenset({"public", "portal", "internal", "bot", "app_user"})
ALLOWED_VALUE_TYPES = frozenset(
    {
        "str",
        "int",
        "float",
        "bool",
        "date",
        "datetime",
        "json",
        "list[str]",
        "list[int]",
        "list[float]",
        "list[bool]",
    }
)
ALLOWED_OPERATORS = frozenset({"=", "!=", "in", "ilike", "like", ">", ">=", "<", "<=", "child_of"})
ALLOWED_EVENT_DIRECTIONS = frozenset({"outbound", "inbound"})
ALLOWED_CRON_INTERVALS = frozenset({"minutes", "hours", "days", "weeks", "months"})

MODULE_RE = re.compile(r"^x_[a-z][a-z0-9_]*$")
SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9_\-]*$")
OPERATION_RE = re.compile(r"^[a-z][a-z0-9_]*$")
IDENTIFIER_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")
HANDLER_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)*$")
MODEL_RE = re.compile(r"^[a-z_][a-z0-9_]*(\.[a-z_][a-z0-9_]*)+$")
PATH_RE = re.compile(r"^[a-z0-9][a-z0-9_\-/]*$")
GROUP_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_.]*$")
TAG_RE = re.compile(r"^[a-z0-9][a-z0-9_\-]*$")
COOKIE_RE = re.compile(r"^[A-Za-z][A-Za-z0-9_\-]*$")


@dataclass(frozen=True)
class OdooAppSpec:
    """Top-level generated Odoo addon identity."""

    name: str
    slug: str
    module: str
    summary: str
    version: str = "18.0.1.0.0"
    description: str = ""
    public_prefix: str = "apps"
    depends: tuple[str, ...] = ("base",)
    base_only: bool = True
    license: str = "LGPL-3"
    application: bool = True

    def __post_init__(self) -> None:
        module = _clean_required(self.module, "app.module").lower()
        slug = _clean_required(self.slug, "app.slug").lower()
        public_prefix = _clean_path(self.public_prefix, "app.public_prefix")
        depends = _clean_text_tuple(self.depends, "app.depends")
        if not MODULE_RE.match(module):
            raise ValueError(f"app.module must be an Odoo custom addon name like x_my_app: {module!r}")
        if not SLUG_RE.match(slug):
            raise ValueError(f"app.slug must be URL-safe lowercase text: {slug!r}")
        if "base" not in depends:
            raise ValueError("app.depends must include base")
        if self.base_only and depends != ("base",):
            raise ValueError("base_only app bridges must depend only on base")
        object.__setattr__(self, "name", _clean_required(self.name, "app.name"))
        object.__setattr__(self, "slug", slug)
        object.__setattr__(self, "module", module)
        object.__setattr__(self, "summary", _clean_required(self.summary, "app.summary"))
        object.__setattr__(self, "version", _clean_required(self.version, "app.version"))
        object.__setattr__(self, "description", _clean_optional(self.description))
        object.__setattr__(self, "public_prefix", public_prefix)
        object.__setattr__(self, "depends", depends)
        object.__setattr__(self, "license", _clean_required(self.license, "app.license"))
        object.__setattr__(self, "application", bool(self.application))


@dataclass(frozen=True)
class BridgeSecuritySpec:
    """Security defaults shared by generated admin and public endpoints."""

    default_role: str | None = None
    deny_public_commands: bool = True
    force_csrf_for_session_commands: bool = True
    allowed_cors_origins: tuple[str, ...] = ()
    api_key_required: bool = True
    rate_limit_enabled: bool = True
    rate_limit_per_minute: int = 60
    require_https: bool = True
    max_payload_bytes: int = 1048576
    oauth_allow_email_fallback: bool = False
    expose_provider_secrets: bool = False
    expose_static_provider_config: bool = False
    max_page_size: int = 100
    max_batch_ids: int = 100
    log_requests: bool = True
    expose_contract_endpoint: bool = True
    expose_openapi_endpoint: bool = True
    expose_asyncapi_endpoint: bool = True
    enable_idempotency: bool = True
    idempotency_ttl_hours: int = 72
    contract_digest_header: bool = True
    enable_app_login: bool = True
    app_session_ttl_hours: int = 12
    app_session_cookie_name: str = "oab_session"
    app_password_iterations: int = 120000
    oauth_state_ttl_minutes: int = 10

    def __post_init__(self) -> None:
        default_role = _clean_optional(self.default_role)
        object.__setattr__(self, "default_role", default_role or None)
        object.__setattr__(
            self,
            "allowed_cors_origins",
            _clean_text_tuple(self.allowed_cors_origins, "security.allowed_cors_origins"),
        )
        object.__setattr__(self, "api_key_required", bool(self.api_key_required))
        object.__setattr__(self, "rate_limit_enabled", bool(self.rate_limit_enabled))
        object.__setattr__(self, "rate_limit_per_minute", _positive_int(self.rate_limit_per_minute, "security.rate_limit_per_minute"))
        object.__setattr__(self, "require_https", bool(self.require_https))
        object.__setattr__(self, "max_payload_bytes", _positive_int(self.max_payload_bytes, "security.max_payload_bytes"))
        object.__setattr__(self, "oauth_allow_email_fallback", bool(self.oauth_allow_email_fallback))
        object.__setattr__(self, "expose_provider_secrets", bool(self.expose_provider_secrets))
        object.__setattr__(self, "expose_static_provider_config", bool(self.expose_static_provider_config))
        object.__setattr__(self, "max_page_size", _positive_int(self.max_page_size, "security.max_page_size"))
        object.__setattr__(self, "max_batch_ids", _positive_int(self.max_batch_ids, "security.max_batch_ids"))
        object.__setattr__(
            self,
            "idempotency_ttl_hours",
            _positive_int(self.idempotency_ttl_hours, "security.idempotency_ttl_hours"),
        )
        object.__setattr__(
            self,
            "app_session_ttl_hours",
            _positive_int(self.app_session_ttl_hours, "security.app_session_ttl_hours"),
        )
        object.__setattr__(
            self,
            "app_password_iterations",
            _positive_int(self.app_password_iterations, "security.app_password_iterations"),
        )
        object.__setattr__(
            self,
            "oauth_state_ttl_minutes",
            _positive_int(self.oauth_state_ttl_minutes, "security.oauth_state_ttl_minutes"),
        )
        object.__setattr__(
            self,
            "app_session_cookie_name",
            _clean_cookie_name(self.app_session_cookie_name, "security.app_session_cookie_name"),
        )


@dataclass(frozen=True)
class BridgeRoleSpec:
    name: str
    auth: AuthMode
    required_groups: tuple[str, ...] = ()
    description: str = ""

    def __post_init__(self) -> None:
        name = _clean_operation_name(self.name, "role.name")
        auth = _clean_required(self.auth, "role.auth")
        if auth not in ALLOWED_AUTH:
            raise ValueError(f"Invalid role auth mode for {name}: {auth}")
        object.__setattr__(self, "name", name)
        object.__setattr__(self, "auth", auth)
        object.__setattr__(self, "required_groups", tuple(_clean_group(item, "role.required_groups") for item in self.required_groups))
        object.__setattr__(self, "description", _clean_optional(self.description))


@dataclass(frozen=True)
class BridgeFilterSpec:
    name: str
    field: str
    operator: str = "="
    type: ValueType = "str"
    required: bool = False
    notes: str = ""
    example: Any = None

    def __post_init__(self) -> None:
        name = _clean_operation_name(self.name, "filter.name")
        operator = _clean_required(self.operator, "filter.operator")
        value_type = _clean_required(self.type, "filter.type")
        if operator not in ALLOWED_OPERATORS:
            raise ValueError(f"Invalid filter operator for {name}: {operator}")
        if value_type not in ALLOWED_VALUE_TYPES:
            raise ValueError(f"Invalid filter type for {name}: {value_type}")
        if operator == "in" and not value_type.startswith("list["):
            raise ValueError(f"Filter {name} uses in and must declare list[...]")
        object.__setattr__(self, "name", name)
        object.__setattr__(self, "field", _clean_identifier(self.field, "filter.field"))
        object.__setattr__(self, "operator", operator)
        object.__setattr__(self, "type", value_type)
        object.__setattr__(self, "required", bool(self.required))
        object.__setattr__(self, "notes", _clean_optional(self.notes))


@dataclass(frozen=True)
class BridgeParamSpec:
    name: str
    type: ValueType = "str"
    required: bool = False
    default: Any = None
    notes: str = ""
    example: Any = None

    def __post_init__(self) -> None:
        value_type = _clean_required(self.type, "param.type")
        if value_type not in ALLOWED_VALUE_TYPES:
            raise ValueError(f"Invalid param type for {self.name}: {value_type}")
        object.__setattr__(self, "name", _clean_identifier(self.name, "param.name"))
        object.__setattr__(self, "type", value_type)
        object.__setattr__(self, "required", bool(self.required))
        object.__setattr__(self, "notes", _clean_optional(self.notes))


@dataclass(frozen=True)
class BridgeQuerySpec:
    name: str
    path: str
    model: str
    role: str
    fields: tuple[str, ...]
    fixed_domain: tuple[Any, ...] = ()
    default_limit: int = 20
    max_limit: int = 50
    order: str = ""
    sortable_fields: tuple[str, ...] = ()
    allowed_context_keys: tuple[str, ...] = ()
    filters: tuple[BridgeFilterSpec, ...] = ()
    response_map: Mapping[str, str] = field(default_factory=dict)
    cache_ttl_seconds: int = 0
    tags: tuple[str, ...] = ()
    risk_tags: tuple[str, ...] = ()
    use_sudo: bool = False
    notes: str = ""

    def __post_init__(self) -> None:
        fields = tuple(_clean_identifier(item, "query.fields") for item in self.fields)
        if not fields:
            raise ValueError(f"Query {self.name} must declare at least one field")
        response_map = {
            _clean_identifier(alias, "query.response_map alias"): _clean_identifier(field_name, "query.response_map field")
            for alias, field_name in dict(self.response_map or {}).items()
        }
        for field_name in response_map.values():
            if field_name not in fields:
                raise ValueError(f"Query {self.name} response_map field must be included in fields: {field_name}")
        default_limit = _positive_int(self.default_limit, "query.default_limit")
        max_limit = _positive_int(self.max_limit, "query.max_limit")
        if default_limit > max_limit:
            raise ValueError(f"Query {self.name} default_limit must be <= max_limit")
        object.__setattr__(self, "name", _clean_operation_name(self.name, "query.name"))
        object.__setattr__(self, "path", _clean_path(self.path, "query.path"))
        object.__setattr__(self, "model", _clean_model(self.model, "query.model"))
        object.__setattr__(self, "role", _clean_operation_name(self.role, "query.role"))
        object.__setattr__(self, "fields", fields)
        object.__setattr__(self, "fixed_domain", tuple(self.fixed_domain or ()))
        object.__setattr__(self, "default_limit", default_limit)
        object.__setattr__(self, "max_limit", max_limit)
        object.__setattr__(self, "order", _clean_optional(self.order))
        object.__setattr__(self, "sortable_fields", tuple(_clean_identifier(item, "query.sortable_fields") for item in self.sortable_fields))
        object.__setattr__(self, "allowed_context_keys", tuple(_clean_identifier(item, "query.allowed_context_keys") for item in self.allowed_context_keys))
        object.__setattr__(self, "filters", tuple(_coerce_filter(item) for item in self.filters))
        object.__setattr__(self, "response_map", response_map)
        object.__setattr__(self, "cache_ttl_seconds", int(self.cache_ttl_seconds))
        object.__setattr__(self, "tags", tuple(_clean_tag(item, "query.tags") for item in self.tags))
        object.__setattr__(self, "risk_tags", tuple(_clean_tag(item, "query.risk_tags") for item in self.risk_tags))
        object.__setattr__(self, "use_sudo", bool(self.use_sudo))
        object.__setattr__(self, "notes", _clean_optional(self.notes))


@dataclass(frozen=True)
class BridgeCommandSpec:
    name: str
    path: str
    model: str
    method: str
    role: str
    ids_required: bool = True
    max_ids: int | None = None
    allowed_context_keys: tuple[str, ...] = ()
    params: tuple[BridgeParamSpec, ...] = ()
    idempotent: bool = False
    require_idempotency_key: bool = False
    csrf_required: bool | None = None
    tags: tuple[str, ...] = ()
    risk_tags: tuple[str, ...] = ()
    use_sudo: bool = False
    notes: str = ""

    def __post_init__(self) -> None:
        method = _clean_required(self.method, "command.method")
        if "." in method:
            method = _clean_model(method, "command.method")
        else:
            method = _clean_identifier(method, "command.method")
        max_ids = None if self.max_ids is None else _positive_int(self.max_ids, "command.max_ids")
        object.__setattr__(self, "name", _clean_operation_name(self.name, "command.name"))
        object.__setattr__(self, "path", _clean_path(self.path, "command.path"))
        object.__setattr__(self, "model", _clean_model(self.model, "command.model"))
        object.__setattr__(self, "method", method)
        object.__setattr__(self, "role", _clean_operation_name(self.role, "command.role"))
        object.__setattr__(self, "ids_required", bool(self.ids_required))
        object.__setattr__(self, "max_ids", max_ids)
        object.__setattr__(self, "allowed_context_keys", tuple(_clean_identifier(item, "command.allowed_context_keys") for item in self.allowed_context_keys))
        object.__setattr__(self, "params", tuple(_coerce_param(item) for item in self.params))
        object.__setattr__(self, "idempotent", bool(self.idempotent))
        object.__setattr__(self, "require_idempotency_key", bool(self.require_idempotency_key))
        object.__setattr__(self, "csrf_required", None if self.csrf_required is None else bool(self.csrf_required))
        object.__setattr__(self, "tags", tuple(_clean_tag(item, "command.tags") for item in self.tags))
        object.__setattr__(self, "risk_tags", tuple(_clean_tag(item, "command.risk_tags") for item in self.risk_tags))
        object.__setattr__(self, "use_sudo", bool(self.use_sudo))
        object.__setattr__(self, "notes", _clean_optional(self.notes))


@dataclass(frozen=True)
class BridgeEventSpec:
    name: str
    direction: EventDirection
    channel: str
    cloudevent_type: str
    source: str = ""
    role: str | None = None
    tags: tuple[str, ...] = ()
    required_headers: tuple[str, ...] = ()
    fields: tuple[BridgeParamSpec, ...] = ()
    summary: str = ""
    description: str = ""

    def __post_init__(self) -> None:
        direction = _clean_required(self.direction, "event.direction")
        if direction not in ALLOWED_EVENT_DIRECTIONS:
            raise ValueError(f"Invalid event direction for {self.name}: {direction}")
        role = _clean_optional(self.role)
        object.__setattr__(self, "name", _clean_operation_name(self.name, "event.name"))
        object.__setattr__(self, "direction", direction)
        object.__setattr__(self, "channel", _clean_path(self.channel, "event.channel"))
        object.__setattr__(self, "cloudevent_type", _clean_required(self.cloudevent_type, "event.cloudevent_type"))
        object.__setattr__(self, "source", _clean_optional(self.source))
        object.__setattr__(self, "role", _clean_operation_name(role, "event.role") if role else None)
        object.__setattr__(self, "tags", tuple(_clean_tag(item, "event.tags") for item in self.tags))
        object.__setattr__(self, "required_headers", tuple(_clean_required(item, "event.required_headers") for item in self.required_headers))
        object.__setattr__(self, "fields", tuple(_coerce_param(item) for item in self.fields))
        object.__setattr__(self, "summary", _clean_optional(self.summary))
        object.__setattr__(self, "description", _clean_optional(self.description))


@dataclass(frozen=True)
class BridgeFunctionSpec:
    name: str
    path: str
    handler: str
    role: str
    allowed_context_keys: tuple[str, ...] = ()
    params: tuple[BridgeParamSpec, ...] = ()
    idempotent: bool = False
    require_idempotency_key: bool = False
    csrf_required: bool | None = None
    tags: tuple[str, ...] = ()
    risk_tags: tuple[str, ...] = ()
    notes: str = ""

    def __post_init__(self) -> None:
        object.__setattr__(self, "name", _clean_operation_name(self.name, "function.name"))
        object.__setattr__(self, "path", _clean_path(self.path, "function.path"))
        object.__setattr__(self, "handler", _clean_handler(self.handler, "function.handler"))
        object.__setattr__(self, "role", _clean_operation_name(self.role, "function.role"))
        object.__setattr__(self, "allowed_context_keys", tuple(_clean_identifier(item, "function.allowed_context_keys") for item in self.allowed_context_keys))
        object.__setattr__(self, "params", tuple(_coerce_param(item) for item in self.params))
        object.__setattr__(self, "idempotent", bool(self.idempotent))
        object.__setattr__(self, "require_idempotency_key", bool(self.require_idempotency_key))
        object.__setattr__(self, "csrf_required", None if self.csrf_required is None else bool(self.csrf_required))
        object.__setattr__(self, "tags", tuple(_clean_tag(item, "function.tags") for item in self.tags))
        object.__setattr__(self, "risk_tags", tuple(_clean_tag(item, "function.risk_tags") for item in self.risk_tags))
        object.__setattr__(self, "notes", _clean_optional(self.notes))


@dataclass(frozen=True)
class BridgeCronSpec:
    name: str
    handler: str
    interval_number: int = 1
    interval_type: CronInterval = "hours"
    active: bool = True
    params: tuple[BridgeParamSpec, ...] = ()
    tags: tuple[str, ...] = ()
    notes: str = ""

    def __post_init__(self) -> None:
        interval_type = _clean_required(self.interval_type, "cron.interval_type")
        if interval_type not in ALLOWED_CRON_INTERVALS:
            raise ValueError(f"Invalid cron interval_type for {self.name}: {interval_type}")
        object.__setattr__(self, "name", _clean_operation_name(self.name, "cron.name"))
        object.__setattr__(self, "handler", _clean_handler(self.handler, "cron.handler"))
        object.__setattr__(self, "interval_number", _positive_int(self.interval_number, "cron.interval_number"))
        object.__setattr__(self, "interval_type", interval_type)
        object.__setattr__(self, "active", bool(self.active))
        object.__setattr__(self, "params", tuple(_coerce_param(item) for item in self.params))
        object.__setattr__(self, "tags", tuple(_clean_tag(item, "cron.tags") for item in self.tags))
        object.__setattr__(self, "notes", _clean_optional(self.notes))


@dataclass(frozen=True)
class OdooAppBridgeSpec:
    """Complete app bridge contract used by generators and docs."""

    app: OdooAppSpec
    security: BridgeSecuritySpec
    roles: tuple[BridgeRoleSpec, ...]
    queries: tuple[BridgeQuerySpec, ...] = ()
    commands: tuple[BridgeCommandSpec, ...] = ()
    events: tuple[BridgeEventSpec, ...] = ()
    functions: tuple[BridgeFunctionSpec, ...] = ()
    crons: tuple[BridgeCronSpec, ...] = ()

    def __post_init__(self) -> None:
        object.__setattr__(self, "app", _coerce_app(self.app))
        object.__setattr__(self, "security", _coerce_security(self.security))
        object.__setattr__(self, "roles", tuple(_coerce_role(item) for item in self.roles))
        object.__setattr__(self, "queries", tuple(_coerce_query(item) for item in self.queries))
        object.__setattr__(self, "commands", tuple(_coerce_command(item) for item in self.commands))
        object.__setattr__(self, "events", tuple(_coerce_event(item) for item in self.events))
        object.__setattr__(self, "functions", tuple(_coerce_function(item) for item in self.functions))
        object.__setattr__(self, "crons", tuple(_coerce_cron(item) for item in self.crons))
        validate_app_bridge_spec(self)

    def role_by_name(self, name: str) -> BridgeRoleSpec:
        for role in self.roles:
            if role.name == name:
                return role
        raise KeyError(f"Unknown role: {name}")

    def query_by_name(self, name: str) -> BridgeQuerySpec:
        for query in self.queries:
            if query.name == name:
                return query
        raise KeyError(f"Unknown query: {name}")

    def command_by_name(self, name: str) -> BridgeCommandSpec:
        for command in self.commands:
            if command.name == name:
                return command
        raise KeyError(f"Unknown command: {name}")

    def function_by_name(self, name: str) -> BridgeFunctionSpec:
        for function in self.functions:
            if function.name == name:
                return function
        raise KeyError(f"Unknown function: {name}")

    def cron_by_name(self, name: str) -> BridgeCronSpec:
        for cron in self.crons:
            if cron.name == name:
                return cron
        raise KeyError(f"Unknown cron: {name}")

    def to_contract(self) -> dict[str, Any]:
        return _json_ready(asdict(self))

    def contract_digest(self) -> str:
        payload = json.dumps(self.to_contract(), sort_keys=True, separators=(",", ":"), ensure_ascii=False)
        return sha256(payload.encode("utf-8")).hexdigest()


def load_app_bridge_spec(path: str | Path) -> OdooAppBridgeSpec:
    """Load an app bridge spec from TOML or JSON."""
    source_path = Path(path)
    if source_path.suffix.lower() == ".json":
        data = json.loads(source_path.read_text(encoding="utf-8"))
    else:
        data = tomllib.loads(source_path.read_text(encoding="utf-8"))
    return app_bridge_spec_from_mapping(data)


def app_bridge_spec_from_mapping(data: Mapping[str, Any]) -> OdooAppBridgeSpec:
    app_raw = dict(data.get("app") or {})
    if "public_prefix" not in app_raw and "website_prefix" in app_raw:
        app_raw["public_prefix"] = app_raw["website_prefix"]
    if "summary" not in app_raw:
        app_raw["summary"] = app_raw.get("description") or app_raw.get("name") or "Odoo app bridge"
    if "base_only" not in app_raw:
        app_raw["base_only"] = True

    security_raw = dict(data.get("security") or {})
    return OdooAppBridgeSpec(
        app=OdooAppSpec(**app_raw),
        security=BridgeSecuritySpec(**security_raw),
        roles=tuple(BridgeRoleSpec(**dict(item)) for item in data.get("roles", ())),
        queries=tuple(_query_from_mapping(item) for item in data.get("queries", ())),
        commands=tuple(_command_from_mapping(item) for item in data.get("commands", ())),
        events=tuple(_event_from_mapping(item) for item in data.get("events", ())),
        functions=tuple(_function_from_mapping(item) for item in data.get("functions", ())),
        crons=tuple(_cron_from_mapping(item) for item in data.get("crons", ())),
    )


def validate_app_bridge_spec(spec: OdooAppBridgeSpec) -> OdooAppBridgeSpec:
    role_names = _unique_by((role.name for role in spec.roles), "role")
    if not role_names:
        raise ValueError("At least one role is required")
    if spec.security.default_role and spec.security.default_role not in role_names:
        raise ValueError(f"security.default_role does not exist: {spec.security.default_role}")

    paths: set[str] = set()
    _unique_by((query.name for query in spec.queries), "query")
    for query in spec.queries:
        _claim_path(paths, query.path)
        if query.role not in role_names:
            raise ValueError(f"Query {query.name} refers to unknown role: {query.role}")
        if spec.role_by_name(query.role).auth == "app_user" and not spec.security.enable_app_login:
            raise ValueError(f"Query {query.name} uses app_user auth but app login is disabled")
        if query.max_limit > spec.security.max_page_size:
            raise ValueError(f"Query {query.name} max_limit exceeds security.max_page_size")
        _unique_by((item.name for item in query.filters), f"filter in query {query.name}")

    _unique_by((command.name for command in spec.commands), "command")
    for command in spec.commands:
        _claim_path(paths, command.path)
        if command.role not in role_names:
            raise ValueError(f"Command {command.name} refers to unknown role: {command.role}")
        role = spec.role_by_name(command.role)
        if role.auth == "app_user" and not spec.security.enable_app_login:
            raise ValueError(f"Command {command.name} uses app_user auth but app login is disabled")
        if spec.security.deny_public_commands and role.auth == "public":
            raise ValueError(f"Public command forbidden by security.deny_public_commands: {command.name}")
        if command.max_ids and command.max_ids > spec.security.max_batch_ids:
            raise ValueError(f"Command {command.name} max_ids exceeds security.max_batch_ids")
        if command.require_idempotency_key and not command.idempotent:
            raise ValueError(f"Command {command.name} requires idempotency key but is not idempotent")
        _unique_by((item.name for item in command.params), f"param in command {command.name}")

    _unique_by((event.name for event in spec.events), "event")
    _unique_by((event.channel for event in spec.events), "event channel")
    for event in spec.events:
        if event.role and event.role not in role_names:
            raise ValueError(f"Event {event.name} refers to unknown role: {event.role}")
        _unique_by((item.name for item in event.fields), f"field in event {event.name}")

    _unique_by((function.name for function in spec.functions), "function")
    for function in spec.functions:
        _claim_path(paths, function.path)
        if function.role not in role_names:
            raise ValueError(f"Function {function.name} refers to unknown role: {function.role}")
        role = spec.role_by_name(function.role)
        if role.auth == "app_user" and not spec.security.enable_app_login:
            raise ValueError(f"Function {function.name} uses app_user auth but app login is disabled")
        if function.require_idempotency_key and not function.idempotent:
            raise ValueError(f"Function {function.name} requires idempotency key but is not idempotent")
        _unique_by((item.name for item in function.params), f"param in function {function.name}")

    _unique_by((cron.name for cron in spec.crons), "cron")
    for cron in spec.crons:
        _unique_by((item.name for item in cron.params), f"param in cron {cron.name}")
    return spec


def _query_from_mapping(raw: Mapping[str, Any]) -> BridgeQuerySpec:
    data = dict(raw)
    data["fields"] = tuple(data.get("fields", ()))
    data["fixed_domain"] = tuple(data.get("fixed_domain", data.get("domain", ())))
    data["sortable_fields"] = tuple(data.get("sortable_fields", ()))
    data["allowed_context_keys"] = tuple(data.get("allowed_context_keys", ()))
    data["filters"] = tuple(BridgeFilterSpec(**dict(item)) for item in data.get("filters", ()))
    data["tags"] = tuple(data.get("tags", ()))
    data["risk_tags"] = tuple(data.get("risk_tags", ()))
    return BridgeQuerySpec(**data)


def _command_from_mapping(raw: Mapping[str, Any]) -> BridgeCommandSpec:
    data = dict(raw)
    data["allowed_context_keys"] = tuple(data.get("allowed_context_keys", ()))
    data["params"] = tuple(BridgeParamSpec(**dict(item)) for item in data.get("params", ()))
    data["tags"] = tuple(data.get("tags", ()))
    data["risk_tags"] = tuple(data.get("risk_tags", ()))
    return BridgeCommandSpec(**data)


def _event_from_mapping(raw: Mapping[str, Any]) -> BridgeEventSpec:
    data = dict(raw)
    data["tags"] = tuple(data.get("tags", ()))
    data["required_headers"] = tuple(data.get("required_headers", ()))
    data["fields"] = tuple(BridgeParamSpec(**dict(item)) for item in data.get("fields", ()))
    return BridgeEventSpec(**data)


def _function_from_mapping(raw: Mapping[str, Any]) -> BridgeFunctionSpec:
    data = dict(raw)
    data["allowed_context_keys"] = tuple(data.get("allowed_context_keys", ()))
    data["params"] = tuple(BridgeParamSpec(**dict(item)) for item in data.get("params", ()))
    data["tags"] = tuple(data.get("tags", ()))
    data["risk_tags"] = tuple(data.get("risk_tags", ()))
    return BridgeFunctionSpec(**data)


def _cron_from_mapping(raw: Mapping[str, Any]) -> BridgeCronSpec:
    data = dict(raw)
    data["params"] = tuple(BridgeParamSpec(**dict(item)) for item in data.get("params", ()))
    data["tags"] = tuple(data.get("tags", ()))
    return BridgeCronSpec(**data)


def _coerce_app(value: OdooAppSpec | Mapping[str, Any]) -> OdooAppSpec:
    return value if isinstance(value, OdooAppSpec) else OdooAppSpec(**dict(value))


def _coerce_security(value: BridgeSecuritySpec | Mapping[str, Any]) -> BridgeSecuritySpec:
    return value if isinstance(value, BridgeSecuritySpec) else BridgeSecuritySpec(**dict(value))


def _coerce_role(value: BridgeRoleSpec | Mapping[str, Any]) -> BridgeRoleSpec:
    return value if isinstance(value, BridgeRoleSpec) else BridgeRoleSpec(**dict(value))


def _coerce_filter(value: BridgeFilterSpec | Mapping[str, Any]) -> BridgeFilterSpec:
    return value if isinstance(value, BridgeFilterSpec) else BridgeFilterSpec(**dict(value))


def _coerce_param(value: BridgeParamSpec | Mapping[str, Any]) -> BridgeParamSpec:
    return value if isinstance(value, BridgeParamSpec) else BridgeParamSpec(**dict(value))


def _coerce_query(value: BridgeQuerySpec | Mapping[str, Any]) -> BridgeQuerySpec:
    return value if isinstance(value, BridgeQuerySpec) else _query_from_mapping(value)


def _coerce_command(value: BridgeCommandSpec | Mapping[str, Any]) -> BridgeCommandSpec:
    return value if isinstance(value, BridgeCommandSpec) else _command_from_mapping(value)


def _coerce_event(value: BridgeEventSpec | Mapping[str, Any]) -> BridgeEventSpec:
    return value if isinstance(value, BridgeEventSpec) else _event_from_mapping(value)


def _coerce_function(value: BridgeFunctionSpec | Mapping[str, Any]) -> BridgeFunctionSpec:
    return value if isinstance(value, BridgeFunctionSpec) else _function_from_mapping(value)


def _coerce_cron(value: BridgeCronSpec | Mapping[str, Any]) -> BridgeCronSpec:
    return value if isinstance(value, BridgeCronSpec) else _cron_from_mapping(value)


def _json_ready(value: Any) -> Any:
    if isinstance(value, tuple):
        return [_json_ready(item) for item in value]
    if isinstance(value, list):
        return [_json_ready(item) for item in value]
    if isinstance(value, dict):
        return {str(key): _json_ready(item) for key, item in value.items()}
    return value


def _clean_required(value: Any, label: str) -> str:
    text = str(value or "").strip()
    if not text:
        raise ValueError(f"{label} is required")
    return text


def _clean_optional(value: Any) -> str:
    return str(value or "").strip()


def _clean_text_tuple(values: Any, label: str) -> tuple[str, ...]:
    if isinstance(values, (str, bytes)):
        raise TypeError(f"{label} must be a sequence")
    cleaned = tuple(_clean_required(item, label) for item in values)
    _unique_by(cleaned, label)
    return cleaned


def _clean_operation_name(value: Any, label: str) -> str:
    text = _clean_required(value, label).lower()
    if not OPERATION_RE.match(text):
        raise ValueError(f"{label} must match {OPERATION_RE.pattern}: {text!r}")
    return text


def _clean_identifier(value: Any, label: str) -> str:
    text = _clean_required(value, label)
    if not IDENTIFIER_RE.match(text):
        raise ValueError(f"{label} must be a Python/Odoo identifier: {text!r}")
    return text


def _clean_handler(value: Any, label: str) -> str:
    text = _clean_required(value, label)
    if not HANDLER_RE.match(text):
        raise ValueError(f"{label} must be a dotted Python handler name: {text!r}")
    return text


def _clean_model(value: Any, label: str) -> str:
    text = _clean_required(value, label).lower()
    if not MODEL_RE.match(text):
        raise ValueError(f"{label} must be a dotted Odoo model name: {text!r}")
    return text


def _clean_path(value: Any, label: str) -> str:
    text = _clean_required(value, label).strip("/")
    if not PATH_RE.match(text):
        raise ValueError(f"{label} must be a normalized URL path: {text!r}")
    return text


def _clean_group(value: Any, label: str) -> str:
    text = _clean_required(value, label)
    if not GROUP_RE.match(text):
        raise ValueError(f"{label} must be an XML ID-like group name: {text!r}")
    return text


def _clean_tag(value: Any, label: str) -> str:
    text = _clean_required(value, label)
    if not TAG_RE.match(text):
        raise ValueError(f"{label} must be a lowercase tag: {text!r}")
    return text


def _clean_cookie_name(value: Any, label: str) -> str:
    text = _clean_required(value, label)
    if not COOKIE_RE.match(text):
        raise ValueError(f"{label} must be a safe cookie name: {text!r}")
    return text


def _positive_int(value: Any, label: str) -> int:
    number = int(value)
    if number <= 0:
        raise ValueError(f"{label} must be > 0")
    return number


def _unique_by(values: Any, label: str) -> set[str]:
    seen: set[str] = set()
    duplicates: set[str] = set()
    for value in values:
        key = str(value)
        if key in seen:
            duplicates.add(key)
        seen.add(key)
    if duplicates:
        raise ValueError(f"Duplicate {label}: {', '.join(sorted(duplicates))}")
    return seen


def _claim_path(paths: set[str], path: str) -> None:
    if path in paths:
        raise ValueError(f"Duplicate public route path: {path}")
    paths.add(path)


__all__ = [
    "AuthMode",
    "BridgeCommandSpec",
    "BridgeCronSpec",
    "BridgeEventSpec",
    "BridgeFilterSpec",
    "BridgeFunctionSpec",
    "BridgeParamSpec",
    "BridgeQuerySpec",
    "BridgeRoleSpec",
    "BridgeSecuritySpec",
    "CronInterval",
    "EventDirection",
    "OdooAppBridgeSpec",
    "OdooAppSpec",
    "ValueType",
    "app_bridge_spec_from_mapping",
    "load_app_bridge_spec",
    "validate_app_bridge_spec",
]
