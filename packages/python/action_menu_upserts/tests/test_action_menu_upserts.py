from __future__ import annotations

import unittest
from dataclasses import fields
from typing import Any

from action_menu_upserts import ActionWindowSpec, upsert_action_window


class _FakeConnection:
    def __init__(self, search_ids_by_name: dict[str, list[int]] | None = None, create_id: int = 71):
        self.search_ids_by_name = {name: list(ids) for name, ids in (search_ids_by_name or {}).items()}
        self.create_id = create_id
        self.searches: list[tuple[str, list[Any], int | None]] = []
        self.writes: list[tuple[str, list[int], dict[str, Any]]] = []
        self.creates: list[tuple[str, dict[str, Any]]] = []

    def search(self, model_name: str, domain: list[Any], limit: int | None = None) -> list[int]:
        self.searches.append((model_name, list(domain), limit))
        name = next((condition[2] for condition in domain if len(condition) >= 3 and condition[0] == "name"), "")
        values = self.search_ids_by_name.get(str(name), [])
        return values[:limit] if limit is not None else list(values)

    def write(self, model_name: str, ids: list[int], values: dict[str, Any]) -> bool:
        self.writes.append((model_name, list(ids), dict(values)))
        return True

    def create(self, model_name: str, values: dict[str, Any]) -> int:
        self.creates.append((model_name, dict(values)))
        return self.create_id


class ActionMenuUpsertsTest(unittest.TestCase):
    def test_action_window_spec_exposes_only_canonical_name_contract(self) -> None:
        field_names = {field.name for field in fields(ActionWindowSpec)}

        self.assertIn("name", field_names)
        self.assertFalse([field_name for field_name in field_names if field_name != "name" and field_name.endswith("_names")])

    def test_upsert_action_window_uses_exact_action_name_only(self) -> None:
        conn = _FakeConnection(search_ids_by_name={"Facturas antiguas": [41]}, create_id=72)

        action_id = upsert_action_window(
            conn,
            ActionWindowSpec(
                name="Facturas",
                res_model="account.move",
                view_mode="list,form",
            ),
        )

        self.assertEqual(action_id, 72)
        self.assertEqual(len(conn.searches), 1)
        self.assertIn(("name", "=", "Facturas"), conn.searches[0][1])
        self.assertNotIn(("name", "=", "Facturas antiguas"), conn.searches[0][1])
        self.assertEqual(conn.writes, [])
        self.assertEqual(conn.creates[0][0], "ir.actions.act_window")


if __name__ == "__main__":
    unittest.main()
