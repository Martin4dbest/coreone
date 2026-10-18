from collections import defaultdict

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.tenant.context import TenantContext
from app.modules.school_features.service import SchoolFeatureService
from app.models.attendance import Attendance
from app.models.cbt_attempt import CBTAttempt
from app.models.cbt_exam import CBTExam
from app.models.classroom import Classroom
from app.models.ebook_activity import EbookActivity
from app.models.parent import Parent
from app.models.parent_student import ParentStudent
from app.models.student import Student
from app.models.youtube_activity import YoutubeActivity


class StudentEngagementService:
    def __init__(self, db: AsyncSession):
        self.db = db

    @staticmethod
    def _role(user) -> str:
        role = getattr(user, "role", None)
        return str(getattr(role, "name", role)).upper()

    def _school_id(self, user, tenant: TenantContext) -> int:
        tenant_school = getattr(tenant, "school_id", None)
        user_school = getattr(user, "school_id", None)

        if self._role(user) == "SCHOOL_ADMIN":
            if tenant_school is None or user_school != tenant_school:
                raise HTTPException(
                    status_code=403,
                    detail="You do not have access to this school's rankings.",
                )

        school_id = tenant_school or user_school
        if school_id is None:
            raise HTTPException(
                status_code=403,
                detail="A school context is required.",
            )
        return school_id

    async def _build(
        self,
        school_id: int,
        classroom_id: int | None = None,
        private_student_id: int | None = None,
    ) -> dict:
        student_query = (
            select(Student, Classroom.name.label("class_name"))
            .outerjoin(Classroom, Classroom.id == Student.classroom_id)
            .where(
                Student.school_id == school_id,
                Student.active.is_(True),
            )
        )
        if classroom_id is not None:
            student_query = student_query.where(
                Student.classroom_id == classroom_id
            )

        student_rows = (await self.db.execute(student_query)).all()
        students = {}
        for student, class_name in student_rows:
            students[student.id] = {
                "id": student.id,
                "user_id": student.user_id,
                "name": " ".join(
                    part for part in (
                        student.first_name,
                        student.middle_name,
                        student.last_name,
                    ) if part
                ),
                "classroom_id": student.classroom_id,
                "class_name": class_name or "Unassigned",
                "cbt_scores": [],
                "attendance_days": 0,
                "attendance_present": 0,
                "ebook_views": 0,
                "youtube_opens": 0,
            }

        if not students:
            return {
                "school_id": school_id,
                "classrooms": await self._classrooms(school_id),
                "categories": self._categories([]),
            }

        student_ids = list(students)
        user_ids = [item["user_id"] for item in students.values()]

        attempts = await self.db.execute(
            select(
                CBTAttempt.student_id,
                CBTAttempt.percentage,
                CBTAttempt.score,
                CBTAttempt.total_marks,
            )
            .join(CBTExam, CBTExam.id == CBTAttempt.exam_id)
            .where(
                CBTAttempt.student_id.in_(student_ids),
                CBTExam.school_id == school_id,
                CBTAttempt.completed.is_(True),
                CBTAttempt.submitted_at.is_not(None),
            )
        )
        for student_id, percentage, score, total_marks in attempts.all():
            if student_id not in students:
                continue
            value = percentage
            if value is None and total_marks and total_marks > 0:
                value = score / total_marks * 100
            if value is not None:
                students[student_id]["cbt_scores"].append(
                    max(0.0, min(100.0, float(value)))
                )

        attendance_rows = await self.db.execute(
            select(
                Attendance.student_id,
                Attendance.status,
            ).where(
                Attendance.school_id == school_id,
                Attendance.student_id.in_(student_ids),
            )
        )
        for student_id, status in attendance_rows.all():
            if student_id not in students:
                continue
            students[student_id]["attendance_days"] += 1
            if str(status).lower() in {"present", "late"}:
                students[student_id]["attendance_present"] += 1

        ebook_rows = await self.db.execute(
            select(EbookActivity.user_id, func.count(EbookActivity.id))
            .where(
                EbookActivity.school_id == school_id,
                EbookActivity.user_id.in_(user_ids),
                func.lower(EbookActivity.activity_type) == "view",
            )
            .group_by(EbookActivity.user_id)
        )
        ebook_counts = dict(ebook_rows.all())
        for item in students.values():
            item["ebook_views"] = int(ebook_counts.get(item["user_id"], 0))

        youtube_rows = await self.db.execute(
            select(YoutubeActivity.user_id, func.count(YoutubeActivity.id))
            .where(
                YoutubeActivity.school_id == school_id,
                YoutubeActivity.user_id.in_(user_ids),
                func.lower(YoutubeActivity.activity_type) == "open",
            )
            .group_by(YoutubeActivity.user_id)
        )
        youtube_counts = dict(youtube_rows.all())
        for item in students.values():
            item["youtube_opens"] = int(
                youtube_counts.get(item["user_id"], 0)
            )

        records = []
        for item in students.values():
            cbt_scores = item.pop("cbt_scores")
            cbt_average = (
                round(sum(cbt_scores) / len(cbt_scores), 2)
                if cbt_scores else None
            )
            attendance_pct = (
                round(
                    item["attendance_present"] / item["attendance_days"] * 100,
                    2,
                )
                if item["attendance_days"] else None
            )
            records.append({
                **item,
                "cbt_average": cbt_average,
                "cbt_attempts": len(cbt_scores),
                "attendance_percentage": attendance_pct,
            })

        definitions = [
            ("cbt", "CBT Performance", "Average completed CBT score", "cbt_average", "%", "cbt_attempts"),
            ("attendance", "Attendance", "Present or late attendance records", "attendance_percentage", "%", "attendance_days"),
            ("ebooks", "E-book Engagement", "Recorded e-book views", "ebook_views", "views", "ebook_views"),
            ("youtube", "YouTube Learning", "Recorded video opens", "youtube_opens", "opens", "youtube_opens"),
        ]

        categories = []
        for key, title, description, field, unit, evidence_field in definitions:
            eligible = [
                record for record in records
                if record[field] is not None and record[evidence_field] > 0
            ]
            eligible.sort(
                key=lambda record: (
                    -record[field],
                    record["name"].casefold(),
                    record["id"],
                )
            )

            rankings = []
            previous_value = object()
            current_rank = 0
            for index, record in enumerate(eligible, start=1):
                if record[field] != previous_value:
                    current_rank = index
                    previous_value = record[field]
                rankings.append({
                    "rank": current_rank,
                    "student_id": record["id"],
                    "student_name": record["name"],
                    "classroom_id": record["classroom_id"],
                    "class_name": record["class_name"],
                    "value": record[field],
                    "unit": unit,
                    "cbt_attempts": record["cbt_attempts"],
                    "attendance_days": record["attendance_days"],
                    "ebook_views": record["ebook_views"],
                    "youtube_opens": record["youtube_opens"],
                })

            private_result = next(
                (
                    row for row in rankings
                    if row["student_id"] == private_student_id
                ),
                None,
            )
            categories.append({
                "key": key,
                "title": title,
                "description": description,
                "unit": unit,
                "total_ranked": len(rankings),
                "top5": rankings[:5],
                "rankings": rankings,
                "my_result": private_result,
            })

        return {
            "school_id": school_id,
            "classrooms": await self._classrooms(school_id),
            "categories": categories,
        }

    async def _classrooms(self, school_id: int) -> list[dict]:
        rows = await self.db.execute(
            select(Classroom.id, Classroom.name)
            .where(Classroom.school_id == school_id)
            .order_by(Classroom.name)
        )
        return [
            {"id": classroom_id, "name": name}
            for classroom_id, name in rows.all()
        ]

    @staticmethod
    def _categories(categories: list) -> list:
        return [
            {
                "key": key,
                "title": title,
                "description": description,
                "unit": unit,
                "total_ranked": 0,
                "top5": [],
                "rankings": [],
                "my_result": None,
            }
            for key, title, description, _field, unit, _evidence in [
                ("cbt", "CBT Performance", "Average completed CBT score", "cbt_average", "%", "cbt_attempts"),
                ("attendance", "Attendance", "Present or late attendance records", "attendance_percentage", "%", "attendance_days"),
                ("ebooks", "E-book Engagement", "Recorded e-book views", "ebook_views", "views", "ebook_views"),
                ("youtube", "YouTube Learning", "Recorded video opens", "youtube_opens", "opens", "youtube_opens"),
            ]
        ]

    async def school_rankings(
        self, user, tenant: TenantContext, classroom_id: int | None = None
    ) -> dict:
        if self._role(user) not in {"SCHOOL_ADMIN", "SUPER_ADMIN"}:
            raise HTTPException(status_code=403, detail="Administrator access required.")

        school_id = self._school_id(user, tenant)
        await SchoolFeatureService(self.db).ensure_enabled(school_id, "student_engagement")
        if classroom_id is not None:
            valid_class = await self.db.scalar(
                select(Classroom.id).where(
                    Classroom.id == classroom_id,
                    Classroom.school_id == school_id,
                )
            )
            if valid_class is None:
                raise HTTPException(status_code=404, detail="Class not found in this school.")

        return await self._build(school_id, classroom_id=classroom_id)

    async def student_view(self, user, tenant: TenantContext) -> dict:
        if self._role(user) != "STUDENT":
            raise HTTPException(status_code=403, detail="Student access required.")

        school_id = self._school_id(user, tenant)
        await SchoolFeatureService(self.db).ensure_enabled(school_id, "student_engagement")
        student_id = await self.db.scalar(
            select(Student.id).where(
                Student.user_id == user.id,
                Student.school_id == school_id,
                Student.active.is_(True),
            )
        )
        if student_id is None:
            raise HTTPException(status_code=404, detail="Student profile not found.")

        data = await self._build(school_id, private_student_id=student_id)
        for category in data["categories"]:
            category.pop("rankings", None)
        return data

    async def parent_view(
        self, user, tenant: TenantContext, student_id: int
    ) -> dict:
        if self._role(user) != "PARENT":
            raise HTTPException(status_code=403, detail="Parent access required.")

        school_id = self._school_id(user, tenant)
        await SchoolFeatureService(self.db).ensure_enabled(school_id, "student_engagement")
        parent_id = await self.db.scalar(
            select(Parent.id).where(Parent.user_id == user.id)
        )
        if parent_id is None:
            raise HTTPException(status_code=404, detail="Parent profile not found.")

        linked_student = await self.db.scalar(
            select(Student.id)
            .join(ParentStudent, ParentStudent.student_id == Student.id)
            .where(
                ParentStudent.parent_id == parent_id,
                Student.id == student_id,
                Student.school_id == school_id,
                Student.active.is_(True),
            )
        )
        if linked_student is None:
            raise HTTPException(
                status_code=403,
                detail="You are not authorized to view this student's rankings.",
            )

        data = await self._build(school_id, private_student_id=student_id)
        for category in data["categories"]:
            category.pop("rankings", None)
        return data
