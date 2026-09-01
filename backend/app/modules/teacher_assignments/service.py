from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.school_access import check_school_access

from app.models.teacher_subject import TeacherSubject
from app.models.teacher import Teacher
from app.models.classroom import Classroom
from app.models.subject import Subject

from app.modules.teacher_assignments.repository import (
    TeacherAssignmentRepository,
)

from app.modules.teacher_assignments.schemas import (
    TeacherSubjectCreate,
    TeacherSubjectUpdate,
)


class TeacherAssignmentService:

    def __init__(
        self,
        db: AsyncSession,
    ):
        self.db = db

        self.repository = TeacherAssignmentRepository(
            db
        )


    async def assign_subject_teacher(
        self,
        data: TeacherSubjectCreate,
        current_user,
    ):

        # ---------------------------------
        # SCHOOL ACCESS CONTROL
        # ---------------------------------

        check_school_access(
            current_user,
            data.school_id,
        )

        target_school_id = data.school_id


        # ---------------------------------
        # Validate teacher
        # ---------------------------------

        teacher = await self.db.get(
            Teacher,
            data.teacher_id,
        )

        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Teacher not found.",
            )


        if teacher.school_id != target_school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Teacher does not belong to this school.",
            )


        # ---------------------------------
        # Validate classroom
        # ---------------------------------

        classroom = await self.db.get(
            Classroom,
            data.classroom_id,
        )

        if not classroom:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Classroom not found.",
            )


        if classroom.school_id != target_school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Classroom does not belong to this school.",
            )


        # ---------------------------------
        # Validate subject
        # ---------------------------------

        subject = await self.db.get(
            Subject,
            data.subject_id,
        )

        if not subject:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subject not found.",
            )


        if subject.school_id != target_school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Subject does not belong to this school.",
            )


        # ---------------------------------
        # COREONE RULE:
        # Only ONE active teacher can teach
        # the same subject in the same class
        # for the same academic session.
        # ---------------------------------

        conflict_query = await self.db.execute(
            select(TeacherSubject).where(
                TeacherSubject.school_id == target_school_id,
                TeacherSubject.classroom_id == data.classroom_id,
                TeacherSubject.subject_id == data.subject_id,
                TeacherSubject.academic_session_id == data.academic_session_id,
                TeacherSubject.is_active == True,
            )
        )

        active_conflict = conflict_query.scalars().first()

        if active_conflict and active_conflict.teacher_id != data.teacher_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This subject is already assigned to another teacher in this class for this academic session.",
            )


        # ---------------------------------
        # Prevent duplicates
        # ---------------------------------

        existing = await self.repository.get_existing_assignment(
            school_id=target_school_id,
            teacher_id=data.teacher_id,
            classroom_id=data.classroom_id,
            subject_id=data.subject_id,
            academic_session_id=data.academic_session_id,
        )


        if existing:

            if existing.is_active:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Teacher is already assigned to this subject.",
                )

            # Reactivate old assignment
            existing.is_active = True
            existing.assigned_by = current_user.id
            existing.assigned_at = datetime.utcnow()

            await self.db.flush()

            return existing



        # ---------------------------------
        # Create assignment
        # ---------------------------------

        assignment = TeacherSubject(
            school_id=target_school_id,

            teacher_id=data.teacher_id,
            classroom_id=data.classroom_id,
            subject_id=data.subject_id,

            academic_session_id=data.academic_session_id,

            assigned_by=current_user.id,
            assigned_at=datetime.utcnow(),

            is_active=True,
        )


        return await self.repository.create(
            assignment
        )


    async def get_teacher_assignments(
        self,
        teacher_id: int,
        current_user,
        school_id: int | None = None,
    ):
        # --------------------------------------------------------
        # DETERMINE TARGET SCHOOL
        # --------------------------------------------------------

        if current_user.role.name == "SUPER_ADMIN":
            if not school_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="school_id is required for SUPER_ADMIN.",
                )

            target_school_id = school_id

        else:
            target_school_id = current_user.school_id

        # --------------------------------------------------------
        # COREONE COMPATIBILITY
        #
        # The caller may provide either:
        #   1. Teacher.id
        #   2. User.id belonging to the teacher
        #
        # Always resolve to the canonical Teacher.id before
        # querying TeacherSubject.
        # --------------------------------------------------------

        teacher_query = await self.db.execute(
            select(Teacher).where(
                Teacher.id == teacher_id,
                Teacher.school_id == target_school_id,
            )
        )

        teacher = teacher_query.scalar_one_or_none()

        if teacher is None:
            teacher_query = await self.db.execute(
                select(Teacher).where(
                    Teacher.user_id == teacher_id,
                    Teacher.school_id == target_school_id,
                )
            )

            teacher = teacher_query.scalar_one_or_none()

        if teacher is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Teacher not found.",
            )

        # --------------------------------------------------------
        # TEACHER ROLE SECURITY
        # --------------------------------------------------------

        if current_user.role.name == "TEACHER":
            if current_user.teacher is None:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Teacher profile not found.",
                )

            if current_user.teacher.id != teacher.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only view your own assignments.",
                )

        # --------------------------------------------------------
        # FETCH ASSIGNMENTS USING CANONICAL TEACHER ID
        # --------------------------------------------------------

        return await self.repository.get_teacher_assignments(
            teacher.id,
            target_school_id,
        )


    async def get_class_assignments(
        self,
        classroom_id: int,
        current_user,
        school_id: int | None = None,
    ):

        if current_user.role.name == "SUPER_ADMIN":

            if not school_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="school_id is required for SUPER_ADMIN.",
                )

            target_school_id = school_id

        else:

            target_school_id = current_user.school_id


        classroom = await self.db.get(
            Classroom,
            classroom_id,
        )


        if not classroom:
            raise HTTPException(
                status_code=404,
                detail="Classroom not found.",
            )


        if classroom.school_id != target_school_id:
            raise HTTPException(
                status_code=403,
                detail="Classroom does not belong to this school.",
            )


        return await self.repository.get_class_assignments(
            classroom_id,
            target_school_id,
        )



    async def get_school_assignments(
        self,
        current_user,
        school_id: int | None = None,
    ):


        if current_user.role.name == "SUPER_ADMIN":

            if not school_id:
                raise HTTPException(
                    status_code=400,
                    detail="school_id is required for SUPER_ADMIN.",
                )

            target_school_id = school_id

        else:

            target_school_id = current_user.school_id


        return await self.repository.get_school_assignments(
            target_school_id
        )



    async def deactivate_assignment(
        self,
        assignment_id: int,
        current_user,
    ):


        assignment = await self.db.get(
            TeacherSubject,
            assignment_id,
        )


        if not assignment:
            raise HTTPException(
                status_code=404,
                detail="Assignment not found.",
            )


        if current_user.role.name != "SUPER_ADMIN":

            if assignment.school_id != current_user.school_id:

                raise HTTPException(
                    status_code=403,
                    detail="You cannot modify this assignment.",
                )


        return await self.repository.deactivate_assignment(
            assignment
        )


    
    async def update_assignment(
        self,
        assignment_id: int,
        data: TeacherSubjectUpdate,
        current_user,
    ):

        assignment = await self.db.get(
            TeacherSubject,
            assignment_id,
        )

        if not assignment:
            raise HTTPException(
                status_code=404,
                detail="Assignment not found",
            )

        if current_user.role.name != "SUPER_ADMIN":

            if assignment.school_id != current_user.school_id:
                raise HTTPException(
                    status_code=403,
                    detail="You cannot modify this assignment",
                )

        assignment.classroom_id = data.classroom_id
        assignment.subject_id = data.subject_id
        assignment.academic_session_id = data.academic_session_id

        return await self.repository.update(
            assignment
        )