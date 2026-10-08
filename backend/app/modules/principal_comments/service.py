from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.principal_comment_bank import PrincipalCommentBank
from app.models.result import Result
from app.models.student import Student


DEFAULT_COMMENTS = [
    {
        "title": "Outstanding Performance",
        "min_score": 90.00,
        "max_score": 100.00,
        "comment": "Excellent performance. Keep up the outstanding work and continue to aim higher.",
    },
    {
        "title": "Very Good Performance",
        "min_score": 80.00,
        "max_score": 89.99,
        "comment": "Very good performance. Your hard work is evident. Keep improving.",
    },
    {
        "title": "Good Performance",
        "min_score": 70.00,
        "max_score": 79.99,
        "comment": "Good performance. With greater consistency and effort, you can achieve even more.",
    },
    {
        "title": "Fair Performance",
        "min_score": 60.00,
        "max_score": 69.99,
        "comment": "Fair performance. More dedication and focused study are required to improve further.",
    },
    {
        "title": "Needs More Effort",
        "min_score": 50.00,
        "max_score": 59.99,
        "comment": "Your performance is below expectation. Greater commitment to your studies is needed.",
    },
    {
        "title": "Significant Improvement Required",
        "min_score": 0.00,
        "max_score": 49.99,
        "comment": "Significant improvement is required. Please put in more effort and seek guidance where necessary.",
    },
]


class PrincipalCommentBankService:
    def __init__(self, db: AsyncSession):
        self.db = db

    @staticmethod
    def _role(current_user) -> str:
        role = getattr(current_user, "role", None)
        return str(getattr(role, "name", role) or "").upper()

    def _assert_school_access(self, school_id: int, current_user) -> int:
        role = self._role(current_user)

        if role not in {"SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL"}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to manage Principal comments.",
            )

        if role == "SUPER_ADMIN":
            return int(school_id)

        user_school_id = getattr(current_user, "school_id", None)

        if user_school_id is None or int(user_school_id) != int(school_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only manage comments for your own school.",
            )

        return int(user_school_id)

    async def _validate_range(
        self,
        school_id: int,
        min_score: float,
        max_score: float,
        exclude_id: int | None = None,
    ):
        min_score = round(float(min_score), 2)
        max_score = round(float(max_score), 2)

        if min_score > max_score:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Minimum score cannot be greater than maximum score.",
            )

        query = select(PrincipalCommentBank).where(
            PrincipalCommentBank.school_id == school_id,
            PrincipalCommentBank.is_active.is_(True),
            PrincipalCommentBank.min_score <= max_score,
            PrincipalCommentBank.max_score >= min_score,
        )

        if exclude_id is not None:
            query = query.where(PrincipalCommentBank.id != exclude_id)

        overlap = (await self.db.execute(query)).scalars().first()

        if overlap:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"The performance range overlaps with '{overlap.title}'. "
                    "Adjust the range so active rules do not overlap."
                ),
            )

        return min_score, max_score

    async def list_banks(self, school_id: int, current_user):
        school_id = self._assert_school_access(school_id, current_user)

        query = (
            select(PrincipalCommentBank)
            .where(PrincipalCommentBank.school_id == school_id)
            .order_by(
                PrincipalCommentBank.max_score.desc(),
                PrincipalCommentBank.min_score.desc(),
                PrincipalCommentBank.id.asc(),
            )
        )

        banks = list((await self.db.execute(query)).scalars().all())

        if not banks:
            for item in DEFAULT_COMMENTS:
                self.db.add(
                    PrincipalCommentBank(
                        school_id=school_id,
                        title=item["title"],
                        min_score=item["min_score"],
                        max_score=item["max_score"],
                        comment=item["comment"],
                        is_active=True,
                    )
                )

            await self.db.commit()

            banks = list(
                (
                    await self.db.execute(
                        select(PrincipalCommentBank)
                        .where(PrincipalCommentBank.school_id == school_id)
                        .order_by(
                            PrincipalCommentBank.max_score.desc(),
                            PrincipalCommentBank.min_score.desc(),
                            PrincipalCommentBank.id.asc(),
                        )
                    )
                ).scalars().all()
            )

        return banks

    async def create_bank(self, payload, current_user):
        school_id = self._assert_school_access(payload.school_id, current_user)

        min_score, max_score = await self._validate_range(
            school_id,
            payload.min_score,
            payload.max_score,
        )

        bank = PrincipalCommentBank(
            school_id=school_id,
            title=payload.title.strip(),
            min_score=min_score,
            max_score=max_score,
            comment=payload.comment.strip(),
            is_active=True,
        )

        self.db.add(bank)
        await self.db.commit()
        await self.db.refresh(bank)

        return bank

    async def update_bank(self, bank_id: int, payload, current_user):
        school_id = self._assert_school_access(payload.school_id, current_user)

        bank = (
            await self.db.execute(
                select(PrincipalCommentBank).where(
                    PrincipalCommentBank.id == bank_id,
                    PrincipalCommentBank.school_id == school_id,
                )
            )
        ).scalar_one_or_none()

        if not bank:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Principal comment rule not found.",
            )

        min_score, max_score = await self._validate_range(
            school_id,
            payload.min_score,
            payload.max_score,
            exclude_id=bank.id,
        )

        bank.title = payload.title.strip()
        bank.min_score = min_score
        bank.max_score = max_score
        bank.comment = payload.comment.strip()
        bank.is_active = payload.is_active

        await self.db.commit()
        await self.db.refresh(bank)

        return bank

    async def delete_bank(self, bank_id: int, school_id: int, current_user):
        school_id = self._assert_school_access(school_id, current_user)

        bank = (
            await self.db.execute(
                select(PrincipalCommentBank).where(
                    PrincipalCommentBank.id == bank_id,
                    PrincipalCommentBank.school_id == school_id,
                )
            )
        ).scalar_one_or_none()

        if not bank:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Principal comment rule not found.",
            )

        await self.db.delete(bank)
        await self.db.commit()

        return {"message": "Principal comment rule deleted successfully."}

    async def preview(
        self,
        school_id: int,
        class_id: int,
        term_id: int,
        academic_session_id: int,
        bank_id: int,
        current_user,
    ):
        school_id = self._assert_school_access(school_id, current_user)

        bank = (
            await self.db.execute(
                select(PrincipalCommentBank).where(
                    PrincipalCommentBank.id == bank_id,
                    PrincipalCommentBank.school_id == school_id,
                    PrincipalCommentBank.is_active.is_(True),
                )
            )
        ).scalar_one_or_none()

        if not bank:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Active Principal comment rule not found.",
            )

        rows = (
            await self.db.execute(
                select(
                    Student.id.label("student_id"),
                    Student.first_name,
                    Student.middle_name,
                    Student.last_name,
                    Student.admission_number,
                    func.avg(Result.total_score).label("average"),
                    func.count(Result.id).label("subjects_count"),
                )
                .join(Result, Result.student_id == Student.id)
                .where(
                    Result.school_id == school_id,
                    Result.class_id == class_id,
                    Result.term_id == term_id,
                    Result.academic_session_id == academic_session_id,
                    Result.is_active.is_(True),
                    Student.school_id == school_id,
                    Student.classroom_id == class_id,
                )
                .group_by(
                    Student.id,
                    Student.first_name,
                    Student.middle_name,
                    Student.last_name,
                    Student.admission_number,
                )
                .order_by(
                    Student.last_name.asc(),
                    Student.first_name.asc(),
                )
            )
        ).all()

        student_ids = [int(row.student_id) for row in rows]
        existing_comments: dict[int, list[str]] = {
            student_id: [] for student_id in student_ids
        }

        if student_ids:
            comment_rows = (
                await self.db.execute(
                    select(Result.student_id, Result.principal_comment).where(
                        Result.school_id == school_id,
                        Result.class_id == class_id,
                        Result.term_id == term_id,
                        Result.academic_session_id == academic_session_id,
                        Result.student_id.in_(student_ids),
                        Result.is_active.is_(True),
                        Result.principal_comment.is_not(None),
                    )
                )
            ).all()

            for student_id, comment in comment_rows:
                cleaned = str(comment or "").strip()
                if cleaned:
                    existing_comments.setdefault(int(student_id), []).append(cleaned)

        students = []

        for row in rows:
            average = round(float(row.average or 0), 2)
            comments = existing_comments.get(int(row.student_id), [])

            students.append(
                {
                    "student_id": int(row.student_id),
                    "student_name": (
                        f"{row.first_name} "
                        f"{(row.middle_name + ' ') if row.middle_name else ''}"
                        f"{row.last_name}"
                    ).strip(),
                    "admission_number": row.admission_number,
                    "average": average,
                    "subjects_count": int(row.subjects_count or 0),
                    "matches_range": (
                        average >= float(bank.min_score)
                        and average <= float(bank.max_score)
                    ),
                    "has_manual_principal_comment": bool(comments),
                    "existing_comment": comments[0] if comments else None,
                }
            )

        return {
            "bank_id": bank.id,
            "min_score": bank.min_score,
            "max_score": bank.max_score,
            "comment": bank.comment,
            "students": students,
        }

    async def apply(self, payload, current_user):
        school_id = self._assert_school_access(payload.school_id, current_user)

        bank = (
            await self.db.execute(
                select(PrincipalCommentBank).where(
                    PrincipalCommentBank.id == payload.bank_id,
                    PrincipalCommentBank.school_id == school_id,
                    PrincipalCommentBank.is_active.is_(True),
                )
            )
        ).scalar_one_or_none()

        if not bank:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Active Principal comment rule not found.",
            )

        student_ids = list(dict.fromkeys(int(x) for x in payload.student_ids))

        if not student_ids:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Select at least one student before applying the comment.",
            )

        averages = (
            await self.db.execute(
                select(
                    Student.id.label("student_id"),
                    func.avg(Result.total_score).label("average"),
                )
                .join(Result, Result.student_id == Student.id)
                .where(
                    Result.school_id == school_id,
                    Result.class_id == payload.class_id,
                    Result.term_id == payload.term_id,
                    Result.academic_session_id == payload.academic_session_id,
                    Result.student_id.in_(student_ids),
                    Result.is_active.is_(True),
                    Student.school_id == school_id,
                    Student.classroom_id == payload.class_id,
                )
                .group_by(Student.id)
            )
        ).all()

        averages_by_student = {
            int(row.student_id): round(float(row.average or 0), 2)
            for row in averages
        }

        result_rows = list(
            (
                await self.db.execute(
                    select(Result).where(
                        Result.school_id == school_id,
                        Result.class_id == payload.class_id,
                        Result.term_id == payload.term_id,
                        Result.academic_session_id == payload.academic_session_id,
                        Result.student_id.in_(averages_by_student.keys()),
                        Result.is_active.is_(True),
                    )
                )
            ).scalars().all()
        ) if averages_by_student else []

        by_student: dict[int, list[Result]] = {}

        for result in result_rows:
            by_student.setdefault(int(result.student_id), []).append(result)

        applied = 0
        skipped_manual = 0
        skipped_outside_range = 0
        skipped_no_results = 0

        for student_id in student_ids:
            average = averages_by_student.get(student_id)

            if average is None:
                skipped_no_results += 1
                continue

            if not (
                average >= float(bank.min_score)
                and average <= float(bank.max_score)
            ):
                skipped_outside_range += 1
                continue

            rows_for_student = by_student.get(student_id, [])

            if not rows_for_student:
                skipped_no_results += 1
                continue

            # Existing Principal comments are protected.
            if any(
                str(row.principal_comment or "").strip()
                for row in rows_for_student
            ):
                skipped_manual += 1
                continue

            for row in rows_for_student:
                row.principal_comment = bank.comment

                if hasattr(row, "principal_comment_by"):
                    row.principal_comment_by = current_user.id

            applied += 1

        await self.db.commit()

        return {
            "message": "Principal comments applied successfully.",
            "applied": applied,
            "skipped_manual": skipped_manual,
            "skipped_outside_range": skipped_outside_range,
            "skipped_no_results": skipped_no_results,
        }
