from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_roles
from app.db.database import get_db
from app.models.school_bus import SchoolBus
from app.modules.school_bus.schemas import (
    SchoolBusCreate,
    SchoolBusResponse,
    SchoolBusUpdate,
)

router = APIRouter(
    prefix="/school-bus",
    tags=["School Bus"],
)


def verify_school_access(current_user, school_id: int):
    role = current_user.role.name if current_user.role else None

    if role == "SUPER_ADMIN":
        return

    if role == "SCHOOL_ADMIN" and current_user.school_id == school_id:
        return

    raise HTTPException(
        status_code=403,
        detail="You do not have permission to manage School Bus.",
    )


@router.get(
    "/{school_id}",
    response_model=list[SchoolBusResponse],
)
async def list_school_buses(
    school_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(
        require_roles("SUPER_ADMIN", "SCHOOL_ADMIN")
    ),
):
    verify_school_access(current_user, school_id)

    result = await db.execute(
        select(SchoolBus)
        .where(SchoolBus.school_id == school_id)
        .order_by(SchoolBus.name.asc())
    )

    return list(result.scalars().all())


@router.post(
    "/{school_id}",
    response_model=SchoolBusResponse,
)
async def create_school_bus(
    school_id: int,
    payload: SchoolBusCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(
        require_roles("SUPER_ADMIN", "SCHOOL_ADMIN")
    ),
):
    verify_school_access(current_user, school_id)

    bus = SchoolBus(
        school_id=school_id,
        name=payload.name.strip(),
        registration_number=payload.registration_number.strip(),
        driver_name=(
            payload.driver_name.strip()
            if payload.driver_name
            else None
        ),
        driver_phone=(
            payload.driver_phone.strip()
            if payload.driver_phone
            else None
        ),
        capacity=payload.capacity,
        is_active=True,
    )

    db.add(bus)
    await db.commit()
    await db.refresh(bus)

    return bus


@router.patch(
    "/{school_id}/{bus_id}",
    response_model=SchoolBusResponse,
)
async def update_school_bus(
    school_id: int,
    bus_id: int,
    payload: SchoolBusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(
        require_roles("SUPER_ADMIN", "SCHOOL_ADMIN")
    ),
):
    verify_school_access(current_user, school_id)

    result = await db.execute(
        select(SchoolBus).where(
            SchoolBus.id == bus_id,
            SchoolBus.school_id == school_id,
        )
    )

    bus = result.scalar_one_or_none()

    if not bus:
        raise HTTPException(
            status_code=404,
            detail="School bus not found.",
        )

    data = payload.model_dump(exclude_unset=True)

    for key, value in data.items():
        if isinstance(value, str):
            value = value.strip()

        setattr(bus, key, value)

    await db.commit()
    await db.refresh(bus)

    return bus


@router.delete(
    "/{school_id}/{bus_id}",
)
async def archive_school_bus(
    school_id: int,
    bus_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(
        require_roles("SUPER_ADMIN", "SCHOOL_ADMIN")
    ),
):
    verify_school_access(current_user, school_id)

    result = await db.execute(
        select(SchoolBus).where(
            SchoolBus.id == bus_id,
            SchoolBus.school_id == school_id,
        )
    )

    bus = result.scalar_one_or_none()

    if not bus:
        raise HTTPException(
            status_code=404,
            detail="School bus not found.",
        )

    bus.is_active = False

    await db.commit()

    return {
        "message": "School bus archived successfully.",
    }
