from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import HCP
from schemas import HCPCreate, HCPResponse
from typing import List
import uuid

router = APIRouter()


@router.get("/", response_model=List[HCPResponse])
async def list_hcps(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(HCP).order_by(HCP.last_name))
    hcps = result.scalars().all()
    return [HCPResponse.from_orm_with_name(h) for h in hcps]


@router.post("/", response_model=HCPResponse, status_code=201)
async def create_hcp(hcp: HCPCreate, db: AsyncSession = Depends(get_db)):
    data = hcp.model_dump(exclude_none=True)
    db_hcp = HCP(id=str(uuid.uuid4()), **data)
    db.add(db_hcp)
    await db.commit()
    await db.refresh(db_hcp)
    return HCPResponse.from_orm_with_name(db_hcp)


@router.get("/{hcp_id}", response_model=HCPResponse)
async def get_hcp(hcp_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(HCP).where(HCP.id == hcp_id))
    hcp = result.scalar_one_or_none()
    if not hcp:
        raise HTTPException(status_code=404, detail="HCP not found")
    return HCPResponse.from_orm_with_name(hcp)
