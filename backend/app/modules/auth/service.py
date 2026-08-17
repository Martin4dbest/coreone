from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.jwt import create_access_token, create_password_reset_token
from app.modules.auth.security import (
    verify_password,
    hash_password,
)

from app.modules.auth.exceptions import InvalidCredentialsException
from app.core.tenant.context import TenantContext

from app.modules.auth.repository import AuthRepository
from app.modules.auth.email_service import send_password_reset_email
from app.modules.schools.repository import SchoolRepository
from app.models.student import Student
from app.models.teacher import Teacher
from app.models.parent import Parent
from app.models.staff import Staff
from app.modules.audit_logs.service import AuditLogService
from app.modules.audit_logs.schemas import AuditLogCreateRequest


class AuthService:

    def __init__(self, db: AsyncSession):
        self.repository = AuthRepository(db)

    async def _record_login_audit(
        self,
        user,
        school_name: str,
    ):
        """
        Record a successful login without ever allowing
        audit logging to break authentication.

        This intentionally runs only after authentication
        and tenant validation have succeeded.
        """

        try:
            # Find the user's display name from the profile
            # associated with this account.
            name = None

            profile_checks = (
                (Student, "first_name", "last_name", "middle_name"),
                (Teacher, "first_name", "last_name", None),
                (Parent, "first_name", "last_name", None),
                (Staff, "first_name", "last_name", None),
            )

            for model, first_field, last_field, middle_field in profile_checks:
                result = await self.repository.db.execute(
                    select(model).where(
                        model.user_id == user.id
                    )
                )

                profile = result.scalar_one_or_none()

                if profile is not None:
                    first_name = getattr(profile, first_field, "") or ""
                    last_name = getattr(profile, last_field, "") or ""

                    parts = [first_name]

                    if middle_field:
                        middle_name = getattr(profile, middle_field, "") or ""
                        if middle_name:
                            parts.append(middle_name)

                    if last_name:
                        parts.append(last_name)

                    name = " ".join(
                        part.strip()
                        for part in parts
                        if part and part.strip()
                    ).strip()

                    break

            # Safe fallback for accounts that do not have
            # a linked profile.
            if not name:
                name = user.email

            role_name = (
                user.role.name
                if user.role is not None
                else "Unknown"
            )

            description = (
                f"{name} logged in — "
                f"School: {school_name} — "
                f"Role: {role_name}"
            )

            payload = AuditLogCreateRequest(
                school_id=user.school_id,
                user_id=user.id,
                action="login",
                entity="User",
                entity_id=user.id,
                description=description,
            )

            await AuditLogService(
                self.repository.db
            ).create_log(payload)

        except Exception as exc:
            # Audit logging must NEVER prevent a valid user
            # from logging in.
            print(
                "WARNING: Login audit logging failed:",
                repr(exc),
            )

            try:
                await self.repository.db.rollback()
            except Exception:
                pass

    async def login(
        self,
        email: str,
        password: str,
        tenant: TenantContext,
    ):
        user = await self.repository.get_user_by_email(
            email=email,
        )

        if user is None:
            raise InvalidCredentialsException()

        if not verify_password(
            password,
            user.hashed_password,
        ):
            raise InvalidCredentialsException()

        #
        # Tenant access enforcement
        #
        if (
            tenant.resolved
            and tenant.school_id is not None
        ):
            #
            # Only non-super admins are restricted
            # to their tenant school.
            #
            if (
                user.role
                and user.role.name != "SUPER_ADMIN"
                and user.school_id != tenant.school_id
            ):
                raise InvalidCredentialsException()

        access_token = create_access_token(
            {
                "sub": str(user.id),
                "school_id": user.school_id,
                "role_id": user.role_id,
            }
        )

        # Record only after authentication and tenant checks
        # have completely succeeded.
        school_repository = SchoolRepository(
            self.repository.db
        )

        school = await school_repository.get_by_id(
            user.school_id
        )

        school_name = (
            school.name
            if school is not None
            else f"School #{user.school_id}"
        )

        await self._record_login_audit(
            user,
            school_name,
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
        }



    async def create_password_reset(
        self,
        email: str,
    ) -> str | None:

        user = await self.repository.get_user_by_email(email)

        if user is None:
            return None

        reset_token = create_password_reset_token(user.id)

        send_password_reset_email(
            user.email,
            reset_token,
        )

        return reset_token


    async def mobile_login(
        self,
        school_code: str,
        email: str,
        password: str,
    ):
        # Normalize credentials before authentication.
        normalized_school_code = school_code.strip().upper()
        normalized_email = email.strip().lower()

        print("=" * 70)
        print("COREONE MOBILE LOGIN")
        print("EMAIL:", normalized_email)
        print("SCHOOL CODE:", normalized_school_code)
        print("=" * 70)

        school_repository = SchoolRepository(
            self.repository.db
        )

        school = await school_repository.get_by_code(
            normalized_school_code
        )

        if school is None:
            print("AUTH RESULT: SCHOOL NOT FOUND")
            raise InvalidCredentialsException()

        print(
            "SCHOOL FOUND:",
            school.id,
            "|",
            school.name,
            "| CODE:",
            school.school_code,
        )

        user = await self.repository.get_user_by_email(
            email=normalized_email,
            school_id=school.id,
        )

        if user is None:
            print(
                "AUTH RESULT: USER NOT FOUND FOR SCHOOL",
                school.id,
            )
            raise InvalidCredentialsException()

        print(
            "USER FOUND:",
            user.id,
            "| EMAIL:",
            user.email,
            "| SCHOOL:",
            user.school_id,
            "| ROLE:",
            user.role.name if user.role else "NO_ROLE",
        )

        password_valid = verify_password(
            password,
            user.hashed_password,
        )

        print("PASSWORD VALID:", password_valid)

        if not password_valid:
            print("AUTH RESULT: PASSWORD VERIFICATION FAILED")
            raise InvalidCredentialsException()

        access_token = create_access_token(
            {
                "sub": str(user.id),
                "school_id": user.school_id,
                "role_id": user.role_id,
            }
        )

        await self._record_login_audit(
            user,
            school.name,
        )

        print("AUTH RESULT: SUCCESS")

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "role": user.role.name,
                "school_id": user.school_id,
                "must_change_password": user.must_change_password,
            },
            "tenant": {
                "id": school.id,
                "name": school.name,
                "school_code": school.school_code,
            },
        }

    async def change_password(
        self,
        user,
        current_password: str,
        new_password: str,
    ):

        if not verify_password(
            current_password,
            user.hashed_password,
        ):
            raise InvalidCredentialsException()


        user.hashed_password = hash_password(
            new_password
        )

        user.must_change_password = False


        await self.repository.db.commit()

        await self.repository.db.refresh(
            user
        )


        return {
            "message": "Password changed successfully.",
            "must_change_password": False,
        }