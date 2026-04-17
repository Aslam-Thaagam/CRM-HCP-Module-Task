"""
LangGraph-powered Interaction Logging Agent
============================================
Graph topology:

  [START]
     │
     ▼
  greet  ──────────────────────────────────┐
     │                                     │
     ▼                                     │
  parse_message ◄──── (loop back) ─────────┤
     │                                     │
     ▼                                     │
  extract_data                             │
     │                                     │
     ▼                                     │
  check_completeness                       │
     │                  │                  │
  complete?          missing?              │
     │                  │                  │
     ▼                  ▼                  │
  build_summary   ask_clarification ───────┘
     │
     ▼
  await_confirmation ◄─── (loop back if changes requested)
     │
  confirmed?
     │
     ▼
  save_interaction
     │
     ▼
  [END]
"""

import json
import re
import uuid
from datetime import datetime, date
from typing import TypedDict, List, Optional, Any, Dict, Annotated

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages

from config import settings
from agents.prompts import SYSTEM_PROMPT, EXTRACTION_PROMPT


# ─── State Definition ─────────────────────────────────────────────────────────

class InteractionState(TypedDict):
    session_id: str
    messages: Annotated[List[Any], add_messages]
    extracted_data: Dict[str, Any]
    missing_fields: List[str]
    stage: str          # greeting | extracting | clarifying | confirming | saved
    confirmed: bool
    interaction_saved: bool
    saved_interaction_id: Optional[str]
    rep_id: Optional[str]
    hcp_id: Optional[str]


# ─── LLM Clients ─────────────────────────────────────────────────────────────

def get_primary_llm() -> ChatGroq:
    """gemma2-9b-it – fast, efficient for extraction and chat."""
    return ChatGroq(
        api_key=settings.groq_api_key,
        model=settings.groq_model_primary,
        temperature=0.2,
        max_tokens=1024,
    )


def get_large_llm() -> ChatGroq:
    """llama-3.3-70b-versatile – for complex reasoning / summarization."""
    return ChatGroq(
        api_key=settings.groq_api_key,
        model=settings.groq_model_large,
        temperature=0.1,
        max_tokens=2048,
    )


# ─── Helper Utilities ─────────────────────────────────────────────────────────

REQUIRED_FIELDS = ["hcp_name", "interaction_type", "interaction_date", "key_points"]

PRODUCTS_CATALOG = [
    "Keytruda", "Opdivo", "Tecentriq", "Imfinzi", "Libtayo",
    "Humira", "Enbrel", "Remicade", "Stelara", "Dupixent",
    "Eliquis", "Xarelto", "Jardiance", "Ozempic", "Wegovy",
    "Entresto", "Farxiga", "Trulicity", "Victoza", "Mounjaro",
]


def _today() -> str:
    return date.today().isoformat()


def _get_missing_fields(data: Dict[str, Any]) -> List[str]:
    missing = []
    for field in REQUIRED_FIELDS:
        val = data.get(field)
        if val is None or val == "" or val == []:
            missing.append(field)
    return missing


def _field_to_question(field: str) -> str:
    questions = {
        "hcp_name": "Who did you meet with? (Doctor's name)",
        "interaction_type": "How did you interact? (e.g., in-person visit, phone call, virtual meeting)",
        "interaction_date": "When did this interaction take place?",
        "key_points": "What were the key points discussed during the interaction?",
    }
    return questions.get(field, f"Can you provide the {field.replace('_', ' ')}?")


def _extract_json_from_text(text: str) -> Optional[Dict]:
    """Robustly extract JSON from LLM output."""
    # Try direct parse
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass
    # Try extracting from code block
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
    # Try bare JSON object
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass
    return None


def _extract_summary_from_text(text: str) -> Optional[Dict]:
    """Extract JSON from within <SUMMARY> tags."""
    match = re.search(r"<SUMMARY>\s*(.*?)\s*</SUMMARY>", text, re.DOTALL)
    if match:
        return _extract_json_from_text(match.group(1))
    return None


def _is_confirmed(text: str) -> bool:
    """Check if <CONFIRMED>true</CONFIRMED> tag is present."""
    return bool(re.search(r"<CONFIRMED>true</CONFIRMED>", text, re.IGNORECASE))


def _merge_data(existing: Dict, new_data: Dict) -> Dict:
    """Merge extracted data, preferring non-null new values."""
    merged = dict(existing)
    for key, val in new_data.items():
        if val is not None and val != "" and val != [] and val != {}:
            merged[key] = val
    return merged


# ─── Graph Nodes ──────────────────────────────────────────────────────────────

def greet(state: InteractionState) -> InteractionState:
    """Initial greeting node — only runs on first message."""
    greeting = (
        "Hi! I'm your AI assistant for logging HCP interactions. "
        "Just tell me about your recent interaction — who you met with, "
        "what you discussed, and any key takeaways. I'll handle the rest!"
    )
    return {
        **state,
        "stage": "extracting",
        "messages": state["messages"] + [AIMessage(content=greeting)],
    }


def parse_message(state: InteractionState) -> InteractionState:
    """Pass-through node — preserves current stage so routing works correctly."""
    return state


def extract_data(state: InteractionState) -> InteractionState:
    """
    Use gemma2-9b-it to extract structured interaction data.
    When in clarifying stage, includes what was asked + falls back to
    assigning the raw user message directly to the missing field.
    """
    llm = get_primary_llm()

    context = json.dumps(state.get("extracted_data", {}), indent=2)
    current_stage = state.get("stage", "extracting")

    # Get last user message
    user_msgs = [m for m in state["messages"] if isinstance(m, HumanMessage)]
    if not user_msgs:
        return state
    last_user_msg = user_msgs[-1].content.strip()

    # Determine which field is missing (for clarification hint)
    missing = _get_missing_fields(state.get("extracted_data", {}))
    clarification_context = ""
    if current_stage == "clarifying" and missing:
        target_field = missing[0]
        ai_msgs = [m for m in state["messages"] if isinstance(m, AIMessage)]
        last_ai = ai_msgs[-1].content if ai_msgs else ""
        clarification_context = (
            f"\nIMPORTANT: The assistant just asked about '{target_field}' "
            f"with the question: \"{last_ai}\"\n"
            f"The rep's reply is the answer to that question. "
            f"Set '{target_field}' to the value in the rep's message.\n"
        )

    extraction_prompt = EXTRACTION_PROMPT.format(
        message=last_user_msg,
        context=context,
        today=_today(),
        clarification_context=clarification_context,
    )

    merged = dict(state.get("extracted_data", {}))
    try:
        response = llm.invoke([HumanMessage(content=extraction_prompt)])
        new_data = _extract_json_from_text(response.content)
        if new_data:
            merged = _merge_data(merged, new_data)
    except Exception:
        pass

    # Fallback: if still clarifying and the target field is still empty,
    # use the raw user message as the value directly
    if current_stage == "clarifying" and missing:
        target_field = missing[0]
        if not merged.get(target_field):
            merged[target_field] = last_user_msg

    # Default interaction_date to today if still missing
    if not merged.get("interaction_date"):
        merged["interaction_date"] = f"{_today()}T00:00:00"

    return {**state, "extracted_data": merged}


def check_completeness(state: InteractionState) -> InteractionState:
    """Determine which required fields are still missing."""
    missing = _get_missing_fields(state.get("extracted_data", {}))
    return {**state, "missing_fields": missing}


def ask_clarification(state: InteractionState) -> InteractionState:
    """Ask the rep for the next missing required field."""
    missing = state.get("missing_fields", [])
    if not missing:
        return state

    question = _field_to_question(missing[0])
    return {
        **state,
        "stage": "clarifying",
        "messages": state["messages"] + [AIMessage(content=question)],
    }


def build_summary(state: InteractionState) -> InteractionState:
    """
    Use llama-3.3-70b-versatile to build a comprehensive summary
    and present it to the rep for confirmation.
    """
    llm = get_large_llm()

    system = SystemMessage(
        content=SYSTEM_PROMPT.format(today_date=_today())
    )

    # Build conversation history (last 10 turns for context)
    history = state["messages"][-10:]

    # Append instruction to produce the summary
    summary_instruction = HumanMessage(
        content=(
            f"Based on our conversation, here is the data I've captured so far:\n"
            f"{json.dumps(state.get('extracted_data', {}), indent=2)}\n\n"
            "Please present the full interaction summary in the <SUMMARY> JSON format "
            "and ask for confirmation."
        )
    )

    try:
        response = llm.invoke([system] + history + [summary_instruction])
        reply_text = response.content

        # Try to extract updated data from the summary
        summary_data = _extract_summary_from_text(reply_text)
        if summary_data:
            merged = _merge_data(state.get("extracted_data", {}), summary_data)
        else:
            merged = state.get("extracted_data", {})

        return {
            **state,
            "stage": "confirming",
            "extracted_data": merged,
            "messages": state["messages"] + [AIMessage(content=reply_text)],
        }
    except Exception as e:
        fallback = (
            f"Here's what I captured:\n"
            f"```json\n{json.dumps(state.get('extracted_data', {}), indent=2)}\n```\n\n"
            "Does this look correct? Reply 'yes' to save or tell me what to change."
        )
        return {
            **state,
            "stage": "confirming",
            "messages": state["messages"] + [AIMessage(content=fallback)],
        }


def await_confirmation(state: InteractionState) -> InteractionState:
    """
    Process the rep's confirmation or correction.
    Uses gemma2-9b-it to detect confirmation intent.
    """
    llm = get_primary_llm()
    system = SystemMessage(
        content=SYSTEM_PROMPT.format(today_date=_today())
    )

    history = state["messages"][-12:]

    try:
        response = llm.invoke([system] + history)
        reply_text = response.content

        if _is_confirmed(reply_text):
            return {
                **state,
                "confirmed": True,
                "stage": "saving",
                "messages": state["messages"] + [AIMessage(content=reply_text)],
            }

        # Check for plain confirmation words in last user message
        user_msgs = [m for m in state["messages"] if isinstance(m, HumanMessage)]
        if user_msgs:
            last = user_msgs[-1].content.lower().strip()
            confirm_words = {"yes", "correct", "save", "save it", "confirm",
                             "looks good", "that's right", "perfect", "ok", "okay", "yep", "yup"}
            if any(word in last for word in confirm_words):
                confirmed_reply = (
                    "Great! Saving your interaction log now... ✓\n\n"
                    "The interaction has been saved successfully."
                )
                return {
                    **state,
                    "confirmed": True,
                    "stage": "saving",
                    "messages": state["messages"] + [AIMessage(content=confirmed_reply)],
                }

        # Rep wants changes — update extracted data and go back
        summary_data = _extract_summary_from_text(reply_text)
        if summary_data:
            merged = _merge_data(state.get("extracted_data", {}), summary_data)
            return {
                **state,
                "confirmed": False,
                "stage": "confirming",
                "extracted_data": merged,
                "messages": state["messages"] + [AIMessage(content=reply_text)],
            }

        return {
            **state,
            "confirmed": False,
            "stage": "confirming",
            "messages": state["messages"] + [AIMessage(content=reply_text)],
        }

    except Exception:
        return {
            **state,
            "confirmed": False,
            "stage": "confirming",
        }


def save_interaction_node(state: InteractionState) -> InteractionState:
    """
    Mark the interaction as ready to be persisted.
    Actual DB write happens in the API layer with the extracted_data payload.
    """
    interaction_id = str(uuid.uuid4())
    final_message = (
        "Your interaction has been logged successfully! "
        f"(ID: {interaction_id[:8]}...)\n\n"
        "You can view and edit this interaction in your activity log. "
        "Is there anything else you'd like to log?"
    )
    return {
        **state,
        "stage": "saved",
        "interaction_saved": True,
        "saved_interaction_id": interaction_id,
        "messages": state["messages"] + [AIMessage(content=final_message)],
    }


# ─── Routing Logic ────────────────────────────────────────────────────────────

def route_initial(state: InteractionState) -> str:
    """Entry: greet on first turn, otherwise parse the message."""
    if state.get("stage") == "greeting" or not state.get("messages"):
        return "greet"
    return "parse_message"


def route_after_parse(state: InteractionState) -> str:
    """After parse_message: go to confirmation handler if already confirming,
    otherwise start extraction pipeline (covers extracting, clarifying, greeting)."""
    if state.get("stage") == "confirming":
        return "await_confirmation"
    return "extract_data"


def route_after_check(state: InteractionState) -> str:
    if state.get("missing_fields"):
        return "ask_clarification"
    return "build_summary"


def route_after_confirmation(state: InteractionState) -> str:
    if state.get("confirmed"):
        return "save_interaction"
    return "build_summary"


# ─── Build Graph ──────────────────────────────────────────────────────────────

def build_interaction_graph() -> StateGraph:
    graph = StateGraph(InteractionState)

    # Register nodes
    graph.add_node("greet", greet)
    graph.add_node("parse_message", parse_message)
    graph.add_node("extract_data", extract_data)
    graph.add_node("check_completeness", check_completeness)
    graph.add_node("ask_clarification", ask_clarification)
    graph.add_node("build_summary", build_summary)
    graph.add_node("await_confirmation", await_confirmation)
    graph.add_node("save_interaction", save_interaction_node)

    # START → greet (first turn) | parse_message (subsequent turns)
    graph.add_conditional_edges(
        START,
        route_initial,
        {"greet": "greet", "parse_message": "parse_message"},
    )

    # greet ends immediately
    graph.add_edge("greet", END)

    # parse_message → await_confirmation (if stage==confirming) | extract_data
    graph.add_conditional_edges(
        "parse_message",
        route_after_parse,
        {"await_confirmation": "await_confirmation", "extract_data": "extract_data"},
    )

    # Extraction pipeline
    graph.add_edge("extract_data", "check_completeness")
    graph.add_conditional_edges(
        "check_completeness",
        route_after_check,
        {"ask_clarification": "ask_clarification", "build_summary": "build_summary"},
    )
    graph.add_edge("ask_clarification", END)
    graph.add_edge("build_summary", END)

    # Confirmation pipeline
    graph.add_conditional_edges(
        "await_confirmation",
        route_after_confirmation,
        {"save_interaction": "save_interaction", "build_summary": "build_summary"},
    )
    graph.add_edge("save_interaction", END)

    return graph.compile()


# Singleton compiled graph
interaction_graph = build_interaction_graph()


# ─── Public Agent Interface ────────────────────────────────────────────────────

async def run_interaction_agent(
    session_id: str,
    user_message: str,
    existing_state: Optional[Dict] = None,
    rep_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Run one turn of the interaction agent.

    Returns updated state including:
    - reply: the assistant's response text
    - stage: current graph stage
    - extracted_data: structured data captured so far
    - interaction_saved: True if interaction was persisted
    - saved_interaction_id: UUID if saved
    """

    # Build initial state
    if existing_state and existing_state.get("messages"):
        msgs = [
            HumanMessage(content=m["content"]) if m["role"] == "user"
            else AIMessage(content=m["content"])
            for m in existing_state["messages"]
        ]
    else:
        msgs = []

    state: InteractionState = {
        "session_id": session_id,
        "messages": msgs + [HumanMessage(content=user_message)],
        "extracted_data": existing_state.get("extracted_data", {}) if existing_state else {},
        "missing_fields": [],
        "stage": existing_state.get("stage", "greeting") if existing_state else "greeting",
        "confirmed": False,
        "interaction_saved": False,
        "saved_interaction_id": None,
        "rep_id": rep_id,
        "hcp_id": existing_state.get("hcp_id") if existing_state else None,
    }

    # Single ainvoke — the graph routes internally based on state["stage"]
    result = await interaction_graph.ainvoke(
        state,
        config={"run_name": f"turn-{session_id}"},
    )

    # Extract last AI message as the reply
    ai_msgs = [m for m in result["messages"] if isinstance(m, AIMessage)]
    reply = ai_msgs[-1].content if ai_msgs else "I'm ready to help you log an interaction."

    # Serialize messages for storage
    serialized_messages = []
    for m in result["messages"]:
        if isinstance(m, HumanMessage):
            serialized_messages.append({"role": "user", "content": m.content})
        elif isinstance(m, AIMessage):
            serialized_messages.append({"role": "assistant", "content": m.content})

    return {
        "reply": reply,
        "stage": result.get("stage", "extracting"),
        "extracted_data": result.get("extracted_data", {}),
        "interaction_saved": result.get("interaction_saved", False),
        "saved_interaction_id": result.get("saved_interaction_id"),
        "messages": serialized_messages,
    }
