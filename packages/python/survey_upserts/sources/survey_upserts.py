"""Canonical helpers for Odoo survey upserts."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Mapping, Protocol, Sequence, runtime_checkable


PAGE_RESERVED_EXTRA_KEYS = frozenset({"survey_id", "title", "is_page", "sequence"})
QUESTION_RESERVED_EXTRA_KEYS = frozenset(
    {
        "survey_id",
        "page_id",
        "title",
        "description",
        "is_page",
        "question_type",
        "constr_mandatory",
        "sequence",
    }
)


@runtime_checkable
class SurveyUpsertConnection(Protocol):
    """Minimal Odoo RPC contract required by survey upserts."""

    def search(
        self,
        model_name: str,
        domain: Sequence[tuple[str, str, Any]],
        limit: int | None = None,
    ) -> list[int]:
        """Return matching record ids."""

    def search_read(
        self,
        model_name: str,
        domain: Sequence[tuple[str, str, Any]],
        fields: Sequence[str] | None = None,
        limit: int | None = None,
        **kwargs: Any,
    ) -> list[Mapping[str, Any]]:
        """Return matching rows with requested fields."""

    def write(self, model_name: str, ids: Sequence[int], values: Mapping[str, Any]) -> Any:
        """Update one or more records."""

    def create(self, model_name: str, values: Mapping[str, Any]) -> Any:
        """Create one record."""

    def unlink(self, model_name: str, ids: Sequence[int]) -> Any:
        """Delete one or more records."""


def _clean_required_text(value: Any, *, field_name: str) -> str:
    clean_value = str(value or "").strip()
    if not clean_value:
        raise ValueError(f"Survey {field_name} is required")
    return clean_value


def _clean_extra_values(
    values: Mapping[str, Any],
    *,
    reserved_keys: frozenset[str],
) -> dict[str, Any]:
    normalized = dict(values or {})
    reserved_used = sorted(key for key in normalized if key in reserved_keys)
    if reserved_used:
        raise ValueError(f"Survey extra_values cannot override reserved keys: {', '.join(reserved_used)}")
    return normalized


@dataclass(frozen=True)
class SurveyPageSpec:
    """Declare one survey page row in `survey.question`."""

    survey_id: int
    title: str
    sequence: int
    extra_values: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        object.__setattr__(self, "survey_id", _required_record_id(self.survey_id, context="survey.survey"))
        object.__setattr__(self, "title", _clean_required_text(self.title, field_name="page title"))
        object.__setattr__(self, "sequence", int(self.sequence))
        object.__setattr__(
            self,
            "extra_values",
            _clean_extra_values(self.extra_values, reserved_keys=PAGE_RESERVED_EXTRA_KEYS),
        )


@dataclass(frozen=True)
class SurveyAnswerOption:
    """Declare one `survey.question.answer` option."""

    value: str
    sequence: int = 0

    def __post_init__(self) -> None:
        object.__setattr__(self, "value", _clean_required_text(self.value, field_name="answer value"))
        object.__setattr__(self, "sequence", int(self.sequence))


@dataclass(frozen=True)
class SurveyQuestionSpec:
    """Declare one non-page `survey.question` row."""

    survey_id: int
    title: str
    sequence: int
    page_id: int = 0
    description: str = ""
    question_type: str = "simple_choice"
    constr_mandatory: bool = False
    answer_options: tuple[SurveyAnswerOption | str | tuple[str, int], ...] = field(default_factory=tuple)
    extra_values: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        object.__setattr__(self, "survey_id", _required_record_id(self.survey_id, context="survey.survey"))
        object.__setattr__(self, "title", _clean_required_text(self.title, field_name="question title"))
        object.__setattr__(self, "sequence", int(self.sequence))
        object.__setattr__(self, "page_id", _record_id(self.page_id))
        object.__setattr__(self, "description", str(self.description or "").strip())
        object.__setattr__(self, "question_type", _clean_required_text(self.question_type, field_name="question_type"))
        object.__setattr__(self, "constr_mandatory", bool(self.constr_mandatory))
        object.__setattr__(self, "answer_options", tuple(_normalize_answer_options(self.answer_options)))
        object.__setattr__(
            self,
            "extra_values",
            _clean_extra_values(self.extra_values, reserved_keys=QUESTION_RESERVED_EXTRA_KEYS),
        )


def upsert_survey_page(conn: SurveyUpsertConnection, spec: SurveyPageSpec) -> int:
    """Create or update one survey page by exact survey/title."""
    normalized = spec if isinstance(spec, SurveyPageSpec) else SurveyPageSpec(**dict(spec))
    values = {
        "survey_id": normalized.survey_id,
        "title": normalized.title,
        "is_page": True,
        "sequence": normalized.sequence,
        **dict(normalized.extra_values),
    }
    existing_ids = conn.search(
        "survey.question",
        [
            ("survey_id", "=", normalized.survey_id),
            ("title", "=", normalized.title),
            ("is_page", "=", True),
        ],
        limit=1,
    )
    if existing_ids:
        page_id = _required_record_id(existing_ids[0], context=f"survey page {normalized.title}")
        conn.write("survey.question", [page_id], values)
        return page_id
    return _required_record_id(conn.create("survey.question", values), context=f"created survey page {normalized.title}")


def upsert_survey_question(conn: SurveyUpsertConnection, spec: SurveyQuestionSpec) -> int:
    """Create or update one survey question by exact survey/title."""
    normalized = spec if isinstance(spec, SurveyQuestionSpec) else SurveyQuestionSpec(**dict(spec))
    values = {
        "survey_id": normalized.survey_id,
        "page_id": normalized.page_id or False,
        "title": normalized.title,
        "description": normalized.description,
        "is_page": False,
        "question_type": normalized.question_type,
        "constr_mandatory": normalized.constr_mandatory,
        "sequence": normalized.sequence,
        **dict(normalized.extra_values),
    }
    existing_ids = conn.search(
        "survey.question",
        [
            ("survey_id", "=", normalized.survey_id),
            ("title", "=", normalized.title),
            ("is_page", "=", False),
        ],
        limit=1,
    )
    if existing_ids:
        question_id = _required_record_id(existing_ids[0], context=f"survey question {normalized.title}")
        conn.write("survey.question", [question_id], values)
    else:
        question_id = _required_record_id(
            conn.create("survey.question", values),
            context=f"created survey question {normalized.title}",
        )
    if normalized.answer_options:
        sync_survey_answer_options(conn, question_id, normalized.answer_options)
    return question_id


def sync_survey_answer_options(
    conn: SurveyUpsertConnection,
    question_id: int,
    answer_options: Sequence[SurveyAnswerOption | str | tuple[str, int]],
) -> dict[str, int]:
    """Reconcile answer options exactly for one survey question."""
    clean_question_id = _required_record_id(question_id, context="survey.question")
    expected = _normalize_answer_options(answer_options)
    expected_by_value = {option.value: option for option in expected}

    existing = conn.search_read(
        "survey.question.answer",
        [("question_id", "=", clean_question_id)],
        ["id", "value", "sequence"],
        order="sequence,id",
    )
    kept_ids_by_value: dict[str, int] = {}
    stale_ids: list[int] = []
    updated = 0
    for row in existing:
        row_id = _record_id(row.get("id"))
        value = str(row.get("value") or "").strip()
        if row_id <= 0:
            continue
        if value not in expected_by_value or value in kept_ids_by_value:
            stale_ids.append(row_id)
            continue
        kept_ids_by_value[value] = row_id
        option = expected_by_value[value]
        write_values: dict[str, Any] = {}
        if int(row.get("sequence") or 0) != option.sequence:
            write_values["sequence"] = option.sequence
        if write_values:
            conn.write("survey.question.answer", [row_id], write_values)
            updated += 1

    created = 0
    for option in expected:
        if option.value in kept_ids_by_value:
            continue
        conn.create(
            "survey.question.answer",
            {
                "question_id": clean_question_id,
                "value": option.value,
                "sequence": option.sequence,
            },
        )
        created += 1

    removed = 0
    if stale_ids:
        unique_stale_ids = sorted(set(stale_ids))
        conn.unlink("survey.question.answer", unique_stale_ids)
        removed = len(unique_stale_ids)
    return {
        "answer_rows_created": created,
        "answer_rows_updated": updated,
        "answer_rows_removed": removed,
    }


def _normalize_answer_options(
    answer_options: Sequence[SurveyAnswerOption | str | tuple[str, int]],
) -> list[SurveyAnswerOption]:
    normalized: list[SurveyAnswerOption] = []
    seen: set[str] = set()
    for index, option in enumerate(answer_options, start=1):
        if isinstance(option, SurveyAnswerOption):
            normalized_option = option
        elif isinstance(option, tuple):
            value, sequence = option
            normalized_option = SurveyAnswerOption(value=value, sequence=sequence)
        else:
            normalized_option = SurveyAnswerOption(value=str(option), sequence=index)
        if normalized_option.sequence <= 0:
            normalized_option = SurveyAnswerOption(value=normalized_option.value, sequence=index)
        if normalized_option.value in seen:
            raise ValueError(f"Duplicate survey answer value: {normalized_option.value}")
        seen.add(normalized_option.value)
        normalized.append(normalized_option)
    return normalized


def _record_id(value: Any) -> int:
    if isinstance(value, Mapping):
        return _record_id(value.get("id"))
    if isinstance(value, (list, tuple)) and value:
        return _record_id(value[0])
    return int(value or 0)


def _required_record_id(value: Any, *, context: str) -> int:
    record_id = _record_id(value)
    if record_id <= 0:
        raise RuntimeError(f"Survey upsert did not receive a valid ID for {context}")
    return record_id
