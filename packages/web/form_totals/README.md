# Form Tax Breakdown

Extraccion source-derived del renderer original de Rental para desglose de impuestos y fila fallback de totales.

## Estado

- `source-derived`
- conserva selectores y supuestos del DOM original de Rental
- archivo de trazabilidad; no es una capa de soporte legacy

## Uso recomendado

- conservarlo solo para auditoria de origen
- no ensamblar, publicar ni extender para compatibilidad legacy
- usar `form-totals-surface` para integraciones nuevas

## Reemplazo canonico

- `form-totals-surface`
