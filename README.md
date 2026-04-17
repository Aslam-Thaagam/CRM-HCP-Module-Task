# Thaagam Field CRM — HCP Module

> **AI-First CRM for Life Science Field Representatives**
> Round 1 Technical Assignment — Log Interaction Screen

---

## Overview

Thaagam Field is an AI-first Customer Relationship Management (CRM) system built for pharmaceutical and biotech field representatives. It focuses on the **HCP (Healthcare Professional) Module**, specifically the **Log Interaction Screen** — a dual-interface screen that allows reps to log HCP interactions either through a **structured form** or a **natural-language AI chat** powered by LangGraph + Groq.

### What Makes It "AI-First"

- A **LangGraph agent** orchestrates the entire conversational logging flow — greeting, extraction, clarification, summarization, confirmation, and saving.
- **gemma2-9b-it** (via Groq) handles fast entity extraction and chat responses.
- **llama-3.3-70b-versatile** (via Groq) handles complex reasoning and structured summaries.
- The AI extracts HCP name, interaction type, date, products, sentiment, objections, and next steps from free-form text — no form filling required.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Redux Toolkit + Vite |
| State Management | Redux (RTK slices: chat, interactions, hcps) |
| Backend | Python 3.11 + FastAPI (async) |
| AI Agent Framework | **LangGraph** (StateGraph with typed nodes) |
| LLM Provider | **Groq** — `gemma2-9b-it` + `llama-3.3-70b-versatile` |
| Database | MySQL (via SQLAlchemy async + aiomysql) |
| ORM | SQLAlchemy 2.x (async) |
| Font | Google Inter |

---

## Project Structure

```
Thaagam-Field-V2/
├── backend/
│   ├── agents/
│   │   ├── interaction_agent.py   # LangGraph StateGraph — full agent pipeline
│   │   └── prompts.py             # System prompt + extraction prompt templates
│   ├── routers/
│   │   ├── chat.py                # POST /api/chat — LangGraph turn handler
│   │   ├── hcp.py                 # CRUD for HCP records
│   │   └── interactions.py        # CRUD for interaction logs
│   ├── config.py                  # Pydantic settings (Groq key, DB URL, CORS)
│   ├── database.py                # Async SQLAlchemy engine + session factory
│   ├── models.py                  # SQLAlchemy ORM models (HCP, Interaction, ChatSession)
│   ├── schemas.py                 # Pydantic request/response schemas
│   ├── seed.py                    # Dev seed script — populates HCP records
│   ├── main.py                    # FastAPI app, CORS middleware, router registration
│   ├── .env                       # Environment variables (Groq key, DB URL)
│   └── requirements.txt           # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LogInteractionScreen/
│   │   │   │   ├── index.jsx          # Side-by-side layout (form left, chat right)
│   │   │   │   ├── StructuredForm.jsx # Full structured form with validation
│   │   │   │   └── ChatInterface.jsx  # AI chat UI with message bubbles
│   │   │   ├── common/
│   │   │   │   ├── Header.jsx
│   │   │   │   └── Sidebar.jsx
│   │   ├── store/
│   │   │   ├── index.js
│   │   │   └── slices/
│   │   │       ├── chatSlice.js         # Chat state + sendChatMessage thunk
│   │   │       ├── interactionSlice.js  # Form state + createInteraction thunk
│   │   │       └── hcpSlice.js          # HCP list state
│   │   ├── services/
│   │   │   └── api.js             # Axios instance + hcpApi, interactionApi, chatApi
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vite.config.js             # Vite dev server + proxy /api → localhost:8505
│   └── package.json
│
├── requirements.txt               # Root-level Python deps (mirrors backend/)
└── README.md
```

---

## Setup & Running

### Prerequisites

- Python 3.11+
- Node.js 18+
- MySQL running locally on port 3306
- A Groq API key from [console.groq.com](https://console.groq.com)

### 1. Create the MySQL Database

```sql
CREATE DATABASE thaagam_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure environment
# Edit .env with your Groq API key and MySQL credentials:
# GROQ_API_KEY=gsk_...
# DATABASE_URL=mysql+aiomysql://root:root@localhost:3306/thaagam_crm
# CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175

# Start the backend (port 8505)
uvicorn main:app --host 0.0.0.0 --port 8505 --reload

# (Optional) Seed sample HCP records
python seed.py
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server (proxies /api → http://localhost:8505)
npm run dev
```

Frontend runs at: **http://localhost:5173**
Backend runs at: **http://localhost:8505**
API docs (Swagger): **http://localhost:8505/docs**

---

## Database Schema

### `hcps`
| Column | Type | Notes |
|---|---|---|
| id | VARCHAR(36) PK | UUID |
| first_name | VARCHAR(100) | |
| last_name | VARCHAR(100) | |
| npi_number | VARCHAR(20) | Unique |
| specialty | ENUM | Oncology, Cardiology, etc. |
| institution | VARCHAR(255) | Hospital / clinic |
| tier | INT | 1 = KOL, 3 = standard |
| is_active | BOOL | Soft delete |

### `interactions`
| Column | Type | Notes |
|---|---|---|
| id | VARCHAR(36) PK | UUID |
| hcp_id | FK → hcps.id | |
| rep_id | VARCHAR(100) | Field rep identifier |
| interaction_type | ENUM | In-Person Visit, Phone Call, etc. |
| interaction_date | DATETIME | |
| products_discussed | JSON | Array of product names |
| key_points | TEXT | |
| sentiment | ENUM | Very Positive → Very Negative |
| samples_provided | JSON | `{product: qty}` |
| source | VARCHAR(20) | `"form"` or `"chat"` |
| raw_chat_transcript | TEXT | Stored when source = chat |

### `chat_sessions`
| Column | Type | Notes |
|---|---|---|
| session_id | VARCHAR(100) UNIQUE | Frontend-generated UUID |
| messages | JSON | Full conversation history |
| extracted_data | JSON | Current extraction state |
| stage | VARCHAR(50) | greeting / extracting / clarifying / confirming / saved |
| interaction_id | FK → interactions.id | Set once saved |

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/hcps/` | List HCPs (search/filter) |
| POST | `/api/hcps/` | Create HCP |
| PATCH | `/api/hcps/{id}` | Update HCP |
| DELETE | `/api/hcps/{id}` | Deactivate HCP |
| GET | `/api/interactions/` | List interactions (filter by HCP, rep, date) |
| POST | `/api/interactions/` | Create interaction (form source) |
| PATCH | `/api/interactions/{id}` | Edit interaction |
| DELETE | `/api/interactions/{id}` | Delete interaction |
| POST | `/api/chat/` | Send message to LangGraph agent |
| GET | `/api/chat/{session_id}` | Retrieve chat session |
| DELETE | `/api/chat/{session_id}` | Clear chat session |
| GET | `/health` | Health check |

---

## LangGraph Agent Architecture

### Role of the Agent

The LangGraph agent acts as a **conversational CRM assistant** for field reps. Instead of manually filling out a form, a rep describes their HCP visit in plain English. The agent:

1. **Greets** the rep and explains what it needs.
2. **Extracts** structured data (HCP, type, date, products, sentiment) from free-form text using `gemma2-9b-it`.
3. **Identifies missing required fields** and asks concise clarifying questions one at a time.
4. **Builds a structured summary** using `llama-3.3-70b-versatile` and presents it for confirmation.
5. **Saves the interaction** to the database upon confirmation.

### Graph Topology

```
[START]
   │
   ▼
route_initial ──── (stage == greeting) ──→ greet ──→ [END]
   │
   └── (stage != greeting) ──→ parse_message
                                    │
                          (stage == confirming) ──→ await_confirmation
                                    │                      │
                          (else)    │              confirmed? ──→ save_interaction ──→ [END]
                                    ▼                      │
                               extract_data        (no) → build_summary ──→ [END]
                                    │
                          check_completeness
                                    │
                      missing? ──→ ask_clarification ──→ [END]
                                    │
                      complete? ──→ build_summary ──→ [END]
```

### State Definition (`InteractionState`)

```python
class InteractionState(TypedDict):
    session_id: str
    messages: List[Any]        # Full conversation (LangChain message objects)
    extracted_data: Dict       # Structured fields captured so far
    missing_fields: List[str]  # Required fields still empty
    stage: str                 # Current pipeline stage
    confirmed: bool            # Whether rep confirmed the summary
    interaction_saved: bool    # Whether DB write is complete
    rep_id: Optional[str]
    hcp_id: Optional[str]
```

---

## Five LangGraph Tools

### Tool 1: Log Interaction (`log_interaction`)

**Purpose:** Capture a new HCP interaction from free-form text or form data and persist it to the database.

**How it works:**
1. The rep sends a natural-language description (e.g. *"Just visited Dr. Smith at MGH, discussed Keytruda for NSCLC, she was very receptive"*).
2. `gemma2-9b-it` runs the `EXTRACTION_PROMPT` and returns a JSON object with all detected fields.
3. The agent merges new extractions with existing session state (never overwrites confirmed data).
4. Missing required fields (`hcp_name`, `interaction_type`, `interaction_date`, `key_points`) are identified.
5. `llama-3.3-70b-versatile` builds a structured `<SUMMARY>` block and requests confirmation.
6. On confirmation, the API layer resolves the HCP UUID from the database and writes the `Interaction` row.

**LLM role:** Entity extraction (gemma2-9b-it), summarization + reasoning (llama-3.3-70b-versatile).

---

### Tool 2: Edit Interaction (`edit_interaction`)

**Purpose:** Allow a rep to modify an already-logged interaction — correct wrong information, add missed details, or update outcomes.

**How it works:**
1. Rep references a previous interaction ("update my last log with Dr. Patel — she actually ordered 3 samples, not 2").
2. The agent fetches the existing interaction record by ID or by recent history lookup.
3. `gemma2-9b-it` extracts the delta — only the fields the rep wants changed.
4. The agent presents the updated summary with changed fields highlighted.
5. On confirmation, a `PATCH /api/interactions/{id}` call updates only the modified fields.

**LLM role:** Delta extraction (what changed), confirmation of the update.

---

### Tool 3: Summarize Interaction (`summarize_interaction`)

**Purpose:** Generate a professional, concise narrative summary of an interaction for sharing with managers or inserting into CRM notes.

**How it works:**
1. Triggered when the rep says "summarize this" or "give me a write-up".
2. `llama-3.3-70b-versatile` receives the full `extracted_data` and conversation history.
3. Produces a 2–3 sentence professional narrative suitable for a CRM activity note.
4. Rep can copy/paste or it auto-populates the `ai_summary` field on the Interaction record.

**LLM role:** Long-form natural-language generation from structured data.

---

### Tool 4: Suggest Follow-Up (`suggest_follow_up`)

**Purpose:** Analyze the interaction content and suggest specific, actionable next steps based on the HCP's specialty, sentiment, and products discussed.

**How it works:**
1. Runs automatically after data extraction when sentiment or objections are detected.
2. `llama-3.3-70b-versatile` receives: products discussed, HCP specialty, sentiment, objections.
3. Returns 2–4 suggested follow-up actions (e.g. *"Send NSCLC Phase III trial data to Dr. Lee within 3 days"*, *"Schedule dinner program invitation for Q2"*).
4. Suggestions appear as clickable chips that auto-populate the `next_steps` field.

**LLM role:** Clinical + sales domain reasoning to generate contextually relevant follow-ups.

---

### Tool 5: Search HCP (`search_hcp`)

**Purpose:** Resolve an HCP name mentioned in conversation to a verified database record, handling partial names, typos, and titles.

**How it works:**
1. When the agent extracts an `hcp_name` string, it calls this tool before proceeding.
2. Performs a fuzzy `ILIKE` search on `first_name` + `last_name` in the `hcps` table.
3. If multiple matches are found, the agent asks the rep to disambiguate ("Did you mean Dr. Jane Smith (Oncology) or Dr. John Smith (Cardiology)?").
4. If no match is found, the agent offers to create a new HCP record inline.
5. On resolution, `hcp_id` is set in session state and used for the DB write.

**LLM role:** Disambiguation phrasing when multiple matches exist.

---

## UI: Log Interaction Screen

The screen is split into two always-visible panels:

```
┌─────────────────────────────────┬──────────────────────────────┐
│  📋 Interaction Details         │  🤖 AI Assistant             │
│  (Structured Form)              │  gemma2-9b-it · Groq         │
│                                 │                              │
│  HCP Name        [dropdown]     │  Hi! I'm your AI assistant   │
│  Interaction Type [dropdown]    │  for logging HCP             │
│  Date & Time     [picker]       │  interactions...             │
│  Duration        [input]        │                              │
│  Location        [input]        │  > Just visited Dr. Smith    │
│  Products        [tag pills]    │                              │
│  Key Points      [textarea]     │  [message bubbles]           │
│  Next Steps      [textarea]     │                              │
│  Follow-up Date  [datepicker]   │  [textarea input]  [Send ↵]  │
│  Sentiment       [radio pills]  │                              │
│  Objections      [textarea]     │                              │
│                                 │                              │
│  [Clear]    [Log Interaction]   │                              │
└─────────────────────────────────┴──────────────────────────────┘
```

- **Form → Chat**: AI-extracted data can be copied into the form with the "← Fill Form" button.
- **Chat → Form**: After AI logging, the rep can review and edit the interaction in form view.
- Both panels are always visible — no mode switching required.

---

## Environment Variables

```env
# backend/.env
GROQ_API_KEY=gsk_...               # From console.groq.com
DATABASE_URL=mysql+aiomysql://root:root@localhost:3306/thaagam_crm
APP_SECRET_KEY=your-secret-key
APP_ENV=development
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175
```

---

## Key Dependencies

### Backend
```
fastapi
uvicorn[standard]
sqlalchemy[asyncio]
aiomysql
pydantic-settings
langchain-groq
langgraph
langchain-core
python-dotenv
```

### Frontend
```
react + react-dom
@reduxjs/toolkit + react-redux
axios
react-router-dom
uuid
vite + @vitejs/plugin-react
```

---

## Architecture Summary

```
Browser (React + Redux)
    │
    │  /api/* (proxied by Vite dev server)
    ▼
FastAPI (port 8505)
    ├── /api/hcps        → hcp.py router        → MySQL (hcps table)
    ├── /api/interactions → interactions.py      → MySQL (interactions table)
    └── /api/chat         → chat.py router
                               │
                               ▼
                         LangGraph Agent (interaction_agent.py)
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
             gemma2-9b-it          llama-3.3-70b-versatile
             (Groq API)            (Groq API)
             Entity extraction     Summarization + Reasoning
```

---

## What I Learned from This Task

Building this system clarified several real-world design challenges for life science field tools:

1. **Conversational UX for structured data is hard** — The gap between "naturally described" and "database-ready" data requires careful prompt engineering and multi-turn state management. LangGraph's typed state machine solved this cleanly.

2. **Field reps need speed, not forms** — The chat interface reflects how reps actually work: on the go, after a visit, dictating notes. The AI handles structuring so reps stay focused on the HCP relationship.

3. **LLM reliability requires layered strategies** — Using `gemma2-9b-it` for fast extraction and falling back to `llama-3.3-70b-versatile` for complex reasoning and summarization balances cost, speed, and quality.

4. **State persistence is non-trivial** — Each conversation turn must reload and rehydrate LangGraph state from the database, which requires careful serialization of LangChain message objects to/from JSON.

5. **Pharma domain knowledge matters** — Products like Keytruda, Jardiance, and Dupixent, specialties, and interaction types are industry-specific. Baking this vocabulary into prompts significantly improved extraction accuracy.
