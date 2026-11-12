from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import delete, func, select

from app.models.classroom import Classroom
from app.models.timetable_entry import TimetableEntry
from app.models.timetable_publication import (
    TimetablePublication,
    TimetablePublicationClass,
)
from app.modules.timetable.schemas import TimetablePublicationRequest
from app.modules.timetable.service import TimetableService


class TimetablePublicationService(TimetableService):

    async def _publication_response(self, publication):
        result = await self.db.execute(
            select(TimetablePublicationClass.classroom_id).where(
                TimetablePublicationClass.publication_id == publication.id,
                TimetablePublicationClass.school_id == publication.school_id,
            )
        )

        return {
            "id": publication.id,
            "school_id": publication.school_id,
            "academic_session_id": publication.academic_session_id,
            "term_id": publication.term_id,
            "publish_all_classes": publication.publish_all_classes,
            "classroom_ids": list(result.scalars().all()),
            "published_at": publication.published_at,
            "published_by": publication.published_by,
        }

    async def _get_publication(
        self,
        school_id: int,
        session_id: int,
        term_id: int,
    ):
        result = await self.db.execute(
            select(TimetablePublication).where(
                TimetablePublication.school_id == school_id,
                TimetablePublication.academic_session_id == session_id,
                TimetablePublication.term_id == term_id,
            )
        )
        return result.scalar_one_or_none()

    async def publish_timetable(
        self,
        payload: TimetablePublicationRequest,
        current_user,
    ):
        self._require_admin(current_user)

        school_id = self._target_school(
            current_user,
            payload.school_id,
        )

        if school_id is None:
            raise HTTPException(
                status_code=400,
                detail="school_id is required for a Super Admin.",
            )

        session_result = await self.db.execute(
            select(TimetableEntry.id).where(
                TimetableEntry.school_id == school_id,
                TimetableEntry.academic_session_id
                == payload.academic_session_id,
            ).limit(1)
        )

        # Validate the session independently of timetable entries.
        from app.models.academic_session import AcademicSession
        from app.models.term import Term

        academic_session = await self.db.execute(
            select(AcademicSession).where(
                AcademicSession.id == payload.academic_session_id,
                AcademicSession.school_id == school_id,
            )
        )

        if not academic_session.scalar_one_or_none():
            raise HTTPException(
                status_code=404,
                detail="Academic session not found for this school.",
            )

        term_result = await self.db.execute(
            select(Term).where(
                Term.id == payload.term_id,
                Term.school_id == school_id,
                Term.academic_session_id == payload.academic_session_id,
            )
        )

        if not term_result.scalar_one_or_none():
            raise HTTPException(
                status_code=404,
                detail="Term not found for the selected academic session.",
            )

        classroom_ids = list(dict.fromkeys(payload.classroom_ids))

        if payload.publish_all_classes and classroom_ids:
            raise HTTPException(
                status_code=400,
                detail="Do not select individual classes when publishing all classes.",
            )

        if not payload.publish_all_classes and not classroom_ids:
            raise HTTPException(
                status_code=400,
                detail="Select at least one class or publish all classes.",
            )

        if payload.publish_all_classes:
            count_result = await self.db.execute(
                select(func.count(TimetableEntry.id)).where(
                    TimetableEntry.school_id == school_id,
                    TimetableEntry.academic_session_id
                    == payload.academic_session_id,
                    TimetableEntry.term_id == payload.term_id,
                    TimetableEntry.is_active.is_(True),
                )
            )

            if count_result.scalar_one() == 0:
                raise HTTPException(
                    status_code=400,
                    detail="There are no active timetable entries to publish.",
                )

        else:
            classes_result = await self.db.execute(
                select(Classroom.id).where(
                    Classroom.school_id == school_id,
                    Classroom.id.in_(classroom_ids),
                )
            )

            valid_classroom_ids = set(classes_result.scalars().all())

            if valid_classroom_ids != set(classroom_ids):
                raise HTTPException(
                    status_code=404,
                    detail="One or more selected classes do not belong to this school.",
                )

            entries_result = await self.db.execute(
                select(TimetableEntry.classroom_id).where(
                    TimetableEntry.school_id == school_id,
                    TimetableEntry.academic_session_id
                    == payload.academic_session_id,
                    TimetableEntry.term_id == payload.term_id,
                    TimetableEntry.classroom_id.in_(classroom_ids),
                    TimetableEntry.is_active.is_(True),
                ).distinct()
            )

            classes_with_entries = set(entries_result.scalars().all())

            if classes_with_entries != set(classroom_ids):
                raise HTTPException(
                    status_code=400,
                    detail="Every selected class must have at least one active timetable entry.",
                )

        publication = await self._get_publication(
            school_id,
            payload.academic_session_id,
            payload.term_id,
        )

        if publication is None:
            publication = TimetablePublication(
                school_id=school_id,
                academic_session_id=payload.academic_session_id,
                term_id=payload.term_id,
            )
            self.db.add(publication)
            await self.db.flush()

        publication.publish_all_classes = payload.publish_all_classes
        publication.published_at = datetime.now(timezone.utc)
        publication.published_by = current_user.id

        await self.db.execute(
            delete(TimetablePublicationClass).where(
                TimetablePublicationClass.publication_id == publication.id,
                TimetablePublicationClass.school_id == school_id,
            )
        )

        if not payload.publish_all_classes:
            for classroom_id in classroom_ids:
                self.db.add(
                    TimetablePublicationClass(
                        school_id=school_id,
                        publication_id=publication.id,
                        classroom_id=classroom_id,
                    )
                )

        await self.db.commit()
        await self.db.refresh(publication)

        return await self._publication_response(publication)

    async def get_publication(
        self,
        current_user,
        session_id: int,
        term_id: int,
        school_id: int | None = None,
    ):
        self._require_admin(current_user)

        target_school_id = self._target_school(
            current_user,
            school_id,
        )

        if target_school_id is None:
            raise HTTPException(
                status_code=400,
                detail="school_id is required for a Super Admin.",
            )

        publication = await self._get_publication(
            target_school_id,
            session_id,
            term_id,
        )

        if publication is None:
            raise HTTPException(
                status_code=404,
                detail="No timetable publication exists for this session and term.",
            )

        return await self._publication_response(publication)

    async def withdraw_publication(
        self,
        current_user,
        session_id: int,
        term_id: int,
        school_id: int | None = None,
    ):
        self._require_admin(current_user)

        target_school_id = self._target_school(
            current_user,
            school_id,
        )

        if target_school_id is None:
            raise HTTPException(
                status_code=400,
                detail="school_id is required for a Super Admin.",
            )

        publication = await self._get_publication(
            target_school_id,
            session_id,
            term_id,
        )

        if publication is None:
            raise HTTPException(
                status_code=404,
                detail="Timetable publication not found.",
            )

        publication.published_at = None
        publication.published_by = current_user.id

        await self.db.commit()

        return {
            "message": "Timetable publication withdrawn successfully."
        }

    async def _filter_published_rows(
        self,
        rows,
        school_id: int,
    ):
        if not rows:
            return []

        result = await self.db.execute(
            select(TimetablePublication).where(
                TimetablePublication.school_id == school_id,
                TimetablePublication.published_at.is_not(None),
            )
        )

        publications = result.scalars().all()

        if not publications:
            return []

        publication_ids = [item.id for item in publications]

        class_result = await self.db.execute(
            select(
                TimetablePublicationClass.publication_id,
                TimetablePublicationClass.classroom_id,
            ).where(
                TimetablePublicationClass.school_id == school_id,
                TimetablePublicationClass.publication_id.in_(
                    publication_ids
                ),
            )
        )

        class_scopes = {}

        for publication_id, classroom_id in class_result.all():
            class_scopes.setdefault(publication_id, set()).add(
                classroom_id
            )

        scopes = {}

        for publication in publications:
            scopes[
                (
                    publication.academic_session_id,
                    publication.term_id,
                )
            ] = (
                publication.publish_all_classes,
                class_scopes.get(publication.id, set()),
            )

        visible = []

        for row in rows:
            scope = scopes.get(
                (
                    row["academic_session_id"],
                    row["term_id"],
                )
            )

            if scope is None:
                continue

            publish_all, classroom_ids = scope

            if publish_all or row["classroom_id"] in classroom_ids:
                visible.append(row)

        return visible

    async def student_timetable(
        self,
        current_user,
        day_of_week: str | None = None,
    ):
        rows = await super().student_timetable(
            current_user,
            day_of_week,
        )

        return await self._filter_published_rows(
            rows,
            current_user.school_id,
        )

    async def teacher_timetable(
        self,
        current_user,
        day_of_week: str | None = None,
    ):
        rows = await super().teacher_timetable(
            current_user,
            day_of_week,
        )

        return await self._filter_published_rows(
            rows,
            current_user.school_id,
        )

    async def parent_timetable(
        self,
        current_user,
        student_id: int | None = None,
        day_of_week: str | None = None,
    ):
        rows = await super().parent_timetable(
            current_user,
            student_id,
            day_of_week,
        )

        return await self._filter_published_rows(
            rows,
            current_user.school_id,
        )

    async def get_timetable_entry(
        self,
        entry_id: int,
        current_user,
    ):
        role = current_user.role.name

        if role in self.ADMIN_ROLES:
            return await super().get_timetable_entry(
                entry_id,
                current_user,
            )

        if role == "STUDENT":
            rows = await self.student_timetable(current_user)
        elif role == "TEACHER":
            rows = await self.teacher_timetable(current_user)
        elif role == "PARENT":
            rows = await self.parent_timetable(current_user)
        else:
            raise HTTPException(
                status_code=403,
                detail="You are not authorised to view this timetable entry.",
            )

        entry = next(
            (row for row in rows if row["id"] == entry_id),
            None,
        )

        if entry is None:
            raise HTTPException(
                status_code=404,
                detail="Published timetable entry not found.",
            )

        return entry


TimetablePublicationService.ADMIN_ROLES = {
    "SUPER_ADMIN",
    "SCHOOL_ADMIN",
}
