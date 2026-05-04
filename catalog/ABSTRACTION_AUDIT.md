# Abstraction Audit

Date: 2026-05-04

Scope:
- `C:\git\odoo\common`
- source workspaces: `C:\git\customers\yo\odoo_fiax`, `C:\git\customers\yo\odoo_rpp`, `C:\git\customers\yo\rp-rental-mock`

## Inventory

- Web packages: 21 total, 17 canonical, 4 source-derived.
- Python packages: 32 total, 32 canonical.
- Schema packages: 3 total, 3 canonical.
- Source-derived web packages are archive/traceability records only; new assembly must use their canonical replacements.

## Canonical Surfaces Already Extracted

- `odoo_fiax`: workspace shell, line picker, record context, commercial capture context, form capture shell contract, record context layout contract, common component sync, view fragment assembly, navigation blueprints, generic record upserts.
- `odoo_rpp`: form layout core, section headers, section visibility, settings panel, chatter toggle, subtotals, layout state, many2x parent autosave, defaults persistence, partner defaults, taxation helpers, resource config normalizers, workflow config helpers, text asset builders, feature catalog helpers.
- `rp-rental-mock`: form defaults, preview, header identity, action bridge, commercial policy, totals, partner language defaults, terms and conditions.
- `odoo_rpp` + `rp-rental-mock`: strict tax group and tax upserts with explicit company/country/group contracts.
- `odoo_rpp` + `rp-rental-mock`: strict binary attachment upserts for `ir.attachment` payload publication.
- `odoo_rpp` + `rp-rental-mock`: backend web asset publication via explicit attachment-backed `ir.asset` specs.
- `odoo_rpp` + `rp-rental-mock`: server automation upserts for `ir.actions.server` and `base.automation` from explicit specs.
- `odoo_rpp` + `rp-rental-mock`: strict code-based cron upserts with explicit user/model contracts.
- `odoo_rpp` + `rp-rental-mock`: strict registry lookup helpers for models, fields, XML IDs, and `fields_get`.
- `rp-rental-mock`: strict XML ID upserts for generated records through `ir.model.data`.
- `rp-rental-mock`: strict data exchange metadata upserts for export templates and import mappings.
- `odoo_rpp` + `rp-rental-mock`: strict product catalog upserts for categories, pricelists, and fixed-price template rules.
- `odoo_rpp`: strict `ir.sequence` upserts for sequence publication.
- `odoo_rpp`: strict survey page/question/answer upserts for declarative survey publication.
- `odoo_rpp`: strict Odoo runtime primitives for domain literals, server-action code snippets, and RPC many2one value normalization.
- `odoo_rpp` + `rp-rental-mock`: exact action/menu upserts for window actions, URL actions, and menus.
- `odoo_rpp` + `rp-rental-mock`: strict model-view and QWeb-view upserts.
- `rp-rental-mock`: strict report publication for paperformats, report layouts, and QWeb report actions.
- `rp-rental-mock`: strict mail template publication with modern `report_template_ids` bindings.
- `odoo_rpp` + `rp-rental-mock`: manual model/custom field upserts and managed selection reconciliation.
- `odoo_rpp` + `rp-rental-mock`: strict security upserts for categories, groups, model access, and record rules.

## Findings

- Fixed: `form-subtotals-surface` now declares its `surface-workspace-shell` bootstrap dependency when publishing adapter APIs on `window.OdooSurfaceLayers`.
- Fixed: `buildFormSubtotalsSurfaceAdapter(spec)` now validates both form-root resolution and scope-key resolution.
- Fixed: `form-subtotals-surface` no longer hard-codes the asset field display normalization from the source runtime. Project-specific passive formatting now enters through `fieldDisplayNormalizers`.
- Fixed: source project docs now point to the active `fiax` workspace while keeping `odoo_fiax` as the historical origin identifier.
- Corrected: `odoo_fiax` source workspace is `C:\git\customers\yo\odoo_fiax`; the plain `fiax` workspace is not the Odoo migration source.
- Fixed: the four source-derived web packages now declare `replacement_components` in their package manifests.
- Fixed: catalog validation is now repeatable through `catalog/validate_catalog.ps1`.
- Updated: source-derived guidance now states archive-only traceability and does not present those packages as fallback support or recommended assembly targets.
- Added: `tax-upserts` canonicalizes `account.tax.group` and `account.tax` publication without country-specific fiscal canon, XML ID lookup, field detection, fallback group creation, or account-copy behavior.
- Added: `binary-attachment-upserts` canonicalizes `ir.attachment` binary publication without orphan cleanup, `ir.asset` writes, version-field detection, or checksum-only metadata skips.
- Added: `backend-web-assets` canonicalizes attachment-backed `ir.asset` publication, fingerprinting, token replacement, and explicit managed cleanup without direct bootstrap injection or version-field fallbacks.
- Added: `server-automation-upserts` canonicalizes server-action/base-automation bundle sync around modern explicit `usage` and `trigger_field_ids` contracts.
- Added: `cron-upserts` canonicalizes code-based `ir.cron` publication without user-resolution fallback, version field detection, missing-model returns, or legacy function crons.
- Added: `odoo-registry-lookup` centralizes strict metadata resolution without XML ID aliases, first-candidate fallbacks, or shared caches.
- Added: `odoo-registry-lookup` now resolves exact window actions, code server actions, and base views while failing on missing or ambiguous rows.
- Added: `odoo-registry-lookup` now selects the first existing field from explicit `fields_get` candidates while requiring opt-in for optional empty results.
- Added: `xmlid-upserts` canonicalizes `ir.model.data` publication without XML ID aliases, dry-run branching, target resolution, or silent model rebinding.
- Added: `data-exchange-upserts` canonicalizes `ir.exports` and `base_import.mapping` publication without aliasing, field inference, dry-run branching, or stale mapping cleanup.
- Added: `record-upserts` canonicalizes generic record creation/update by exact domain without dry-run branching, field filtering, XML ID resolution, or stale cleanup.
- Added: `resource-config` canonicalizes pure config merge/accessors without YAML/JSON loading, project defaults, route fallbacks, or business validation.
- Added: `workflow-config` canonicalizes workflow step labels, selection options, and simple XML visibility expressions without business states, label inference, or legacy workflow fallbacks.
- Added: `text-asset-builders` canonicalizes manifest-ordered text assembly and build manifests without globbing, inferred ordering, JS/CSS transforms, or Odoo publication.
- Added: `feature-catalog` canonicalizes feature specs, serialization, install-list validation, and dependency checks without runner execution, exception fallbacks, logging, or partial installs.
- Added: `product-catalog-upserts` canonicalizes product category, pricelist, and fixed-price pricelist item publication without rental-period normalization, legacy rule migration, field detection, or old-list deactivation.
- Added: `sequence-upserts` canonicalizes `ir.sequence` publication without business-model binding, next-number scans, project slugification, or `number_next_actual` compatibility.
- Added: `survey-upserts` canonicalizes survey page/question/answer publication without settings introspection, dry-run branching, generated-key parsing, or stale page/question deletion.
- Added: `odoo-runtime-primitives` canonicalizes domain literal construction, Python function source extraction, and many2one RPC value normalization without connection management, XML ID lookup, field detection, or legacy action-server compatibility.
- Added: `common-component-sync` canonicalizes consumer sync manifests, catalog resolution, dependency-ordered file bindings, web publish-order checks, target-collision detection, and safe generated-copy pruning without component aliases, source-derived targets, path hacks, or manual copy policy.
- Added: `view-fragment-assembly` canonicalizes strict XML view fragment registries, arch assembly, explicit substitutions, and view blueprint serialization without business fragments, folder fallbacks, approximate matching, or view upsert side effects.
- Added: `navigation-blueprints` canonicalizes keyed window-action/menu blueprint construction and duplicate-key checks without business menu trees, ID resolution, upserts, aliases, or fallback name matching.
- Added: `backend-web-assets` now derives `BackendWebAssetSpec` rows from common sync bindings, preserving dependency and publish order while requiring explicit target-prefix stripping instead of route/path inference.
- Added: `action-menu-upserts` canonicalizes exact `ir.actions.act_window`, `ir.actions.act_url`, and `ir.ui.menu` writes without legacy name matching or group-field detection.
- Added: `view-upserts` canonicalizes exact `ir.ui.view` creation/update for model views, QWeb views, and keyed QWeb templates without legacy view cleanup, key-to-name fallback, or alternate write forms.
- Added: `report-upserts` canonicalizes paperformat/layout/report-action publication without mail-template field fallbacks, version field detection, or legacy report matching.
- Added: `mail-template-upserts` canonicalizes `mail.template` publication through modern `report_template_ids` without XML ID resolution, legacy `report_template` fallback, field detection, or business-specific content.
- Added: `custom-field-upserts` canonicalizes manual model/field creation, strict existing-field contract validation, and selection row reconciliation without legacy value migrations.
- Added: `security-upserts` canonicalizes security publication without user assignment, version field detection, missing-metadata ignores, or legacy group absorption.

## Remaining Source-Derived Archive Traces

- `form-section-layout`: archive trace for the original section-layout extraction only. New consumers should assemble `form-layout-surface`, section sibling surfaces, `form-subtotals-surface`, and `form-layout-state`.
- `form-defaults`: archive trace for the Rental extraction only. New consumers should assemble `form-defaults-surface`, `form-preview-surface`, and `form-header-identity-surface`.
- `form-totals`: archive trace for the Rental totals extraction only. New consumers should assemble `form-totals-surface`.
- `customer-defaults-web`: archive trace for the Rental customer policy extraction only. New consumers should assemble `commercial-policy-surface`, `form-action-bridge-surface`, `record-context-surface`, `form-preview-surface`, and `partner-defaults`.

## Estado De Cierre

- La extraccion de paquetes comunes desde las familias auditadas queda cerrada para esta pasada.
- Las familias reutilizables restantes ya tienen paquetes canonicos o fueron rechazadas para `common` porque codifican politica de negocio del proyecto, fixtures de importacion, orquestacion de pruebas live, limpieza/reconciliacion destructiva o comportamiento de compatibilidad.
- La pasada correctiva sobre `C:\git\customers\yo\odoo_fiax` promovio las capas neutrales adicionales: specs de backend assets desde sync bindings, resolvers exactos de registry, templates QWeb por key, y upsert generico por dominio exacto.
- Cualquier trabajo posterior sobre consumidores debe pasar por `CONSUMER_MIGRATION_CHECKLIST.md`; no debe abrir mas fallbacks comunes ni ensamblajes source-derived.
- Migrar consumidores requiere una politica explicita de import/distribucion para `C:\git\odoo\common` y evidencia base de paridad por proyecto antes de cambiar repos fuente.

## Intencionalmente Local Al Proyecto

- Orquestacion de conexion/config/servicios Odoo: los callers mantienen ciclo de conexion, dry-run, retry, logging y politica de entorno mientras los paquetes comunes dependen de protocolos estrechos.
- Runtime XML-RPC, seleccion de perfiles de secrets y aliases de perfil (`odoo_fiax`, `fiax`, `odoo`) quedan fuera de `common`; si se necesita conexion compartida, debe nacer como contrato estricto sin fallback de perfil.
- Inyeccion directa en `web.webclient_bootstrap`, deteccion `head/head_web` y QWeb bootstrap patching quedan locales; `common` mantiene `ir.asset` como publicacion canonica y exige que cualquier XPath sea declarado por el adapter.
- Loaders, seeds de workbook/catalogo, demo data y fixtures de validacion live: son herramientas de ingestion de datos o evidencia, no superficies canonicas de runtime Odoo.
- Rental pricing, rental products, snapshots, compromisos de assets, auditorias de estado, limpieza de partners y reconciliacion: codifican reglas de negocio Rental y politica de limpieza.
- Wizards de localization/setup/admin, descubrimiento de opciones de settings, asignacion de usuarios de seguridad y reglas de migracion de grupos: requieren decisiones de tenant y contexto Odoo live.
- Legacy cleanup, orphan cleanup, deteccion de campos por version, aliases XML ID y rutas alternativas de matching: quedan fuera de `common` por la regla no-legacy/no-fallback.
- FIAX CFDI, fiscal bridge, PDF/layout de reporte, AI, PocketBase, datatable schemas, production audit checks, catalog seeds y app state: son runtime/evidencia de la aplicacion FIAX, no abstracciones comunes de Odoo.

## Risk Register

- Canonical examples still use concrete Odoo model and field names in docs/examples. That is acceptable as sample material, but runtime code should stay business-neutral.
- `partner-defaults` includes default sale/invoice model names by configuration. That remains reusable while the caller can override names, but it should be watched if another project needs a fully model-agnostic preset layer.
- Source-derived artifacts still contain business fields and Rental paths by design. They are archive inputs only and should not be used as assembly targets for new projects.
- The catalog schema has no dedicated `archive_only` flag. The policy remains documented through `status: source-derived`, `replacement_components`, this audit, and the assembly guide to avoid validator or downstream schema risk.

## Consumer Migration Gate

Esta auditoria no deja una cola abierta de abstraccion en `common`. Reemplazar consumidores de proyectos fuente por paquetes canonicos es una migracion separada de cada proyecto y debe seguir `catalog/CONSUMER_MIGRATION_CHECKLIST.md`.

Puerta requerida antes de cambiar consumidores:

- elegir una estrategia de paquete/import para `common` en vez de hacks `sys.path` o copias fuente
- capturar evidencia del comportamiento actual del consumidor objetivo
- reemplazar una capacidad por slice con un adapter delgado del proyecto
- rechazar cualquier cambio que agregue aliases, compatibilidad legacy, fallbacks de version o dependencias runtime source-derived
- ejecutar la validacion propia del proyecto consumidor antes de commitear
