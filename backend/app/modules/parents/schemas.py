from pydantic import BaseModel, EmailStr, Field


class ParentCreateRequest(BaseModel):
    email: EmailStr
    password: str
    school_id: int

    first_name: str
    last_name: str
    phone: str

    student_ids: list[int] = Field(default_factory=list)
    relationship_type: str = "Parent/Guardian"


class ParentUpdateRequest(BaseModel):
    first_name: str
    last_name: str
    phone: str


class ParentStudentLinkRequest(BaseModel):
    relationship_type: str = "Parent/Guardian"


class ParentExistingStudentLinkRequest(BaseModel):
    email: EmailStr
    student_id: int
    relationship_type: str = "Parent/Guardian"


class ParentResponse(BaseModel):
    id: int
    user_id: int

    first_name: str
    last_name: str
    phone: str

    class Config:
        from_attributes = True


class ParentSchoolBrandingResponse(BaseModel):
    logo_url: str | None = None
    app_icon_url: str | None = None
    splash_image_url: str | None = None

    primary_color: str
    secondary_color: str
    accent_color: str

    motto: str | None = None
    login_title: str | None = None
    login_message: str | None = None

    class Config:
        from_attributes = True


class ParentSchoolResponse(BaseModel):
    id: int
    name: str
    school_code: str

    email: str | None = None
    phone: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None

    logo: str | None = None
    primary_color: str
    secondary_color: str

    branding: ParentSchoolBrandingResponse | None = None


class ParentStudentResponse(BaseModel):
    id: int
    admission_number: str

    first_name: str
    last_name: str
    middle_name: str | None = None

    gender: str
    date_of_birth: str | None = None
    passport: str | None = None

    classroom_id: int | None = None
    class_name: str | None = None

    relationship_type: str

    school: ParentSchoolResponse


class ParentDetailsResponse(BaseModel):
    id: int
    user_id: int

    first_name: str
    last_name: str
    phone: str
    email: str | None = None

    students: list[ParentStudentResponse] = Field(
        default_factory=list
    )


class ParentMeResponse(BaseModel):
    id: int
    user_id: int

    first_name: str
    last_name: str
    phone: str

    students: list[ParentStudentResponse] = Field(
        default_factory=list
    )


class ParentAttendanceRecordResponse(BaseModel):
    attendance_date: str
    status: str
    remarks: str | None = None


class ParentAttendanceResponse(BaseModel):
    student_id: int

    attendance_percentage: float

    total_days: int
    present_days: int
    absent_days: int
    late_days: int
    excused_days: int

    records: list[ParentAttendanceRecordResponse] = Field(
        default_factory=list
    )
