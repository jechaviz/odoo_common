# Taxation Spec Helpers

Helpers canonicos para crear o actualizar impuestos Odoo desde specs explicitos.

## Contrato publico

El modulo expone:

- `SalesTaxSpec`
- `DEFAULT_SALES_TAX_SPEC`
- `TaxationConnection`
- `TaxationMixin.configure_sales_tax(spec=None)`

## Spec

`SalesTaxSpec` declara nombres de modelos, campos y valores del impuesto. El default conserva el impuesto actual `Sales Tax (Texas)` con `8.25`, `US`, `TX`, grupo `Sales` y creacion declarada del grupo `Sales (TIS)` cuando no existe.

No hay introspeccion por version ni adaptadores de compatibilidad: si el tenant no soporta un campo declarado por el spec, el caller debe usar un spec apropiado o resolverlo en su adapter de proyecto.

## Fuera de alcance

- defaults de impuestos por cliente o producto
- adaptadores de localizacion fiscal por proyecto
