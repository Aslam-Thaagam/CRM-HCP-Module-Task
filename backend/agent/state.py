from typing import Annotated, Optional, List
from typing_extensions import TypedDict
from langgraph.graph.message import add_messages


class InteractionState(TypedDict):
    messages: Annotated[list, add_messages]
    hcp_name: Optional[str]
    interaction_type: Optional[str]
    interaction_date: Optional[str]
    interaction_time: Optional[str]
    contact_detail: Optional[str]
    attendees: Optional[str]
    topics_discussed: Optional[str]
    materials_shared: Optional[List[str]]
    samples_distributed: Optional[List[str]]
    sentiment: Optional[str]
    outcomes: Optional[str]
    follow_up_actions: Optional[str]
    ai_suggested_followups: Optional[List[str]]
    is_complete: bool
    missing_required: Optional[List[str]]
