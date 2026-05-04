# Form Chatter Toggle Surface Sources

Source of truth for the canonical chatter toggle surface extracted from `form_section_layout`.

## Structure

- `runtime/`
  - strict host contract and chatter runtime
- `styles/`
  - chatter toggle and collapsed layout CSS

The runtime keeps only documented Odoo technical selectors by default. Consumers with different markup must pass explicit `chatterSelectors` through `install(hostApi)`.
