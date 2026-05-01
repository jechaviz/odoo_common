# Form Settings Panel Surface Sources

Source of truth for the canonical settings panel surface extracted from `form_section_layout`.

## Structure

- `runtime/`
  - lifecycle, host contract, and panel UI modules
- `styles/`
  - panel-only CSS

## Boundary

This package owns panel rendering and interaction only.

The host runtime owns:
- section and layout discovery
- field metadata and default editor implementations
- persistence payload shape
- access policy decisions
