"""Reusable builder for the Many2X parent-form autosave web patch."""

from __future__ import annotations

from pathlib import Path

from .text_templates import load_template_from_dir


_TEMPLATES_DIR = Path(__file__).resolve().parent / "templates"


def build_many2x_parent_form_autosave_patch() -> str:
    """Return the reusable Many2X parent-form autosave patch source."""
    return load_template_from_dir(_TEMPLATES_DIR, "many2x_parent_form_autosave.js.tmpl")
