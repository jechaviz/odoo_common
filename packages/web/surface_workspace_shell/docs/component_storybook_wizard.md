# Common Component Storybook And Install Wizard

Goal: make `odoo_common` explorable and installable from one interactive surface without turning FIAX or any consumer into a component graveyard.

## Product Shape

Create an Odoo-native "Common Components" app with three panes:

1. Storybook menu

   - left rail groups components by package: workspace, forms, lists, reports, data, scaffolds.
   - selecting a component shows purpose, contract, props/spec, dependencies, examples and live preview.
   - each component has a "Use this" action.

2. Wizard

   Steps:

   - target instance/profile.
   - component package/version.
   - required dependencies and publish order.
   - adapter questions only for consumer-owned choices: labels, routes, model names, fields, permissions.
   - generated install plan.
   - dry run evidence.
   - publish/install.

3. AI co-designer

   - reads the selected component contract and current preview state.
   - proposes token, layout and interaction changes.
   - never edits consumer code directly without showing a patch plan.
   - can use Codex as the implementation path and Kilo as an optional critique provider.

## Architecture

Use existing common packages:

- `feature-catalog` for component metadata.
- `common-component-sync` for copying common packages into consumers.
- `backend-web-assets` for publishing JS/CSS into live Odoo.
- `odoo-app-bridge` for a base-only Odoo module that serves the storybook UI without depending on `website`.
- `odoo-module-scaffold` for any local addon skeleton created by the wizard.

Implemented now:

- `common-component-gallery` as a pure Python planner:
  - reads catalog/component manifests.
  - builds storybook entries.
  - builds install plans.
  - emits JSON for the app bridge UI.
  - emits `x_odoo_common_gallery` as a base-only installable Odoo addon/zip.
- `surface-component-gallery` as a web surface:
  - renders the storybook shell and wizard.
  - mounts common previews.
  - calls host-provided install/dry-run endpoints.

Add later:

- target adapters that execute the generated plan against a selected Odoo instance.

## Installation Flow

1. The gallery app lists `odoo_common` components from catalog metadata.
2. User selects a component.
3. Wizard asks only for missing adapter data.
4. `common-component-gallery` returns or precomputes:
   - packages to sync.
   - assets to publish.
   - runtime contract checks.
   - preview, AI review and visual audit steps.
   - dry-run or live target install step.
5. The user runs dry-run.
6. The installer publishes through the target profile.
7. Live audit captures screenshots and `auditSurfaceWorkspaceDesign()` output.

## Production Artifact

`common-component-gallery` now builds an Odoo addon named `x_odoo_common_gallery`:

- generated through `odoo-app-bridge`, not a one-off controller.
- public shell at `/apps/odoo-common-gallery`.
- static model at `/x_odoo_common_gallery/static/src/json/common_component_gallery_model.json`.
- static assets copied from `surface-component-gallery`.
- precomputed dry-run/live plan templates for every canonical component.
- browser events for external orchestration:
  - `odoo-common-gallery:plan-built`
  - `odoo-common-gallery:ai-review`
  - `odoo-common-gallery:step-action`

Codex Goal or Kilo should consume those events/snapshots as reviewers or patch planners. The Odoo app remains deterministic and installable without embedding provider-specific AI logic.

## Codex Goal Integration

`C:\git\codex\tools\codex-goal` already provides:

- a Vue webview shell.
- preview mode.
- provider routing for Codex/Kilo/Z.ai/Kimi/DeepSeek.
- task waves and agent/audit messages.

The best integration is not to embed Odoo into Codex Goal. Instead:

- Codex Goal hosts the AI co-designer conversation and patch loop.
- The Odoo gallery app hosts the live component preview and install wizard.
- They exchange JSON plans, screenshot evidence and audit findings.

Kilo can be used as an alternate reviewer of the generated plan. Codex remains the implementation path because it can edit common/consumer repos and run validations.

## Non-Goals

- no legacy project cloning.
- no hidden install side effects before dry-run.
- no business defaults inside common.
- no component-specific one-off wizard code in FIAX.
- no website dependency for the gallery shell unless a target instance explicitly requests it.
