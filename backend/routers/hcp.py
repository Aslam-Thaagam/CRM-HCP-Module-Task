from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import List, Optional

from database import get_db
from models import HCP
from schemas import HCPCreate, HCPUpdate, HCPResponse

router = APIRouter(prefix="/api/hcps", tags=["HCPs"])


@router.get("/", response_model=List[HCPResponse])
async def list_hcps(
    search: Optional[str] = Query(None),
    specialty: Optional[str] = Query(None),
    tier: Optional[int] = Query(None),
    is_active: bool = Query(True),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
):
    query = select(HCP).where(HCP.is_active == is_active)
    if search:
        s = f"%{search}%"
        query = query.where(
            or_(
                HCP.first_name.ilike(s),
                HCP.last_name.ilike(s),
                HCP.institution.ilike(s),
                HCP.npi_number.ilike(s),
            )
        )
    if specialty:
        query = query.where(HCP.specialty == specialty)
    if tier is not None:
        query = query.where(HCP.tier == tier)

    query = query.order_by(HCP.last_name, HCP.first_name).limit(limit).offset(offset)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{hcp_id}", response_model=HCPResponse)
async def get_hcp(hcp_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(HCP).where(HCP.id == hcp_id))
    hcp = result.scalar_one_or_none()
    if not hcp:
        raise HTTPException(status_code=404, detail="HCP not found")
    return hcp


@router.post("/", response_model=HCPResponse, status_code=201)
async def create_hcp(payload: HCPCreate, db: AsyncSession = Depends(get_db)):
    hcp = HCP(**payload.model_dump())
    db.add(hcp)
    await db.flush()
    await db.refresh(hcp)
    return hcp


@router.patch("/{hcp_id}", response_model=HCPResponse)
async def update_hcp(hcp_id: str, payload: HCPUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(HCP).where(HCP.id == hcp_id))
    hcp = result.scalar_one_or_none()
    if not hcp:
        raise HTTPException(status_code=404, detail="HCP not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(hcp, field, value)
    await db.flush()
    await db.refresh(hcp)
    return hcp


@router.delete("/{hcp_id}", status_code=204)
async def deactivate_hcp(hcp_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(HCP).where(HCP.id == hcp_id))
    hcp = result.scalar_one_or_none()
    if not hcp:
        raise HTTPException(status_code=404, detail="HCP not found")
    hcp.is_active = False
    await db.flush()
