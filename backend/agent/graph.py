from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langgraph.graph import StateGraph, END, START
from .state import InteractionState
from utils.date_utils import resolve_datetime_fields
from datetime import datetime, timedelta
import json
import re
import os
from dotenv import load_dotenv

load_dotenv()

# ── Prompt ────────────────────────────────────────────────────────────────────

SYSTEM_PROMPT_TEMPLATE = """\
You are a CRM assistant for pharma field reps. Your job is to extract HCP interaction details from conversation and return structured JSON.

=== TODAY'S CONTEXT ===
Date: {today} ({weekday}) | Time: {now_time}
Yesterday: {yesterday} | Tomorrow: {tomorrow}

=== DATE RULES ===
- Always output interaction_date as YYYY-MM-DD
- Relative: today={today}, yesterday={yesterday}, tomorrow={tomorrow}
- Weekdays: "last Monday", "next Friday", "this Thursday" → calculate from {today}
- Ordinal: "24th April", "April 24th", "24 April" → use current year unless stated otherwise
- Month only: "in June", "next June" → 1st of that month, current or next year
- "Next year" → year {next_year}. "Last year" → year {last_year}
- Combined date+time like "April 24th 7pm" → split into interaction_date=2026-04-24 AND interaction_time=19:00

=== TIME RULES ===
- Always output interaction_time as HH:MM (24-hour)
- "7pm"→19:00, "7am"→07:00, "10:30am"→10:30, "10:30pm"→22:30
- "morning"→09:00, "afternoon"→14:00, "evening"→18:00, "night"→20:00
- No time mentioned → leave null, do not ask unless other required fields are done

=== REGISTERED HCPs (ONLY these are valid) ===
{hcp_list}

IMPORTANT: hcp_name MUST exactly match one of the names above (case-insensitive).
- If the user mentions a doctor not in this list → set hcp_name to null and set hcp_validation_error to a friendly message explaining the doctor is not registered, and list 3-5 available names.
- If the user mentions a partial name or nickname that clearly refers to one of the above doctors, use the full registered name.

=== REQUIRED FIELDS ===
hcp_name, interaction_type (Meeting/Call/Email/Conference/Dinner Program/Lunch & Learn/Other), interaction_date, topics_discussed

=== OPTIONAL FIELDS ===
interaction_time, contact_detail, attendees, materials_shared (list), samples_distributed (list),
sentiment (Positive/Neutral/Negative — infer from tone), outcomes, follow_up_actions,
ai_suggested_followups (2-3 smart next-step suggestions when hcp_name + topics known)

=== CONTACT DETAIL RULE ===
- If interaction_type is "Email" and contact_detail is not yet captured → ask: "What email address did you use to reach them?"
- If interaction_type is "Call" and contact_detail is not yet captured → ask: "What number did you call them on?"
- Store the answer in contact_detail (e.g. "arjun@apollo.com" or "+91 98765 43210")
- For other interaction types (Meeting, Conference, etc.) leave contact_detail as null

=== RESPONSE FORMAT (strict JSON, no markdown) ===
{{
  "message": "Write a real helpful sentence here — never copy this placeholder text",
  "hcp_validation_error": null,
  "extracted": {{
    "hcp_name": null,
    "interaction_type": null,
    "interaction_date": null,
    "interaction_time": null,
    "contact_detail": null,
    "attendees": null,
    "topics_discussed": null,
    "materials_shared": null,
    "samples_distributed": null,
    "sentiment": null,
    "outcomes": null,
    "follow_up_actions": null,
    "ai_suggested_followups": null
  }},
  "is_complete": false,
  "missing_required": ["hcp_name", "interaction_type", "interaction_date", "topics_discussed"]
}}

MESSAGE FIELD RULES — read carefully:
- ALWAYS write a real sentence in "message". Never output "conversational reply", "string", or any template text.
- If details were extracted: confirm what you got and ask for the next missing field. E.g. "Got it — noted Dr. Sharma. What type of interaction was this — a visit, call, or email?"
- If hcp_name is unknown: set hcp_validation_error to a friendly sentence like "I don't see [name] in the system. Did you mean Dr. X or Dr. Y?"
- If redirecting off-topic: "I'm here to log HCP visits! Tell me who you met, when, and what was discussed."

RULES:
1. Preserve all previously extracted values — only update fields with new information
2. is_complete = true only when ALL 4 required fields have values AND hcp_name is valid
3. When complete, summarise everything in message
4. Infer sentiment from tone: enthusiastic/positive → Positive, skeptical/resistant → Negative
5. Generate ai_suggested_followups when hcp_name + topics_discussed are both known
6. STAY ON TASK — redirect greetings and small talk: "I'm here to log HCP visits! Tell me who you met, when, and what was discussed."
7. NEVER re-ask for a field that already has a value in ALREADY EXTRACTED. Only ask for missing fields.
8. Ask for ONE missing field at a time — don't ask multiple questions in one message.
9. When user gives a date like "24th april" or "April 24" — extract it directly as interaction_date, do not ask to confirm unless it is genuinely ambiguous.
10. When user gives a time like "7pm", "morning", "3:30pm" — extract as interaction_time immediately."""


def _build_system_prompt(hcp_names: list[str]) -> str:
    now = datetime.now()
    if hcp_names:
        hcp_list_str = "\n".join(f"  - {name}" for name in hcp_names)
    else:
        hcp_list_str = "  (No HCPs registered yet — ask the user to add HCPs first)"

    return SYSTEM_PROMPT_TEMPLATE.format(
        today=now.strftime("%Y-%m-%d"),
        weekday=now.strftime("%A"),
        now_time=now.strftime("%H:%M"),
        yesterday=(now - timedelta(days=1)).strftime("%Y-%m-%d"),
        tomorrow=(now + timedelta(days=1)).strftime("%Y-%m-%d"),
        next_year=now.year + 1,
        last_year=now.year - 1,
        hcp_list=hcp_list_str,
    )


# ── LLM ───────────────────────────────────────────────────────────────────────

llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model="llama-3.1-8b-instant",
    temperature=0.1,
)

ALL_FIELDS = [
    "hcp_name", "interaction_type", "interaction_date", "interaction_time",
    "contact_detail", "attendees", "topics_discussed", "materials_shared",
    "samples_distributed", "sentiment", "outcomes", "follow_up_actions",
    "ai_suggested_followups",
]

# ── Helpers ───────────────────────────────────────────────────────────────────

def _extract_json(text: str) -> dict:
    text = text.strip()
    # Strip markdown code fences if present
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    match = re.search(r'\{[\s\S]*\}', text)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    return {}


# ── Graph node ────────────────────────────────────────────────────────────────

def make_extract_node(hcp_names: list[str]):
    """Returns an extract_node function that has access to the HCP roster."""

    def extract_node(state: InteractionState) -> dict:
        messages = state["messages"]
        current = {f: state.get(f) for f in ALL_FIELDS}

        system_content = _build_system_prompt(hcp_names)
        system_content += f"\n\n=== ALREADY EXTRACTED ===\n{json.dumps(current, indent=2)}"
        system = SystemMessage(content=system_content)

        response = llm.invoke([system] + messages)
        parsed = _extract_json(response.content)

        extracted = parsed.get("extracted", {})
        resolve_datetime_fields(extracted)

        message_text = parsed.get("message", response.content)
        hcp_error = parsed.get("hcp_validation_error")
        is_complete = parsed.get("is_complete", False)
        missing = parsed.get("missing_required", [])

        # If LLM flagged a validation error, embed it in the message
        if hcp_error:
            message_text = hcp_error
            is_complete = False

        updates: dict = {"is_complete": is_complete, "missing_required": missing}

        for field in ALL_FIELDS:
            new_val = extracted.get(field)
            if new_val is not None:
                updates[field] = new_val
            elif state.get(field) is not None:
                updates[field] = state[field]

        ai_msg = AIMessage(content=message_text)
        updates["messages"] = [ai_msg]
        return updates

    return extract_node


def build_graph(hcp_names: list[str] = None):
    graph = StateGraph(InteractionState)
    graph.add_node("extract", make_extract_node(hcp_names or []))
    graph.add_edge(START, "extract")
    graph.add_edge("extract", END)
    return graph.compile()
