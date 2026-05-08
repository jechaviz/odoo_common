"""Command-line entry point for Odoo module scaffolds."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Sequence

try:  # pragma: no cover - supports both direct PYTHONPATH and package imports.
    from .module_scaffold import load_module_scaffold_spec, plan_module_scaffold_write, write_module_scaffold
except ImportError:  # pragma: no cover
    from module_scaffold import load_module_scaffold_spec, plan_module_scaffold_write, write_module_scaffold


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Generate a layered Odoo addon from a JSON scaffold spec.")
    parser.add_argument("--spec", required=True, help="Path to the JSON ModuleScaffoldSpec payload.")
    parser.add_argument("--target-root", required=True, help="Directory where the addon folder will be created.")
    parser.add_argument("--overwrite", action="store_true", help="Allow updates to existing files with different content.")
    parser.add_argument("--dry-run", action="store_true", help="Print the write plan without creating files.")
    parser.add_argument("--plan-json", action="store_true", help="Print the write plan as JSON.")
    return parser


def run_module_scaffold_cli(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    spec = load_module_scaffold_spec(args.spec)
    plan = plan_module_scaffold_write(args.target_root, spec, overwrite=args.overwrite)
    blocked = [entry for entry in plan if entry.action == "blocked"]

    if args.plan_json:
        print(json.dumps([entry.as_dict() for entry in plan], indent=2, sort_keys=True))
    else:
        for entry in plan:
            print(f"{entry.action:9} {entry.layer:10} {entry.relative_path.as_posix()}")

    if blocked:
        return 2
    if args.dry_run:
        return 0

    written_paths = write_module_scaffold(Path(args.target_root), spec, overwrite=args.overwrite)
    if not args.plan_json:
        print(f"written {len(written_paths)} file(s)")
    return 0


def main() -> None:
    raise SystemExit(run_module_scaffold_cli())


if __name__ == "__main__":
    main()
