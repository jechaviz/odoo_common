"""CLI for generating the installable common component gallery app."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from component_gallery import (
    ComponentGalleryAppSpec,
    build_component_gallery_app_files,
    build_component_gallery_app_model,
    write_component_gallery_app,
    write_component_gallery_app_zip,
)


def run_component_gallery_cli(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Build the Odoo Common Component Gallery addon.")
    parser.add_argument("--catalog", required=True, help="Path to catalog/components.json.")
    parser.add_argument("--target-root", help="Directory where the addon should be written.")
    parser.add_argument("--common-root", help="Common repo root. Defaults to parent of catalog/.")
    parser.add_argument("--surface-package-path", help="Override path to packages/web/surface_component_gallery.")
    parser.add_argument("--module", default="x_odoo_common_gallery", help="Generated addon technical name.")
    parser.add_argument("--slug", default="odoo-common-gallery", help="Public app slug.")
    parser.add_argument("--name", default="Odoo Common Gallery", help="Generated app display name.")
    parser.add_argument("--summary", default="Explore, preview and plan installation of canonical odoo_common components.")
    parser.add_argument("--zip", action="store_true", help="Also package the generated addon as a zip.")
    parser.add_argument("--overwrite", action="store_true", help="Allow replacing changed generated files.")
    parser.add_argument("--model-json", action="store_true", help="Print the static gallery model JSON and exit.")
    parser.add_argument("--dry-run", action="store_true", help="Print the generated file plan without writing.")
    args = parser.parse_args(argv)

    app_spec = ComponentGalleryAppSpec(name=args.name, slug=args.slug, module=args.module, summary=args.summary)
    catalog = Path(args.catalog)

    if args.model_json:
        print(json.dumps(build_component_gallery_app_model(catalog, package_root=args.common_root), indent=2, ensure_ascii=False))
        return 0

    if args.dry_run or not args.target_root:
        files = build_component_gallery_app_files(
            catalog,
            common_root=args.common_root,
            surface_package_path=args.surface_package_path,
            app_spec=app_spec,
        )
        print(json.dumps([file.to_dict() for file in files], indent=2, ensure_ascii=False))
        return 0

    if args.zip:
        zip_path = write_component_gallery_app_zip(
            args.target_root,
            catalog,
            common_root=args.common_root,
            surface_package_path=args.surface_package_path,
            app_spec=app_spec,
            overwrite=args.overwrite,
        )
        print(str(zip_path))
        return 0

    written = write_component_gallery_app(
        args.target_root,
        catalog,
        common_root=args.common_root,
        surface_package_path=args.surface_package_path,
        app_spec=app_spec,
        overwrite=args.overwrite,
    )
    print(json.dumps([str(path) for path in written], indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(run_component_gallery_cli())
