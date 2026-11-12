import csv
import io
from datetime import datetime, time, timedelta
from pathlib import Path

from fastapi import HTTPException
from openpyxl import Workbook, load_workbook
from sqlalchemy import select

from app.models.academic_session import AcademicSession
from app.models.classroom import Classroom
from app.models.subject import Subject
from app.models.teacher import Teacher
from app.models.term import Term
from app.models.timetable_entry import TimetableEntry
from app.modules.timetable.service import TimetableService


HEADERS = [
    "Academic Session",
    "Term",
    "Class",
    "Subject",
    "Teacher",
    "Day",
    "Start Time",
    "End Time",
]

MAX_FILE_SIZE = 5 * 1024 * 1024
MAX_ROWS = 1000
DAYS = {
    "MONDAY", "TUESDAY", "WEDNESDAY",
    "THURSDAY", "FRIDAY", "SATURDAY",
}


def normalize(value):
    return " ".join(str(value or "").strip().casefold().split())


def parse_time(value):
    if isinstance(value, datetime):
        return value.time().replace(second=0, microsecond=0)

    if isinstance(value, time):
        return value.replace(second=0, microsecond=0)

    if isinstance(value, timedelta):
        seconds = int(value.total_seconds()) % 86400
        return time(seconds // 3600, (seconds % 3600) // 60)

    if isinstance(value, (int, float)):
        seconds = int(float(value) * 86400) % 86400
        return time(seconds // 3600, (seconds % 3600) // 60)

    raw = str(value or "").strip()

    for fmt in ("%H:%M", "%H:%M:%S", "%I:%M %p", "%I:%M%p"):
        try:
            return datetime.strptime(raw.upper(), fmt).time()
        except ValueError:
            continue

    raise ValueError("Use a valid time, e.g. 08:00 or 2:30 PM.")


def parse_rows(filename, content):
    extension = Path(filename or "").suffix.lower()

    if extension not in {".xlsx", ".csv"}:
        raise HTTPException(
            status_code=400,
            detail="Upload an Excel (.xlsx) or CSV (.csv) file.",
        )

    try:
        if extension == ".xlsx":
            workbook = load_workbook(
                io.BytesIO(content),
                read_only=True,
                data_only=True,
            )
            sheet = workbook.active
            rows = list(sheet.iter_rows(values_only=True))
            workbook.close()
        else:
            rows = list(csv.reader(
                io.StringIO(content.decode("utf-8-sig"))
            ))
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail="The spreadsheet could not be read. Check the file format.",
        ) from exc

    if not rows:
        raise HTTPException(status_code=400, detail="The spreadsheet is empty.")

    expected = [normalize(value) for value in HEADERS]
    actual = [normalize(value) for value in rows[0]]

    if actual[:len(expected)] != expected:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "The spreadsheet columns do not match the timetable template.",
                "expected_columns": HEADERS,
            },
        )

    data_rows = []

    for number, values in enumerate(rows[1:], start=2):
        if not values or not any(
            value is not None and str(value).strip()
            for value in values
        ):
            continue

        if len(data_rows) >= MAX_ROWS:
            raise HTTPException(
                status_code=400,
                detail=f"A maximum of {MAX_ROWS} timetable rows can be imported at once.",
            )

        data_rows.append((number, list(values[:8])))

    if not data_rows:
        raise HTTPException(
            status_code=400,
            detail="No timetable entries were found below the header row.",
        )

    return data_rows


def build_template():
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Timetable Import"
    sheet.append(HEADERS)
    sheet.freeze_panes = "A2"
    sheet.auto_filter.ref = "A1:H1"

    for index, width in enumerate(
        [22, 18, 18, 24, 26, 16, 16, 16],
        start=1,
    ):
        from openpyxl.utils import get_column_letter
        sheet.column_dimensions[get_column_letter(index)].width = width

    instructions = workbook.create_sheet("Instructions")
    instructions.append(["TIMETABLE IMPORT INSTRUCTIONS"])
    instructions.append(["Complete the Timetable Import sheet."])
    instructions.append(["Use the exact names registered for your school."])
    instructions.append(["Day must be Monday to Saturday."])
    instructions.append(["Use times such as 08:00 or 02:30 PM."])
    instructions.append(["End Time must be later than Start Time."])
    instructions.append(["Do not create overlapping periods for a class or teacher."])
    instructions.append(["Maximum 1,000 timetable entries per upload."])
    instructions.append(["All rows must be valid before the import can be saved."])
    instructions.append(["Importing does not publish the timetable."])

    output = io.BytesIO()
    workbook.save(output)
    output.seek(0)
    return output


class TimetableImportService:

    def __init__(self, db):
        self.db = db
        self.service = TimetableService(db)

    async def _prepare(self, file, current_user, requested_school_id):
        self.service._require_admin(current_user)

        school_id = self.service._target_school(
            current_user,
            requested_school_id,
        )

        if school_id is None:
            raise HTTPException(
                status_code=400,
                detail="A school must be selected.",
            )

        content = await file.read(MAX_FILE_SIZE + 1)

        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="The upload exceeds the 5 MB file limit.",
            )

        rows = parse_rows(file.filename, content)

        session_result = await self.db.execute(
            select(AcademicSession).where(
                AcademicSession.school_id == school_id
            )
        )
        sessions = session_result.scalars().all()

        term_result = await self.db.execute(
            select(Term).where(Term.school_id == school_id)
        )
        terms = term_result.scalars().all()

        class_result = await self.db.execute(
            select(Classroom).where(Classroom.school_id == school_id)
        )
        classrooms = class_result.scalars().all()

        subject_result = await self.db.execute(
            select(Subject).where(Subject.school_id == school_id)
        )
        subjects = subject_result.scalars().all()

        teacher_result = await self.db.execute(
            select(Teacher).where(Teacher.school_id == school_id)
        )
        teachers = teacher_result.scalars().all()

        def unique_match(items, name, label, getter):
            matches = [
                item for item in items
                if normalize(getter(item)) == normalize(name)
            ]

            if not name or not str(name).strip():
                raise ValueError(f"{label} is required.")

            if not matches:
                raise ValueError(
                    f"{label} '{name}' was not found in this school."
                )

            if len(matches) > 1:
                raise ValueError(
                    f"{label} '{name}' is ambiguous. Use a unique name."
                )

            return matches[0]

        def teacher_name(item):
            return f"{item.first_name} {item.last_name}".strip()

        prepared = []
        preview_rows = []
        errors = []
        staged = []

        for row_number, values in rows:
            values += [None] * (8 - len(values))

            try:
                (
                    session_name,
                    term_name,
                    class_name,
                    subject_name,
                    staff_name,
                    day_value,
                    start_value,
                    end_value,
                ) = values

                session = unique_match(
                    sessions, session_name, "Academic Session",
                    lambda item: item.name,
                )
                term = unique_match(
                    [
                        item for item in terms
                        if item.academic_session_id == session.id
                    ],
                    term_name,
                    "Term",
                    lambda item: item.name,
                )
                classroom = unique_match(
                    classrooms, class_name, "Class",
                    lambda item: item.name,
                )
                subject = unique_match(
                    subjects, subject_name, "Subject",
                    lambda item: item.name,
                )
                teacher = unique_match(
                    teachers, staff_name, "Teacher", teacher_name,
                )

                day = str(day_value or "").strip().upper()

                if day not in DAYS:
                    raise ValueError("Day must be Monday to Saturday.")

                start_time = parse_time(start_value)
                end_time = parse_time(end_value)

                if start_time >= end_time:
                    raise ValueError(
                        "End Time must be later than Start Time."
                    )

                item = {
                    "school_id": school_id,
                    "academic_session_id": session.id,
                    "term_id": term.id,
                    "classroom_id": classroom.id,
                    "subject_id": subject.id,
                    "teacher_id": teacher.id,
                    "day_of_week": day,
                    "start_time": start_time,
                    "end_time": end_time,
                }

                await self.service._validate_references(
                    school_id=school_id,
                    academic_session_id=session.id,
                    term_id=term.id,
                    classroom_id=classroom.id,
                    subject_id=subject.id,
                    teacher_id=teacher.id,
                )

                await self.service._check_conflicts(
                    school_id=school_id,
                    academic_session_id=session.id,
                    term_id=term.id,
                    classroom_id=classroom.id,
                    teacher_id=teacher.id,
                    day_of_week=day,
                    start_time=start_time,
                    end_time=end_time,
                )

                for previous in staged:
                    same_period = (
                        previous["academic_session_id"] == session.id
                        and previous["term_id"] == term.id
                        and previous["day_of_week"] == day
                        and previous["start_time"] < end_time
                        and previous["end_time"] > start_time
                    )

                    if same_period and (
                        previous["classroom_id"] == classroom.id
                        or previous["teacher_id"] == teacher.id
                    ):
                        raise ValueError(
                            "This row overlaps another row in the uploaded spreadsheet for the same class or teacher."
                        )

                staged.append(item)
                prepared.append(item)

                preview_rows.append({
                    "row": row_number,
                    "academic_session": session.name,
                    "term": term.name,
                    "class": classroom.name,
                    "subject": subject.name,
                    "teacher": teacher_name(teacher),
                    "day": day.title(),
                    "start_time": start_time.strftime("%H:%M"),
                    "end_time": end_time.strftime("%H:%M"),
                })

            except HTTPException as exc:
                detail = exc.detail
                if isinstance(detail, dict):
                    detail = detail.get("message", str(detail))
                errors.append({
                    "row": row_number,
                    "error": str(detail),
                })

            except Exception as exc:
                errors.append({
                    "row": row_number,
                    "error": str(exc),
                })

        return school_id, prepared, preview_rows, errors

    async def preview_file(
        self,
        file,
        current_user,
        requested_school_id,
    ):
        school_id, prepared, preview_rows, errors = await self._prepare(
            file,
            current_user,
            requested_school_id,
        )

        return {
            "school_id": school_id,
            "valid_rows": len(prepared),
            "invalid_rows": len(errors),
            "can_import": bool(prepared) and not errors,
            "rows": preview_rows,
            "errors": errors,
            "message": (
                "All rows passed validation. Confirm to import."
                if prepared and not errors
                else "Correct the errors before importing. No entries have been saved."
            ),
        }

    async def import_file(
        self,
        file,
        current_user,
        requested_school_id,
    ):
        school_id, prepared, preview_rows, errors = await self._prepare(
            file,
            current_user,
            requested_school_id,
        )

        if errors or not prepared:
            raise HTTPException(
                status_code=422,
                detail={
                    "message": "Import rejected. Correct the listed rows and preview again. No entries were saved.",
                    "errors": errors,
                    "valid_rows": len(prepared),
                    "invalid_rows": len(errors),
                },
            )

        try:
            self.db.add_all([
                TimetableEntry(**item, is_active=True)
                for item in prepared
            ])
            await self.db.commit()

        except Exception as exc:
            await self.db.rollback()
            raise HTTPException(
                status_code=409,
                detail="The import could not be saved. No timetable entries were imported.",
            ) from exc

        return {
            "message": "Timetable imported successfully.",
            "school_id": school_id,
            "imported_count": len(prepared),
            "rejected_count": 0,
        }
