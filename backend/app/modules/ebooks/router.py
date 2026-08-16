from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.database import get_db
from app.models.user import User
from app.models.student import Student
from app.models.ebook_activity import EbookActivity
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.ebooks.schemas import (
    EbookCreateRequest,
    EbookResponse,
    EbookUpdateRequest,
)
from app.modules.ebooks.service import EbookService

router = APIRouter(
    prefix="/ebooks",
    tags=["Ebooks"],
)

def _ebook_response(ebook):
    return EbookResponse.model_validate(ebook).model_copy(
        update={
            "file_url": f"/api/v1/ebooks/{ebook.id}/file"
        }
    )


def _ebook_responses(ebooks):
    return [_ebook_response(ebook) for ebook in ebooks]


@router.get(
    "",
    response_model=list[EbookResponse],
)
async def list_ebooks(
    search: str | None = Query(None),
    category: str | None = Query(None),
    subject_id: int | None = Query(None),
    classroom_id: int | None = Query(None),
    featured: bool | None = Query(None),
    include_archived: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Students must only see ebooks that have been explicitly published.
    # Admins/teachers keep the current library behavior so an uploaded ebook
    # remains visible to staff before it is assigned/published to students.
    role_name = (
        getattr(current_user.role, "name", "") or ""
    ).upper()

    student_only = role_name == "STUDENT"

    student_id = None

    if student_only:
        student = await EbookService(db)._get_student_for_user(
            current_user
        )
        student_id = student.id

    ebooks = await EbookService(db).list_ebooks(
        school_id=current_user.school_id,
        search=search,
        category=category,
        subject_id=subject_id,
        classroom_id=classroom_id,
        featured=featured,
        include_archived=include_archived,
        student_only=student_only,
        student_id=student_id,
    )
    return _ebook_responses(ebooks)


@router.get(
    "/recent",
    response_model=list[EbookResponse],
)
async def recent_ebooks(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role_name = (
        getattr(current_user.role, "name", "") or ""
    ).upper()

    student_only = role_name == "STUDENT"

    student_id = None

    if student_only:
        student = await EbookService(db)._get_student_for_user(
            current_user
        )
        student_id = student.id

    ebooks = await EbookService(db).recent_ebooks(
        current_user.school_id,
        limit,
        student_only=student_only,
        student_id=student_id,
    )
    return _ebook_responses(ebooks)


@router.get(
    "/categories",
    response_model=list[str],
)
async def ebook_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await EbookService(db).categories(
        current_user.school_id
    )


# ============================================================
# INDIVIDUAL STUDENT EBOOK ACCESS
# ============================================================

@router.post(
    "/{ebook_id}/students/{student_id}",
)
async def assign_ebook_to_student(
    ebook_id: int,
    student_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    access = await EbookService(db).assign_ebook_to_student(
        ebook_id,
        student_id,
        current_user,
    )

    return {
        "success": True,
        "message": "Ebook assigned to student.",
        "ebook_id": access.ebook_id,
        "student_id": access.student_id,
        "is_active": access.is_active,
    }


@router.delete(
    "/{ebook_id}/students/{student_id}",
)
async def revoke_ebook_from_student(
    ebook_id: int,
    student_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await EbookService(db).revoke_ebook_from_student(
        ebook_id,
        student_id,
        current_user,
    )


@router.get(
    "/{ebook_id}/students/{student_id}",
)
async def get_ebook_student_access(
    ebook_id: int,
    student_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    access = await EbookService(db).get_ebook_student_access(
        ebook_id,
        student_id,
        current_user.school_id,
    )

    return {
        "assigned": access is not None,
        "ebook_id": ebook_id,
        "student_id": student_id,
        "is_active": access.is_active if access else False,
    }


@router.get(
    "/{ebook_id}",
    response_model=EbookResponse,
)
async def get_ebook(
    ebook_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ebook = await EbookService(db).get_ebook(
        ebook_id,
        current_user.school_id,
    )

    if not ebook:
        raise HTTPException(
            status_code=404,
            detail="Ebook not found.",
        )

    return _ebook_response(ebook)


@router.post(
    "",
    response_model=EbookResponse,
)
async def create_ebook(
    payload: EbookCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await EbookService(db).create_ebook(
        payload,
        current_user,
    )


@router.patch(
    "/{ebook_id}",
    response_model=EbookResponse,
)
async def update_ebook(
    ebook_id: int,
    payload: EbookUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await EbookService(db).update_ebook(
        ebook_id,
        payload,
        current_user,
    )


@router.delete(
    "/{ebook_id}",
)
async def delete_ebook(
    ebook_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Archive the ebook instead of permanently deleting it.
    """
    ebook = await EbookService(db).get_ebook(
        ebook_id,
        current_user.school_id,
    )

    if not ebook:
        raise HTTPException(
            status_code=404,
            detail="Ebook not found",
        )

    ebook.is_active = False

    await db.commit()
    await db.refresh(ebook)

    return {
        "message": "Ebook archived successfully",
        "id": ebook.id,
        "is_active": ebook.is_active,
    }




@router.delete(
    "/{ebook_id}/permanent",
)
async def permanently_delete_ebook(
    ebook_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Permanently delete an ebook and its stored files.
    """

    ebook = await EbookService(db).repository.get_by_id(
        ebook_id,
        current_user.school_id,
    )

    if not ebook:
        raise HTTPException(
            status_code=404,
            detail="Ebook not found.",
        )

    # Delete the protected ebook file.
    if ebook.file_url:
        filename = Path(
            ebook.file_url.split("?")[0]
        ).name

        protected_file = (
            Path.cwd()
            / "protected_ebooks"
            / str(current_user.school_id)
            / "files"
            / filename
        )

        if protected_file.is_file():
            protected_file.unlink()

    # Delete the protected cover.
    if ebook.cover_image_url:
        cover_filename = Path(
            ebook.cover_image_url.split("?")[0]
        ).name

        cover_file = (
            Path.cwd()
            / "protected_ebooks"
            / str(current_user.school_id)
            / "covers"
            / cover_filename
        )

        if cover_file.is_file():
            cover_file.unlink()

    # Permanently remove the database record.
    await db.delete(ebook)
    await db.commit()

    return {
        "success": True,
        "message": "Ebook permanently deleted.",
        "id": ebook_id,
    }


@router.get("/{ebook_id}/file")
async def protected_ebook_file(
    ebook_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Protected ebook file endpoint.

    Ebook PDFs are stored in Cloudinary as authenticated raw assets.

    Access rules:
    - Staff/admin users in the same school may access the ebook.
    - Students may access it only when:
        1. the ebook is published school-wide, OR
        2. the ebook is individually assigned to that student.

    The Cloudinary authenticated URL is never returned directly to
    the client. The backend fetches the protected asset and streams it
    to the authorized user.
    """

    service = EbookService(db)

    ebook = await service.get_ebook(
        ebook_id,
        current_user.school_id,
    )

    if not ebook:
        raise HTTPException(
            status_code=404,
            detail="Ebook not found.",
        )

    role_name = (
        getattr(current_user.role, "name", "") or ""
    ).upper()

    if role_name == "STUDENT":
        student = await service._get_student_for_user(
            current_user
        )

        if not student:
            raise HTTPException(
                status_code=403,
                detail="Student account not found.",
            )

        access = await service.get_ebook_student_access(
            ebook_id,
            student.id,
            current_user.school_id,
        )

        if not ebook.is_published and access is None:
            raise HTTPException(
                status_code=403,
                detail="You do not have access to this ebook.",
            )

    if not ebook.file_url:
        raise HTTPException(
            status_code=404,
            detail="Ebook file not available.",
        )

    cloudinary_url = ebook.file_url.strip()

    if not cloudinary_url.startswith("https://"):
        raise HTTPException(
            status_code=500,
            detail="Ebook storage URL is invalid.",
        )

    parsed_url = urlparse(cloudinary_url)

    if not parsed_url.netloc:
        raise HTTPException(
            status_code=500,
            detail="Ebook storage URL is invalid.",
        )

    filename = (
        ebook.file_name
        or Path(parsed_url.path).name
        or f"ebook-{ebook_id}.pdf"
    )

    try:
        # Cloudinary authenticated raw assets cannot be fetched with
        # a normal GET against their secure_url. Generate a signed
        # private download URL using the Cloudinary SDK instead.
        import cloudinary
        import cloudinary.utils

        cloudinary.config(
            cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
            api_key=os.getenv("CLOUDINARY_API_KEY"),
            api_secret=os.getenv("CLOUDINARY_API_SECRET"),
            secure=True,
        )

        cloudinary_path = unquote(
            parsed_url.path
        )

        # Cloudinary authenticated raw delivery URLs have this form:
        #
        # /raw/authenticated/<signature>/v<version>/<public_id>
        #
        # Example:
        #
        # /raw/authenticated/s--Ofq8049U--/v1786853521/
        # presense/schools/999999/ebooks/example.pdf
        #
        # The signature and version are delivery URL components.
        # They are NOT part of the Cloudinary public_id.
        marker = "/raw/authenticated/"

        if marker not in cloudinary_path:
            raise HTTPException(
                status_code=500,
                detail="Ebook Cloudinary URL format is invalid.",
            )

        remainder = cloudinary_path.split(
            marker,
            1,
        )[1]

        parts = remainder.split(
            "/",
            2,
        )

        if len(parts) < 3:
            raise HTTPException(
                status_code=500,
                detail="Ebook Cloudinary URL format is invalid.",
            )

        signature_segment = parts[0]
        version_segment = parts[1]
        public_id = parts[2]

        if not (
            signature_segment.startswith("s--")
            and signature_segment.endswith("--")
        ):
            raise HTTPException(
                status_code=500,
                detail="Ebook Cloudinary URL signature is invalid.",
            )

        if not version_segment.startswith("v"):
            raise HTTPException(
                status_code=500,
                detail="Ebook Cloudinary URL version is invalid.",
            )

        if not public_id:
            raise HTTPException(
                status_code=500,
                detail="Ebook Cloudinary public ID is missing.",
            )

        # IMPORTANT:
        # Cloudinary raw authenticated assets created by save_ebook_file()
        # have the original file extension included in the stored public_id.
        #
        # Example:
        #   presense/schools/999999/ebooks/abc123.pdf
        #
        # The successful Cloudinary test confirmed that this complete
        # public_id, including ".pdf", must be supplied to
        # private_download_url(). Do not strip the extension and do not
        # append it separately.

        download_url = cloudinary.utils.private_download_url(
            public_id,
            "",
            resource_type="raw",
            type="authenticated",
            attachment=False,
        )

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to generate the secure ebook download URL: "
                f"{exc}"
            ),
        ) from exc

    try:
        client = httpx.AsyncClient(
            follow_redirects=True,
            timeout=httpx.Timeout(
                connect=15.0,
                read=120.0,
                write=30.0,
                pool=15.0,
            ),
        )

        response = await client.send(
            client.build_request(
                "GET",
                download_url,
            ),
            stream=True,
        )

    except Exception as exc:
        try:
            await client.aclose()
        except Exception:
            pass

        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to retrieve ebook from Cloudinary: "
                f"{exc}"
            ),
        ) from exc

    if response.status_code != 200:
        status_code = response.status_code

        try:
            await response.aclose()
        finally:
            await client.aclose()

        if status_code in (401, 403, 404):
            raise HTTPException(
                status_code=404,
                detail="Ebook file is unavailable.",
            )

        raise HTTPException(
            status_code=502,
            detail="Cloudinary could not provide the ebook file.",
        )

    media_type = (
        ebook.file_type
        or response.headers.get(
            "content-type",
            "application/pdf",
        )
    )

    async def stream_ebook():
        try:
            async for chunk in response.aiter_bytes(
                chunk_size=1024 * 1024
            ):
                if chunk:
                    yield chunk
        finally:
            await response.aclose()
            await client.aclose()

    return StreamingResponse(
        stream_ebook(),
        media_type=media_type,
        headers={
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
            "Content-Disposition": (
                f'inline; filename="{filename}"'
            ),
        },
    )


@router.get("/{ebook_id}/content")
async def protected_ebook_content(
    ebook_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Backward-compatible protected ebook content endpoint.

    The mobile ebook reader historically used /content, while other
    clients use /file. Both endpoints must therefore enforce exactly
    the same access rules and storage behavior.
    """

    return await protected_ebook_file(
        ebook_id=ebook_id,
        db=db,
        current_user=current_user,
    )


