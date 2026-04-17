# HCP Field CRM — 15-Minute Video Walkthrough Script

---

## INTRO (0:00 – 0:45) — The Problem

> Start with the problem, not the code.

"Pharma field reps visit 8 to 10 doctors every single day. After every visit they have to manually fill a form — doctor name, visit type, date, time, what was discussed, materials shared, samples given, follow-up actions. That's a lot of repetitive logging at the end of a long day.

The idea behind this app is simple: instead of filling out a form, you just tell the AI what happened in plain English — and it fills the entire form for you automatically.

Let me show you how it works."

---

## SECTION 1 (0:45 – 2:30) — Live Demo First

> Show the app working before explaining the code. Let the product speak.

**Steps to demo:**
1. Open `http://localhost:5173`
2. Show the Login page — sign up with a name, email, password
3. Land on Dashboard — show the stats cards, recent interactions, bar chart
4. Go to HCPs page — show the search, specialty filter chips, add a new HCP
5. Go to Log Interaction — show the split-screen layout
6. Type in chat: `"Met Dr. Arjun Sharma yesterday at Apollo, discussed Cardiomax efficacy, he was positive, shared the clinical trial brochure"`
7. Watch the form auto-fill on the left in real time
8. Show the Save button appearing in chat when all fields are complete
9. Click Save — show the success state

**One-liner to say:** "One message. Everything filled. That's the whole idea."

---

## SECTION 2 (2:30 – 4:00) — Architecture Overview

> Draw/show a simple flow diagram or just talk through it.

```
User types message
       ↓
React frontend (Redux)
       ↓
POST /api/chat/  (FastAPI)
       ↓
LangGraph Agent (Groq LLM)
       ↓
Extracted fields JSON
       ↓
Backend validates HCP name
       ↓
Response → Redux mergeExtracted → Form auto-fills
```

**Three layers to explain:**

1. **Frontend** — React 18 + Redux Toolkit + Vite. The form and chat are in sync through shared Redux state. When the AI returns extracted fields, a `mergeExtracted` reducer patches only the fields that came back — never wipes what's already there.

2. **Backend** — Python FastAPI with async SQLAlchemy. Every chat message hits `POST /api/chat/`, which fetches the live HCP list from the DB and passes it into the LangGraph agent.

3. **AI Layer** — LangGraph wraps a Groq LLM. The agent receives the full conversation history + whatever's already been extracted as context, extracts new fields, and returns structured JSON.

---

## SECTION 3 (4:00 – 6:30) — The AI Agent (Most Important Part)

> This is the technical heart — spend the most time here.

### Why LangGraph?

LangGraph is a stateful graph framework built on top of LangChain. It lets you define nodes (processing steps) and edges (flow between them). For this use case, we have one node — `extract` — which runs the LLM and returns updated state. The state persists across turns.

```
START → extract → END
```

It's a simple single-node graph, but the power is in the **state management** — `InteractionState` is a TypedDict that holds all 13 fields plus the conversation messages. LangGraph's `add_messages` annotation handles message accumulation automatically.

### The Prompt Strategy

The system prompt does four things:

1. **Injects today's date context** — so the LLM can resolve "yesterday", "last Monday", "next Friday" accurately without hallucinating.

2. **Injects the registered HCP list** — so the LLM knows exactly which doctor names are valid. If the user mentions someone not on the list, the LLM sets `hcp_name` to null and writes an error message.

3. **Passes already-extracted fields** — so the LLM never re-asks for something you've already told it. Rule 7 in the prompt: "NEVER re-ask for a field that already has a value in ALREADY EXTRACTED."

4. **Enforces a strict JSON response format** — the LLM always returns a JSON object with `message`, `extracted`, `is_complete`, and `missing_required`. No markdown, no prose. We parse this with a regex fallback in `_extract_json()`.

### Model Choice

Using **Groq's `llama-3.1-8b-instant`** — it's free, extremely fast (token streaming in ~300ms), and the 8B model handles structured JSON extraction reliably at low temperature (0.1). Temperature is intentionally low because we want deterministic field extraction, not creative writing.

---

## SECTION 4 (6:30 – 8:00) — HCP Validation (Smart Detail)

> This shows you thought beyond just "call the LLM".

Two-layer validation — LLM first, backend safety net second.

**Layer 1 — LLM prompt**: The registered HCP list is injected into every prompt. The LLM is instructed to only accept names from that list. If a name doesn't match, it sets `hcp_name: null` and writes a friendly error like "I don't see Dr. X in the system — did you mean Dr. Y?"

**Layer 2 — Backend (`chat.py`)**:
Even if the LLM makes a mistake, the backend runs its own check using **three levels of matching**:

```
exact match → "dr. arjun sharma" == "dr. arjun sharma" ✓
    ↓ if not found
prefix match → "arjun" is contained in "dr. arjun sharma" ✓
    ↓ if not found
fuzzy match → difflib.get_close_matches(cutoff=0.55) — catches typos
    ↓ if still not found
error response with suggestions
```

There's also a regex `_extract_mentioned_dr()` that catches cases where the user says "Dr. Arjun" but the LLM had already cleared `hcp_name` to null — the backend catches the mention from the raw message text and validates it independently.

---

## SECTION 5 (8:00 – 9:30) — Date & Time Parser

> Another piece of real engineering — custom, not just LLM guessing.

The LLM is not reliable for date math. "Last Monday" when today is Wednesday — the LLM might get it wrong. So we built `date_utils.py` as a deterministic resolver that runs **after** the LLM extracts the raw string.

**What it handles:**
- Keywords: `today`, `yesterday`, `tomorrow`, `day after tomorrow`
- Relative: `2 days ago`, `3 weeks from now`
- Weekdays: `last Monday`, `next Friday`, `this Thursday`
- Ordinals: `24th April`, `April 24th`, `24 April`, `June 15`
- Month only: `in June` → `2026-06-01`
- Year: `next year` → `2027`, `last year` → `2025`
- Times: `7pm` → `19:00`, `10:30am` → `10:30`, `morning` → `09:00`
- Fallback: `dateparser` library for anything else

The flow: LLM extracts `"24th april"` as a string → `resolve_datetime_fields()` converts it to `"2026-04-24"` → stored in state. The form receives a clean ISO date.

---

## SECTION 6 (9:30 – 11:00) — Frontend Architecture

> Keep this shorter — show the code, don't over-explain.

**Redux state slices:**
- `authSlice` — login, signup, logout, session persisted in localStorage (no backend auth needed for a demo)
- `hcpSlice` — fetches and caches the HCP list
- `interactionSlice` — holds `formData` for every form field, `mergeExtracted` patches fields from AI response
- `chatSlice` — holds message history, calls `POST /api/chat/`, dispatches `mergeExtracted` when response arrives

**Key design decision — shared state sync:**
The form and chat don't talk to each other directly. They both read from the same Redux store. When the AI returns extracted fields, `chatSlice` dispatches `mergeExtracted` to `interactionSlice`. The form re-renders automatically. No prop drilling, no callbacks.

**UX details worth mentioning:**
- Dynamic textarea — grows as you type up to 150px, then scrolls internally
- Chat scroll is scoped to the chat container — pressing Enter doesn't scroll the whole page
- `is_complete: true` from the backend triggers the Save button in chat
- Contact detail field appears conditionally — only when type is Email or Call

---

## SECTION 7 (11:00 – 12:00) — Database & Auto-Setup

> Quick but impressive.

**Models:** Two tables — `hcps` and `interactions`. UUID primary keys on HCPs. SQLAlchemy async with `aiomysql` driver for non-blocking DB calls.

**Auto-setup on first run:**
```python
async def _ensure_database_exists():
    # connects to MySQL without a database
    # runs CREATE DATABASE IF NOT EXISTS log_crm
    # then SQLAlchemy creates all tables via Base.metadata.create_all
```

Zero manual setup. Just point the `.env` at your MySQL instance, start the server, and everything is created.

---

## SECTION 8 (12:00 – 13:30) — What Makes This Different

> This is your "why I built it this way" section — shows thinking.

**1. Stateless backend, stateful frontend**
The backend doesn't store conversation sessions. Every request sends the full message history + current extracted state. This means the backend is horizontally scalable from day one — any server instance can handle any request.

**2. LLM as extractor, not decider**
The LLM's job is to extract structured data from free text — not to make business logic decisions. Validation, HCP matching, date resolution — all handled by deterministic Python code. This makes the system predictable and debuggable.

**3. Progressive disclosure in chat**
The bot asks for one missing field at a time. It never dumps all required fields in one message. This feels like a conversation, not a form with validation errors.

**4. Graceful degradation**
If the LLM returns malformed JSON, `_extract_json()` uses regex to find the JSON block. If Groq hits the daily rate limit, the error surfaces cleanly in the chat. Nothing crashes silently.

---

## SECTION 9 (13:30 – 14:30) — Quick Code Tour

> Screen-share the actual files for 60 seconds.

Show these files quickly:
- `backend/agent/graph.py` — the LangGraph node and prompt
- `backend/routers/chat.py` — HCP validation logic
- `backend/utils/date_utils.py` — date resolver
- `frontend/src/store/slices/chatSlice.js` — `mergeExtracted` dispatch
- `frontend/src/store/slices/interactionSlice.js` — `mergeExtracted` reducer

---

## OUTRO (14:30 – 15:00) — Wrap Up

"The goal was to eliminate form-filling for field reps. A single chat message — the AI extracts everything, fills the form, and you hit save.

The interesting engineering here is not just calling an LLM. It's the validation layer on top of it, the deterministic date resolver, the stateful Redux sync between chat and form, and the design choice to keep the backend stateless so it's easy to scale.

Built end-to-end in the 60-hour window. Thank you."

---

## Quick Reference — Tech Stack

| What | Tool | Why |
|---|---|---|
| AI framework | LangGraph | Stateful multi-turn agent, clean node/edge model |
| LLM | Groq llama-3.1-8b-instant | Free, fast (~300ms), reliable JSON extraction |
| Backend | FastAPI + SQLAlchemy async | Non-blocking, auto-docs at /docs |
| Database | MySQL + aiomysql | Relational, async driver |
| Frontend | React 18 + Redux Toolkit | Shared state sync between form and chat |
| Build | Vite | Fast HMR during development |

---

## Numbers to Drop In the Video

- **13 fields** extracted from a single chat message
- **3-level HCP matching**: exact → prefix → fuzzy (difflib)
- **15+ date/time formats** handled deterministically
- **0 manual DB setup** — database and tables created on first run
- **~800–1,200 tokens** per chat turn (full history sent every time)
- **100,000 tokens/day** on Groq free tier — roughly 80–120 conversations

---

## If Asked "Why Not Just Use ChatGPT Directly?"

"We need structured data — specific fields in specific formats — that go into a database. A raw ChatGPT conversation doesn't give you that. LangGraph gives us a typed state container where we control exactly what gets extracted and validated. The LLM is the parser; the application logic is ours."

---

## If Asked "What Would You Add Next?"

- Voice input — field reps are in cars between visits, typing is inconvenient
- Offline mode — sync when back on network
- Multi-rep support with manager dashboard
- Push reminders for follow-up actions
- Integration with CRM systems like Salesforce or Veeva
