# HCP Field CRM — AI-Powered Interaction Logger

A CRM tool built for pharma field reps. Instead of filling out long visit forms after every doctor meeting, you just tell the AI what happened in plain English and it does the rest.

---

## The problem it solves

Field reps visit 8–10 doctors a day. After every visit they have to manually log the HCP name, interaction type, date, topics discussed, materials shared, sentiment, outcomes, and follow-ups. That's a lot of form-filling at the end of a long day.

This app cuts that down to a single chat message:

> *"Met Dr. Arjun Sharma at Apollo this morning, email interaction, discussed Cardiomax efficacy, he was positive, shared the clinical trial brochure"*

The AI reads that, fills in every form field, and you just hit save.

---

## Pages and what they do

### Login / Signup
When you open the app you land here. Create an account — it just takes a name, email, and password. Your session is stored locally so you stay logged in across refreshes.

### Dashboard
An overview of your activity. Shows total interactions, how many you've logged this month, how many HCPs are in your network, and a sentiment breakdown. The recent interactions list and a bar chart of interaction types by count are also here.

### HCPs (Healthcare Professionals)
This is your contact book. All the doctors and nurses you interact with live here.

- Search by name, specialty, or institution
- Filter by specialty using the chips at the top
- Add a new HCP with the **+ Add HCP** button — fill in their name, specialty, institution, email, and phone
- Each card shows their contact info and specialty badge

You need to add HCPs here before the AI can log interactions for them. The chat bot will reject unknown doctor names and tell you what's available.

### Log Interaction
The main screen. Split into two halves:

**Left — the form.** All the fields for logging a visit: HCP name (autocomplete from your HCP list), interaction type, date, time, contact detail (email address or phone number, appears automatically when the type is Email or Call), attendees, topics discussed, materials shared, samples distributed, sentiment, outcomes, and follow-up actions.

**Right — the AI chat.** Just describe what happened. The bot extracts every detail from your message and auto-fills the form on the left in real time. If you mention a doctor not in the system, it tells you and shows who's available. When all required fields are filled, a save button appears in the chat.

The form and chat are in sync — changes in one show up in the other immediately.

---

## How the AI chat works

Every message you send goes to the backend along with the full conversation history and whatever's already been extracted. The AI (running on Groq's API) reads everything, extracts or updates fields, and responds asking for whatever's still missing.

**What it understands:**

Dates — plain English, ordinal, relative, everything:
- `"today"`, `"yesterday"`, `"tomorrow"`
- `"last Monday"`, `"next Friday"`, `"this Thursday"`
- `"24th April"`, `"April 24th"`, `"24 April"`
- `"June 15"`, `"next June"`, `"next year"`
- `"2 days ago"`, `"3 weeks from now"`

Times:
- `"7pm"` → 19:00, `"10:30am"` → 10:30
- `"morning"` → 09:00, `"afternoon"` → 14:00, `"evening"` → 18:00

Interaction flow based on type:
- If you say **Email** → bot asks which email address you used
- If you say **Call** → bot asks which number you called

The bot never asks for something you've already told it. Once all four required fields are filled (HCP name, type, date, topics), it marks the interaction complete and shows a save button.

---

## Tech stack

| Layer | What's used |
|---|---|
| Frontend | React 18, Redux Toolkit, Vite, CSS Modules |
| Backend | Python 3.11, FastAPI, SQLAlchemy (async) |
| AI | LangGraph, Groq API (llama-3.1-8b-instant) |
| Database | MySQL with aiomysql driver |
| Auth | localStorage session (client-side) |

---

## How to run it

You need: **Node.js 18+**, **Python 3.11+**, **MySQL** running locally.

### 1. Clone the repo

```bash
git clone https://github.com/your-username/hcp-field-crm.git
cd hcp-field-crm
```

### 2. Set up the backend

```bash
# Create a virtual environment
python -m venv .venv

# Activate it
.venv\Scripts\activate       # Windows
source .venv/bin/activate    # Mac / Linux

# Install dependencies
pip install -r requirements.txt
```

Create a file called `.env` inside the `backend/` folder:

```
GROQ_API_KEY=your_groq_api_key_here
DATABASE_URL=mysql+aiomysql://root:yourpassword@localhost:3306/log_crm
CORS_ORIGINS=http://localhost:5173
APP_SECRET_KEY=any-random-string
APP_ENV=development
```

Get a free Groq API key at [console.groq.com](https://console.groq.com) — it's free to sign up and the free tier is enough to run this.

Start the backend:

```bash
cd backend
uvicorn main:app --host 127.0.0.1 --port 8002 --reload
```

You should see: `Uvicorn running on http://127.0.0.1:8002`

> **No manual database setup needed.** On first start, the backend automatically creates the `log_crm` database and all tables if they don't exist. Just make sure MySQL is running — that's it.

### 4. Set up the frontend

```bash
cd frontend
npm install
npm run dev
```

You should see: `Local: http://localhost:5173`

### 5. Open the app

Go to [http://localhost:5173](http://localhost:5173) in your browser.

1. Click **Create an account** and sign up
2. Go to the **HCPs** page and add a few doctors (name, specialty, institution)
3. Go to **Log Interaction** and start chatting with the AI

---

## Groq rate limits

The free Groq tier allows 100,000 tokens per day per model. Each chat message uses roughly 800–1,200 tokens (because the full conversation history is sent every time). If you hit the limit you'll see an error in chat — it resets at midnight UTC.

If you hit the daily limit on `llama-3.1-8b-instant`, you can change the model in `backend/agent/graph.py`:

```python
llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model="llama-3.1-8b-instant",  # change this
    ...
)
```

Other available models on Groq: `llama-3.3-70b-versatile`, `qwen/qwen3-32b`, `meta-llama/llama-4-scout-17b-16e-instruct`

---

## Project structure

```
hcp-field-crm/
│
├── backend/
│   ├── agent/
│   │   ├── graph.py          # LangGraph agent — prompt, extraction logic, HCP validation
│   │   └── state.py          # InteractionState TypedDict (all fields the AI tracks)
│   ├── routers/
│   │   ├── chat.py           # POST /api/chat/ — runs the AI, validates HCP names
│   │   ├── interactions.py   # GET / POST /api/interactions/
│   │   └── hcps.py           # GET / POST /api/hcps/
│   ├── utils/
│   │   └── date_utils.py     # Date/time resolver (handles all natural language formats)
│   ├── models.py             # SQLAlchemy ORM models
│   ├── schemas.py            # Pydantic request/response schemas
│   ├── database.py           # Async DB engine + session
│   └── main.py               # FastAPI app, CORS, lifespan, router registration
│
└── frontend/
    └── src/
        ├── components/
        │   ├── Auth/              # LoginPage.jsx, SignupPage.jsx
        │   ├── Layout/            # Sidebar, Topbar, Layout wrapper
        │   ├── DashboardPage/     # Overview stats and charts
        │   ├── HCPsPage/          # HCP list, search, add HCP modal
        │   └── LogInteractionScreen/  # Form + AI chat + interaction logs
        ├── store/
        │   └── slices/
        │       ├── authSlice.js        # Login, signup, logout, localStorage session
        │       ├── chatSlice.js        # Chat messages, send, reset
        │       ├── interactionSlice.js # Form state, save, fetch logs
        │       └── hcpSlice.js         # HCP list, create HCP
        └── services/
            └── api.js             # Axios wrapper for all API calls
```

---

## API endpoints

| Method | Endpoint | What it does |
|---|---|---|
| GET | `/api/hcps/` | List all HCPs |
| POST | `/api/hcps/` | Add a new HCP |
| GET | `/api/hcps/{id}` | Get a single HCP |
| GET | `/api/interactions/` | List all logged interactions |
| POST | `/api/interactions/` | Save a new interaction |
| POST | `/api/chat/` | Send a chat message, get AI response + extracted fields |

The full interactive API docs are available at [http://localhost:8002/docs](http://localhost:8002/docs) when the backend is running.

---

## What was built during this project

Started as a Round 1 interview assignment — build an AI-first CRM HCP module in 60 hours. Here's what ended up getting built along the way:

- Full split-screen layout with collapsible sidebar, topbar with search and notifications
- AI chat that extracts structured data from free-text conversation
- LangGraph stateful agent with a carefully optimized prompt (trimmed to reduce token waste)
- Custom date/time resolver that handles every natural language format without depending entirely on the LLM
- HCP name validation — the bot rejects unknown doctors, does fuzzy matching for partial names like "Dr. Arjun" → "Dr. Arjun Sharma", and lists available options
- Conditional contact detail capture — asks for email address when type is Email, phone number when type is Call
- HCPs page with search, specialty filters, and add-HCP modal
- Dashboard with interaction stats, recent activity, type breakdown bar chart, sentiment split
- Login and signup with localStorage session persistence
- Dynamic chat textarea that grows as you type
- Chat scroll stays inside the chat box (doesn't scroll the whole page)
- Model fallback handling when Groq daily quota is exceeded
