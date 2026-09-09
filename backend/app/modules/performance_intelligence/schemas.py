from __future__ import annotations

from pydantic import BaseModel, Field


class PerformanceSubjectInsight(BaseModel):
    subject_id: int
    subject_name: str
    average_score: float
    highest_score: float
    lowest_score: float
    result_count: int


class PerformanceTermInsight(BaseModel):
    term_id: int
    term_name: str
    academic_session_id: int
    academic_session_name: str
    average_score: float
    result_count: int
    trend: str = "stable"
    change_from_previous: float = 0.0


class AttendanceInsight(BaseModel):
    total_days: int
    present_days: int
    late_days: int
    absent_days: int
    excused_days: int
    attendance_percentage: float


class PerformanceRiskInsight(BaseModel):
    level: str
    score: int
    flags: list[str] = Field(default_factory=list)
    summary: str


class StudentPerformanceIntelligenceResponse(BaseModel):
    student_id: int
    student_name: str
    admission_number: str
    school_id: int
    school_name: str | None = None
    classroom_id: int | None = None
    classroom_name: str | None = None

    academic_average: float
    academic_result_count: int

    strongest_subject: PerformanceSubjectInsight | None = None
    weakest_subject: PerformanceSubjectInsight | None = None
    subjects: list[PerformanceSubjectInsight] = Field(
        default_factory=list
    )

    term_trends: list[PerformanceTermInsight] = Field(
        default_factory=list
    )

    attendance: AttendanceInsight
    risk: PerformanceRiskInsight


class StudentAttentionItem(BaseModel):
    student_id: int
    student_name: str
    admission_number: str
    classroom_id: int | None = None
    classroom_name: str | None = None
    academic_average: float
    attendance_percentage: float
    risk_level: str
    reasons: list[str] = Field(default_factory=list)


class ClassPerformanceIntelligenceResponse(BaseModel):
    classroom_id: int
    classroom_name: str
    school_id: int
    school_name: str | None = None

    student_count: int
    students_with_results: int

    academic_average: float
    attendance: AttendanceInsight

    strongest_subject: PerformanceSubjectInsight | None = None
    weakest_subject: PerformanceSubjectInsight | None = None
    subjects: list[PerformanceSubjectInsight] = Field(
        default_factory=list
    )

    students_needing_attention: list[StudentAttentionItem] = Field(
        default_factory=list
    )


class ClassPerformanceSummary(BaseModel):
    classroom_id: int
    classroom_name: str
    student_count: int
    academic_average: float
    attendance_percentage: float


class SubjectPerformanceSummary(BaseModel):
    subject_id: int
    subject_name: str
    average_score: float
    result_count: int


class SchoolPerformanceIntelligenceResponse(BaseModel):
    school_id: int
    school_name: str

    student_count: int
    students_with_results: int
    classroom_count: int

    academic_average: float
    attendance: AttendanceInsight

    classes: list[ClassPerformanceSummary] = Field(
        default_factory=list
    )

    subjects: list[SubjectPerformanceSummary] = Field(
        default_factory=list
    )

    students_needing_attention: list[StudentAttentionItem] = Field(
        default_factory=list
    )
