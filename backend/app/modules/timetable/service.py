from fastapi import HTTPException, status
from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.academic_session import AcademicSession
from app.models.classroom import Classroom
from app.models.parent import Parent
from app.models.parent_student import ParentStudent
from app.models.student import Student
from app.models.subject import Subject
from app.models.teacher import Teacher
from app.models.term import Term
from app.models.timetable_entry import TimetableEntry
from app.modules.timetable.schemas import (
    DAYS,
    TimetableCreateRequest,
    TimetableUpdateRequest,
)
from app.modules.timetable.repository import TimetableRepository


ADMIN_ROLES = {"SUPER_ADMIN", "SCHOOL_ADMIN"}


class TimetableService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = TimetableRepository(db)

    # ---------------------------------------------------------
    # ACCESS
    # ---------------------------------------------------------

    def _target_school(
        self,
        current_user,
        requested_school_id: int | None = None,
    ) -> int | None:

        role = current_user.role.name

        if role == "SUPER_ADMIN":
            return requested_school_id

        return current_user.school_id

    def _require_admin(self, current_user):
        if current_user.role.name not in ADMIN_ROLES:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only School Admins can manage timetables.",
            )

    # ---------------------------------------------------------
    # VALIDATION
    # ---------------------------------------------------------

    async def _validate_references(
        self,
        *,
        school_id: int,
        academic_session_id: int,
        term_id: int,
        classroom_id: int,
        subject_id: int,
        teacher_id: int,
    ):

        session_result = await self.db.execute(
            select(AcademicSession).where(
                AcademicSession.id == academic_session_id,
                AcademicSession.school_id == school_id,
            )
        )
        session = session_result.scalar_one_or_none()

        if not session:
            raise HTTPException(
                status_code=404,
                detail="Academic session not found for this school.",
            )

        term_result = await self.db.execute(
            select(Term).where(
                Term.id == term_id,
                Term.school_id == school_id,
                Term.academic_session_id == academic_session_id,
            )
        )
        term = term_result.scalar_one_or_none()

        if not term:
            raise HTTPException(
                status_code=404,
                detail="Term not found for the selected academic session.",
            )

        classroom_result = await self.db.execute(
            select(Classroom).where(
                Classroom.id == classroom_id,
                Classroom.school_id == school_id,
            )
        )
        classroom = classroom_result.scalar_one_or_none()

        if not classroom:
            raise HTTPException(
                status_code=404,
                detail="Class not found for this school.",
            )

        subject_result = await self.db.execute(
            select(Subject).where(
                Subject.id == subject_id,
                Subject.school_id == school_id,
            )
        )
        subject = subject_result.scalar_one_or_none()

        if not subject:
            raise HTTPException(
                status_code=404,
                detail="Subject not found for this school.",
            )

        teacher_result = await self.db.execute(
            select(Teacher).where(
                Teacher.id == teacher_id,
                Teacher.school_id == school_id,
            )
        )
        teacher = teacher_result.scalar_one_or_none()

        if not teacher:
            raise HTTPException(
                status_code=404,
                detail="Teacher not found for this school.",
            )

        return session, term, classroom, subject, teacher

    async def _check_conflicts(
        self,
        *,
        school_id: int,
        academic_session_id: int,
        term_id: int,
        classroom_id: int,
        teacher_id: int,
        day_of_week: str,
        start_time,
        end_time,
        exclude_id: int | None = None,
    ):

        overlap = and_(
            TimetableEntry.start_time < end_time,
            TimetableEntry.end_time > start_time,
        )

        base = [
            TimetableEntry.school_id == school_id,
            TimetableEntry.academic_session_id
            == academic_session_id,
            TimetableEntry.term_id == term_id,
            TimetableEntry.day_of_week == day_of_week,
            TimetableEntry.is_active.is_(True),
            overlap,
        ]

        if exclude_id is not None:
            base.append(TimetableEntry.id != exclude_id)

        class_result = await self.db.execute(
            select(TimetableEntry).where(
                *base,
                TimetableEntry.classroom_id == classroom_id,
            )
        )
        class_conflict = class_result.scalar_one_or_none()

        if class_conflict:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Class timetable conflict: this class already has "
                    "a lesson during the selected time."
                ),
            )

        teacher_result = await self.db.execute(
            select(TimetableEntry).where(
                *base,
                TimetableEntry.teacher_id == teacher_id,
            )
        )
        teacher_conflict = teacher_result.scalar_one_or_none()

        if teacher_conflict:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Teacher timetable conflict: this teacher already "
                    "has a lesson during the selected time."
                ),
            )

    # ---------------------------------------------------------
    # DISPLAY
    # ---------------------------------------------------------

    async def _list_query(
        self,
        *,
        school_id: int | None = None,
        session_id: int | None = None,
        term_id: int | None = None,
        classroom_id: int | None = None,
        teacher_id: int | None = None,
        day_of_week: str | None = None,
    ):

        stmt = (
            select(
                TimetableEntry,
                AcademicSession.name,
                Term.name,
                Classroom.name,
                Subject.name,
                Teacher.first_name,
                Teacher.last_name,
            )
            .join(
                AcademicSession,
                AcademicSession.id
                == TimetableEntry.academic_session_id,
            )
            .join(
                Term,
                Term.id == TimetableEntry.term_id,
            )
            .join(
                Classroom,
                Classroom.id == TimetableEntry.classroom_id,
            )
            .join(
                Subject,
                Subject.id == TimetableEntry.subject_id,
            )
            .join(
                Teacher,
                Teacher.id == TimetableEntry.teacher_id,
            )
            .where(
                TimetableEntry.is_active.is_(True)
            )
            .order_by(
                TimetableEntry.day_of_week,
                TimetableEntry.start_time,
                Classroom.name,
            )
        )

        if school_id is not None:
            stmt = stmt.where(
                TimetableEntry.school_id == school_id
            )

        if session_id is not None:
            stmt = stmt.where(
                TimetableEntry.academic_session_id == session_id
            )

        if term_id is not None:
            stmt = stmt.where(
                TimetableEntry.term_id == term_id
            )

        if classroom_id is not None:
            stmt = stmt.where(
                TimetableEntry.classroom_id == classroom_id
            )

        if teacher_id is not None:
            stmt = stmt.where(
                TimetableEntry.teacher_id == teacher_id
            )

        if day_of_week:
            stmt = stmt.where(
                TimetableEntry.day_of_week == day_of_week
            )

        result = await self.db.execute(stmt)

        rows = result.all()

        return [
            {
                "id": entry.id,
                "school_id": entry.school_id,
                "academic_session_id": entry.academic_session_id,
                "academic_session_name": session_name,
                "term_id": entry.term_id,
                "term_name": term_name,
                "classroom_id": entry.classroom_id,
                "classroom_name": classroom_name,
                "subject_id": entry.subject_id,
                "subject_name": subject_name,
                "teacher_id": entry.teacher_id,
                "teacher_name": (
                    f"{first_name} {last_name}"
                ).strip(),
                "day_of_week": entry.day_of_week,
                "start_time": entry.start_time,
                "end_time": entry.end_time,
                "is_active": entry.is_active,
            }
            for (
                entry,
                session_name,
                term_name,
                classroom_name,
                subject_name,
                first_name,
                last_name,
            ) in rows
        ]

    # ---------------------------------------------------------
    # ADMIN
    # ---------------------------------------------------------

    async def list_timetable(
        self,
        current_user,
        school_id: int | None = None,
        session_id: int | None = None,
        term_id: int | None = None,
        classroom_id: int | None = None,
        teacher_id: int | None = None,
        day_of_week: str | None = None,
    ):

        self._require_admin(current_user)

        target_school_id = self._target_school(
            current_user,
            school_id,
        )

        if (
            current_user.role.name != "SUPER_ADMIN"
            and target_school_id != current_user.school_id
        ):
            raise HTTPException(
                status_code=403,
                detail="You cannot access another school's timetable.",
            )

        return await self._list_query(
            school_id=target_school_id,
            session_id=session_id,
            term_id=term_id,
            classroom_id=classroom_id,
            teacher_id=teacher_id,
            day_of_week=day_of_week,
        )

    async def create_timetable(
        self,
        payload: TimetableCreateRequest,
        current_user,
    ):

        self._require_admin(current_user)

        target_school_id = self._target_school(
            current_user,
            payload.school_id,
        )

        if target_school_id is None:
            raise HTTPException(
                status_code=400,
                detail="school_id is required.",
            )

        if payload.start_time >= payload.end_time:
            raise HTTPException(
                status_code=400,
                detail="End time must be later than start time.",
            )

        day = payload.day_of_week.upper().strip()

        if day not in DAYS:
            raise HTTPException(
                status_code=400,
                detail="Invalid day of week.",
            )

        await self._validate_references(
            school_id=target_school_id,
            academic_session_id=payload.academic_session_id,
            term_id=payload.term_id,
            classroom_id=payload.classroom_id,
            subject_id=payload.subject_id,
            teacher_id=payload.teacher_id,
        )

        await self._check_conflicts(
            school_id=target_school_id,
            academic_session_id=payload.academic_session_id,
            term_id=payload.term_id,
            classroom_id=payload.classroom_id,
            teacher_id=payload.teacher_id,
            day_of_week=day,
            start_time=payload.start_time,
            end_time=payload.end_time,
        )

        entry = TimetableEntry(
            school_id=target_school_id,
            academic_session_id=payload.academic_session_id,
            term_id=payload.term_id,
            classroom_id=payload.classroom_id,
            subject_id=payload.subject_id,
            teacher_id=payload.teacher_id,
            day_of_week=day,
            start_time=payload.start_time,
            end_time=payload.end_time,
            is_active=True,
        )

        await self.repository.create(entry)

        rows = await self._list_query(
            school_id=target_school_id,
        )

        return next(
            item for item in rows if item["id"] == entry.id
        )

    async def update_timetable(
        self,
        entry_id: int,
        payload: TimetableUpdateRequest,
        current_user,
    ):

        self._require_admin(current_user)

        target_school_id = current_user.school_id

        if current_user.role.name == "SUPER_ADMIN":
            existing_any = await self.repository.get_by_id(
                entry_id
            )
        else:
            existing_any = await self.repository.get_by_id(
                entry_id,
                target_school_id,
            )

        if not existing_any:
            raise HTTPException(
                status_code=404,
                detail="Timetable entry not found.",
            )

        if payload.start_time >= payload.end_time:
            raise HTTPException(
                status_code=400,
                detail="End time must be later than start time.",
            )

        day = payload.day_of_week.upper().strip()

        if day not in DAYS:
            raise HTTPException(
                status_code=400,
                detail="Invalid day of week.",
            )

        await self._validate_references(
            school_id=existing_any.school_id,
            academic_session_id=payload.academic_session_id,
            term_id=payload.term_id,
            classroom_id=payload.classroom_id,
            subject_id=payload.subject_id,
            teacher_id=payload.teacher_id,
        )

        await self._check_conflicts(
            school_id=existing_any.school_id,
            academic_session_id=payload.academic_session_id,
            term_id=payload.term_id,
            classroom_id=payload.classroom_id,
            teacher_id=payload.teacher_id,
            day_of_week=day,
            start_time=payload.start_time,
            end_time=payload.end_time,
            exclude_id=entry_id,
        )

        existing_any.academic_session_id = (
            payload.academic_session_id
        )
        existing_any.term_id = payload.term_id
        existing_any.classroom_id = payload.classroom_id
        existing_any.subject_id = payload.subject_id
        existing_any.teacher_id = payload.teacher_id
        existing_any.day_of_week = day
        existing_any.start_time = payload.start_time
        existing_any.end_time = payload.end_time

        await self.repository.update(existing_any)

        rows = await self._list_query(
            school_id=existing_any.school_id
        )

        return next(
            item for item in rows if item["id"] == entry_id
        )

    async def delete_timetable(
        self,
        entry_id: int,
        current_user,
    ):

        self._require_admin(current_user)

        school_id = (
            None
            if current_user.role.name == "SUPER_ADMIN"
            else current_user.school_id
        )

        entry = await self.repository.get_by_id(
            entry_id,
            school_id,
        )

        if not entry:
            raise HTTPException(
                status_code=404,
                detail="Timetable entry not found.",
            )

        await self.repository.deactivate(entry)

        return {
            "message": "Timetable entry removed successfully."
        }

    async def get_timetable_entry(
        self,
        entry_id: int,
        current_user,
    ):

        school_id = (
            None
            if current_user.role.name == "SUPER_ADMIN"
            else current_user.school_id
        )

        entry = await self.repository.get_by_id(
            entry_id,
            school_id,
        )

        if not entry:
            raise HTTPException(
                status_code=404,
                detail="Timetable entry not found.",
            )

        rows = await self._list_query(
            school_id=entry.school_id
        )

        return next(
            item for item in rows if item["id"] == entry.id
        )

    # ---------------------------------------------------------
    # CURRENT SESSION / TERM
    # ---------------------------------------------------------

    async def _current_filters(
        self,
        school_id: int,
    ):

        session_result = await self.db.execute(
            select(AcademicSession.id).where(
                AcademicSession.school_id == school_id,
                AcademicSession.is_current.is_(True),
            )
        )

        session_id = session_result.scalar_one_or_none()

        if not session_id:
            return None, None

        term_result = await self.db.execute(
            select(Term.id).where(
                Term.school_id == school_id,
                Term.academic_session_id == session_id,
                Term.is_current.is_(True),
            )
        )

        term_id = term_result.scalar_one_or_none()

        return session_id, term_id

    # ---------------------------------------------------------
    # STUDENT
    # ---------------------------------------------------------

    async def student_timetable(
        self,
        current_user,
        day_of_week: str | None = None,
    ):

        if current_user.role.name != "STUDENT":
            raise HTTPException(
                status_code=403,
                detail="Student timetable access required.",
            )

        student_result = await self.db.execute(
            select(Student).where(
                Student.user_id == current_user.id,
                Student.school_id == current_user.school_id,
            )
        )

        student = student_result.scalar_one_or_none()

        if not student:
            raise HTTPException(
                status_code=404,
                detail="Student profile not found.",
            )

        if not student.classroom_id:
            return []

        session_id, term_id = await self._current_filters(
            current_user.school_id
        )

        return await self._list_query(
            school_id=current_user.school_id,
            session_id=session_id,
            term_id=term_id,
            classroom_id=student.classroom_id,
            day_of_week=(
                day_of_week.upper()
                if day_of_week
                else None
            ),
        )

    # ---------------------------------------------------------
    # TEACHER
    # ---------------------------------------------------------

    async def teacher_timetable(
        self,
        current_user,
        day_of_week: str | None = None,
    ):

        if current_user.role.name != "TEACHER":
            raise HTTPException(
                status_code=403,
                detail="Teacher timetable access required.",
            )

        teacher_result = await self.db.execute(
            select(Teacher).where(
                Teacher.user_id == current_user.id,
                Teacher.school_id == current_user.school_id,
            )
        )

        teacher = teacher_result.scalar_one_or_none()

        if not teacher:
            raise HTTPException(
                status_code=404,
                detail="Teacher profile not found.",
            )

        session_id, term_id = await self._current_filters(
            current_user.school_id
        )

        return await self._list_query(
            school_id=current_user.school_id,
            session_id=session_id,
            term_id=term_id,
            teacher_id=teacher.id,
            day_of_week=(
                day_of_week.upper()
                if day_of_week
                else None
            ),
        )

    # ---------------------------------------------------------
    # PARENT
    # ---------------------------------------------------------

    async def parent_timetable(
        self,
        current_user,
        student_id: int | None = None,
        day_of_week: str | None = None,
    ):

        if current_user.role.name != "PARENT":
            raise HTTPException(
                status_code=403,
                detail="Parent timetable access required.",
            )

        parent_result = await self.db.execute(
            select(Parent).where(
                Parent.user_id == current_user.id
            )
        )

        parent = parent_result.scalar_one_or_none()

        if not parent:
            raise HTTPException(
                status_code=404,
                detail="Parent profile not found.",
            )

        link_stmt = (
            select(Student)
            .join(
                ParentStudent,
                ParentStudent.student_id == Student.id,
            )
            .where(
                ParentStudent.parent_id == parent.id,
                Student.school_id == current_user.school_id,
            )
        )

        if student_id is not None:
            link_stmt = link_stmt.where(
                Student.id == student_id
            )

        linked_result = await self.db.execute(link_stmt)
        students = linked_result.scalars().all()

        if not students:
            raise HTTPException(
                status_code=403,
                detail="You are not linked to this student.",
            )

        session_id, term_id = await self._current_filters(
            current_user.school_id
        )

        classroom_ids = {
            student.classroom_id
            for student in students
            if student.classroom_id is not None
        }

        if not classroom_ids:
            return []

        query = await self._list_query(
            school_id=current_user.school_id,
            session_id=session_id,
            term_id=term_id,
            day_of_week=(
                day_of_week.upper()
                if day_of_week
                else None
            ),
        )

        return [
            row
            for row in query
            if row["classroom_id"] in classroom_ids
        ]
