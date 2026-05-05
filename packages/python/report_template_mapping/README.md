# Neutral Report Template Mapping

Reusable helpers for report-template migrations:

- Map JRXML aliases such as `$F{UUID}` or `$F{rfcEmisor}` to trusted Odoo/QWeb/XML sources.
- Build pure mapping plans with explicit missing references.
- Build SAT CFDI verification QR URLs and Odoo barcode-controller image tags.

The package does not execute JRXML Java/Groovy expressions and does not call RPC.
