# Form Layout State Persistence

Helpers server-side para leer, normalizar y persistir el estado compartido que consume `form_section_layout`.

## Contiene

- `sources/form_layout_state.py`
  - normalizacion de keys y merge del payload persistido
  - mixin para `ir.config_parameter`
  - helpers para sembrar labels de statusbar por locale

## Dependencias

- requiere `default-persistence` para el mixin base de `ir.default` y `ir.config_parameter`
- al ensamblar este paquete, ambos deben aterrizar bajo el namespace canonico `odoo_common.*`

## Fuera de alcance

- presets de subtotales, campos `x_*` y toggles de negocio
- adapters por proyecto para modelos, labels o defaults comerciales
