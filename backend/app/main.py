from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.modules.students.mobile_router import router as mobile_student_router
from app.middleware.tenant import TenantMiddleware

from app.core.config import settings
from app.db.database import AsyncSessionLocal
from app.modules.auth.bootstrap import bootstrap_super_admin
from app.modules.auth.router import router as auth_router
from app.modules.users.router import router as users_router
from app.modules.admins.router import router as admins_router
from app.modules.super_admins.router import router as super_admins_router
from app.modules.schools.router import router as schools_router
from app.modules.school_features.router import router as school_features_router
from app.modules.roles.router import router as roles_router
from app.modules.parents.router import router as parents_router
from app.modules.teachers.router import router as teachers_router
from app.modules.students.router import router as students_router
from app.modules.staff.router import router as staff_router
from app.modules.academic_sessions.router import router as academic_sessions_router
from app.modules.terms.router import router as terms_router
from app.modules.levels.router import router as levels_router
from app.modules.classes.router import router as classes_router
from app.modules.attendance.router import router as attendance_router
from app.modules.visitors.router import router as visitors_router
from app.modules.subjects.router import router as subjects_router
from app.modules.departments.router import router as departments_router
from app.modules.houses.router import router as houses_router
from app.modules.grading_systems.router import router as grading_systems_router
from app.modules.events.router import router as events_router
from app.modules.notifications.router import router as notifications_router
from app.modules.messages.router import router as messages_router
from app.modules.assessments.router import router as assessments_router
from app.modules.results.router import router as results_router
from app.modules.ebooks.router import router as ebooks_router
from app.modules.ebooks.upload_router import router as ebooks_upload_router
from app.modules.browser.router import router as browser_router
from app.modules.youtube_learning.router import router as youtube_learning_router
from app.modules.cbt.router import router as cbt_router
from app.modules.gallery.router import router as gallery_router
from app.modules.dashboard.router import router as dashboard_router
from app.modules.reports.router import router as reports_router
from app.modules.settings.router import router as settings_router
from app.modules.branding.router import router as branding_router
from app.modules.audit_logs.router import router as audit_logs_router
from app.routes_test import router as routes_test_router
from app.modules.teacher_assignments.router import router as teacher_assignments_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with AsyncSessionLocal() as db:
        await bootstrap_super_admin(db)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

from pathlib import Path

UPLOAD_DIR = Path.cwd() / "uploads"

# Public uploads remain available for non-sensitive assets.
# Ebook files are NOT publicly mounted here.
# Ebook files must be accessed through the authenticated
# /api/v1/ebooks/{ebook_id}/file endpoint.
_PUBLIC_UPLOAD_DIR = UPLOAD_DIR / "branding"

if _PUBLIC_UPLOAD_DIR.exists():
    app.mount(
        "/uploads/branding",
        StaticFiles(directory=str(_PUBLIC_UPLOAD_DIR)),
        name="branding_uploads",
    )

# Ebook cover images are public.
# The actual ebook files remain protected and are served only
# through the authenticated ebook content endpoint.
_EBOOK_COVERS_DIR = UPLOAD_DIR / "ebooks"

if _EBOOK_COVERS_DIR.exists():
    app.mount(
        "/uploads/ebooks",
        StaticFiles(directory=str(_EBOOK_COVERS_DIR)),
        name="ebook_covers",
    )



app.add_middleware(
    TenantMiddleware,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(
    auth_router,
    prefix=settings.API_V1_STR,
)

app.include_router(
    users_router,
    prefix=settings.API_V1_STR,
)
app.include_router(
    admins_router,
    prefix=settings.API_V1_STR,
)

app.include_router(
    super_admins_router,
    prefix=settings.API_V1_STR,
)

app.include_router(
    schools_router,
    prefix=settings.API_V1_STR,
)


app.include_router(
    school_features_router,
    prefix=settings.API_V1_STR,
)

app.include_router(
    roles_router,
    prefix=settings.API_V1_STR,
)


app.include_router(
    parents_router,
    prefix=settings.API_V1_STR,
)


app.include_router(
    teachers_router,
    prefix=settings.API_V1_STR,
)

app.include_router(
    teacher_assignments_router,
    prefix=settings.API_V1_STR,
)


app.include_router(
    students_router,
    prefix=settings.API_V1_STR,
)


app.include_router(
    staff_router,
    prefix=settings.API_V1_STR,
)



app.include_router(
    academic_sessions_router,
    prefix=settings.API_V1_STR,
)


app.include_router(
    terms_router,
    prefix=settings.API_V1_STR,
)


app.include_router(
    levels_router,
    prefix=settings.API_V1_STR,
)


app.include_router(
    classes_router,
    prefix=settings.API_V1_STR,
)


app.include_router(
    attendance_router,
    prefix=settings.API_V1_STR,
)


app.include_router(
    visitors_router,
    prefix=settings.API_V1_STR,
)


app.include_router(
    subjects_router,
    prefix=settings.API_V1_STR,
)


app.include_router(
    departments_router,
    prefix=settings.API_V1_STR,
)


app.include_router(
    houses_router,
    prefix=settings.API_V1_STR,
)


app.include_router(
    grading_systems_router,
    prefix=settings.API_V1_STR,
)


app.include_router(
    notifications_router,
    prefix=settings.API_V1_STR,
)


app.include_router(
    events_router,
    prefix=settings.API_V1_STR,
)


app.include_router(
    messages_router,
    prefix=settings.API_V1_STR,
)


app.include_router(
    assessments_router,
    prefix=settings.API_V1_STR,
)


app.include_router(
    results_router,
    prefix=settings.API_V1_STR,
)


app.include_router(
    ebooks_router,
    prefix=settings.API_V1_STR,
)

app.include_router(
    ebooks_upload_router,
    prefix=settings.API_V1_STR,
)


app.include_router(
    browser_router,
    prefix=settings.API_V1_STR,
)


app.include_router(
    cbt_router,
    prefix=settings.API_V1_STR,
)


app.include_router(
    youtube_learning_router,
    prefix=settings.API_V1_STR,
)


app.include_router(
    gallery_router,
    prefix=settings.API_V1_STR,
)


app.include_router(
    dashboard_router,
    prefix=settings.API_V1_STR,
)


app.include_router(
    reports_router,
    prefix=settings.API_V1_STR,
)


app.include_router(
    settings_router,
    prefix=settings.API_V1_STR,
)
app.include_router(
    branding_router,
    prefix=settings.API_V1_STR,
)


app.include_router(
    audit_logs_router,
    prefix=settings.API_V1_STR,
)


app.include_router(
    routes_test_router,
)

@app.get("/", tags=["Root"])
async def root():
    return {
        "application": settings.APP_NAME,
        "version": "1.0.0",
        "status": "running",
    }


@app.get("/health", tags=["Health"])
async def health():
    return {
        "status": "healthy",
    }

app.include_router(
    mobile_student_router,
    prefix="/api/v1"
)


print("=" * 80)
print("FASTAPI ROUTES AFTER REGISTRATION")
print("=" * 80)

from fastapi.routing import APIRoute

count = 0
for route in app.router.routes:
    if isinstance(route, APIRoute):
        count += 1
        print(route.path)

print("TOTAL:", count)
# ============================
# Mobile Student API
# ============================
from app.modules.students.mobile_router import router as mobile_student_router

app.include_router(
    mobile_student_router,
    prefix="/api/v1",
)

