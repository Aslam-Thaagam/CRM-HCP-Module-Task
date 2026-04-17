import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Text, DateTime, ForeignKey,
    Enum as SAEnum, JSON, Boolean, Integer
)
from sqlalchemy.orm import relationship
from database import Base
import enum


def _uuid() -> str:
    return str(uuid.uuid4())


class SpecialtyEnum(str, enum.Enum):
    oncology = "Oncology"
    cardiology = "Cardiology"
    neurology = "Neurology"
    pulmonology = "Pulmonology"
    endocrinology = "Endocrinology"
    rheumatology = "Rheumatology"
    gastroenterology = "Gastroenterology"
    dermatology = "Dermatology"
    internal_medicine = "Internal Medicine"
    general_practice = "General Practice"
    other = "Other"


class InteractionTypeEnum(str, enum.Enum):
    in_person_visit = "In-Person Visit"
    virtual_meeting = "Virtual Meeting"
    phone_call = "Phone Call"
    email = "Email"
    conference = "Conference/Congress"
    dinner_program = "Dinner Program"
    lunch_learn = "Lunch & Learn"
    other = "Other"


class SentimentEnum(str, enum.Enum):
    very_positive = "Very Positive"
    positive = "Positive"
    neutral = "Neutral"
    negative = "Negative"
    very_negative = "Very Negative"


class HCP(Base):
    __tablename__ = "hcps"

    id = Column(String(36), primary_key=True, default=_uuid)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    npi_number = Column(String(20), unique=True, nullable=True)
    email = Column(String(255), unique=True, nullable=True)
    phone = Column(String(30), nullable=True)
    specialty = Column(SAEnum(SpecialtyEnum), nullable=False, default=SpecialtyEnum.other)
    institution = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(50), nullable=True)
    zip_code = Column(String(20), nullable=True)
    tier = Column(Integer, nullable=True, default=3)
    is_active = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    interactions = relationship("Interaction", back_populates="hcp", lazy="noload")

    @property
    def full_name(self):
        return f"Dr. {self.first_name} {self.last_name}"


class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(String(36), primary_key=True, default=_uuid)
    hcp_id = Column(String(36), ForeignKey("hcps.id"), nullable=False)
    rep_id = Column(String(100), nullable=True)
    interaction_type = Column(SAEnum(InteractionTypeEnum), nullable=False)
    interaction_date = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, nullable=True)
    location = Column(String(255), nullable=True)
    products_discussed = Column(JSON, default=list)
    key_points = Column(Text, nullable=True)
    next_steps = Column(Text, nullable=True)
    follow_up_date = Column(DateTime, nullable=True)
    sentiment = Column(SAEnum(SentimentEnum), nullable=True)
    samples_provided = Column(JSON, default=dict)
    objections = Column(Text, nullable=True)
    ai_summary = Column(Text, nullable=True)
    source = Column(String(20), default="form")
    raw_chat_transcript = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    hcp = relationship("HCP", back_populates="interactions", lazy="noload")


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String(36), primary_key=True, default=_uuid)
    session_id = Column(String(100), unique=True, nullable=False, default=_uuid)
    rep_id = Column(String(100), nullable=True)
    hcp_id = Column(String(36), ForeignKey("hcps.id"), nullable=True)
    messages = Column(JSON, default=list)
    extracted_data = Column(JSON, default=dict)
    stage = Column(String(50), default="greeting")
    interaction_id = Column(String(36), ForeignKey("interactions.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
