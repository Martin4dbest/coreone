from __future__ import annotations

from collections import defaultdict

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.teacher_access import check_teacher_class_access
from app.modules.performance_intelligence.repository import (
    PerformanceIntelligenceRepository,
)
from app.modules.performance_intelligence.schemas import (
    AttendanceInsight,
    ClassPerformanceIntelligenceResponse,
    ClassPerformanceSummary,
    PerformanceRiskInsight,
    PerformanceSubjectInsight,
    PerformanceTermInsight,
    SchoolPerformanceIntelligenceResponse,
    StudentAttentionItem,
    StudentPerformanceIntelligenceResponse,
    SubjectPerformanceSummary,
)


class PerformanceIntelligenceService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = PerformanceIntelligenceRepository(db)

    # =========================================================
    # COMMON
    # =========================================================

    def _resolve_school_id(
        self,
        current_user,
        tenant,
    ) -> int:

        role = current_user.role.name

        if role == "SUPER_ADMIN":
            if tenant.school_id is not None:
                return tenant.school_id

            if current_user.school_id is not None:
                return current_user.school_id

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A school must be selected.",
            )

        if tenant.school_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="School could not be resolved.",
            )

        if current_user.school_id != tenant.school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot access performance intelligence for another school.",
            )

        return tenant.school_id

    @staticmethod
    def _student_name(
        first_name: str | None,
        middle_name: str | None,
        last_name: str | None,
    ) -> str:
        return " ".join(
            part
            for part in [
                first_name,
                middle_name,
                last_name,
            ]
            if part
        ).strip()

    @staticmethod
    def _attendance(
        records,
    ) -> AttendanceInsight:

        total_days = len(records)

        present_days = sum(
            1
            for record in records
            if record.status == "present"
        )

        late_days = sum(
            1
            for record in records
            if record.status == "late"
        )

        absent_days = sum(
            1
            for record in records
            if record.status == "absent"
        )

        excused_days = sum(
            1
            for record in records
            if record.status == "excused"
        )

        credited_days = present_days + late_days

        attendance_percentage = (
            round(
                (credited_days / total_days) * 100,
                2,
            )
            if total_days
            else 0.0
        )

        return AttendanceInsight(
            total_days=total_days,
            present_days=present_days,
            late_days=late_days,
            absent_days=absent_days,
            excused_days=excused_days,
            attendance_percentage=attendance_percentage,
        )

    @staticmethod
    def _risk(
        academic_average: float,
        attendance_percentage: float,
        academic_result_count: int,
    ) -> PerformanceRiskInsight:

        score = 0
        flags: list[str] = []

        if academic_result_count == 0:
            flags.append(
                "No published academic results are available."
            )
            score += 20

        if academic_average < 40:
            flags.append("Very low academic performance.")
            score += 45
        elif academic_average < 50:
            flags.append("Low academic performance.")
            score += 30
        elif academic_average < 60:
            flags.append(
                "Academic performance needs improvement."
            )
            score += 15

        if attendance_percentage < 60:
            flags.append("Very poor attendance.")
            score += 40
        elif attendance_percentage < 75:
            flags.append("Poor attendance.")
            score += 25
        elif attendance_percentage < 85:
            flags.append("Attendance could be improved.")
            score += 10

        score = min(score, 100)

        if score >= 60:
            level = "high"
            summary = (
                "The student has significant indicators requiring "
                "timely academic or attendance support."
            )
        elif score >= 30:
            level = "moderate"
            summary = (
                "The student has indicators that should be monitored "
                "and supported."
            )
        else:
            level = "low"
            summary = (
                "No major academic or attendance risk indicators "
                "were detected from the available data."
            )

        return PerformanceRiskInsight(
            level=level,
            score=score,
            flags=flags,
            summary=summary,
        )

    # =========================================================
    # STUDENT
    # =========================================================

    async def get_student_intelligence(
        self,
        student_id: int,
        current_user,
        tenant,
    ) -> StudentPerformanceIntelligenceResponse:

        school_id = self._resolve_school_id(
            current_user,
            tenant,
        )

        row = await self.repository.get_student(
            student_id,
            school_id,
        )

        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found.",
            )

        student = row[0]
        classroom_name = row.classroom_name
        school_name = row.school_name

        role = current_user.role.name

        if role == "STUDENT" and student.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own performance intelligence.",
            )

        if role == "TEACHER":
            if student.classroom_id is None:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="This student is not assigned to a class.",
                )

            await check_teacher_class_access(
                self.db,
                current_user,
                student.classroom_id,
            )

        results = await self.repository.get_student_results(
            student_id,
            school_id,
        )

        attendance_records = (
            await self.repository.get_student_attendance(
                student_id,
                school_id,
            )
        )

        subjects = self._build_subject_insights(results)
        term_trends = self._build_term_trends(results)

        result_count = len(results)

        academic_average = (
            round(
                sum(
                    float(row[0].total_score or 0)
                    for row in results
                )
                / result_count,
                2,
            )
            if result_count
            else 0.0
        )

        strongest_subject = (
            max(
                subjects,
                key=lambda item: item.average_score,
            )
            if subjects
            else None
        )

        weakest_subject = (
            min(
                subjects,
                key=lambda item: item.average_score,
            )
            if subjects
            else None
        )

        attendance = self._attendance(
            attendance_records
        )

        risk = self._risk(
            academic_average,
            attendance.attendance_percentage,
            result_count,
        )

        return StudentPerformanceIntelligenceResponse(
            student_id=student.id,
            student_name=self._student_name(
                student.first_name,
                student.middle_name,
                student.last_name,
            ),
            admission_number=student.admission_number,
            school_id=student.school_id,
            school_name=school_name,
            classroom_id=student.classroom_id,
            classroom_name=classroom_name,
            academic_average=academic_average,
            academic_result_count=result_count,
            strongest_subject=strongest_subject,
            weakest_subject=weakest_subject,
            subjects=subjects,
            term_trends=term_trends,
            attendance=attendance,
            risk=risk,
        )

    def _build_subject_insights(
        self,
        rows,
    ) -> list[PerformanceSubjectInsight]:

        grouped = defaultdict(list)

        for row in rows:
            result = row[0]

            grouped[
                (
                    row.subject_id,
                    row.subject_name,
                )
            ].append(
                float(result.total_score or 0)
            )

        insights = []

        for (
            subject_id,
            subject_name,
        ), scores in grouped.items():

            insights.append(
                PerformanceSubjectInsight(
                    subject_id=subject_id,
                    subject_name=subject_name,
                    average_score=round(
                        sum(scores) / len(scores),
                        2,
                    ),
                    highest_score=round(
                        max(scores),
                        2,
                    ),
                    lowest_score=round(
                        min(scores),
                        2,
                    ),
                    result_count=len(scores),
                )
            )

        insights.sort(
            key=lambda item: item.average_score,
            reverse=True,
        )

        return insights

    def _build_term_trends(
        self,
        rows,
    ) -> list[PerformanceTermInsight]:

        grouped = defaultdict(list)

        for row in rows:
            result = row[0]

            grouped[
                (
                    row.academic_session_id,
                    row.academic_session_name,
                    row.term_id,
                    row.term_name,
                )
            ].append(
                float(result.total_score or 0)
            )

        raw = []

        for (
            academic_session_id,
            academic_session_name,
            term_id,
            term_name,
        ), scores in grouped.items():

            raw.append(
                {
                    "term_id": term_id,
                    "term_name": term_name,
                    "academic_session_id": academic_session_id,
                    "academic_session_name": academic_session_name,
                    "average_score": round(
                        sum(scores) / len(scores),
                        2,
                    ),
                    "result_count": len(scores),
                }
            )

        raw.sort(
            key=lambda item: (
                item["academic_session_id"],
                item["term_id"],
            )
        )

        insights = []
        previous_average = None

        for item in raw:
            current = item["average_score"]

            if previous_average is None:
                trend = "stable"
                change = 0.0
            else:
                change = round(
                    current - previous_average,
                    2,
                )

                if change >= 2:
                    trend = "improving"
                elif change <= -2:
                    trend = "declining"
                else:
                    trend = "stable"

            insights.append(
                PerformanceTermInsight(
                    term_id=item["term_id"],
                    term_name=item["term_name"],
                    academic_session_id=item[
                        "academic_session_id"
                    ],
                    academic_session_name=item[
                        "academic_session_name"
                    ],
                    average_score=current,
                    result_count=item["result_count"],
                    trend=trend,
                    change_from_previous=change,
                )
            )

            previous_average = current

        return insights

    # =========================================================
    # CLASS
    # =========================================================

    async def get_class_intelligence(
        self,
        classroom_id: int,
        current_user,
        tenant,
    ) -> ClassPerformanceIntelligenceResponse:

        school_id = self._resolve_school_id(
            current_user,
            tenant,
        )

        classroom_row = await self.repository.get_classroom(
            classroom_id,
            school_id,
        )

        if not classroom_row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Classroom not found.",
            )

        classroom = classroom_row[0]
        school_name = classroom_row.school_name

        if current_user.role.name == "TEACHER":
            await check_teacher_class_access(
                self.db,
                current_user,
                classroom_id,
            )
        elif current_user.role.name not in {
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        }:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not permitted to access class performance intelligence.",
            )

        students = await self.repository.get_class_students(
            classroom_id,
            school_id,
        )

        results = await self.repository.get_class_results(
            classroom_id,
            school_id,
        )

        attendance_records = (
            await self.repository.get_class_attendance(
                classroom_id,
                school_id,
            )
        )

        result_count = len(results)

        academic_average = (
            round(
                sum(
                    float(row[0].total_score or 0)
                    for row in results
                )
                / result_count,
                2,
            )
            if result_count
            else 0.0
        )

        class_attendance = self._attendance(
            attendance_records
        )

        subject_rows = [
            (
                row[0],
                row.subject_id,
                row.subject_name,
            )
            for row in results
        ]

        subjects = self._build_subject_insights(
            [
                type(
                    "SubjectRow",
                    (),
                    {
                        "0": item[0],
                        "subject_id": item[1],
                        "subject_name": item[2],
                    },
                )
                for item in subject_rows
            ]
        ) if False else self._build_subject_insights_from_class_results(
            results
        )

        strongest_subject = (
            max(
                subjects,
                key=lambda item: item.average_score,
            )
            if subjects
            else None
        )

        weakest_subject = (
            min(
                subjects,
                key=lambda item: item.average_score,
            )
            if subjects
            else None
        )

        student_result_scores = defaultdict(list)
        student_attendance = defaultdict(list)
        student_info = {}

        for row in results:
            result = row[0]
            student_result_scores[result.student_id].append(
                float(result.total_score or 0)
            )

            student_info[result.student_id] = {
                "student_name": self._student_name(
                    row.first_name,
                    row.middle_name,
                    row.last_name,
                ),
                "admission_number": row.admission_number,
            }

        for record in attendance_records:
            student_attendance[
                record.student_id
            ].append(record)

        for student_row in students:
            student = student_row[0]

            if student.id not in student_info:
                student_info[student.id] = {
                    "student_name": self._student_name(
                        student.first_name,
                        student.middle_name,
                        student.last_name,
                    ),
                    "admission_number": student.admission_number,
                }

        attention = []

        for student_id, info in student_info.items():
            scores = student_result_scores.get(
                student_id,
                [],
            )

            student_average = (
                round(sum(scores) / len(scores), 2)
                if scores
                else 0.0
            )

            attendance = self._attendance(
                student_attendance.get(student_id, [])
            )

            risk = self._risk(
                student_average,
                attendance.attendance_percentage,
                len(scores),
            )

            if risk.level in {"moderate", "high"}:
                attention.append(
                    StudentAttentionItem(
                        student_id=student_id,
                        student_name=info["student_name"],
                        admission_number=info[
                            "admission_number"
                        ],
                        classroom_id=classroom.id,
                        classroom_name=classroom.name,
                        academic_average=student_average,
                        attendance_percentage=(
                            attendance.attendance_percentage
                        ),
                        risk_level=risk.level,
                        reasons=risk.flags,
                    )
                )

        attention.sort(
            key=lambda item: (
                0 if item.risk_level == "high" else 1,
                item.academic_average,
                item.attendance_percentage,
            )
        )

        return ClassPerformanceIntelligenceResponse(
            classroom_id=classroom.id,
            classroom_name=classroom.name,
            school_id=school_id,
            school_name=school_name,
            student_count=len(students),
            students_with_results=len(
                student_result_scores
            ),
            academic_average=academic_average,
            attendance=class_attendance,
            strongest_subject=strongest_subject,
            weakest_subject=weakest_subject,
            subjects=subjects,
            students_needing_attention=attention,
        )

    def _build_subject_insights_from_class_results(
        self,
        rows,
    ) -> list[PerformanceSubjectInsight]:

        grouped = defaultdict(list)

        for row in rows:
            result = row[0]

            grouped[
                (
                    row.subject_id,
                    row.subject_name,
                )
            ].append(
                float(result.total_score or 0)
            )

        insights = []

        for (
            subject_id,
            subject_name,
        ), scores in grouped.items():
            insights.append(
                PerformanceSubjectInsight(
                    subject_id=subject_id,
                    subject_name=subject_name,
                    average_score=round(
                        sum(scores) / len(scores),
                        2,
                    ),
                    highest_score=round(
                        max(scores),
                        2,
                    ),
                    lowest_score=round(
                        min(scores),
                        2,
                    ),
                    result_count=len(scores),
                )
            )

        insights.sort(
            key=lambda item: item.average_score,
            reverse=True,
        )

        return insights

    # =========================================================
    # SCHOOL
    # =========================================================

    async def get_school_intelligence(
        self,
        current_user,
        tenant,
    ) -> SchoolPerformanceIntelligenceResponse:

        school_id = self._resolve_school_id(
            current_user,
            tenant,
        )

        if current_user.role.name not in {
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        }:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only school administrators can access school performance intelligence.",
            )

        school = await self.repository.get_school(
            school_id
        )

        if not school:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="School not found.",
            )

        students = await self.repository.get_school_students(
            school_id
        )

        results = await self.repository.get_school_results(
            school_id
        )

        attendance_records = (
            await self.repository.get_school_attendance(
                school_id
            )
        )

        classrooms = (
            await self.repository.get_school_classrooms(
                school_id
            )
        )

        result_count = len(results)

        academic_average = (
            round(
                sum(
                    float(row[0].total_score or 0)
                    for row in results
                )
                / result_count,
                2,
            )
            if result_count
            else 0.0
        )

        school_attendance = self._attendance(
            attendance_records
        )

        # -------------------------
        # Class summaries
        # -------------------------

        class_result_scores = defaultdict(list)
        class_attendance_records = defaultdict(list)

        for row in results:
            result = row[0]

            class_result_scores[
                result.class_id
            ].append(
                float(result.total_score or 0)
            )

        for record in attendance_records:
            class_attendance_records[
                record.classroom_id
            ].append(record)

        class_summaries = []

        for classroom in classrooms:
            scores = class_result_scores.get(
                classroom.id,
                [],
            )

            class_avg = (
                round(
                    sum(scores) / len(scores),
                    2,
                )
                if scores
                else 0.0
            )

            attendance = self._attendance(
                class_attendance_records.get(
                    classroom.id,
                    [],
                )
            )

            class_summaries.append(
                ClassPerformanceSummary(
                    classroom_id=classroom.id,
                    classroom_name=classroom.name,
                    student_count=sum(
                        1
                        for student_row in students
                        if student_row[0].classroom_id
                        == classroom.id
                    ),
                    academic_average=class_avg,
                    attendance_percentage=(
                        attendance.attendance_percentage
                    ),
                )
            )

        class_summaries.sort(
            key=lambda item: item.academic_average,
            reverse=True,
        )

        # -------------------------
        # Subject summaries
        # -------------------------

        subject_scores = defaultdict(list)
        subject_names = {}

        for row in results:
            result = row[0]

            subject_scores[
                row.subject_id
            ].append(
                float(result.total_score or 0)
            )

            subject_names[
                row.subject_id
            ] = row.subject_name

        subject_summaries = []

        for subject_id, scores in subject_scores.items():
            subject_summaries.append(
                SubjectPerformanceSummary(
                    subject_id=subject_id,
                    subject_name=subject_names[subject_id],
                    average_score=round(
                        sum(scores) / len(scores),
                        2,
                    ),
                    result_count=len(scores),
                )
            )

        subject_summaries.sort(
            key=lambda item: item.average_score
        )

        # -------------------------
        # Students needing attention
        # -------------------------

        student_scores = defaultdict(list)
        student_attendance = defaultdict(list)
        student_info = {}

        for row in results:
            result = row[0]

            student_scores[
                result.student_id
            ].append(
                float(result.total_score or 0)
            )

            student_info[
                result.student_id
            ] = {
                "student_name": self._student_name(
                    row.first_name,
                    row.middle_name,
                    row.last_name,
                ),
                "admission_number": row.admission_number,
                "classroom_id": row.student_classroom_id,
                "classroom_name": row.classroom_name,
            }

        for student_row in students:
            student = student_row[0]

            student_info.setdefault(
                student.id,
                {
                    "student_name": self._student_name(
                        student.first_name,
                        student.middle_name,
                        student.last_name,
                    ),
                    "admission_number": student.admission_number,
                    "classroom_id": student.classroom_id,
                    "classroom_name": student_row.classroom_name,
                },
            )

        for record in attendance_records:
            student_attendance[
                record.student_id
            ].append(record)

        attention = []

        for student_id, info in student_info.items():
            scores = student_scores.get(
                student_id,
                [],
            )

            student_average = (
                round(sum(scores) / len(scores), 2)
                if scores
                else 0.0
            )

            attendance = self._attendance(
                student_attendance.get(
                    student_id,
                    [],
                )
            )

            risk = self._risk(
                student_average,
                attendance.attendance_percentage,
                len(scores),
            )

            if risk.level in {"moderate", "high"}:
                attention.append(
                    StudentAttentionItem(
                        student_id=student_id,
                        student_name=info["student_name"],
                        admission_number=info["admission_number"],
                        classroom_id=info["classroom_id"],
                        classroom_name=info["classroom_name"],
                        academic_average=student_average,
                        attendance_percentage=(
                            attendance.attendance_percentage
                        ),
                        risk_level=risk.level,
                        reasons=risk.flags,
                    )
                )

        attention.sort(
            key=lambda item: (
                0 if item.risk_level == "high" else 1,
                item.academic_average,
                item.attendance_percentage,
            )
        )

        return SchoolPerformanceIntelligenceResponse(
            school_id=school.id,
            school_name=school.name,
            student_count=len(students),
            students_with_results=len(student_scores),
            classroom_count=len(classrooms),
            academic_average=academic_average,
            attendance=school_attendance,
            classes=class_summaries,
            subjects=subject_summaries,
            students_needing_attention=attention,
        )
