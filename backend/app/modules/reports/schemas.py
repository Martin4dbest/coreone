from pydantic import BaseModel


class ReportsResponse(BaseModel):
    total_students: int
    total_teachers: int
    total_classes: int
    total_attendance_records: int
    total_visitors: int
