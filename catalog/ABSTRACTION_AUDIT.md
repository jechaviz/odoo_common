# Abstraction Audit

Date: 2026-05-04

Scope:
- `C:\git\odoo\common`
- source workspaces: `C:\git\customers\yo\fiax`, `C:\git\customers\yo\odoo_rpp`, `C:\git\customers\yo\rp-rental-mock`

## Inventory

- Web packages: 21 total, 17 canonical, 4 source-derived.
- Python packages: 15 total, 15 canonical.
- Schema packages: 3 total, 3 canonical.
- Source-derived web packages are archive/traceability records only; new assembly must use their canonical replacements.

## Canonical Surfaces Already Extracted

- `fiax`: workspace shell, line picker, record context, commercial capture context, form capture shell contract, record context layout contract.
- `odoo_rpp`: form layout core, section headers, section visibility, settings panel, chatter toggle, subtotals, layout state, many2x parent autosave, defaults persistence, partner defaults, taxation helpers.
- `rp-rental-mock`: form defaults, preview, header identity, action bridge, commercial policy, totals, partner language defaults, terms and conditions.
- `odoo_rpp` + `rp-rental-mock`: backend web asset publication via explicit attachment-backed `ir.asset` specs.
- `odoo_rpp` + `rp-rental-mock`: server automation upserts for `ir.actions.server` and `base.automation` from explicit specs.
- `odoo_rpp` + `rp-rental-mock`: strict code-based cron upserts with explicit user/model contracts.
- `odoo_rpp` + `rp-rental-mock`: strict registry lookup helpers for models, fields, XML IDs, and `fields_get`.
- `rp-rental-mock`: strict XML ID upserts for generated records through `ir.model.data`.
- `odoo_rpp` + `rp-rental-mock`: exact action/menu upserts for window actions, URL actions, and menus.
- `odoo_rpp` + `rp-rental-mock`: strict model-view and QWeb-view upserts.
- `odoo_rpp` + `rp-rental-mock`: manual model/custom field upserts and managed selection reconciliation.
- `odoo_rpp` + `rp-rental-mock`: strict security upserts for categories, groups, model access, and record rules.

## Findings

- Fixed: `form-subtotals-surface` now declares its `surface-workspace-shell` bootstrap dependency when publishing adapter APIs on `window.OdooSurfaceLayers`.
- Fixed: `buildFormSubtotalsSurfaceAdapter(spec)` now validates both form-root resolution and scope-key resolution.
- Fixed: `form-subtotals-surface` no longer hard-codes the asset field display normalization from the source runtime. Project-specific passive formatting now enters through `fieldDisplayNormalizers`.
- Fixed: source project docs now point to the active `fiax` workspace while keeping `odoo_fiax` as the historical origin identifier.
- Fixed: the four source-derived web packages now declare `replacement_components` in their package manifests.
- Fixed: catalog validation is now repeatable through `catalog/validate_catalog.ps1`.
- Updated: source-derived guidance now states archive-only traceability and does not present those packages as fallback support or recommended assembly targets.
- Added: `backend-web-assets` canonicalizes attachment-backed `ir.asset` publication, fingerprinting, token replacement, and explicit managed cleanup without direct bootstrap injection or version-field fallbacks.
- Added: `server-automation-upserts` canonicalizes server-action/base-automation bundle sync around modern explicit `usage` and `trigger_field_ids` contracts.
- Added: `cron-upserts` canonicalizes code-based `ir.cron` publication without user-resolution fallback, version field detection, missing-model returns, or legacy function crons.
- Added: `odoo-registry-lookup` centralizes strict metadata resolution without XML ID aliases, first-candidate fallbacks, or shared caches.
- Added: `xmlid-upserts` canonicalizes `ir.model.data` publication without XML ID aliases, dry-run branching, target resolution, or silent model rebinding.
- Added: `action-menu-upserts` canonicalizes exact `ir.actions.act_window`, `ir.actions.act_url`, and `ir.ui.menu` writes without legacy name matching or group-field detection.
- Added: `view-upserts` canonicalizes exact `ir.ui.view` creation/update for model views and QWeb views without legacy view cleanup or alternate write forms.
- Added: `custom-field-upserts` canonicalizes manual model/field creation, strict existing-field contract validation, and selection row reconciliation without legacy value migrations.
- Added: `security-upserts` canonicalizes security publication without user assignment, version field detection, missing-metadata ignores, or legacy group absorption.

## Remaining Source-Derived Archive Traces

- `form-section-layout`: archive trace for the original section-layout extraction only. New consumers should assemble `form-layout-surface`, section sibling surfaces, `form-subtotals-surface`, and `form-layout-state`.
- `form-defaults`: archive trace for the Rental extraction only. New consumers should assemble `form-defaults-surface`, `form-preview-surface`, and `form-header-identity-surface`.
- `form-totals`: archive trace for the Rental totals extraction only. New consumers should assemble `form-totals-surface`.
- `customer-defaults-web`: archive trace for the Rental customer policy extraction only. New consumers should assemble `commercial-policy-surface`, `form-action-bridge-surface`, `record-context-surface`, `form-preview-surface`, and `partner-defaults`.

## Risk Register

- Canonical examples still use concrete Odoo model and field names in docs/examples. That is acceptable as sample material, but runtime code should stay business-neutral.
- `partner-defaults` includes default sale/invoice model names by configuration. That remains reusable while the caller can override names, but it should be watched if another project needs a fully model-agnostic preset layer.
- Source-derived artifacts still contain business fields and Rental paths by design. They are archive inputs only and should not be used as assembly targets for new projects.
- The catalog schema has no dedicated `archive_only` flag. The policy remains documented through `status: source-derived`, `replacement_components`, this audit, and the assembly guide to avoid validator or downstream schema risk.

## Next Abstraction Queue

1. Move project-specific subtotals field display formatting into thin project adapters that call `buildFormSubtotalsSurfaceAdapter(spec)`.
2. Audit canonical runtime files for literal project routes and hard-coded `x_*` fields, excluding docs/examples and intentionally configurable Python defaults.
3. Move any remaining project consumers away from source-derived packages once each project adapter has parity evidence; do not add common fallbacks to keep those consumers alive.
4. Adapt `odoo_rpp` and `rp-rental-mock` publication scripts to call `backend-web-assets` once each project has a thin spec adapter and live Odoo evidence.
5. Adapt automation installers to call `server-automation-upserts` through project-specific advice/pointcut adapters.
6. Replace cron installers with `cron-upserts`; keep user lookup policy and dry-run behavior project-local.
7. Replace local XML ID/model/field helper copies with `odoo-registry-lookup` where callers can tolerate strict missing-metadata errors.
8. Replace XML ID publication helpers with `xmlid-upserts`; keep target-record creation and dry-run behavior project-local.
9. Replace action/menu installers with `action-menu-upserts` once each project removes legacy menu cleanup from the common path.
10. Replace view installers with `view-upserts` for canonical model/QWeb writes; leave legacy cleanup in project adapters only.
11. Replace custom field installers with `custom-field-upserts`; keep destructive obsolete-field cleanup project-local.
12. Replace security installers with `security-upserts`; keep user assignment and group migration rules project-local.
