# Rental Customer Discount Surface

Extraccion source-derived del runtime original de Rental para sincronizar descuentos por cliente.

## Estado

- `source-derived`
- mantiene wiring y supuestos del flujo original de Rental
- archivo de trazabilidad; no es una capa de soporte legacy

## Uso recomendado

- conservarlo solo para auditoria de origen
- no ensamblar, publicar ni extender para compatibilidad legacy
- usar `commercial-policy-surface` para integraciones nuevas o extracciones canonicas

## Reemplazos canonicos

- `commercial-policy-surface`
- `form-action-bridge-surface`
- `record-context-surface`
- `form-preview-surface`
- `partner-defaults`
