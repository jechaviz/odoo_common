# Odoo Module Scaffold

Contrato canonico para crear modulos Odoo nuevos desde specs declarativas, sin copiar estructura de proyecto ni mezclar reglas de negocio con infraestructura.

## Contrato Publico

El modulo expone:

- `FieldScaffoldSpec`
- `ModelAccessScaffoldSpec`
- `ModelScaffoldSpec`
- `ModuleScaffoldFile`
- `ModuleScaffoldSpec`
- `ModuleScaffoldWritePlanEntry`
- `build_module_scaffold_files(spec)`
- `load_module_scaffold_spec(spec_path)`
- `normalize_module_name(value)`
- `normalize_model_name(value)`
- `plan_module_scaffold_write(target_root, spec, overwrite=False)`
- `write_module_scaffold(target_root, spec, overwrite=False)`

## Responsabilidad

- validar nombres tecnicos de modulos, modelos, archivos y campos
- renderizar manifiesto, init files, contratos, adapters, servicios, modelos, seguridad, vistas y tests
- separar puertos/adapters de servicios para mantener DI y SoC desde el primer commit
- generar permisos y vistas base por modelo cuando el spec los declara
- leer specs JSON estrictas para integrarse con templates/repos consumidores
- planear `create/update/unchanged/blocked` antes de escribir
- escribir archivos solo bajo un target explicito y bloquear cambios destructivos por defecto

## No Incluye

- conexion a Odoo
- introspeccion de modelos vivos
- lectura de YAML o configuracion implicita de proyecto
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

## CLI

```powershell
$env:PYTHONPATH = "C:\git\odoo\common\packages\python\module_scaffold\sources"
python -m module_scaffold_cli --spec packages\python\module_scaffold\examples\service_desk_module.json --target-root custom --dry-run
```

Usar `--plan-json` para integrarlo con pipelines y `--overwrite` solo cuando el diff ya fue revisado. Si un archivo existe con contenido distinto y no se pasa `--overwrite`, el plan marca `blocked` y el comando sale con codigo `2`.
