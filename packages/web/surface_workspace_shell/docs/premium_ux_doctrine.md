# Premium UX Doctrine For Odoo Surfaces

This doctrine is an implementation contract, not an inspiration board. Each rule must map to reusable primitives in `surface-workspace-shell`, deployable audit evidence, and a consumer fix path.

## Operating Standard

Build Odoo-native workspaces that feel dense, calm, and premium:

- keep the native Odoo mental model: actions in the control panel, records in Odoo lists/forms, breadcrumbs as real navigation.
- upgrade the surface, not the product grammar: fewer decorative wrappers, tighter rhythm, clearer states.
- prefer one strong hierarchy over repeated labels: page title, command lane, tabs, metrics, table/form.
- make every pixel earn its keep: empty floors may hold visual structure, but never stretch real data.
- design for repeated work: shortcuts, bulk actions, filters, preview and details should stay near the task.

## Shared Rules

1. Command lanes

   Use the command lane for the primary action, upload/import, search, filters and bulk state. Do not repeat the Odoo page title unless the Odoo header is hidden. Search and filters stay in the main lane; operational metrics sit to the right on desktop.

2. Metrics

   Metrics are compact right-rail evidence, not hero cards. Hide neutral zero-value alert chips. Use trend chips only when they change the operator's next action.

3. Lists

   Tables stay compact at every row count. Sparse lists keep a panel floor on the renderer/shell, never on `table`, `tbody`, `tr` or `td`. Preview/action columns render only when they expose real row actions, and they must never collapse behind Odoo's native sticky action column.

4. Tabs

   Tabs are state controls, not links pretending to be pills. Every tab needs a stable key, `role="tab"`, `aria-selected`, and the shared active/focus grammar.

5. Forms

   Forms are workspaces. Put identity, required fiscal/commercial context, lines, totals and validation where the operator can scan them without hunting. Progressive details belong in tabs, drawers or inspector zones.

6. Menus and breadcrumbs

   Menus cannot repeat their owner label as a child action. Nested flyouts must visually attach to the parent. Breadcrumb labels navigate; toggles open sibling menus. No ghost breadcrumb remains after leaving a workspace.

7. Modals and overlays

   Dialogs must have readable controls in the current theme. A close icon on a dark modal is white by asset, not black made white by fragile filters. Text-bearing overlays need enough opacity, border, shadow or backdrop separation to stay legible.

8. Auditability

   A principle that cannot fail a live audit is too vague. Every reusable visual decision should leave DOM evidence: data keys, roles, classes, stable regions, measurable geometry or accessible labels.

## Deployment Gates

Consumers should fail live deployment when `auditSurfaceWorkspaceDesign()` returns findings for:

- redundant command-bar title/description.
- duplicate or drifting menus.
- ghost breadcrumbs.
- weak overlay separation.
- zero-value metric alerts.
- overstretched list rows or inherited table floors.
- collapsed or empty preview/action columns.
- unreadable modal close controls.
- tabs without stable keys/roles/shared shape.
- metric strips that are not right-anchored on desktop.

Local product code may tune tokens, labels and routing, but must not fork these rules into one-off project heuristics.
