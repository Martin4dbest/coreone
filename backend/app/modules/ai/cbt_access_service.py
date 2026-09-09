from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_cbt_teacher_access import AICBTTeacherAccess
from app.models.classroom import Classroom
from app.models.teacher import Teacher
from app.models.teacher_subject import TeacherSubject


CODE_TTL_HOURS = 24


def _hash_code(code: str) -> str:
    return hashlib.sha256(
        code.strip().upper().encode("utf-8")
    ).hexdigest()


def _generate_code() -> str:
    raw = secrets.token_hex(5).upper()
    return f"CT-{raw[:5]}-{raw[5:]}"


class AICBTTeacherAccessService:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def _get_teacher_for_user(
        self,
        current_user,
    ) -> Teacher:
        result = await self.db.execute(
            select(Teacher).where(
                Teacher.user_id == current_user.id,
                Teacher.school_id == current_user.school_id,
            )
        )

        teacher = result.scalar_one_or_none()

        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Teacher profile not found.",
            )

        return teacher

    async def generate_code(
        self,
        classroom_id: int,
        target_teacher_id: int,
        current_user,
    ):
        issuer = await self._get_teacher_for_user(
            current_user
        )

        classroom_result = await self.db.execute(
            select(Classroom).where(
                Classroom.id == classroom_id,
                Classroom.school_id == current_user.school_id,
                Classroom.is_active.is_(True),
            )
        )

        classroom = classroom_result.scalar_one_or_none()

        if not classroom:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Classroom not found.",
            )

        if classroom.class_teacher_id != issuer.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Only the class teacher of this class "
                    "can generate AI CBT access codes."
                ),
            )

        target_result = await self.db.execute(
            select(Teacher).where(
                Teacher.id == target_teacher_id,
                Teacher.school_id == current_user.school_id,
            )
        )

        target_teacher = target_result.scalar_one_or_none()

        if not target_teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Selected teacher not found.",
            )

        if target_teacher.id == issuer.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "You are already the class teacher "
                    "and do not need an access code."
                ),
            )

        assignment_result = await self.db.execute(
            select(TeacherSubject).where(
                TeacherSubject.school_id == current_user.school_id,
                TeacherSubject.classroom_id == classroom_id,
                TeacherSubject.teacher_id == target_teacher_id,
                TeacherSubject.is_active.is_(True),
            ).limit(1)
        )

        if not assignment_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "The selected teacher is not assigned "
                    "to this class."
                ),
            )

        # Revoke older active unredeemed codes for this
        # same teacher/class. This ensures the latest code
        # is the only valid invitation.
        existing_result = await self.db.execute(
            select(AICBTTeacherAccess).where(
                AICBTTeacherAccess.school_id
                == current_user.school_id,
                AICBTTeacherAccess.classroom_id
                == classroom_id,
                AICBTTeacherAccess.target_teacher_id
                == target_teacher_id,
                AICBTTeacherAccess.redeemed_at.is_(None),
                AICBTTeacherAccess.revoked_at.is_(None),
            )
        )

        now = datetime.utcnow()

        for existing in existing_result.scalars().all():
            existing.revoked_at = now

        code = _generate_code()
        expires_at = now + timedelta(
            hours=CODE_TTL_HOURS
        )

        access = AICBTTeacherAccess(
            school_id=current_user.school_id,
            classroom_id=classroom_id,
            issued_by_teacher_id=issuer.id,
            target_teacher_id=target_teacher_id,
            code_hash=_hash_code(code),
            expires_at=expires_at,
        )

        self.db.add(access)
        await self.db.commit()

        return {
            "classroom_id": classroom_id,
            "target_teacher_id": target_teacher.id,
            "target_teacher_name": (
                f"{target_teacher.first_name} "
                f"{target_teacher.last_name}"
            ).strip(),
            "code": code,
            "expires_at": expires_at,
        }

    async def redeem_code(
        self,
        code: str,
        current_user,
    ):
        teacher = await self._get_teacher_for_user(
            current_user
        )

        clean_code = code.strip().upper()

        if not clean_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please enter the class teacher passcode.",
            )

        result = await self.db.execute(
            select(AICBTTeacherAccess).where(
                AICBTTeacherAccess.school_id
                == current_user.school_id,
                AICBTTeacherAccess.code_hash
                == _hash_code(clean_code),
            )
        )

        access = result.scalar_one_or_none()

        if not access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid AI CBT access code.",
            )

        if access.revoked_at is not None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This AI CBT access code has been revoked.",
            )

        if access.target_teacher_id != teacher.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "This access code was issued to another teacher."
                ),
            )

        # Codes may only be redeemed once.
        if access.redeemed_at is not None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "This AI CBT access code has already been used."
                ),
            )

        if access.expires_at < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This AI CBT access code has expired.",
            )

        access.redeemed_at = datetime.utcnow()

        await self.db.commit()

        return {
            "allowed": True,
            "message": "AI CBT access granted successfully.",
        }

    async def has_granted_access(
        self,
        current_user,
    ) -> bool:
        teacher = await self._get_teacher_for_user(
            current_user
        )

        result = await self.db.execute(
            select(AICBTTeacherAccess.id).where(
                AICBTTeacherAccess.school_id
                == current_user.school_id,
                AICBTTeacherAccess.target_teacher_id
                == teacher.id,
                AICBTTeacherAccess.redeemed_at.is_not(None),
                AICBTTeacherAccess.revoked_at.is_(None),
            ).limit(1)
        )

        return result.scalar_one_or_none() is not None
