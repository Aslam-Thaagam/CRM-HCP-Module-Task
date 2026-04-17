from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from schemas import ChatRequest, ChatResponse
from agent.graph import build_graph, ALL_FIELDS
from langchain_core.messages import HumanMessage, AIMessage
from database import get_db
from models import HCP
from difflib import get_close_matches
import re

router = APIRouter()


def _extract_mentioned_dr(text: str) -> str | None:
    """Pull out 'Dr. X Y' or 'Dr X' from a raw message string."""
    m = re.search(r'\bdr\.?\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)', text, re.IGNORECASE)
    return m.group(0).strip() if m else None


def _normalise(name: str) -> str:
    return name.lower().replace("dr.", "").replace("dr ", "").strip()


def _validate_hcp(extracted_name: str | None, hcp_names: list[str]) -> tuple[bool, str | None]:
    """
    Returns (is_valid, corrected_name_or_None).
    Tries exact → prefix → fuzzy matching.
    """
    if not extracted_name or not hcp_names:
        return True, extracted_name

    norm_input = _normalise(extracted_name)

    # Exact match
    for name in hcp_names:
        if norm_input == _normalise(name):
            return True, name

    # Partial / prefix match — "Raja" matches "Dr. Raja Kumar"
    partial = [n for n in hcp_names if norm_input in _normalise(n)]
    if len(partial) == 1:
        return True, partial[0]
    if len(partial) > 1:
        # Ambiguous partial → return closest
        return True, partial[0]

    # Fuzzy match using difflib
    normed_names = [_normalise(n) for n in hcp_names]
    close_normed = get_close_matches(norm_input, normed_names, n=3, cutoff=0.55)
    close_names = [hcp_names[normed_names.index(n)] for n in close_normed]

    return False, None  # not found — let caller build the error


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    # Fetch HCP roster
    result = await db.execute(select(HCP).where(HCP.is_active != 0))
    hcps = result.scalars().all()
    hcp_names = [f"Dr. {h.first_name} {h.last_name}" for h in hcps]

    # Build message list for LangGraph
    lc_messages = [
        HumanMessage(content=m.content) if m.role == "user"
        else AIMessage(content=m.content)
        for m in request.messages
    ]

    cs = request.current_state or {}
    initial_state = {
        "messages": lc_messages,
        "is_complete": False,
        "missing_required": None,
        **{f: cs.get(f) for f in ALL_FIELDS},
    }

    # Rebuild graph with current HCP list each call (lightweight compile)
    graph = build_graph(hcp_names)
    result_state = await graph.ainvoke(initial_state)

    last_ai = next(
        (m for m in reversed(result_state["messages"]) if isinstance(m, AIMessage)),
        None,
    )
    message_text = last_ai.content if last_ai else "I couldn't process that. Please try again."

    extracted_data = {f: result_state.get(f) for f in ALL_FIELDS}

    # ── Backend safety net: validate hcp_name even if LLM missed it ──────────
    # Also catch: user mentioned a Dr name but LLM already cleared hcp_name to null
    extracted_hcp = extracted_data.get("hcp_name")
    prev_hcp = (request.current_state or {}).get("hcp_name")

    if not extracted_hcp and not prev_hcp and hcp_names:
        last_msg = next((m.content for m in reversed(request.messages) if m.role == "user"), "")
        mentioned = _extract_mentioned_dr(last_msg)
        if mentioned:
            is_valid, corrected = _validate_hcp(mentioned, hcp_names)
            if not is_valid:
                norm_input = _normalise(mentioned)
                normed = [_normalise(n) for n in hcp_names]
                close_normed = get_close_matches(norm_input, normed, n=4, cutoff=0.45)
                suggestions = [hcp_names[normed.index(n)] for n in close_normed]
                shown = suggestions if suggestions else hcp_names[:5]
                names_str = ", ".join(shown)
                if suggestions:
                    message_text = f"I don't see '{mentioned}' in the portal — did you mean {names_str}? Please use the registered name so I can log the visit correctly."
                else:
                    message_text = f"'{mentioned}' isn't registered here yet. Some available HCPs: {names_str}. You can add new doctors from the HCPs page."
            elif corrected:
                extracted_data["hcp_name"] = corrected

    if extracted_hcp:
        is_valid, corrected = _validate_hcp(extracted_hcp, hcp_names)
        if is_valid and corrected and corrected != extracted_hcp:
            # Auto-corrected partial match → silently use full name
            extracted_data["hcp_name"] = corrected
        elif not is_valid:
            # Not in the system — generate a clear error response
            extracted_data["hcp_name"] = None
            result_state["is_complete"] = False

            # Find closest suggestions
            norm_input = _normalise(extracted_hcp)
            normed = [_normalise(n) for n in hcp_names]
            close_normed = get_close_matches(norm_input, normed, n=4, cutoff=0.45)
            suggestions = [hcp_names[normed.index(n)] for n in close_normed]
            shown = suggestions if suggestions else hcp_names[:5]

            if suggestions:
                names_str = ", ".join(suggestions)
                message_text = f"I don't see '{extracted_hcp}' in the portal — did you mean {names_str}? Please use the registered name so I can log the visit correctly."
            else:
                names_str = ", ".join(hcp_names[:5])
                message_text = f"'{extracted_hcp}' isn't registered here yet. Some available HCPs: {names_str}. You can add new doctors from the HCPs page."

    return ChatResponse(
        message=message_text,
        extracted_data=extracted_data,
        is_complete=result_state.get("is_complete", False),
        missing_required=result_state.get("missing_required"),
        ai_suggested_followups=result_state.get("ai_suggested_followups"),
    )
