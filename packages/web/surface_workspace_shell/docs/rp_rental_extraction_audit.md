# RP Rental Mock Extraction Audit

This audit records reusable UI/UX patterns found in `C:\git\customers\yo\rp-rental-mock` and the common-first extraction decision.

## Extract Now

1. Collapsible ledger rows

   Source: `odoo_migration/web_assets/rental_native_tabs/actions.js`, `render.js`, `records.js`.

   Common shape:

   - one root row remains the main Odoo list row.
   - a toggle action opens a child detail row immediately below it.
   - the detail row receives consumer-rendered HTML and shared dense styling.
   - root row actions and child row actions are icon-first.
   - expansion state is keyed by an explicit row key, never by display labels.

   Implemented in `surface_workspace_shell/actions.js` through:

   - `buildCollapsibleRowToggleMarkup`
   - `installCollapsibleRowController`
   - `ensureCollapsibleDetailRow`
   - `removeCollapsibleDetailRow`
   - `toggleCollapsibleDetailRow`

2. Trailing row actions

   Already common as `syncTrailingActionColumns`, `ensureManagedActionColumn`, `buildPreviewActionGroupMarkup`, and `mountPreviewActionSlots`.

   Keep enhancing this in common, not in per-project list runtimes.

3. Scoped filters

   Already common as `normalizeScopedFilterState`, `areNormalizedStatesEqual`, `buildYearMonthRange`, `hasDomainCondition`, and toolbar filter markup builders.

   The consumer owns option hydration and route persistence.

4. Chatter collapse

   Already common as `form-chatter-toggle-surface`.

   It intentionally keeps strict current Odoo selectors and requires host-provided persistence.

## Extract Later

- return/focus replay across navigation.
- progressive hydration scheduling for large ledgers.
- row-level PDF/ZIP action plans.
- event timeline preview primitives.
- child ledger responsive table profiles.

These should become generic only when a second consumer needs them, so common does not absorb rental-specific lifecycle assumptions.

## Do Not Extract

- rental document codes such as `_Q`, `_OP`, `_IN`, `_EX`, `_PR`, `_CL`.
- rental role names, billing cadence, QC semantics or branch logic.
- old mockup route aliases.
- broad legacy Odoo selector fallbacks.
- hidden RPC calls inside common components.

## Consumer Contract

A consumer that wants collapsible ledger rows provides:

- `rowKey` or `getRowKey(row, settings)`.
- `renderDetail(row, context)` returning safe HTML.
- optional `onToggle(context)`.
- domain-specific actions and filter option hydration.

Common owns:

- accessible toggle markup.
- detail row insertion/removal.
- ARIA expanded state.
- dense visual styling.
- click delegation lifecycle.

