# Partner Language Defaults

Helpers canonicos para sembrar y aplicar un idioma default en `res.partner` usando un contrato minimo de conexion Odoo.

## Contrato publico

El modulo expone:

- `PartnerLanguageDefaultsSpec`
- `DEFAULT_PARTNER_LANGUAGE_DEFAULTS_SPEC`
- `DEFAULT_ENGLISH_LANGUAGE_CODE`
- `resolve_canonical_english_lang_code(conn, spec=DEFAULT_PARTNER_LANGUAGE_DEFAULTS_SPEC)`
- `ensure_partner_language_defaults(conn, *, dry_run=False, spec=DEFAULT_PARTNER_LANGUAGE_DEFAULTS_SPEC)`
- `apply_partner_language_default(conn, payload, spec=DEFAULT_PARTNER_LANGUAGE_DEFAULTS_SPEC)`

## Connection Contract

El helper espera un objeto `conn` con estas operaciones:

- `search_read(model, domain, fields, **kwargs)`
- `search(model, domain, limit=None)`
- `write(model, ids, values)`
- `create(model, values)`

No depende de mixins externos ni de wrappers de compatibilidad.

## Spec

`PartnerLanguageDefaultsSpec` declara explicitamente los modelos, campos y scoring de idioma usados por el helper. El default conserva `en_US` sobre `res.partner.lang`, pero callers con otro contrato deben pasar un spec propio.

## Responsabilidad

- resolver el mejor codigo de ingles disponible para el tenant
- activar `en_US` si existe pero esta inactivo
- sembrar `ir.default` para `res.partner.lang` en scope global y por compania
- inyectar `lang` en payloads de partner cuando el caller aun no lo define

## No Incluye

- hooks ORM
- wiring de vistas
- sincronizacion de otros defaults de partner
