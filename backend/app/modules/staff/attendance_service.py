import math
from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

from fastapi import HTTPException, status
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

import asyncio
import json
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from app.models.staff import Staff
from app.models.school import School
from app.models.staff_attendance import StaffAttendance

from app.modules.staff.attendance_repository import (
    StaffAttendanceRepository,
)
from app.modules.staff.attendance_schemas import (
    StaffAttendanceCreateRequest,
    StaffAttendanceUpdateRequest,
)


ALLOWED_STATUSES = {
    "present",
    "absent",
    "late",
    "excused",
}

def _distance_meters(
    latitude_1: float,
    longitude_1: float,
    latitude_2: float,
    longitude_2: float,
) -> float:
    radius = 6371000.0

    lat1 = math.radians(latitude_1)
    lat2 = math.radians(latitude_2)

    delta_lat = math.radians(latitude_2 - latitude_1)
    delta_lon = math.radians(longitude_2 - longitude_1)

    a = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat1)
        * math.cos(lat2)
        * math.sin(delta_lon / 2) ** 2
    )

    return 2 * radius * math.atan2(
        math.sqrt(a),
        math.sqrt(1 - a),
    )



async def _reverse_geocode(
    latitude: float,
    longitude: float,
) -> str | None:
    params = urlencode(
        {
            "format": "jsonv2",
            "lat": f"{latitude:.8f}",
            "lon": f"{longitude:.8f}",
            "zoom": "18",
            "addressdetails": "1",
            "accept-language": "en",
        }
    )

    url = f"https://nominatim.openstreetmap.org/reverse?{params}"

    def fetch() -> str | None:
        request = Request(
            url,
            headers={
                "User-Agent": "CoreOne-Staff-Attendance/1.0",
            },
        )

        try:
            with urlopen(request, timeout=8) as response:
                payload = json.loads(
                    response.read().decode("utf-8")
                )

            display_name = payload.get("display_name")

            if display_name:
                return str(display_name).strip()

        except Exception:
            return None

        return None

    return await asyncio.to_thread(fetch)


class StaffAttendanceService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = StaffAttendanceRepository(db)

    async def _school_id(
        self,
        current_user,
        school_id: int | None = None,
    ):
        if current_user.role.name == "SUPER_ADMIN":
            if school_id is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="school_id is required.",
                )
            return school_id

        if current_user.school_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is not linked to a school.",
            )

        return current_user.school_id

    async def _get_staff(
        self,
        staff_id: int,
        school_id: int,
    ):
        result = await self.db.execute(
            select(Staff).options(selectinload("*"))
            .join(Staff.user)
            .where(
                Staff.id == staff_id,
            )
        )

        staff = result.scalar_one_or_none()

        if not staff or staff.user.school_id != school_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Staff member not found.",
            )

        return staff

    async def create(
        self,
        payload: StaffAttendanceCreateRequest,
        current_user,
    ):
        school_id = await self._school_id(current_user)

        if current_user.role.name == "STAFF":
            staff_result = await self.db.execute(
                select(Staff).where(
                    Staff.user_id == current_user.id,
                    Staff.school_id == school_id,
                )
            )

            own_staff = staff_result.scalar_one_or_none()

            if (
                not own_staff
                or own_staff.id != payload.staff_id
            ):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only record your own attendance.",
                )

        elif current_user.role.name not in {
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        }:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not permitted to manage staff attendance.",
            )

        await self._get_staff(
            payload.staff_id,
            school_id,
        )

        attendance_status = payload.status.lower().strip()

        if attendance_status not in ALLOWED_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Status must be present, absent, late, or excused.",
            )

        existing = await self.repository.get_by_staff_date(
            payload.staff_id,
            payload.attendance_date,
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Staff attendance already exists for this date.",
            )

        location_name = await _reverse_geocode(
            payload.latitude,
            payload.longitude,
        )

        attendance = StaffAttendance(
            staff_id=payload.staff_id,
            school_id=school_id,
            attendance_date=payload.attendance_date,
            status=attendance_status,
            remarks=payload.remarks,
        )

        return await self.repository.create(attendance)

    async def clock_in(
        self,
        payload,
        current_user,
    ):
        if current_user.role.name != "STAFF":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Staff access required.",
            )

        school_id = current_user.school_id

        if school_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Your account is not linked to a school.",
            )

        school_result = await self.db.execute(
            select(School).where(School.id == school_id)
        )
        school = school_result.scalar_one_or_none()

        if school is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="School not found.",
            )

        if (
            school.staff_attendance_latitude is None
            or school.staff_attendance_longitude is None
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Staff attendance location has not been configured "
                    "for your school."
                ),
            )

        if payload.mocked:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Mocked or simulated location is not allowed "
                    "for staff attendance."
                ),
            )

        if payload.accuracy > 100.0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Your GPS accuracy is too low. "
                    "Please enable precise location and try again."
                ),
            )

        staff_result = await self.db.execute(
            select(Staff.id).where(
                Staff.user_id == current_user.id,
            )
        )

        staff_id = staff_result.scalar_one_or_none()

        if staff_id is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Staff profile not found.",
            )

        local_now = datetime.now(
            ZoneInfo("Africa/Lagos")
        )
        # One authoritative server timestamp for the clock-in.
        # Store UTC and derive the official Lagos attendance date
        # from this exact same instant.
        check_in_at=check_in_at
        # Authoritative clock-in timestamp from the CoreOne server.
        # Store UTC and derive the attendance date from this same instant
        # in Africa/Lagos.
        check_in_at = datetime.now(timezone.utc)
        attendance_date = check_in_at.astimezone(
            ZoneInfo("Africa/Lagos")
        ).date()
            ZoneInfo("Africa/Lagos")
        ).date()

        existing_result = await self.db.execute(
            select(StaffAttendance.id).where(
                StaffAttendance.staff_id == staff_id,
                StaffAttendance.school_id == school_id,
                StaffAttendance.attendance_date == attendance_date,
            )
        )

        existing_id = existing_result.scalar_one_or_none()

        if existing_id is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You have already marked attendance today.",
            )

        distance = _distance_meters(
            payload.latitude,
            payload.longitude,
            school.staff_attendance_latitude,
            school.staff_attendance_longitude,
        )

        radius = float(
            school.staff_attendance_radius_meters or 100.0
        )

        # Require the GPS uncertainty circle to remain within
        # the configured school geofence.
        if distance + payload.accuracy > radius:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You are outside the school's attendance area. "
                    "Please move to the school premises and try again."
                ),
            )

        attendance = StaffAttendance(
            staff_id=staff_id,
            school_id=school_id,
            attendance_date=attendance_date,
            status="present",
            remarks="Mobile geofenced clock-in",
            check_in_at=check_in_at,
            check_in_latitude=payload.latitude,
            check_in_longitude=payload.longitude,
            check_in_accuracy=payload.accuracy,
            check_in_distance_meters=distance,
            check_in_mocked=payload.mocked,
            check_in_location_name=location_name,
        )

        try:
            self.db.add(attendance)
            await self.db.commit()
            await self.db.refresh(attendance)
        except IntegrityError:
            await self.db.rollback()

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You have already marked attendance today.",
            )

        return {
            "id": attendance.id,
            "staff_id": attendance.staff_id,
            "school_id": attendance.school_id,
            "attendance_date": attendance.attendance_date,
            "check_in_at": attendance.check_in_at,
            "status": attendance.status,
            "check_in_latitude": attendance.check_in_latitude,
            "check_in_longitude": attendance.check_in_longitude,
            "check_in_accuracy": attendance.check_in_accuracy,
            "check_in_distance_meters": attendance.check_in_distance_meters,
            "check_in_location_name": attendance.check_in_location_name,
            "check_in_mocked": attendance.check_in_mocked,
            "message": (
                f"Attendance marked successfully at "
                f"{local_now.strftime('%I:%M %p')}."
            ),
        }

    async def get_clock_in_status(
        self,
        current_user,
    ):
        if current_user.role.name != "STAFF":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Staff access required.",
            )

        local_date = datetime.now(
            ZoneInfo("Africa/Lagos")
        ).date()

        result = await self.db.execute(
            text(
                """
                SELECT
                    sa.id,
                    sa.staff_id,
                    sa.school_id,
                    sa.attendance_date,
                    sa.status,
                    sa.remarks,
                    sa.check_in_at,
                    sa.check_in_latitude,
                    sa.check_in_longitude,
                    sa.check_in_accuracy,
                    sa.check_in_distance_meters,
                    sa.check_in_location_name,
                    sa.check_in_mocked
                FROM staff_attendance sa
                INNER JOIN staff s
                    ON s.id = sa.staff_id
                WHERE s.user_id = :user_id
                  AND sa.school_id = :school_id
                  AND sa.attendance_date = :attendance_date
                ORDER BY sa.id DESC
                LIMIT 1
                """
            ),
            {
                "user_id": current_user.id,
                "school_id": current_user.school_id,
                "attendance_date": local_date,
            },
        )

        row = result.mappings().first()

        if row is None:
            return {
                "checked_in": False,
                "attendance": None,
            }

        return {
            "checked_in": True,
            "attendance": dict(row),
        }

    async def get_attendance_report(
        self,
        school_id: int,
        current_user,
        attendance_date: date | None = None,
    ):
        role_name = (
            current_user.role.name
            if current_user.role
            else None
        )

        if role_name == "SCHOOL_ADMIN":
            if current_user.school_id != school_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You cannot access another school.",
                )
        elif role_name != "SUPER_ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view this report.",
            )

        sql = """
            SELECT
                sa.id,
                sa.staff_id,
                sa.school_id,
                CONCAT_WS(
                    ' ',
                    s.first_name,
                    s.middle_name,
                    s.last_name
                ) AS staff_name,
                s.employee_number,
                sa.attendance_date,
                sa.status,
                sa.check_in_at,
                sa.check_in_latitude,
                sa.check_in_longitude,
                sa.check_in_accuracy,
                sa.check_in_distance_meters
            FROM staff_attendance sa
            INNER JOIN staff s
                ON s.id = sa.staff_id
            WHERE sa.school_id = :school_id
        """

        params = {
            "school_id": school_id,
        }

        if attendance_date is not None:
            sql += """
                AND sa.attendance_date = :attendance_date
            """
            params["attendance_date"] = attendance_date

        sql += """
            ORDER BY
                sa.attendance_date DESC,
                sa.check_in_at DESC NULLS LAST,
                sa.id DESC
        """

        result = await self.db.execute(
            text(sql),
            params,
        )

        return [
            dict(row)
            for row in result.mappings().all()
        ]

    async def get_attendance_location(
        self,
        school_id: int,
        current_user,
    ):
        role_name = (
            current_user.role.name
            if current_user.role
            else None
        )

        if role_name == "SCHOOL_ADMIN":
            if current_user.school_id != school_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You cannot access another school.",
                )
        elif role_name != "SUPER_ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission denied.",
            )

        result = await self.db.execute(
            select(School).where(
                School.id == school_id
            )
        )

        school = result.scalar_one_or_none()

        if school is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="School not found.",
            )

        return {
            "school_id": school.id,
            "school_name": school.name,
"location_name": school.staff_attendance_location_name,
            "latitude": school.staff_attendance_latitude,
            "longitude": school.staff_attendance_longitude,
            "radius_meters": float(
                school.staff_attendance_radius_meters or 100.0
            ),
        }

    async def update_attendance_location(
        self,
        school_id: int,
        payload,
        current_user,
    ):
        role_name = (
            current_user.role.name
            if current_user.role
            else None
        )

        if role_name == "SCHOOL_ADMIN":
            if current_user.school_id != school_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You cannot update another school.",
                )
        elif role_name != "SUPER_ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission denied.",
            )

        result = await self.db.execute(
            select(School).where(
                School.id == school_id
            )
        )

        school = result.scalar_one_or_none()

        if school is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="School not found.",
            )

        school.staff_attendance_latitude = payload.latitude
        school.staff_attendance_longitude = payload.longitude
        school.staff_attendance_radius_meters = payload.radius_meters
        location_name = await _reverse_geocode(
            payload.latitude,
            payload.longitude,
        )

        if not location_name:
            fallback_parts = [
                school.address,
                school.city,
                school.state,
                school.country,
            ]

            location_name = ", ".join(
                part.strip()
                for part in fallback_parts
                if part and part.strip()
            ) or None

        school.staff_attendance_location_name = location_name


        await self.db.commit()
        await self.db.refresh(school)

        return {
            "school_id": school.id,
            "school_name": school.name,
            "latitude": school.staff_attendance_latitude,
            "longitude": school.staff_attendance_longitude,
            "radius_meters": float(
                school.staff_attendance_radius_meters
            ),
        }

    async def get_my_attendance(
        self,
        current_user,
        attendance_date: date | None = None,
    ):
        query = """
            SELECT
                sa.id,
                sa.staff_id,
                sa.school_id,
                sa.attendance_date,
                sa.status,
                sa.remarks
            FROM staff_attendance sa
            INNER JOIN staff s
                ON s.id = sa.staff_id
            INNER JOIN users u
                ON u.id = s.user_id
            INNER JOIN roles r
                ON r.id = u.role_id
            WHERE u.id = :user_id
              AND u.school_id = :school_id
              AND r.name = 'STAFF'
              AND sa.school_id = u.school_id
        """

        params = {
            "user_id": current_user.id,
            "school_id": current_user.school_id,
        }

        if attendance_date is not None:
            query += """
                AND sa.attendance_date = :attendance_date
            """
            params["attendance_date"] = attendance_date

        query += """
            ORDER BY
                sa.attendance_date DESC,
                sa.id DESC
        """

        result = await self.db.execute(
            text(query),
            params,
        )

        return [
            {
                "id": row["id"],
                "staff_id": row["staff_id"],
                "school_id": row["school_id"],
                "attendance_date": row["attendance_date"],
                "status": row["status"],
                "remarks": row["remarks"],
            }
            for row in result.mappings().all()
        ]

    async def get_all(
        self,
        current_user,
        staff_id: int | None = None,
        attendance_date: date | None = None,
        school_id: int | None = None,
    ):
        if current_user.role.name not in {
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        }:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not permitted to view staff attendance.",
            )

        resolved_school_id = await self._school_id(
            current_user,
            school_id,
        )

        return await self.repository.get_all(
            school_id=resolved_school_id,
            staff_id=staff_id,
            attendance_date=attendance_date,
        )

    async def update(
        self,
        attendance_id: int,
        payload: StaffAttendanceUpdateRequest,
        current_user,
    ):
        if current_user.role.name not in {
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        }:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not permitted to update staff attendance.",
            )

        school_id = await self._school_id(current_user)

        attendance = await self.repository.get_by_id(
            attendance_id,
            school_id,
        )

        if not attendance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Staff attendance record not found.",
            )

        attendance_status = payload.status.lower().strip()

        if attendance_status not in ALLOWED_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Status must be present, absent, late, or excused.",
            )

        attendance.status = attendance_status
        attendance.remarks = payload.remarks

        await self.db.commit()
        await self.db.refresh(attendance)

        return attendance
