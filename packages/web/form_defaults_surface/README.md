# Form Defaults Surface

Shared `default_get` loader extracted from the source-derived Rental form defaults runtime.

This package owns:
- cached `default_get` resolution for managed forms
- optional async enrichment for related labels or preview metadata
- shared ORM helper wiring for form-default loaders

This package must stay generic:
- no route naming
- no branch/series/document copy
- no project-specific model defaults

Public API on `window.OdooSurfaceLayers`:
- `buildFormDefaultsResolver(spec)`

Consumers should provide only config:
- `model`
- `fieldNames`
- optional `kwargs` or `buildKwargs()`
- optional `isEnabled()`
- optional `enrichDefaults(defaults, helpers)`

Resolver helpers exposed to `enrichDefaults`:
- `ormService`
- `normalizeMany2oneValue`
- `searchReadSingle(model, domain, fields, options)`
