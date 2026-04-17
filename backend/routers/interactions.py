from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List, Optional
from datetime import datetime

from database import get_db
from models import Interaction, HCP
from schemas import InteractionCreate, InteractionUpdate, InteractionResponse

router = APIRouter(prefix="/api/interactions", tags=["Interactions"])


@router.get("/", response_model=List[InteractionResponse])
async def list_interactions(
    hcp_id: Optional[str] = Query(None),
    rep_id: Optional[str] = Query(None),
    interaction_type: Optional[str] = Query(None),
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
):
    query = select(Interaction).order_by(desc(Interaction.interaction_date))

    if hcp_id:
        query = query.where(Interaction.hcp_id == hcp_id)
    if rep_id:
        query = query.where(Interaction.rep_id == rep_id)
    if interaction_type:
        query = query.where(Interaction.interaction_type == interaction_type)
    if from_date:
        query = query.where(Interaction.interaction_date >= from_date)
    if to_date:
        query = query.where(Interaction.interaction_date <= to_date)

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{interaction_id}", response_model=InteractionResponse)
async def get_interaction(interaction_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Interaction).where(Interaction.id == interaction_id)
    )
    interaction = result.scalar_one_or_none()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    return interaction


@router.post("/", response_model=InteractionResponse, status_code=201)
async def create_interaction(payload: InteractionCreate, db: AsyncSession = Depends(get_db)):
    hcp_result = await db.execute(select(HCP).where(HCP.id == str(payload.hcp_id)))
    if not hcp_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="HCP not found")

    interaction = Interaction(**payload.model_dump())
    db.add(interaction)
    await db.flush()
    await db.refresh(interaction)
    return interaction


@router.patch("/{interaction_id}", response_model=InteractionResponse)
async def update_interaction(
    interaction_id: str,
    payload: InteractionUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Interaction).where(Interaction.id == interaction_id)
    )
    interaction = result.scalar_one_or_none()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(interaction, field, value)

    await db.flush()
    await db.refresh(interaction)
    return interaction


@router.delete("/{interaction_id}", status_code=204)
async def delete_interaction(interaction_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Interaction).where(Interaction.id == interaction_id)
    )
    interaction = result.scalar_one_or_none()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    await db.delete(interaction)
    await db.flush()
