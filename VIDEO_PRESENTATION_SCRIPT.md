# HCP Field CRM - Video Presentation Script (10-15 minutes)

## 📋 Video Structure Overview

**Total Duration**: 10-15 minutes
**Sections**:
1. Introduction & Project Overview (2 min)
2. Frontend Demo - All Pages (3 min)
3. LangGraph AI Agent Demo - 5 Key Features (5 min)
4. Code Architecture & Flow (3 min)
5. Key Learnings from Task 1 (2 min)

---

## 🎬 SECTION 1: Introduction & Project Overview (2 minutes)

### What to Show:
- Your face/screen recording setup
- Project running on localhost

### Script:

> "Hello! I'm [Your Name], and today I'll be presenting my HCP Field CRM project - an AI-powered interaction logging system built for pharmaceutical field representatives.
>
> **The Problem**: Field reps visit 8-10 doctors daily and spend hours filling out detailed visit forms with HCP names, interaction types, dates, topics discussed, materials shared, sentiment, and follow-up actions.
>
> **My Solution**: Instead of filling forms, reps just describe their visit in plain English to an AI chatbot, and it automatically extracts all the structured data.
>
> For example, instead of filling 10+ form fields, they can just say: *'Met Dr. Arjun Sharma at Apollo this morning, discussed Cardiomax efficacy, he was positive, shared the clinical trial brochure'* - and the AI fills everything.
>
> **Tech Stack**:
> - **Frontend**: React 18, Redux Toolkit, Vite
> - **Backend**: Python FastAPI with async SQLAlchemy
> - **AI**: LangGraph + Groq API (llama-3.1-8b-instant)
> - **Database**: MySQL on Railway
>
> Let me show you the live application running on **http://localhost:5173**"

---

## 🎬 SECTION 2: Frontend Demo - All Pages (3 minutes)

### Page 1: Login/Signup (30 seconds)
**Show**: 
- Login page UI
- Create a new account
- Session persistence (localStorage)

**Script**:
> "The app starts with authentication. I'll create a test account - it stores credentials in localStorage for this demo. In production, this would use proper JWT tokens and backend authentication."

### Page 2: Dashboard (45 seconds)
**Show**:
- Total interactions count
- Monthly stats
- HCP network size
- Sentiment breakdown (Positive/Neutral/Negative)
- Recent interactions list
- Interaction type bar chart

**Script**:
> "After login, we land on the Dashboard. It shows:
> - Total interactions logged
> - This month's activity
> - HCP network size
> - Sentiment analysis breakdown
> - Recent interactions with quick details
> - A visual breakdown by interaction type
>
> This gives field reps a quick overview of their activity."

### Page 3: HCPs Page (45 seconds)
**Show**:
- HCP list with cards
- Search functionality
- Specialty filter chips
- Add HCP modal
- Add 2-3 sample HCPs (Dr. Arjun Sharma, Dr. Priya Patel, Dr. Rajesh Kumar)

**Script**:
> "The HCPs page is the contact book. Before logging interactions, reps need to add their doctors here.
>
> Features:
> - Search by name, specialty, or institution
> - Filter by specialty using these chips
> - Each card shows contact info and specialty badge
>
> Let me add a few doctors for our demo:
> - Dr. Arjun Sharma - Cardiology - Apollo Hospital
> - Dr. Priya Patel - Oncology - Fortis Hospital
> - Dr. Rajesh Kumar - Neurology - Max Healthcare
>
> The AI will only accept these registered names when logging interactions."

### Page 4: Log Interaction (60 seconds)
**Show**:
- Split-screen layout (form + chat)
- Empty form with all fields
- AI chat interface
- Status indicator "AI Active"

**Script**:
> "This is the main screen - Log Interaction. It's split into two parts:
>
> **Left side**: Traditional form with all fields - HCP name, interaction type, date, time, contact details, topics, materials, samples, sentiment, outcomes, and follow-ups.
>
> **Right side**: AI chat interface. Instead of filling the form manually, reps can just chat naturally.
>
> The form and chat are synchronized in real-time - whatever the AI extracts appears in the form instantly, and vice versa.
>
> Now let me demonstrate the 5 key LangGraph features..."

---

## 🎬 SECTION 3: LangGraph AI Agent Demo - 5 Key Features (5 minutes)

### Feature 1: Natural Language Date/Time Extraction (60 seconds)

**Demo Conversation**:
```
User: "Met Dr. Arjun Sharma yesterday at 7pm"
AI: "Got it — noted Dr. Arjun Sharma. What type of interaction was this?"
```

**Show**:
- Form auto-fills: 
  - HCP Name: "Dr. Arjun Sharma"
  - Date: [yesterday's date in YYYY-MM-DD]
  - Time: "19:00"

**Try Multiple Date Formats**:
```
User: "Actually it was last Monday morning"
```
**Show**: Date updates to last Monday, Time updates to "09:00"

**Script**:
> "**Feature 1: Natural Language Date/Time Extraction**
>
> The AI understands ANY date format:
> - Relative: 'yesterday', 'tomorrow', 'today'
> - Weekdays: 'last Monday', 'next Friday'
> - Ordinal: '24th April', 'April 24th'
> - Combined: 'yesterday at 7pm'
>
> And time formats:
> - '7pm' → 19:00
> - 'morning' → 09:00
> - '10:30am' → 10:30
>
> This is handled by a custom date resolver in `backend/utils/date_utils.py` that works alongside the LLM."

---

### Feature 2: HCP Name Validation with Fuzzy Matching (60 seconds)

**Demo Conversation**:
```
User: "Met Dr. Smith yesterday"
AI: "I don't see 'Dr. Smith' in the portal — did you mean Dr. Arjun Sharma, Dr. Priya Patel, or Dr. Rajesh Kumar? Please use the registered name so I can log the visit correctly."
```

**Then try partial match**:
```
User: "Met Dr. Arjun yesterday"
AI: "Got it — noted Dr. Arjun Sharma. What type of interaction was this?"
```

**Show**: Form auto-fills with full name "Dr. Arjun Sharma"

**Script**:
> "**Feature 2: HCP Name Validation with Fuzzy Matching**
>
> The AI only accepts registered HCP names. If you mention an unknown doctor, it suggests alternatives.
>
> But it's smart about partial names - 'Dr. Arjun' automatically matches 'Dr. Arjun Sharma'.
>
> This uses Python's `difflib.get_close_matches()` for fuzzy matching with a 0.55 cutoff threshold.
>
> This prevents data quality issues - you can't log interactions for doctors who don't exist in the system."

---

### Feature 3: Conditional Contact Detail Capture (60 seconds)

**Demo Conversation**:
```
User: "It was an email interaction"
AI: "Noted — Email interaction. What email address did you use to reach them?"

User: "arjun.sharma@apollo.com"
AI: "Got it. When did this interaction take place?"
```

**Show**: Form auto-fills:
- Interaction Type: "Email"
- Contact Detail: "arjun.sharma@apollo.com"

**Then try Call**:
```
User: "Actually it was a call"
AI: "Updated to Call. What number did you call them on?"

User: "+91 98765 43210"
```

**Show**: Contact Detail updates to phone number

**Script**:
> "**Feature 3: Conditional Contact Detail Capture**
>
> The AI adapts its questions based on interaction type:
> - If type is 'Email' → asks for email address
> - If type is 'Call' → asks for phone number
> - For 'Meeting', 'Conference', etc. → skips contact detail
>
> This is implemented in the LangGraph prompt with conditional logic rules."

---

### Feature 4: Sentiment Analysis & AI-Suggested Follow-ups (60 seconds)

**Demo Conversation**:
```
User: "We discussed Cardiomax efficacy and safety profile. He was very enthusiastic and wants to prescribe it to his patients. Shared the clinical trial brochure."
AI: "Perfect! I've logged everything. Dr. Arjun Sharma was positive about Cardiomax. Here are some suggested follow-ups:
- Schedule a follow-up call in 2 weeks to discuss patient outcomes
- Send additional clinical data on long-term efficacy
- Arrange a hospital presentation for the cardiology team"
```

**Show**: Form auto-fills:
- Topics Discussed: "Cardiomax efficacy and safety profile"
- Materials Shared: ["Clinical trial brochure"]
- Sentiment: "Positive" (inferred from "very enthusiastic")
- AI Suggested Follow-ups: [3 smart suggestions]

**Script**:
> "**Feature 4: Sentiment Analysis & AI-Suggested Follow-ups**
>
> The AI infers sentiment from tone:
> - 'enthusiastic', 'positive', 'interested' → Positive
> - 'skeptical', 'resistant', 'concerned' → Negative
> - Everything else → Neutral
>
> When it knows the HCP name and topics discussed, it generates 2-3 smart follow-up suggestions based on the conversation context.
>
> This helps reps plan their next steps without thinking."

---

### Feature 5: Stateful Conversation with Context Preservation (60 seconds)

**Demo Conversation**:
```
User: "Actually, I also distributed 5 Cardiomax samples"
AI: "Noted — added 5 Cardiomax samples to the interaction."

User: "And Dr. Patel was also present"
AI: "Got it — added Dr. Patel as an attendee."

User: "Change the date to today"
AI: "Updated the date to [today's date]."
```

**Show**: Form updates incrementally without losing previous data

**Script**:
> "**Feature 5: Stateful Conversation with Context Preservation**
>
> The AI maintains conversation state across multiple messages. You can:
> - Add more details incrementally
> - Correct previous information
> - Update any field at any time
>
> The LangGraph state management preserves all previously extracted values and only updates what you change.
>
> The full conversation history is sent to the LLM each time, along with the current extracted state, so it has complete context."

---

### Complete the Interaction (30 seconds)

**Show**:
- Save button appears in chat
- Click save
- Interaction appears in the logs below
- Form resets
- Chat resets

**Script**:
> "Once all required fields are filled, a save button appears. After saving, the interaction immediately shows up in the logs below with all the details, and the form resets for the next entry."

---

## 🎬 SECTION 4: Code Architecture & Flow (3 minutes)

### Show: Code Editor with Key Files

**File 1: `backend/agent/graph.py` (45 seconds)**

**Show**:
- LangGraph StateGraph setup
- System prompt template
- `build_graph()` function
- `make_extract_node()` function

**Script**:
> "Let me show you the core AI architecture.
>
> **`backend/agent/graph.py`** - This is the LangGraph agent:
>
> 1. **System Prompt**: A carefully crafted prompt with:
>    - Today's date context
>    - Date/time parsing rules
>    - Registered HCP list (dynamically injected)
>    - Required vs optional fields
>    - Conditional logic for contact details
>    - JSON response format
>
> 2. **StateGraph**: Simple linear graph with one node:
>    - START → extract → END
>
> 3. **extract_node**: 
>    - Takes current state + new user message
>    - Builds system prompt with HCP roster
>    - Calls Groq LLM
>    - Parses JSON response
>    - Resolves dates/times using custom resolver
>    - Updates state with new extracted data
>    - Returns AI message
>
> The graph is rebuilt on every request with the current HCP list, so it always has up-to-date doctor names."

---

**File 2: `backend/agent/state.py` (20 seconds)**

**Show**:
- InteractionState TypedDict
- All fields with types
- `add_messages` annotation

**Script**:
> "**`backend/agent/state.py`** - The state schema:
>
> This TypedDict defines all fields the AI tracks:
> - Required: hcp_name, interaction_type, interaction_date, topics_discussed
> - Optional: time, contact_detail, attendees, materials, samples, sentiment, outcomes, follow-ups
> - Meta: is_complete, missing_required
>
> The `messages` field uses LangGraph's `add_messages` annotation to maintain conversation history."

---

**File 3: `backend/routers/chat.py` (45 seconds)**

**Show**:
- `/api/chat/` endpoint
- HCP roster fetch
- Graph building
- HCP validation logic
- Response construction

**Script**:
> "**`backend/routers/chat.py`** - The API endpoint:
>
> Flow:
> 1. Fetch all active HCPs from database
> 2. Convert request messages to LangChain format
> 3. Build initial state with current extracted data
> 4. Build graph with HCP roster
> 5. Invoke graph asynchronously
> 6. **Backend safety net**: Validate HCP name even if LLM missed it
>    - Uses fuzzy matching with `get_close_matches()`
>    - Suggests alternatives if not found
> 7. Return AI message + extracted data + completion status
>
> The backend validation is crucial - it catches cases where the LLM might hallucinate or miss an invalid name."

---

**File 4: `backend/utils/date_utils.py` (30 seconds)**

**Show**:
- `resolve_date()` function
- Regex patterns for different formats
- `resolve_time()` function
- `resolve_datetime_fields()` function

**Script**:
> "**`backend/utils/date_utils.py`** - Custom date/time resolver:
>
> This handles all natural language date formats:
> - Keywords: 'today', 'yesterday', 'tomorrow'
> - Relative: '2 days ago', '3 weeks from now'
> - Weekdays: 'last Monday', 'next Friday'
> - Ordinal: '24th April', 'April 24th'
> - Month only: 'June', 'next June'
>
> And time formats:
> - AM/PM: '7pm', '10:30am'
> - Period words: 'morning', 'afternoon', 'evening'
>
> This runs AFTER the LLM extracts the raw date string, converting it to ISO format (YYYY-MM-DD and HH:MM).
>
> Using a custom resolver instead of relying entirely on the LLM reduces token usage and improves accuracy."

---

**File 5: Frontend Flow (40 seconds)**

**Show**:
- `frontend/src/components/LogInteractionScreen/ChatMode.jsx`
- Redux flow: `chatSlice.js` → `interactionSlice.js`

**Script**:
> "**Frontend Flow**:
>
> 1. User types message in `ChatMode.jsx`
> 2. Dispatches `sendMessage` action from `chatSlice.js`
> 3. Calls `/api/chat/` with full conversation history + current form state
> 4. Backend returns AI message + extracted data
> 5. `chatSlice` adds AI message to conversation
> 6. Dispatches `mergeExtracted` to `interactionSlice`
> 7. Form updates in real-time via Redux state
>
> The form and chat are completely synchronized through Redux - changes in one immediately reflect in the other."

---

## 🎬 SECTION 5: Key Learnings from Task 1 (2 minutes)

### Script:

> "**What I Learned from Task 1**:
>
> **1. LangGraph State Management**
> - LangGraph's TypedDict state is powerful for maintaining conversation context
> - The `add_messages` annotation automatically handles message history
> - State updates are immutable - you return new state, not modify existing
> - Rebuilding the graph on each request is lightweight and allows dynamic prompt injection
>
> **2. Prompt Engineering is Critical**
> - A well-structured prompt with clear rules dramatically improves extraction accuracy
> - Including examples and edge cases in the prompt reduces hallucinations
> - Dynamic context injection (like HCP roster) makes the agent context-aware
> - Explicit JSON format specification ensures consistent parsing
>
> **3. Hybrid Approach: LLM + Traditional Code**
> - Don't rely on LLM for everything - use traditional code where it's better
> - Date parsing: LLM extracts raw string → Python regex converts to ISO format
> - HCP validation: LLM attempts match → Backend fuzzy matching catches errors
> - This reduces token usage and improves reliability
>
> **4. Stateful Conversations Require Careful Design**
> - Sending full conversation history each time provides context but increases tokens
> - Including 'ALREADY EXTRACTED' in the prompt prevents re-asking for known fields
> - The LLM needs explicit instructions to preserve previous values
> - State merging logic must handle null vs undefined vs empty string carefully
>
> **5. User Experience Matters**
> - Real-time form updates create a magical feeling
> - Clear error messages (like HCP not found) guide users
> - Conditional questions (email vs phone) feel intelligent
> - AI-suggested follow-ups add value beyond just data entry
>
> **6. Production Considerations**
> - Token usage adds up fast with full conversation history
> - Need to implement conversation truncation for long chats
> - Backend validation is essential - never trust LLM output blindly
> - Error handling for API failures, rate limits, and network issues
> - Database transactions for data consistency
>
> **7. LangGraph vs Traditional Chatbots**
> - LangGraph's graph structure is overkill for simple linear flows
> - But it shines when you need branching logic, tool calling, or multi-step reasoning
> - For this use case, a simple stateful prompt would work too
> - However, LangGraph provides better structure and testability
>
> **8. Real-World Impact**
> - This could genuinely save field reps 30-45 minutes per day
> - Reducing form-filling friction increases compliance
> - Structured data enables better analytics and insights
> - AI-suggested follow-ups improve sales effectiveness
>
> **Challenges I Faced**:
> - Getting date parsing to handle all edge cases
> - Preventing the LLM from re-asking for already-filled fields
> - Handling HCP name variations and typos
> - Balancing prompt length vs context completeness
> - Synchronizing form and chat state without race conditions
>
> **What I Would Improve**:
> - Add conversation summarization to reduce token usage
> - Implement voice input for hands-free logging
> - Add bulk import for HCPs from CSV
> - Create analytics dashboard with insights
> - Add export to PDF/Excel for reports
> - Implement proper authentication with JWT
> - Add role-based access control for managers
> - Deploy to production with proper CI/CD
>
> Thank you for watching! The code is available on GitHub, and I'm happy to answer any questions."

---

## 📝 Video Recording Checklist

### Before Recording:
- [ ] Backend running on http://localhost:8505
- [ ] Frontend running on http://localhost:5173
- [ ] Database has no existing data (fresh start)
- [ ] Browser window maximized
- [ ] Close unnecessary tabs/windows
- [ ] Disable notifications
- [ ] Test microphone audio
- [ ] Prepare 2-3 HCPs to add during demo
- [ ] Have script open on second monitor

### During Recording:
- [ ] Show URL in browser address bar
- [ ] Speak clearly and at moderate pace
- [ ] Pause briefly between sections
- [ ] Show code files clearly (zoom if needed)
- [ ] Highlight key lines of code
- [ ] Show form updates in real-time
- [ ] Demonstrate all 5 LangGraph features
- [ ] Show error handling (invalid HCP name)

### After Recording:
- [ ] Review video for audio quality
- [ ] Check all features were demonstrated
- [ ] Verify video length (10-15 min)
- [ ] Add timestamps in video description
- [ ] Export in high quality (1080p minimum)

---

## 🎯 Key Points to Emphasize

1. **Real-world problem solving** - Not just a tech demo, solves actual pain point
2. **AI + Traditional code hybrid** - Best of both worlds
3. **Production-ready considerations** - Error handling, validation, UX
4. **Clean architecture** - Separation of concerns, modular design
5. **Thoughtful UX** - Real-time updates, clear feedback, smart suggestions

---

## 📊 Video Timestamps (for description)

```
0:00 - Introduction & Project Overview
2:00 - Frontend Demo: Login & Dashboard
3:00 - Frontend Demo: HCPs Page
4:00 - Frontend Demo: Log Interaction Page
5:00 - LangGraph Feature 1: Date/Time Extraction
6:00 - LangGraph Feature 2: HCP Validation
7:00 - LangGraph Feature 3: Conditional Contact Capture
8:00 - LangGraph Feature 4: Sentiment & Follow-ups
9:00 - LangGraph Feature 5: Stateful Conversation
10:00 - Code Architecture & Flow
13:00 - Key Learnings from Task 1
15:00 - Conclusion
```

---

## 🎤 Speaking Tips

1. **Pace**: Speak at 120-140 words per minute (moderate pace)
2. **Pauses**: Pause 1-2 seconds between major points
3. **Enthusiasm**: Show genuine excitement about the features
4. **Clarity**: Pronounce technical terms clearly
5. **Confidence**: You built this - own it!
6. **Natural**: Don't read word-for-word, use script as guide
7. **Examples**: Use concrete examples when explaining concepts

---

## 🚀 Good Luck!

This script covers everything needed for a comprehensive 10-15 minute presentation. Practice once or twice before recording to get comfortable with the flow. Remember to show, not just tell - demonstrate each feature live!
