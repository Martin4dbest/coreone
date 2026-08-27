from datetime import date
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_roles
from app.db.database import get_db
from app.models.school_book import SchoolBook
from app.models.student import Student
from app.models.school_book_inventory import (
    SchoolBookReceipt,
    SchoolBookDistribution,
    SchoolBookDistributionStudent,
)
from app.modules.school_books.schemas import (
    SchoolBookCreate,
    SchoolBookResponse,
    SchoolBookUpdate,
)

router = APIRouter(
    prefix="/school-books",
    tags=["School Books"],
)


BOOK_MANAGEMENT_ROLES = (
    "SUPER_ADMIN",
    "SCHOOL_ADMIN",
    "ACCOUNTANT",
    "BOOK_STOREKEEPER",
)


def verify_school_access(current_user, school_id: int):
    role = current_user.role.name if current_user.role else None

    if role == "SUPER_ADMIN":
        return

    if role in {
        "SCHOOL_ADMIN",
        "ACCOUNTANT",
        "BOOK_STOREKEEPER",
    }:
        if current_user.school_id == school_id:
            return

    raise HTTPException(
        status_code=403,
        detail="You do not have permission to manage School Books.",
    )


@router.get(
    "/{school_id}",
    response_model=list[SchoolBookResponse],
)
async def list_school_books(
    school_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(
        require_roles(*BOOK_MANAGEMENT_ROLES)
    ),
):
    verify_school_access(current_user, school_id)

    result = await db.execute(
        select(SchoolBook)
        .where(
            SchoolBook.school_id == school_id,
            SchoolBook.is_active == True,
        )
        .order_by(SchoolBook.title.asc())
    )

    return list(result.scalars().all())


@router.post(
    "/{school_id}",
    response_model=SchoolBookResponse,
)
async def create_school_book(
    school_id: int,
    payload: SchoolBookCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(
        require_roles(*BOOK_MANAGEMENT_ROLES)
    ),
):
    verify_school_access(current_user, school_id)

    if payload.quantity < 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity cannot be negative.",
        )

    book = SchoolBook(
        school_id=school_id,
        title=payload.title.strip(),
        author=payload.author.strip() if payload.author else None,
        isbn=payload.isbn.strip() if payload.isbn else None,
        category=payload.category.strip() if payload.category else None,
        subject_id=payload.subject_id,
        quantity=payload.quantity,
        is_active=True,
    )

    db.add(book)
    await db.commit()
    await db.refresh(book)

    return book


@router.patch(
    "/{school_id}/{book_id}",
    response_model=SchoolBookResponse,
)
async def update_school_book(
    school_id: int,
    book_id: int,
    payload: SchoolBookUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(
        require_roles(*BOOK_MANAGEMENT_ROLES)
    ),
):
    verify_school_access(current_user, school_id)

    result = await db.execute(
        select(SchoolBook).where(
            SchoolBook.id == book_id,
            SchoolBook.school_id == school_id,
        )
    )

    book = result.scalar_one_or_none()

    if not book:
        raise HTTPException(
            status_code=404,
            detail="School book not found.",
        )

    data = payload.model_dump(exclude_unset=True)

    if "quantity" in data and data["quantity"] is not None:
        if data["quantity"] < 0:
            raise HTTPException(
                status_code=400,
                detail="Quantity cannot be negative.",
            )

    for key, value in data.items():
        if isinstance(value, str):
            value = value.strip()

        setattr(book, key, value)

    await db.commit()
    await db.refresh(book)

    return book


@router.delete(
    "/{school_id}/{book_id}",
)
async def archive_school_book(
    school_id: int,
    book_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(
        require_roles(*BOOK_MANAGEMENT_ROLES)
    ),
):
    verify_school_access(current_user, school_id)

    result = await db.execute(
        select(SchoolBook).where(
            SchoolBook.id == book_id,
            SchoolBook.school_id == school_id,
        )
    )

    book = result.scalar_one_or_none()

    if not book:
        raise HTTPException(
            status_code=404,
            detail="School book not found.",
        )

    book.is_active = False

    await db.commit()

    return {
        "message": "School book archived successfully.",
    }


# ============================================================
# RECEIVING BOOKS INTO STORE
# ============================================================

@router.post(
    "/{school_id}/{book_id}/receipts",
)
async def receive_school_books(
    school_id: int,
    book_id: int,
    quantity: int,
    date_received: date,
    supplier: str | None = None,
    reference_number: str | None = None,
    notes: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(
        require_roles(*BOOK_MANAGEMENT_ROLES)
    ),
):
    verify_school_access(current_user, school_id)

    if quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Received quantity must be greater than zero.",
        )

    result = await db.execute(
        select(SchoolBook).where(
            SchoolBook.id == book_id,
            SchoolBook.school_id == school_id,
            SchoolBook.is_active == True,
        )
    )

    book = result.scalar_one_or_none()

    if not book:
        raise HTTPException(
            status_code=404,
            detail="School book not found.",
        )

    receipt = SchoolBookReceipt(
        school_id=school_id,
        school_book_id=book_id,
        quantity_received=quantity,
        date_received=date_received,
        supplier=supplier.strip() if supplier else None,
        reference_number=(
            reference_number.strip()
            if reference_number
            else None
        ),
        received_by=current_user.id,
        notes=notes.strip() if notes else None,
    )

    book.quantity += quantity

    db.add(receipt)

    await db.commit()
    await db.refresh(receipt)

    return {
        "message": "Books received successfully.",
        "receipt_id": receipt.id,
        "school_book_id": book.id,
        "quantity_received": quantity,
        "new_quantity": book.quantity,
    }


# ============================================================
# ISSUE BOOKS TO A CLASS
# ============================================================

@router.post(
    "/{school_id}/{book_id}/distributions",
)
async def distribute_school_books(
    school_id: int,
    book_id: int,
    classroom_id: int,
    quantity_issued: int,
    student_count: int,
    date_issued: date,
    student_ids: List[int] | None = None,
    notes: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(
        require_roles(
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
            "ACCOUNTANT",
            "BOOK_STOREKEEPER",
        )
    ),
):
    verify_school_access(current_user, school_id)

    if quantity_issued <= 0:
        raise HTTPException(
            status_code=400,
            detail="Issued quantity must be greater than zero.",
        )

    if student_count <= 0:
        raise HTTPException(
            status_code=400,
            detail="Student count must be greater than zero.",
        )

    # Student-level accountability is required because every issued
    # copy must be traceable to the individual student who received it.
    if not student_ids:
        raise HTTPException(
            status_code=400,
            detail=(
                "Select the individual students who received the books. "
                "Student-level distribution records are required."
            ),
        )

    # ------------------------------------------------------------
    # Validate classroom belongs to this school.
    # ------------------------------------------------------------
    from app.models.classroom import Classroom

    classroom_result = await db.execute(
        select(Classroom).where(
            Classroom.id == classroom_id,
            Classroom.school_id == school_id,
        )
    )

    classroom = classroom_result.scalar_one_or_none()

    if not classroom:
        raise HTTPException(
            status_code=400,
            detail="Selected classroom does not belong to this school.",
        )

    # If individual students are supplied, validate them.
    if student_ids is not None:
        if len(student_ids) == 0:
            raise HTTPException(
                status_code=400,
                detail="student_ids cannot be empty when supplied.",
            )

        if len(set(student_ids)) != len(student_ids):
            raise HTTPException(
                status_code=400,
                detail="Duplicate student IDs are not allowed.",
            )

        if len(student_ids) != student_count:
            raise HTTPException(
                status_code=400,
                detail=(
                    "student_count must match the number of "
                    "student_ids supplied."
                ),
            )

        student_result = await db.execute(
            select(Student).where(
                Student.id.in_(student_ids),
                Student.school_id == school_id,
            )
        )

        students = list(student_result.scalars().all())

        if len(students) != len(student_ids):
            raise HTTPException(
                status_code=400,
                detail=(
                    "One or more selected students do not belong "
                    "to this school."
                ),
            )

    result = await db.execute(
        select(SchoolBook).where(
            SchoolBook.id == book_id,
            SchoolBook.school_id == school_id,
            SchoolBook.is_active == True,
        )
    )

    book = result.scalar_one_or_none()

    if not book:
        raise HTTPException(
            status_code=404,
            detail="School book not found.",
        )

    if book.quantity < quantity_issued:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Insufficient stock. Available: {book.quantity}, "
                f"requested: {quantity_issued}."
            ),
        )

    distribution = SchoolBookDistribution(
        school_id=school_id,
        school_book_id=book_id,
        classroom_id=classroom_id,
        quantity_issued=quantity_issued,
        student_count=student_count,
        date_issued=date_issued,
        issued_by=current_user.id,
        notes=notes.strip() if notes else None,
    )

    book.quantity -= quantity_issued

    db.add(distribution)

    await db.flush()

    # Record each individual student who received a book.
    if student_ids:
        for student_id in student_ids:
            db.add(
                SchoolBookDistributionStudent(
                    school_id=school_id,
                    distribution_id=distribution.id,
                    student_id=student_id,
                    quantity_issued=1,
                )
            )

    await db.commit()
    await db.refresh(distribution)

    return {
        "message": "Books issued successfully.",
        "distribution_id": distribution.id,
        "school_book_id": book.id,
        "quantity_issued": quantity_issued,
        "remaining_quantity": book.quantity,
    }


# ============================================================
# INVENTORY HISTORY
# ============================================================


# ============================================================
# DISTRIBUTION RECORDS
# ============================================================

@router.get(
    "/{school_id}/distribution-records",
)
async def distribution_records(
    school_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(
        require_roles(*BOOK_MANAGEMENT_ROLES)
    ),
):
    verify_school_access(current_user, school_id)

    from app.models.school_book import SchoolBook
    from app.models.school_book_inventory import (
        SchoolBookDistribution,
        SchoolBookDistributionStudent,
    )
    from app.models.student import Student
    from app.models.classroom import Classroom
    from app.models.user import User
    from app.models.staff import Staff

    def issuer_name(user, staff, issued_by):
        if staff is not None:
            name = " ".join(
                part
                for part in [
                    getattr(staff, "first_name", None),
                    getattr(staff, "last_name", None),
                ]
                if part
            ).strip()

            if name:
                return name

        if user is not None:
            email = getattr(user, "email", None)
            if email:
                return email

        if issued_by is not None:
            return f"Account #{issued_by}"

        return "Unknown Account"

    def student_name(student):
        name = " ".join(
            part
            for part in [
                getattr(student, "first_name", None),
                getattr(student, "middle_name", None),
                getattr(student, "last_name", None),
            ]
            if part
        ).strip()

        return (
            name
            or getattr(student, "admission_number", None)
            or f"Student #{student.id}"
        )

    def class_name(classroom, fallback=None):
        return (
            getattr(classroom, "name", None)
            or getattr(classroom, "title", None)
            or getattr(classroom, "level_name", None)
            or fallback
            or "Unassigned"
        )

    records = []
    individual_ids = set()

    # ============================================================
    # CURRENT / STUDENT-LEVEL DISTRIBUTION RECORDS
    # ============================================================

    result = await db.execute(
        select(
            SchoolBookDistributionStudent,
            SchoolBookDistribution,
            SchoolBook,
            Student,
            Classroom,
            User,
            Staff,
        )
        .join(
            SchoolBookDistribution,
            SchoolBookDistribution.id
            == SchoolBookDistributionStudent.distribution_id,
        )
        .join(
            SchoolBook,
            SchoolBook.id
            == SchoolBookDistribution.school_book_id,
        )
        .join(
            Student,
            Student.id
            == SchoolBookDistributionStudent.student_id,
        )
        .outerjoin(
            Classroom,
            Classroom.id == Student.classroom_id,
        )
        .outerjoin(
            User,
            User.id == SchoolBookDistribution.issued_by,
        )
        .outerjoin(
            Staff,
            Staff.user_id == User.id,
        )
        .where(
            SchoolBookDistributionStudent.school_id == school_id,
            SchoolBookDistribution.school_id == school_id,
            Student.school_id == school_id,
        )
        .order_by(
            SchoolBookDistribution.date_issued.desc(),
            SchoolBookDistribution.id.desc(),
            SchoolBookDistributionStudent.id.desc(),
        )
    )

    for (
        distribution_student,
        distribution,
        book,
        student,
        classroom,
        user,
        staff,
    ) in result.all():

        individual_ids.add(distribution.id)

        records.append(
            {
                "id": distribution_student.id,
                "distribution_id": distribution.id,
                "record_type": "student",
                "student_id": student.id,
                "student_name": student_name(student),
                "admission_number": getattr(
                    student,
                    "admission_number",
                    None,
                ),
                "book_id": book.id,
                "book_name": book.title,
                "classroom_id": getattr(
                    student,
                    "classroom_id",
                    None,
                ),
                "class_name": class_name(
                    classroom,
                    fallback="Unassigned",
                ),
                "quantity_issued": distribution_student.quantity_issued,
                "student_count": 1,
                "date_received": distribution.date_issued,
                "issued_by": distribution.issued_by,
                "issued_by_name": issuer_name(
                    user,
                    staff,
                    distribution.issued_by,
                ),
                "notes": distribution.notes,
            }
        )

    # ============================================================
    # PARENT / LEGACY DISTRIBUTION RECORDS
    #
    # For old records created before individual student rows existed:
    #
    #   - If the classroom roster count exactly matches the saved
    #     student_count, we can safely expose one record per student.
    #
    #   - Otherwise we preserve the legacy class-level record instead
    #     of inventing student identities.
    # ============================================================

    result = await db.execute(
        select(
            SchoolBookDistribution,
            SchoolBook,
            Classroom,
            User,
            Staff,
        )
        .join(
            SchoolBook,
            SchoolBook.id
            == SchoolBookDistribution.school_book_id,
        )
        .outerjoin(
            Classroom,
            Classroom.id
            == SchoolBookDistribution.classroom_id,
        )
        .outerjoin(
            User,
            User.id
            == SchoolBookDistribution.issued_by,
        )
        .outerjoin(
            Staff,
            Staff.user_id == User.id,
        )
        .where(
            SchoolBookDistribution.school_id == school_id,
            SchoolBook.school_id == school_id,
        )
        .order_by(
            SchoolBookDistribution.date_issued.desc(),
            SchoolBookDistribution.id.desc(),
        )
    )

    for (
        distribution,
        book,
        classroom,
        user,
        staff,
    ) in result.all():

        # Already represented by individual student records.
        if distribution.id in individual_ids:
            continue

        students = []

        if classroom is not None:
            student_result = await db.execute(
                select(Student)
                .where(
                    Student.school_id == school_id,
                    Student.classroom_id == classroom.id,
                )
                .order_by(
                    Student.first_name.asc(),
                    Student.last_name.asc(),
                    Student.id.asc(),
                )
            )

            students = list(student_result.scalars().all())

        expected_count = int(
            distribution.student_count or 0
        )

        # --------------------------------------------------------
        # SAFE LEGACY RECOVERY
        # --------------------------------------------------------
        # Only expand when the historical student_count exactly
        # matches the current classroom roster.
        #
        # This prevents us from falsely assigning books to only
        # some of the current students.
        # --------------------------------------------------------

        if (
            classroom is not None
            and expected_count > 0
            and len(students) == expected_count
        ):
            per_student_quantity = 1

            for index, student in enumerate(students, start=1):
                records.append(
                    {
                        # Negative synthetic IDs prevent collision
                        # with real SchoolBookDistributionStudent IDs.
                        "id": -(
                            distribution.id * 1_000_000
                            + student.id
                        ),
                        "distribution_id": distribution.id,
                        "record_type": "student",
                        "legacy_recovered": True,
                        "student_id": student.id,
                        "student_name": student_name(student),
                        "admission_number": getattr(
                            student,
                            "admission_number",
                            None,
                        ),
                        "book_id": book.id,
                        "book_name": book.title,
                        "classroom_id": classroom.id,
                        "class_name": class_name(
                            classroom,
                            fallback=f"Class #{classroom.id}",
                        ),
                        "quantity_issued": per_student_quantity,
                        "student_count": 1,
                        "date_received": distribution.date_issued,
                        "issued_by": distribution.issued_by,
                        "issued_by_name": issuer_name(
                            user,
                            staff,
                            distribution.issued_by,
                        ),
                        "notes": distribution.notes,
                    }
                )

            continue

        # --------------------------------------------------------
        # TRUE LEGACY FALLBACK
        # --------------------------------------------------------

        records.append(
            {
                "id": -distribution.id,
                "distribution_id": distribution.id,
                "record_type": "class",
                "legacy_recovered": False,
                "student_id": None,
                "student_name": "Class Distribution",
                "admission_number": None,
                "book_id": book.id,
                "book_name": book.title,
                "classroom_id": distribution.classroom_id,
                "class_name": class_name(
                    classroom,
                    fallback=(
                        f"Class #{distribution.classroom_id}"
                        if distribution.classroom_id
                        else "Unassigned"
                    ),
                ),
                "quantity_issued": distribution.quantity_issued,
                "student_count": distribution.student_count,
                "date_received": distribution.date_issued,
                "issued_by": distribution.issued_by,
                "issued_by_name": issuer_name(
                    user,
                    staff,
                    distribution.issued_by,
                ),
                "notes": distribution.notes,
            }
        )

    records.sort(
        key=lambda item: (
            str(item.get("date_received") or ""),
            int(item.get("distribution_id") or 0),
            int(item.get("id") or 0),
        ),
        reverse=True,
    )

    return records


@router.get(
    "/{school_id}/{book_id}/receipts/history",
)
async def receipt_history(
    school_id: int,
    book_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(
        require_roles(*BOOK_MANAGEMENT_ROLES)
    ),
):
    verify_school_access(current_user, school_id)

    result = await db.execute(
        select(SchoolBookReceipt)
        .where(
            SchoolBookReceipt.school_id == school_id,
            SchoolBookReceipt.school_book_id == book_id,
        )
        .order_by(
            SchoolBookReceipt.date_received.desc(),
            SchoolBookReceipt.id.desc(),
        )
    )

    return list(result.scalars().all())


@router.get(
    "/{school_id}/{book_id}/distributions/history",
)
async def distribution_history(
    school_id: int,
    book_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(
        require_roles(*BOOK_MANAGEMENT_ROLES)
    ),
):
    verify_school_access(current_user, school_id)

    result = await db.execute(
        select(SchoolBookDistribution)
        .where(
            SchoolBookDistribution.school_id == school_id,
            SchoolBookDistribution.school_book_id == book_id,
        )
        .order_by(
            SchoolBookDistribution.date_issued.desc(),
            SchoolBookDistribution.id.desc(),
        )
    )

    return list(result.scalars().all())
