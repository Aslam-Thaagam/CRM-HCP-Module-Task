from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from datetime import datetime
from database import Base
import uuid


class HCP(Base):
    __tablename__ = "hcps"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    first_name = Column(String(255), nullable=False)
    last_name = Column(String(255), nullable=False)
    specialty = Column(String(255))
    institution = Column(String(255))
    email = Column(String(255))
    phone = Column(String(50))
    npi_number = Column(String(50))
    city = Column(String(100))
    state = Column(String(50))
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    @property
    def name(self):
        return f"{self.first_name} {self.last_name}"


class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    hcp_id = Column(Integer, nullable=True)
    hcp_name = Column(String(255), nullable=False)
    interaction_type = Column(String(50), default="Meeting")
    interaction_date = Column(String(50), nullable=False)
    interaction_time = Column(String(10))
    contact_detail = Column(String(255))
    attendees = Column(Text)
    topics_discussed = Column(Text)
    materials_shared = Column(JSON)
    samples_distributed = Column(JSON)
    sentiment = Column(String(20), default="Neutral")
    outcomes = Column(Text)
    follow_up_actions = Column(Text)
    ai_suggested_followups = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
