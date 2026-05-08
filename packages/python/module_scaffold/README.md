# Odoo Module Scaffold

Contrato canonico para crear modulos Odoo nuevos desde specs declarativas, sin copiar estructura de proyecto ni mezclar reglas de negocio con infraestructura.

## Contrato Publico

El modulo expone:

- `FieldScaffoldSpec`
- `ModelAccessScaffoldSpec`
- `ModelScaffoldSpec`
- `ModuleScaffoldFile`
- `ModuleScaffoldSpec`
- `build_module_scaffold_files(spec)`
- `normalize_module_name(value)`
- `normalize_model_name(value)`
- `write_module_scaffold(target_root, spec, overwrite=False)`

## Responsabilidad

- validar nombres tecnicos de modulos, modelos, archivos y campos
- renderizar manifiesto, init files, contratos, adapters, servicios, modelos, seguridad, vistas y tests
- separar puertos/adapters de servicios para mantener DI y SoC desde el primer commit
- generar permisos y vistas base por modelo cuando el spec los declara
- escribir archivos solo bajo un target explicito y rechazar sobrescritura por defecto

## No Incluye

- conexion a Odoo
- introspeccion de modelos vivos
- lectura de YAML/JSON de proyecto
- menus, vistas o politicas de negocio implicitas
- cleanup o migracion destructiva de modulos existentes
- aliases legacy o fallback por version

## Uso Minimo

```python
from pathlib import Path

from module_scaffold import FieldScaffoldSpec, ModelScaffoldSpec, ModuleScaffoldSpec, write_module_scaffold

spec = ModuleScaffoldSpec(
    technical_name="acme_service_desk",
    summary="Service desk workflow",
    models=(
        ModelScaffoldSpec(
            technical_name="acme.service.ticket",
            description="Service Ticket",
            fields=(
                FieldScaffoldSpec("name", string="Reference", required=True),
                FieldScaffoldSpec("priority", field_type="Selection", selection=(("0", "Low"), ("1", "High"))),
            ),
        ),
    ),
)

write_module_scaffold(Path("custom"), spec)
```

El resultado crea un addon con capas explicitas. La regla de consumo es simple: la politica de negocio vive en el modulo generado; `common` solo aporta contrato y forma.
