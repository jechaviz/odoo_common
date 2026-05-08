# Common Component Gallery

Contrato canonico para construir una galeria tipo Storybook de componentes `odoo_common` y convertir una seleccion de usuario en un plan de instalacion verificable.

## Contrato Publico

El paquete expone:

- `ComponentGalleryEntry`
- `ComponentInstallPlan`
- `ComponentInstallPlanStep`
- `ComponentInstallTarget`
- `build_component_gallery_entries(catalog_or_path, package_root=None, canonical_only=True)`
- `build_component_gallery_app_files(catalog_or_path, common_root=None, surface_package_path=None, app_spec=None)`
- `build_component_gallery_app_model(catalog_or_path, package_root=None, include_ai_preview=True)`
- `build_component_gallery_bridge_spec_mapping(app_spec=None)`
- `build_component_install_plan(component_key, target, catalog_or_path, package_root=None, include_ai_preview=True)`
- `build_component_storybook_model(entries)`
- `group_component_gallery_entries(entries)`
- `load_component_catalog(path)`
- `write_component_gallery_app(target_root, catalog_or_path, ...)`
- `write_component_gallery_app_zip(target_root, catalog_or_path, ...)`

## Responsabilidad

- leer el catalogo canonico de componentes
- normalizar entradas para una UI tipo Storybook
- agrupar por runtime sin etiquetas de proyecto
- generar pasos de wizard por componente y target
- incluir pasos explicitos de sync, publicacion, auditoria visual y revision IA cuando apliquen
- devolver specs y planes puros, sin escribir archivos ni ejecutar RPC
- emitir un addon Odoo base-only instalable con la galeria, assets, JSON de planes y CLI de dry-run/zip

## No Incluye

- conexion a Odoo
- publicacion de assets
- ejecucion de tests
- instalacion real de modulos
- introspeccion de instancias vivas
- soporte legacy, aliases historicos o fallback por proyecto

## Uso Minimo

```python
from pathlib import Path

from common_component_gallery import (
    ComponentInstallTarget,
    build_component_gallery_entries,
    build_component_install_plan,
)

catalog_path = Path("catalog/components.json")
entries = build_component_gallery_entries(catalog_path)
plan = build_component_install_plan(
    "surface-workspace-shell",
    ComponentInstallTarget(consumer_key="odoo_fiax", target_root="C:/git/customers/yo/odoo_fiax", mode="dry-run"),
    catalog_path,
)
```

La UI puede renderizar `entries` como menu de componentes, abrir el wizard con `ComponentInstallTarget`, y ejecutar cada step con adapters explicitos del consumidor. `common` solo define la forma segura del recorrido.

## App Instalable

```powershell
$env:PYTHONPATH = "C:\git\odoo\common\packages\python\common_component_gallery\sources"
python C:\git\odoo\common\packages\python\common_component_gallery\sources\component_gallery_cli.py `
  --catalog C:\git\odoo\common\catalog\components.json `
  --common-root C:\git\odoo\common `
  --target-root C:\tmp\common-gallery `
  --zip
```

Esto genera `x_odoo_common_gallery.zip`, un addon base-only con:

- controller publico `/apps/odoo-common-gallery`
- assets del `surface-component-gallery`
- modelo JSON de componentes y plantillas de planes dry-run/live
- hooks browser para `odoo-common-gallery:plan-built`, `:ai-review` y `:step-action`
