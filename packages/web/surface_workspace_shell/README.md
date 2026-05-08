# Surface Workspace Shell

Canonical Odoo shell runtime for sidebar, breadcrumb, route state, and managed workspace lifecycles.

## Sidebar Ownership

The sidebar current section must come from explicit identity:

- `data-surface-sidebar-section-key`
- `data-section`
- breadcrumb section key (`shared.surfaceBreadcrumbSectionKey`)
- `registerSidebarShellSectionResolver(resolver)`

`registerSidebarShellRootSectionKeys(entries)` only annotates DOM nodes from explicit `{ selector, key }` entries. It does not map navbar labels to section keys.

Popover ownership is tied to the live trigger that opened the menu through `data-surface-sidebar-owner-trigger-id`; the shell does not reconstruct owner state from labels or stale popover metadata.

Registered sidebar trees bind leaves by explicit item key or href-derived key. Labels remain display copy only.

## Premium Surface Kit

`surface_layers.css` exposes reusable, CSS-only primitives for customer workspaces. They are scoped to `body.o_surface_workspace_active`, inherit dark-friendly `--o-surface-theme-*` tokens, and can be tuned per subtree with `data-surface-density="compact|comfortable|spacious"` or matching `o_surface_premium_density_*` classes.

Primary classes:

- `o_surface_premium_command_bar`: command/search/filter/action bar.
- `o_surface_premium_metric_strip` and `o_surface_premium_metric`: KPI strip.
- `o_surface_premium_smart_table_shell` and `o_surface_premium_smart_table`: sticky-header data table shell.
- `o_surface_premium_inspector`: right/left drawer with `[data-surface-open="1"]` or `.is-open`.
- `o_surface_premium_code_modal`: code dialog with `[data-surface-open="1"]` or `.is-open`.
- `o_surface_premium_status_chip`: neutral/success/warning/danger/info/accent chips via modifier classes or `data-status`/`data-state`.
- `o_surface_premium_validation_rail`: validation checklist with severity modifiers or `data-severity`.
- `o_surface_premium_empty_state`: dense empty/loading guidance for list and inspector surfaces.

The workspace runtime exposes `buildPremiumWorkspaceToolbarConsoleMarkup`, `buildPremiumWorkspaceListConsoleMarkup`, and `buildPremiumWorkspaceToolbarConsoleController` on both `window.OdooSurfaceLayers` and `window.OdooSurfaceLayers.workspaceRuntime` where consumers need shell-level composition. `buildPremiumWorkspaceListConsoleMarkup` is the preferred list bootstrap helper: pass `commandBar`, `toolbar`/`toolbarMarkup`, `metrics`, `smartTable`, `validationRail`, `emptyState`, and optional `bodyMarkup` to compose dense list workspaces without duplicating console plumbing.

## Design Audit Rules

The shared debug runtime exposes `getSurfaceDesignAuditPrinciples()` and `auditSurfaceWorkspaceDesign(root, options)`. These are not brand slogans; each principle resolves a UI trade-off and maps to measurable findings that consumers can fail in live QA:

- `prefer-what-matters`: when clarity conflicts with completeness, remove redundant titles, descriptions, and neutral zero-value alerts.
- `obvious-easy-possible`: make primary work obvious, repeated work fast, and advanced flows available through progressive depth; duplicate menu labels without context fail this rule.
- `usable-for-edge-benefits-all`: contrast, focus, density, and opaque readable overlays are requirements for every workspace.
- `evidence-over-assumption`: every principle must leave DOM evidence; ghost breadcrumbs after leaving a workspace are treated as product bugs.

Granular audits now cover:

- list density: no megafilas, no table body inheriting empty-state floor, no collapsed/empty preview columns.
- modal controls: dark dialogs keep readable white close controls without inverting already-white SVGs.
- tab grammar: every surface tab has a stable key, `role="tab"`, and a shared hit-target shape.
- metric placement: operational stats sit in the right rail on desktop, while filters and search stay in the main command lane.
- menu, breadcrumb, command-bar, overlay and metric-signal rules from the original audit set.

Consumers should sync these rules instead of rebuilding local visual heuristics. If a finding appears, the `action` field tells the consumer whether to hide a duplicate command-bar header, add menu context, use an opaque overlay token, clear managed breadcrumb state, keep list floors on containers instead of table rows, remove empty preview columns, or restore contrast on modal controls.

See `docs/premium_ux_doctrine.md` for the actionable design doctrine used by live deployment audits.
