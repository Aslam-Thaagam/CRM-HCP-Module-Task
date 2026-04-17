from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import Interaction
from schemas import InteractionCreate, InteractionResponse
from typing import List

router = APIRouter()


@router.get("/", response_model=List[InteractionResponse])
async def list_interactions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Interaction).order_by(Interaction.created_at.desc())
    )
    return result.scalars().all()


@router.post("/", response_model=InteractionResponse, status_code=201)
async def create_interaction(
    interaction: InteractionCreate, db: AsyncSession = Depends(get_db)
):
    db_interaction = Interaction(**interaction.model_dump())
    db.add(db_interaction)
    await db.commit()
    await db.refresh(db_interaction)
    return db_interaction


@router.get("/{interaction_id}", response_model=InteractionResponse)
async def get_interaction(
    interaction_id: int, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Interaction).where(Interaction.id == interaction_id)
    )
    interaction = result.scalar_one_or_none()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    return interaction


@router.delete("/{interaction_id}")
async def delete_interaction(
    interaction_id: int, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Interaction).where(Interaction.id == interaction_id)
    )
    interaction = result.scalar_one_or_none()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    await db.delete(interaction)
    await db.commit()
    return {"message": "Deleted successfully"}
