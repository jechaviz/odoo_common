"""Canonical Odoo survey upsert helpers."""

from .survey_upserts import (
    SurveyAnswerOption,
    SurveyPageSpec,
    SurveyQuestionSpec,
    SurveyUpsertConnection,
    sync_survey_answer_options,
    upsert_survey_page,
    upsert_survey_question,
)

__all__ = [
    "SurveyAnswerOption",
    "SurveyPageSpec",
    "SurveyQuestionSpec",
    "SurveyUpsertConnection",
    "sync_survey_answer_options",
    "upsert_survey_page",
    "upsert_survey_question",
]
