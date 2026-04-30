# Form Section Layout Runtime

## Source Of Truth
- Published bundle graph manifest: `lib/manifest.json`
- Runtime module manifest: `lib/odoo/web/form_section_layout/runtime/manifest.json`
- Published JS fallback artifact: `lib/odoo/web/form_section_layout.runtime.js`
- Published CSS asset: `lib/odoo/web/form_section_layout.css`
- Runtime source modules: `lib/odoo/web/form_section_layout/runtime/**/*.js`
- CSS source modules: `lib/odoo/web/form_section_layout/styles/**/*.css`

## Hard-Cut Rule
- `api.js`, `ui_builder.js`, and `subtotals.js` were retired.
- Do not reintroduce source extraction from legacy aggregate files.
- The modular `runtime/` tree is the only JS source of truth.

## Build And Audit
1. `uv run python scripts/build_form_section_layout_runtime.py`
2. `uv run python scripts/build_form_section_layout_css.py`
3. `uv run python scripts/check_form_section_layout_runtime_parity.py`
4. `uv run python scripts/check_form_section_layout_css_parity.py`
5. `uv run python scripts/audit_form_section_layout_preview.py`

## Publication
- Publication to Odoo must happen only after the preview audit passes.
- `src/setup/views/web_client_patches.py` rebuilds runtime/CSS before sync.
- Odoo publication is now manifest-driven:
  - `lib/manifest.json` defines atomic bundle members and sub-bundle `include` graphs.
  - `form_section_layout.runtime.js` is generated for parity/fallback, not the primary unit of change.
  - avoid dual loading: either publish atomic bundle members or bootstrap-only payloads, never both for the same feature slice.
