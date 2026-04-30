"""Generic text-template loading/rendering helpers for Odoo setup code."""

from functools import lru_cache
from pathlib import Path
from typing import Mapping


def render_template(template: str, replacements: Mapping[str, str]) -> str:
    """Render a snippet with deterministic token replacements."""
    rendered = template
    for token, value in replacements.items():
        rendered = rendered.replace(token, value)
    return rendered.strip()


@lru_cache(maxsize=128)
def load_template_from_dir(templates_dir: Path, filename: str) -> str:
    """Load one UTF-8 template from a known directory."""
    template_path = Path(templates_dir) / filename
    if not template_path.exists():
        raise FileNotFoundError(f"Missing snippet template: {template_path}")
    return template_path.read_text(encoding="utf-8").strip()
