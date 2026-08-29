from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.parent import Parent
from app.models.parent_student import ParentStudent
from app.models.parent_school import ParentSchool
from app.models.role import Role
from app.models.school_branding import SchoolBranding
from app.models.student import Student
from app.models.user import User

from app.modules.auth.security import hash_password
from app.modules.parents.repository import ParentRepository
from app.modules.parents.schemas import (
    ParentAttendanceRecordResponse,
    ParentAttendanceResponse,
    ParentCreateRequest,
    ParentDetailsResponse,
    ParentMeResponse,
    ParentSchoolBrandingResponse,
    ParentSchoolResponse,
    ParentStudentResponse,
)


class ParentService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = ParentRepository(db)

    async def get_parents(
        self,
        current_user,
    ):
        school_id = None

        if current_user.role.name != "SUPER_ADMIN":
            school_id = current_user.school_id

        return await self.repository.get_all(school_id)

    async def get_parent(
        self,
        parent_id: int,
        current_user,
    ):
        school_id = None

        if current_user.role.name != "SUPER_ADMIN":
            school_id = current_user.school_id

        parent = await self.repository.get_by_id(
            parent_id,
            school_id,
        )

        if parent is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent not found",
            )

        return parent

    async def get_parent_details(
        self,
        parent_id: int,
        current_user,
        school_id: int | None = None,
    ):
        # Parent records are school-visible to School Admins and
        # globally visible to the SUPER_ADMIN.
        school_id = None

        if current_user.role.name != "SUPER_ADMIN":
            school_id = current_user.school_id

        parent = await self.repository.get_by_id(
            parent_id,
            school_id,
        )

        if parent is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent not found",
            )

        # Retrieve the account email from the linked User record.
        result = await self.db.execute(
            select(User.email).where(
                User.id == parent.user_id
            )
        )

        email = result.scalar_one_or_none()

        # IMPORTANT:
        # A parent can have children in multiple schools.
        # The relationship table is the source of truth.
        if school_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="School context is required.",
            )

        rows = (
            await self.repository.get_students_for_parent_in_school(
                parent.id,
                school_id,
            )
        )

        students = [
            self._build_student_response(row)
            for row in rows
        ]

        return ParentDetailsResponse(
            id=parent.id,
            user_id=parent.user_id,
            first_name=parent.first_name,
            last_name=parent.last_name,
            phone=parent.phone,
            email=email,
            students=students,
        )

    async def create_parent(
        self,
        payload: ParentCreateRequest,
        current_user,
    ):
        # Parent creation itself remains school-scoped for
        # School Admins. SUPER_ADMIN can create for any school.
        if (
            current_user.role.name != "SUPER_ADMIN"
            and payload.school_id != current_user.school_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot create parents for another school",
            )

        student_ids = list(
            dict.fromkeys(payload.student_ids)
        )

        relationship_type = (
            payload.relationship_type.strip()
            or "Parent/Guardian"
        )

        # --------------------------------------------------------
        # VALIDATE EMAIL
        # --------------------------------------------------------

        result = await self.db.execute(
            select(User).where(
                User.email == payload.email
            )
        )

        existing_user = result.scalar_one_or_none()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists",
            )

        # --------------------------------------------------------
        # VALIDATE STUDENTS BEFORE CREATING USER/PARENT
        # --------------------------------------------------------

        students = []

        if student_ids:
            result = await self.db.execute(
                select(Student).where(
                    Student.id.in_(student_ids)
                )
            )

            students = result.scalars().all()

            found_student_ids = {
                student.id
                for student in students
            }

            missing_student_ids = [
                student_id
                for student_id in student_ids
                if student_id not in found_student_ids
            ]

            if missing_student_ids:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=(
                        "One or more selected students "
                        "could not be found."
                    ),
                )

            # School Admin can only link students from their
            # own school. SUPER_ADMIN can link from any school.
            if current_user.role.name == "SCHOOL_ADMIN":
                wrong_school_students = [
                    student.id
                    for student in students
                    if student.school_id != current_user.school_id
                ]

                if wrong_school_students:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=(
                            "You can only link students "
                            "belonging to your school."
                        ),
                    )

        # --------------------------------------------------------
        # FIND PARENT ROLE
        # --------------------------------------------------------

        result = await self.db.execute(
            select(Role).where(
                Role.name == "PARENT"
            )
        )

        role = result.scalar_one_or_none()

        if role is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="PARENT role is not configured.",
            )

        # --------------------------------------------------------
        # CREATE PARENT ACCOUNT + LINKS IN ONE TRANSACTION
        # --------------------------------------------------------

        try:
            user = User(
                email=payload.email,
                hashed_password=hash_password(
                    payload.password
                ),
                school_id=payload.school_id,
                role_id=role.id,
                is_active=True,
                is_verified=False,
            )

            self.db.add(user)
            await self.db.flush()

            parent = Parent(
                user_id=user.id,
                first_name=payload.first_name,
                last_name=payload.last_name,
                phone=payload.phone,
            )

            self.db.add(parent)
            await self.db.flush()

            # ----------------------------------------------------
            # REGISTER THE PARENT WITH THIS SCHOOL
            #
            # A parent has one global CoreOne account, but must
            # have a ParentSchool membership for every school
            # where the parent has a child.
            # ----------------------------------------------------

            self.db.add(
                ParentSchool(
                    parent_id=parent.id,
                    school_id=payload.school_id,
                )
            )

            for student in students:
                self.db.add(
                    ParentStudent(
                        parent_id=parent.id,
                        student_id=student.id,
                        relationship_type=relationship_type,
                    )
                )

            await self.db.commit()
            await self.db.refresh(parent)

            return parent

        except Exception:
            await self.db.rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unable to create parent account.",
            )

    async def link_student(
        self,
        parent_id: int,
        student_id: int,
        relationship_type: str,
        current_user,
    ):
        if current_user.role.name not in (
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You are not allowed to manage "
                    "parent/student relationships."
                ),
            )

        # IMPORTANT:
        # Do not restrict the parent by its original school.
        # One parent can have children in many schools.
        parent = await self.repository.get_by_id(
            parent_id,
            None,
        )

        if parent is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent not found.",
            )

        result = await self.db.execute(
            select(Student).where(
                Student.id == student_id,
            )
        )

        student = result.scalar_one_or_none()

        if student is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found.",
            )

        # School Admin can only manage students in their school.
        if (
            current_user.role.name == "SCHOOL_ADMIN"
            and student.school_id != current_user.school_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You can only manage parent/student "
                    "relationships for your school."
                ),
            )

        existing = await self.repository.get_student_link(
            parent_id,
            student_id,
        )

        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "This student is already linked "
                    "to this parent."
                ),
            )

        clean_relationship = (
            relationship_type.strip()
            or "Parent/Guardian"
        )

        try:
            self.db.add(
                ParentStudent(
                    parent_id=parent_id,
                    student_id=student_id,
                    relationship_type=clean_relationship,
                )
            )

            await self.db.commit()

            row = await self.repository.get_student_for_parent(
                parent_id,
                student_id,
            )

            if row is None:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=(
                        "Student relationship was created "
                        "but could not be loaded."
                    ),
                )

            return self._build_student_response(row)

        except HTTPException:
            await self.db.rollback()
            raise

        except Exception:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unable to link student to parent.",
            )

    async def link_existing_parent_by_email(
        self,
        email: str,
        student_id: int,
        relationship_type: str,
        current_user,
    ):
        if current_user.role.name not in (
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You are not allowed to manage "
                    "parent/student relationships."
                ),
            )

        parent = await self.repository.get_by_email(email)

        if parent is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No parent account exists with this email.",
            )

        result = await self.db.execute(
            select(Student).where(
                Student.id == student_id
            )
        )

        student = result.scalar_one_or_none()

        if student is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found.",
            )

        # School Admin can only link students from the
        # administrator's own school.
        if (
            current_user.role.name == "SCHOOL_ADMIN"
            and student.school_id != current_user.school_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You can only link students "
                    "belonging to your school."
                ),
            )

        existing = await self.repository.get_student_link(
            parent.id,
            student.id,
        )

        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "This student is already linked "
                    "to this parent."
                ),
            )

        clean_relationship = (
            relationship_type.strip()
            or "Parent/Guardian"
        )

        try:
            # ----------------------------------------------------
            # SCHOOL MEMBERSHIP
            #
            # A parent has one global CoreOne account, but must
            # also be registered with every school where they
            # have a child.
            # ----------------------------------------------------

            membership_result = await self.db.execute(
                select(ParentSchool).where(
                    ParentSchool.parent_id == parent.id,
                    ParentSchool.school_id == student.school_id,
                )
            )

            membership = (
                membership_result.scalar_one_or_none()
            )

            if membership is None:
                self.db.add(
                    ParentSchool(
                        parent_id=parent.id,
                        school_id=student.school_id,
                    )
                )

            # ----------------------------------------------------
            # CHILD RELATIONSHIP
            # ----------------------------------------------------

            self.db.add(
                ParentStudent(
                    parent_id=parent.id,
                    student_id=student.id,
                    relationship_type=clean_relationship,
                )
            )

            await self.db.commit()

            row = await self.repository.get_student_for_parent(
                parent.id,
                student.id,
            )

            if row is None:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=(
                        "Student relationship was created "
                        "but could not be loaded."
                    ),
                )

            return self._build_student_response(row)

        except HTTPException:
            await self.db.rollback()
            raise

        except Exception:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unable to link existing parent to student.",
            )

    async def unlink_student(
        self,
        parent_id: int,
        student_id: int,
        current_user,
    ):
        if current_user.role.name not in (
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You are not allowed to manage "
                    "parent/student relationships."
                ),
            )

        # Parent is global across schools.
        parent = await self.repository.get_by_id(
            parent_id,
            None,
        )

        if parent is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent not found.",
            )

        result = await self.db.execute(
            select(Student).where(
                Student.id == student_id,
            )
        )

        student = result.scalar_one_or_none()

        if student is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found.",
            )

        # School Admin can only manage students in their school.
        if (
            current_user.role.name == "SCHOOL_ADMIN"
            and student.school_id != current_user.school_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You can only manage parent/student "
                    "relationships for your school."
                ),
            )

        link = await self.repository.get_student_link(
            parent_id,
            student_id,
        )

        if link is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent/student relationship not found.",
            )

        try:
            await self.repository.delete_student_link(link)

            return {
                "success": True,
                "message": (
                    "Student unlinked from parent successfully."
                ),
            }

        except Exception:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unable to unlink student from parent.",
            )

    async def get_current_parent(
        self,
        current_user,
    ):
        if current_user.role.name != "PARENT":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Parent access required",
            )

        parent = await self.repository.get_by_user_id(
            current_user.id
        )

        if parent is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent profile not found",
            )

        rows = await self.repository.get_students_for_parent(
            parent.id
        )

        return ParentMeResponse(
            id=parent.id,
            user_id=parent.user_id,
            first_name=parent.first_name,
            last_name=parent.last_name,
            phone=parent.phone,
            students=[
                self._build_student_response(row)
                for row in rows
            ],
        )

    async def get_my_students(
        self,
        current_user,
    ):
        if current_user.role.name != "PARENT":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Parent access required",
            )

        parent = await self.repository.get_by_user_id(
            current_user.id
        )

        if parent is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent profile not found",
            )

        rows = await self.repository.get_students_for_parent(
            parent.id
        )

        return [
            self._build_student_response(row)
            for row in rows
        ]

    async def get_my_student_results(
        self,
        student_id: int,
        current_user,
    ):
        if current_user.role.name != "PARENT":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Parent access required",
            )

        parent = await self.repository.get_by_user_id(
            current_user.id
        )

        if parent is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent profile not found",
            )

        # The child must explicitly belong to this parent.
        link = await self.repository.get_student_link(
            parent.id,
            student_id,
        )

        if link is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student is not linked to this parent",
            )

        result = await self.db.execute(
            select(Student).where(
                Student.id == student_id
            )
        )

        student = result.scalar_one_or_none()

        if student is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found",
            )

        # Reuse the existing report-card engine, but resolve the
        # active school from the CHILD rather than the parent's
        # original account school. This is what permits a parent
        # to have children attending different schools.
        from types import SimpleNamespace

        from app.modules.results.service import ResultService

        report_user = SimpleNamespace(
            id=current_user.id,
            school_id=student.school_id,
            role=SimpleNamespace(
                name="PARENT"
            ),
            teacher=None,
        )

        child_tenant = SimpleNamespace(
            school_id=student.school_id
        )

        return await ResultService(
            self.db
        ).get_student_report(
            student.id,
            report_user,
            child_tenant,
        )

    async def get_my_student_attendance(
        self,
        student_id: int,
        current_user,
    ):
        if current_user.role.name != "PARENT":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Parent access required",
            )

        parent = await self.repository.get_by_user_id(
            current_user.id
        )

        if parent is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent profile not found",
            )

        # The parent may only access students that are
        # explicitly linked to that parent.
        link = await self.repository.get_student_link(
            parent.id,
            student_id,
        )

        if link is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student is not linked to this parent",
            )

        result = await self.db.execute(
            select(Student).where(
                Student.id == student_id
            )
        )

        student = result.scalar_one_or_none()

        if student is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found",
            )

        records = (
            await self.repository.get_attendance_for_student(
                student.id,
                student.school_id,
            )
        )

        total = len(records)

        present_days = sum(
            1
            for record in records
            if record.status in {"present", "late"}
        )

        absent_days = sum(
            1
            for record in records
            if record.status == "absent"
        )

        late_days = sum(
            1
            for record in records
            if record.status == "late"
        )

        excused_days = sum(
            1
            for record in records
            if record.status == "excused"
        )

        percentage = (
            round(
                (present_days / total) * 100,
                2,
            )
            if total
            else 0.0
        )

        response_records = [
            ParentAttendanceRecordResponse(
                attendance_date=(
                    record.attendance_date.isoformat()
                ),
                status=record.status,
                remarks=record.remarks,
            )
            for record in records
        ]

        return ParentAttendanceResponse(
            student_id=student.id,
            attendance_percentage=percentage,
            total_days=total,
            present_days=present_days,
            absent_days=absent_days,
            late_days=late_days,
            excused_days=excused_days,
            records=response_records,
        )

    async def get_my_student(
        self,
        student_id: int,
        current_user,
    ):
        if current_user.role.name != "PARENT":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Parent access required",
            )

        parent = await self.repository.get_by_user_id(
            current_user.id
        )

        if parent is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent profile not found",
            )

        row = await self.repository.get_student_for_parent(
            parent.id,
            student_id,
        )

        if row is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student is not linked to this parent",
            )

        return self._build_student_response(row)

    @staticmethod
    def _build_student_response(row):
        parent_student, student, school, branding, class_name = row

        branding_response = None

        if branding is not None:
            branding_response = ParentSchoolBrandingResponse(
                logo_url=branding.logo_url,
                app_icon_url=branding.app_icon_url,
                splash_image_url=branding.splash_image_url,
                primary_color=branding.primary_color,
                secondary_color=branding.secondary_color,
                accent_color=branding.accent_color,
                motto=branding.motto,
                login_title=branding.login_title,
                login_message=branding.login_message,
            )

        school_response = ParentSchoolResponse(
            id=school.id,
            name=school.name,
            school_code=school.school_code,
            email=school.email,
            phone=school.phone,
            address=school.address,
            city=school.city,
            state=school.state,
            country=school.country,
            logo=school.logo,
            primary_color=school.primary_color,
            secondary_color=school.secondary_color,
            branding=branding_response,
        )

        return ParentStudentResponse(
            id=student.id,
            admission_number=student.admission_number,
            first_name=student.first_name,
            last_name=student.last_name,
            middle_name=student.middle_name,
            gender=student.gender,
            date_of_birth=(
                student.date_of_birth.isoformat()
                if student.date_of_birth is not None
                else None
            ),
            passport=student.passport,
            classroom_id=student.classroom_id,
            class_name=class_name,
            relationship_type=parent_student.relationship_type,
            school=school_response,
        )
