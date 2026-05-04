# Record Context Layout Contract

Paquete canonico de schema para paneles declarativos de contexto relacional/comercial que viven dentro de un formulario y son hidratados por `record-context-surface`.

No define modelos Odoo, labels de negocio, ni wiring ORM. Solo formaliza el markup/attrs del panel, los cards y los slot markers que el runtime shared ya sabe sincronizar.

## Origen De Extraccion

Este contrato se extrajo de paneles Odoo reales hidratados por `record-context-surface`. Esas referencias validan el runtime y el markup, pero sus labels, campos y keys de negocio no son canonicos.

## Lo Que Este Paquete Si Define

- root canonico del panel `data-surface-record-context-panel`
- layouts canonicos del stack (`detail-list`)
- cards declarativos por `data-surface-record-context-card`
- slot markers que el runtime shared hidrata (`primary-name`, `secondary-details`, `identifier`, etc.)

## Lo Que Este Paquete No Define

- campos o modelos concretos
- readers ORM o cache
- labels de negocio, identificadores fiscales, tarifas, envios o copy por vertical
- estilos concretos por vertical

## Contrato Canonico

- `record_context_layout.schema.json`
- `record_context_slot_markers.schema.json`
- `record_context_layout_contract.md`

## Fixtures De Ejemplo

- `examples/invoice_record_context_layout.xml`

El fixture `invoice_record_context_layout.xml` conserva nombres concretos para mostrar una integracion posible. Card keys, labels y copy pertenecen al adapter y no deben tratarse como enum compartido.

## Modelo Mental

1. Un formulario declara un panel `record-context`.
2. El panel usa un layout canonico como `detail-list`.
3. Dentro del panel, cards y slot markers se hidratan desde `record-context-surface`.
4. El adapter del proyecto solo define labels, field maps, enrichers y copy.
