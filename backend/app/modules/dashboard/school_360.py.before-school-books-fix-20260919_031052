from __future__ import annotations

import calendar
from datetime import date

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class School360Service:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _columns(self, table: str) -> set[str]:
        result = await self.db.execute(
            text(
                """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = :table
                """
            ),
            {"table": table},
        )
        return {row[0] for row in result.all()}

    async def _exists(self, table: str) -> bool:
        result = await self.db.execute(
            text(
                """
                SELECT EXISTS (
                    SELECT 1
                    FROM information_schema.tables
                    WHERE table_schema = 'public'
                      AND table_name = :table
                )
                """
            ),
            {"table": table},
        )
        return bool(result.scalar())

    async def get(self, school_id: int) -> dict:
        # ---------------------------------------------------------
        # PEOPLE
        # ---------------------------------------------------------
        people = await self.db.execute(
            text(
                """
                SELECT
                    COUNT(*) FILTER (
                        WHERE r.name = 'TEACHER'
                          AND COALESCE(u.is_active, TRUE) = TRUE
                    ) AS teachers,

                    COUNT(*) FILTER (
                        WHERE r.name = 'STAFF'
                          AND COALESCE(u.is_active, TRUE) = TRUE
                    ) AS staff,

                    COUNT(*) FILTER (
                        WHERE r.name = 'PARENT'
                          AND COALESCE(u.is_active, TRUE) = TRUE
                    ) AS parents
                FROM users u
                JOIN roles r ON r.id = u.role_id
                WHERE u.school_id = :school_id
                """
            ),
            {"school_id": school_id},
        )
        people_row = people.one()

        student_columns = await self._columns("students")

        student_sql = """
            SELECT
                COUNT(*) AS students,
                COUNT(*) FILTER (
                    WHERE LOWER(COALESCE(gender, '')) IN ('male', 'm')
                ) AS male_students,
                COUNT(*) FILTER (
                    WHERE LOWER(COALESCE(gender, '')) IN ('female', 'f')
                ) AS female_students
            FROM students
            WHERE school_id = :school_id
        """

        students_result = await self.db.execute(
            text(student_sql),
            {"school_id": school_id},
        )
        students_row = students_result.one()

        class_columns = await self._columns("classrooms")
        class_filter = (
            "AND COALESCE(c.is_active, TRUE) = TRUE"
            if "is_active" in class_columns
            else ""
        )

        classes_result = await self.db.execute(
            text(
                f"""
                SELECT COUNT(*)
                FROM classrooms c
                WHERE c.school_id = :school_id
                {class_filter}
                """
            ),
            {"school_id": school_id},
        )
        classes = int(classes_result.scalar() or 0)

        # ---------------------------------------------------------
        # STUDENT GROWTH
        # ---------------------------------------------------------
        monthly_students = [0] * 12

        if "created_at" in student_columns:
            result = await self.db.execute(
                text(
                    """
                    SELECT
                        EXTRACT(MONTH FROM created_at)::int AS month_no,
                        COUNT(*) AS total
                    FROM students
                    WHERE school_id = :school_id
                      AND created_at IS NOT NULL
                      AND created_at >= DATE_TRUNC('year', CURRENT_DATE)
                      AND created_at < DATE_TRUNC('year', CURRENT_DATE)
                                      + INTERVAL '1 year'
                    GROUP BY 1
                    ORDER BY 1
                    """
                ),
                {"school_id": school_id},
            )

            for month_no, total in result.all():
                if 1 <= month_no <= 12:
                    monthly_students[month_no - 1] = int(total or 0)

        # ---------------------------------------------------------
        # CLASS DISTRIBUTION
        # ---------------------------------------------------------
        class_distribution_result = await self.db.execute(
            text(
                """
                SELECT
                    c.name,
                    COUNT(s.id) AS value
                FROM classrooms c
                LEFT JOIN students s
                    ON s.classroom_id = c.id
                   AND s.school_id = :school_id
                WHERE c.school_id = :school_id
                GROUP BY c.id, c.name
                ORDER BY c.name
                """
            ),
            {"school_id": school_id},
        )

        class_distribution = [
            {
                "name": row[0],
                "value": int(row[1] or 0),
            }
            for row in class_distribution_result.all()
        ]

        # ---------------------------------------------------------
        # DEPARTMENT DISTRIBUTION
        # Based on configured subjects per department because
        # students do not have a department_id in the current schema.
        # ---------------------------------------------------------
        department_distribution = []

        if await self._exists("departments") and await self._exists("subjects"):
            result = await self.db.execute(
                text(
                    """
                    SELECT
                        d.name,
                        COUNT(s.id) AS value
                    FROM departments d
                    LEFT JOIN subjects s
                        ON s.department_id = d.id
                       AND s.school_id = :school_id
                    WHERE d.school_id = :school_id
                    GROUP BY d.id, d.name
                    ORDER BY d.name
                    """
                ),
                {"school_id": school_id},
            )

            department_distribution = [
                {
                    "name": row[0],
                    "value": int(row[1] or 0),
                }
                for row in result.all()
            ]

        # ---------------------------------------------------------
        # ATTENDANCE
        # Uses the latest attendance date recorded for the school.
        # ---------------------------------------------------------
        present = absent = late = 0
        attendance_rate = 0.0
        monthly_attendance = [0] * 7
        attendance_date = None

        attendance_columns = await self._columns("attendance")

        if {
            "school_id",
            "attendance_date",
            "status",
        }.issubset(attendance_columns):
            latest = await self.db.execute(
                text(
                    """
                    SELECT MAX(attendance_date)
                    FROM attendance
                    WHERE school_id = :school_id
                    """
                ),
                {"school_id": school_id},
            )
            attendance_date = latest.scalar()

            if attendance_date:
                result = await self.db.execute(
                    text(
                        """
                        SELECT
                            COUNT(*) FILTER (
                                WHERE LOWER(status) = 'present'
                            ) AS present,
                            COUNT(*) FILTER (
                                WHERE LOWER(status) = 'absent'
                            ) AS absent,
                            COUNT(*) FILTER (
                                WHERE LOWER(status) = 'late'
                            ) AS late,
                            COUNT(*) AS total
                        FROM attendance
                        WHERE school_id = :school_id
                          AND attendance_date = :attendance_date
                        """
                    ),
                    {
                        "school_id": school_id,
                        "attendance_date": attendance_date,
                    },
                )

                row = result.one()
                present = int(row[0] or 0)
                absent = int(row[1] or 0)
                late = int(row[2] or 0)
                total_attendance = int(row[3] or 0)

                if total_attendance:
                    attendance_rate = round(
                        (present / total_attendance) * 100,
                        1,
                    )

                trend = await self.db.execute(
                    text(
                        """
                        SELECT
                            attendance_date,
                            ROUND(
                                100.0 * COUNT(*) FILTER (
                                    WHERE LOWER(status) = 'present'
                                ) / NULLIF(COUNT(*), 0),
                                1
                            ) AS rate
                        FROM attendance
                        WHERE school_id = :school_id
                          AND attendance_date >= :latest_date - INTERVAL '6 days'
                          AND attendance_date <= :latest_date
                        GROUP BY attendance_date
                        ORDER BY attendance_date
                        """
                    ),
                    {
                        "school_id": school_id,
                        "latest_date": attendance_date,
                    },
                )

                for _, rate in trend.all():
                    monthly_attendance.append(int(float(rate or 0)))

                monthly_attendance = monthly_attendance[-7:]

        # ---------------------------------------------------------
        # FEES
        # ---------------------------------------------------------
        fees_expected = 0.0
        fees_paid = 0.0
        fees_outstanding = 0.0

        if await self._exists("student_fees"):
            fee_columns = await self._columns("student_fees")

            if {
                "student_id",
                "amount_due",
                "amount_paid",
            }.issubset(fee_columns):
                adjustment = (
                    "COALESCE(sf.adjustment_amount, 0)"
                    if "adjustment_amount" in fee_columns
                    else "0"
                )

                result = await self.db.execute(
                    text(
                        f"""
                        SELECT
                            COALESCE(
                                SUM(sf.amount_due + {adjustment}),
                                0
                            ) AS expected,
                            COALESCE(
                                SUM(sf.amount_paid),
                                0
                            ) AS paid
                        FROM student_fees sf
                        JOIN students s
                          ON s.id = sf.student_id
                        WHERE s.school_id = :school_id
                        """
                    ),
                    {"school_id": school_id},
                )

                row = result.one()
                fees_expected = float(row[0] or 0)
                fees_paid = float(row[1] or 0)
                fees_outstanding = max(
                    fees_expected - fees_paid,
                    0,
                )

        fees_rate = (
            round((fees_paid / fees_expected) * 100, 1)
            if fees_expected > 0
            else 0.0
        )

        # ---------------------------------------------------------
        # CBT
        # ---------------------------------------------------------
        cbt_exams = 0
        cbt_results = 0
        average_score = 0.0

        if await self._exists("cbt_exams"):
            exam_columns = await self._columns("cbt_exams")

            if "school_id" in exam_columns:
                result = await self.db.execute(
                    text(
                        """
                        SELECT COUNT(*)
                        FROM cbt_exams
                        WHERE school_id = :school_id
                        """
                    ),
                    {"school_id": school_id},
                )
                cbt_exams = int(result.scalar() or 0)

        if await self._exists("cbt_attempts") and cbt_exams:
            attempt_columns = await self._columns("cbt_attempts")

            if {
                "exam_id",
                "percentage",
            }.issubset(attempt_columns):
                result = await self.db.execute(
                    text(
                        """
                        SELECT
                            COUNT(*) AS attempts,
                            COALESCE(AVG(ca.percentage), 0) AS average_score
                        FROM cbt_attempts ca
                        JOIN cbt_exams ce
                          ON ce.id = ca.exam_id
                        WHERE ce.school_id = :school_id
                        """
                    ),
                    {"school_id": school_id},
                )

                row = result.one()
                cbt_results = int(row[0] or 0)
                average_score = round(float(row[1] or 0), 1)

        # ---------------------------------------------------------
        # SCHOOL BOOKS
        # ---------------------------------------------------------
        books_catalogue = 0
        books_available = 0
        books_issued = 0
        books_sales_value = 0.0

        if await self._exists("school_books"):
            book_columns = await self._columns("school_books")

            quantity_expression = (
                "COALESCE(quantity, 0)"
                if "quantity" in book_columns
                else "0"
            )

            active_filter = (
                "AND COALESCE(is_active, TRUE) = TRUE"
                if "is_active" in book_columns
                else ""
            )

            result = await self.db.execute(
                text(
                    f"""
                    SELECT
                        COUNT(*) AS catalogue,
                        COALESCE(SUM({quantity_expression}), 0)
                    FROM school_books
                    WHERE school_id = :school_id
                    {active_filter}
                    """
                ),
                {"school_id": school_id},
            )

            row = result.one()
            books_catalogue = int(row[0] or 0)
            books_available = int(row[1] or 0)

        if await self._exists("school_book_distributions"):
            result = await self.db.execute(
                text(
                    """
                    SELECT COALESCE(SUM(quantity_issued), 0)
                    FROM school_book_distributions
                    WHERE school_id = :school_id
                    """
                ),
                {"school_id": school_id},
            )
            books_issued = int(result.scalar() or 0)

        if await self._exists("school_book_distribution_students"):
            distribution_student_columns = await self._columns(
                "school_book_distribution_students"
            )

            if "total_selling_amount" in distribution_student_columns:
                result = await self.db.execute(
                    text(
                        """
                        SELECT COALESCE(
                            SUM(total_selling_amount),
                            0
                        )
                        FROM school_book_distribution_students
                        WHERE school_id = :school_id
                        """
                    ),
                    {"school_id": school_id},
                )
                books_sales_value = float(result.scalar() or 0)

        # ---------------------------------------------------------
        # LEAVE
        # ---------------------------------------------------------
        leave_pending = 0
        leave_approved = 0

        leave_tables = (
            "staff_leaves",
            "staff_leave_requests",
            "leave_requests",
            "leaves",
        )

        selected_leave_table = None
        for table in leave_tables:
            if await self._exists(table):
                selected_leave_table = table
                break

        if selected_leave_table:
            cols = await self._columns(selected_leave_table)

            if {"status", "school_id"}.issubset(cols):
                result = await self.db.execute(
                    text(
                        f"""
                        SELECT
                            COUNT(*) FILTER (
                                WHERE UPPER(status) = 'PENDING'
                            ),
                            COUNT(*) FILTER (
                                WHERE UPPER(status) = 'APPROVED'
                            )
                        FROM {selected_leave_table}
                        WHERE school_id = :school_id
                        """
                    ),
                    {"school_id": school_id},
                )
                row = result.one()
                leave_pending = int(row[0] or 0)
                leave_approved = int(row[1] or 0)

        # ---------------------------------------------------------
        # RESPONSE
        # ---------------------------------------------------------
        return {
            # Core counts
            "students": int(students_row.students or 0),
            "teachers": int(people_row.teachers or 0),
            "staff": int(people_row.staff or 0),
            "parents": int(people_row.parents or 0),
            "classes": classes,

            # Gender
            "maleStudents": int(students_row.male_students or 0),
            "femaleStudents": int(students_row.female_students or 0),

            # Attendance
            "present": present,
            "absent": absent,
            "late": late,
            "attendanceRate": attendance_rate,
            "attendanceDate": (
                attendance_date.isoformat()
                if attendance_date
                else None
            ),
            "monthlyAttendance": monthly_attendance,

            # Fees
            "feesExpected": fees_expected,
            "feesPaid": fees_paid,
            "feesOutstanding": fees_outstanding,
            "feesRate": fees_rate,

            # CBT
            "cbtExams": cbt_exams,
            "cbtResults": cbt_results,
            "averageScore": average_score,

            # Books
            "booksCatalogue": books_catalogue,
            "booksAvailable": books_available,
            "booksIssued": books_issued,
            "booksSalesValue": books_sales_value,

            # Leave
            "leavePending": leave_pending,
            "leaveApproved": leave_approved,

            # Charts
            "monthlyStudents": monthly_students,
            "classDistribution": class_distribution,
            "departmentDistribution": department_distribution,

            # Same data in snake_case for compatibility
            "male_students": int(students_row.male_students or 0),
            "female_students": int(students_row.female_students or 0),
            "attendance_rate": attendance_rate,
            "fees_expected": fees_expected,
            "fees_paid": fees_paid,
            "fees_outstanding": fees_outstanding,
            "cbt_exams": cbt_exams,
            "cbt_results": cbt_results,
            "average_score": average_score,
            "books_catalogue": books_catalogue,
            "books_available": books_available,
            "books_issued": books_issued,
            "books_sales_value": books_sales_value,
            "leave_pending": leave_pending,
            "leave_approved": leave_approved,
            "monthly_students": monthly_students,
            "monthly_attendance": monthly_attendance,
            "class_distribution": class_distribution,
            "department_distribution": department_distribution,
        }
