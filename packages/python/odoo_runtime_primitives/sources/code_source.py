"""Helpers to derive Odoo-ready code snippets from Python functions."""

from __future__ import annotations

import inspect
import textwrap
from typing import Any, Callable


def source_from_function(func: Callable[..., Any]) -> str:
    """Return a function body as a dedented source snippet."""
    source = inspect.getsource(func)
    lines = source.splitlines()
    if len(lines) <= 1:
        return ""
    body = "\n".join(
        line[4:] if line.startswith("    ") else line
        for line in lines[1:]
    )
    return textwrap.dedent(body).strip("\n")


def definition_from_function(func: Callable[..., Any]) -> str:
    """Return a full dedented function definition source snippet."""
    return textwrap.dedent(inspect.getsource(func)).strip("\n")


__all__ = ["definition_from_function", "source_from_function"]
