from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
import uuid

from database import get_db
from models import ChatSession, Interaction, HCP
from schemas import ChatRequest, ChatResponse, InteractionCreate
from agents.interaction_agent import run_interaction_agent
from models import InteractionTypeEnum, SentimentEnum

router = APIRouter(prefix="/api/chat", tags=["Chat"])


def _map_interaction_type(raw: str) -> InteractionTypeEnum:
    mapping = {
        "in-person visit": InteractionTypeEnum.in_person_visit,
        "in person visit": InteractionTypeEnum.in_person_visit,
        "virtual meeting": InteractionTypeEnum.virtual_meeting,
        "phone call": InteractionTypeEnum.phone_call,
        "email": InteractionTypeEnum.email,
        "conference/congress": InteractionTypeEnum.conference,
        "conference": InteractionTypeEnum.conference,
        "dinner program": InteractionTypeEnum.dinner_program,
        "lunch & learn": InteractionTypeEnum.lunch_learn,
        "lunch and learn": InteractionTypeEnum.lunch_learn,
    }
    return mapping.get(raw.lower().strip(), InteractionTypeEnum.other)


def _map_sentiment(raw: str) -> SentimentEnum:
    mapping = {
        "very positive": SentimentEnum.very_positive,
        "positive": SentimentEnum.positive,
        "neutral": SentimentEnum.neutral,
        "negative": SentimentEnum.negative,
        "very negative": SentimentEnum.very_negative,
    }
    return mapping.get(raw.lower().strip(), SentimentEnum.neutral)


async def _resolve_hcp_id(hcp_name: str, db: AsyncSession) -> str | None:
    """Try to find an HCP by name. Returns UUID or None."""
    if not hcp_name:
        return None
    parts = hcp_name.replace("Dr.", "").replace("Dr ", "").strip().split()
    if not parts:
        return None

    from sqlalchemy import or_
    from models import HCP

    if len(parts) >= 2:
        first, last = parts[0], parts[-1]
        result = await db.execute(
            select(HCP).where(
                HCP.first_name.ilike(f"%{first}%"),
                HCP.last_name.ilike(f"%{last}%"),
            )
        )
    else:
        result = await db.execute(
            select(HCP).where(
                or_(
                    HCP.first_name.ilike(f"%{parts[0]}%"),
                    HCP.last_name.ilike(f"%{parts[0]}%"),
                )
            )
        )
    hcp = result.scalar_one_or_none()
    return hcp.id if hcp else None


async def _persist_interaction(
    extracted: dict,
    session: ChatSession,
    db: AsyncSession,
) -> Interaction | None:
    """Convert extracted agent data into a saved Interaction row."""
    hcp_id = session.hcp_id
    if not hcp_id and extracted.get("hcp_name"):
        hcp_id = await _resolve_hcp_id(extracted["hcp_name"], db)

    if not hcp_id:
        return None

    # Parse date
    raw_date = extracted.get("interaction_date")
    try:
        interaction_date = datetime.fromisoformat(raw_date) if raw_date else datetime.utcnow()
    except (ValueError, TypeError):
        interaction_date = datetime.utcnow()

    # Parse follow-up date
    raw_follow_up = extracted.get("follow_up_date")
    try:
        follow_up_date = datetime.fromisoformat(raw_follow_up) if raw_follow_up else None
    except (ValueError, TypeError):
        follow_up_date = None

    interaction = Interaction(
        hcp_id=hcp_id,
        rep_id=session.rep_id,
        interaction_type=_map_interaction_type(extracted.get("interaction_type", "other")),
        interaction_date=interaction_date,
        duration_minutes=extracted.get("duration_minutes"),
        location=extracted.get("location"),
        products_discussed=extracted.get("products_discussed") or [],
        key_points=extracted.get("key_points"),
        next_steps=extracted.get("next_steps"),
        follow_up_date=follow_up_date,
        sentiment=_map_sentiment(extracted.get("sentiment", "neutral")) if extracted.get("sentiment") else None,
        samples_provided=extracted.get("samples_provided") or {},
        objections=extracted.get("objections"),
        source="chat",
        raw_chat_transcript=str(session.messages),
    )
    db.add(interaction)
    await db.flush()
    await db.refresh(interaction)
    return interaction


@router.post("/", response_model=ChatResponse)
async def chat(payload: ChatRequest, db: AsyncSession = Depends(get_db)):
    from sqlalchemy.exc import IntegrityError

    # Load or create session — handle race condition from React StrictMode double-fire
    session = None
    session_id = payload.session_id or str(uuid.uuid4())

    result = await db.execute(
        select(ChatSession).where(ChatSession.session_id == session_id)
    )
    session = result.scalar_one_or_none()

    if not session:
        try:
            session = ChatSession(
                session_id=session_id,
                rep_id=payload.rep_id,
                messages=[],
                extracted_data={},
                stage="greeting",
            )
            db.add(session)
            await db.flush()
        except IntegrityError:
            # Another concurrent request already created it — roll back and re-fetch
            await db.rollback()
            result = await db.execute(
                select(ChatSession).where(ChatSession.session_id == session_id)
            )
            session = result.scalar_one_or_none()
            if not session:
                raise

    # Build existing state for the agent
    existing_state = {
        "messages": session.messages or [],
        "extracted_data": session.extracted_data or {},
        "stage": session.stage or "greeting",
        "hcp_id": str(session.hcp_id) if session.hcp_id else None,
    }

    # Run LangGraph agent
    agent_result = await run_interaction_agent(
        session_id=session.session_id,
        user_message=payload.message,
        existing_state=existing_state,
        rep_id=payload.rep_id or session.rep_id,
    )

    # Update session state
    session.messages = agent_result["messages"]
    session.extracted_data = agent_result["extracted_data"]
    session.stage = agent_result["stage"]
    session.updated_at = datetime.utcnow()

    saved_interaction_id = None

    # Persist interaction if agent confirmed save
    if agent_result.get("interaction_saved") and session.stage == "saved":
        interaction = await _persist_interaction(
            agent_result["extracted_data"], session, db
        )
        if interaction:
            session.interaction_id = interaction.id
            saved_interaction_id = str(interaction.id)

    await db.flush()

    return ChatResponse(
        session_id=session.session_id,
        reply=agent_result["reply"],
        stage=agent_result["stage"],
        extracted_data=agent_result["extracted_data"],
        interaction_saved=agent_result.get("interaction_saved", False),
        interaction_id=saved_interaction_id,
        messages=[
            {"role": m["role"], "content": m["content"]}
            for m in (agent_result["messages"] or [])
        ],
    )


@router.get("/{session_id}", response_model=ChatResponse)
async def get_session(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ChatSession).where(ChatSession.session_id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    messages = session.messages or []
    last_ai = next(
        (m["content"] for m in reversed(messages) if m["role"] == "assistant"),
        ""
    )
    return ChatResponse(
        session_id=session.session_id,
        reply=last_ai,
        stage=session.stage,
        extracted_data=session.extracted_data or {},
        interaction_saved=session.stage == "saved",
        interaction_id=str(session.interaction_id) if session.interaction_id else None,
        messages=messages,
    )


@router.delete("/{session_id}", status_code=204)
async def clear_session(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ChatSession).where(ChatSession.session_id == session_id)
    )
    session = result.scalar_one_or_none()
    if session:
        await db.delete(session)
        await db.flush()
