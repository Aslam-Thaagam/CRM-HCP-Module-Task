from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class HCPBase(BaseModel):
    first_name: str
    last_name: str
    specialty: Optional[str] = None
    institution: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


class HCPCreate(HCPBase):
    pass


class HCPResponse(HCPBase):
    id: str
    name: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_name(cls, hcp):
        data = cls.model_validate(hcp)
        data.name = hcp.name
        return data


class InteractionBase(BaseModel):
    hcp_name: str
    interaction_type: str = "Meeting"
    interaction_date: str
    interaction_time: Optional[str] = None
    contact_detail: Optional[str] = None
    attendees: Optional[str] = None
    topics_discussed: Optional[str] = None
    materials_shared: Optional[List[str]] = None
    samples_distributed: Optional[List[str]] = None
    sentiment: Optional[str] = "Neutral"
    outcomes: Optional[str] = None
    follow_up_actions: Optional[str] = None
    ai_suggested_followups: Optional[List[str]] = None


class InteractionCreate(InteractionBase):
    hcp_id: Optional[int] = None


class InteractionResponse(InteractionBase):
    id: int
    hcp_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    current_state: Optional[dict] = None


class ChatResponse(BaseModel):
    message: str
    extracted_data: Optional[dict] = None
    is_complete: bool = False
    missing_required: Optional[List[str]] = None
    ai_suggested_followups: Optional[List[str]] = None
