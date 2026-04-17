from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from models import SpecialtyEnum, InteractionTypeEnum, SentimentEnum

# MySQL stores UUIDs as CHAR(36) strings
UUID = str


# ─── HCP Schemas ────────────────────────────────────────────────────────────

class HCPBase(BaseModel):
    first_name: str
    last_name: str
    npi_number: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    specialty: SpecialtyEnum = SpecialtyEnum.other
    institution: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    tier: Optional[int] = 3
    notes: Optional[str] = None


class HCPCreate(HCPBase):
    pass


class HCPUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    npi_number: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    specialty: Optional[SpecialtyEnum] = None
    institution: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    tier: Optional[int] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class HCPResponse(HCPBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Interaction Schemas ─────────────────────────────────────────────────────

class InteractionBase(BaseModel):
    hcp_id: UUID
    interaction_type: InteractionTypeEnum
    interaction_date: datetime
    duration_minutes: Optional[int] = None
    location: Optional[str] = None
    products_discussed: Optional[List[str]] = []
    key_points: Optional[str] = None
    next_steps: Optional[str] = None
    follow_up_date: Optional[datetime] = None
    sentiment: Optional[SentimentEnum] = None
    samples_provided: Optional[Dict[str, int]] = {}
    objections: Optional[str] = None


class InteractionCreate(InteractionBase):
    source: str = "form"


class InteractionUpdate(BaseModel):
    interaction_type: Optional[InteractionTypeEnum] = None
    interaction_date: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    location: Optional[str] = None
    products_discussed: Optional[List[str]] = None
    key_points: Optional[str] = None
    next_steps: Optional[str] = None
    follow_up_date: Optional[datetime] = None
    sentiment: Optional[SentimentEnum] = None
    samples_provided: Optional[Dict[str, int]] = None
    objections: Optional[str] = None


class InteractionResponse(InteractionBase):
    id: UUID
    rep_id: Optional[str]
    ai_summary: Optional[str]
    source: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Chat Schemas ─────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str
    timestamp: Optional[datetime] = None


class ChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str
    rep_id: Optional[str] = None


class ChatResponse(BaseModel):
    session_id: str
    reply: str
    stage: str
    extracted_data: Optional[Dict[str, Any]] = {}
    interaction_saved: bool = False
    interaction_id: Optional[str] = None
    messages: Optional[List[ChatMessage]] = []


class ExtractedInteractionData(BaseModel):
    hcp_name: Optional[str] = None
    hcp_id: Optional[str] = None
    interaction_type: Optional[str] = None
    interaction_date: Optional[str] = None
    duration_minutes: Optional[int] = None
    location: Optional[str] = None
    products_discussed: Optional[List[str]] = []
    key_points: Optional[str] = None
    next_steps: Optional[str] = None
    follow_up_date: Optional[str] = None
    sentiment: Optional[str] = None
    samples_provided: Optional[Dict[str, int]] = {}
    objections: Optional[str] = None
