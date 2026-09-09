from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class CBTQuestionRequest(BaseModel):
    school_id: int = Field(gt=0)
    subject: str = Field(min_length=1, max_length=120)
    topic: str = Field(min_length=1, max_length=200)
    class_name: str = Field(min_length=1, max_length=120)
    number_of_questions: int = Field(
        default=10,
        ge=1,
        le=50,
    )
    difficulty: Literal[
        "easy",
        "medium",
        "hard",
        "mixed",
    ] = "mixed"


class CBTQuestion(BaseModel):
    question: str
    options: list[str] = Field(
        min_length=4,
        max_length=4,
    )
    correct_answer: str
    explanation: str


class CBTQuestionResponse(BaseModel):
    subject: str
    topic: str
    class_name: str
    questions: list[CBTQuestion]


# =========================================================
# PERFORMANCE INTELLIGENCE AI
# =========================================================

class PerformanceAIInsightResponse(BaseModel):
    scope: Literal[
        "student",
        "class",
        "school",
    ]

    title: str
    summary: str

    key_findings: list[str] = Field(
        default_factory=list
    )

    recommendations: list[str] = Field(
        default_factory=list
    )

    priority: Literal[
        "low",
        "moderate",
        "high",
    ] = "low"


# =========================================================
# AI CBT TEACHER ACCESS
# =========================================================

class AICBTAccessGenerateRequest(BaseModel):
    classroom_id: int
    target_teacher_id: int


class AICBTAccessGenerateResponse(BaseModel):
    classroom_id: int
    target_teacher_id: int
    target_teacher_name: str
    code: str
    expires_at: datetime


class AICBTAccessRedeemRequest(BaseModel):
    code: str


class AICBTAccessRedeemResponse(BaseModel):
    allowed: bool
    message: str


class AICBTAccessStatusResponse(BaseModel):
    allowed: bool
    reason: str
