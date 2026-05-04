# Form Defaults Surface

Shared `default_get` loader for managed Odoo form defaults runtimes.

This package owns:
- cached `default_get` resolution for managed forms
- optional async enrichment for related labels or preview metadata
- shared ORM helper wiring for form-default loaders

This package must stay generic:
- no project route naming
- no business-specific copy or field semantics
- no project-specific model defaults

Public API on `window.OdooSurfaceLayers`:
- `buildFormDefaultsResolver(spec)`

Consumers should provide only config:
- `model`
- `fieldNames`
- optional `kwargs` or `buildKwargs()`
- optional `isEnabled()`
- optional `enrichDefaults(defaults, helpers)`

Adapter contract:
- concrete models and field names must come from the consumer spec
- enrichment domains, related models, labels, and preview metadata are adapter-owned
- this surface should only cache and resolve the declared `default_get` request

Resolver helpers exposed to `enrichDefaults`:
- `ormService`
- `normalizeMany2oneValue`
- `searchReadSingle(model, domain, fields, options)`
