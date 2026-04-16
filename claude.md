# CLAUDE.md — Athira EdTech Hackathon 2026
## Complete Project Bible for Claude Code

> **Read this entire file before writing a single line of code.**
> This is the authoritative source of truth for architecture, features, data models, WebSocket schemas, and implementation order.

---

## TABLE OF CONTENTS

1. [Project Overview & Mission](#1-project-overview--mission)
2. [Problem Statement](#2-problem-statement)
3. [Our Solution Philosophy](#3-our-solution-philosophy)
4. [Feature Specifications (Deep Dive)](#4-feature-specifications-deep-dive)
5. [Tech Stack & Tooling](#5-tech-stack--tooling)
6. [Complete Project Structure](#6-complete-project-structure)
7. [Database & Data Models](#7-database--data-models)
8. [WebSocket Event Schema](#8-websocket-event-schema)
9. [REST API Endpoints](#9-rest-api-endpoints)
10. [Frontend Architecture](#10-frontend-architecture)
11. [Backend Architecture](#11-backend-architecture)
12. [AI Integration Layer](#12-ai-integration-layer)
13. [Implementation Order (Day-by-Day Sprint Plan)](#13-implementation-order-day-by-day-sprint-plan)
14. [Environment Variables](#14-environment-variables)
15. [UI/UX Design System](#15-uiux-design-system)
16. [Judging Criteria Alignment](#16-judging-criteria-alignment)

---

## 1. PROJECT OVERVIEW & MISSION

**Company:** Athira — an EdTech marketplace connecting students with world-class mentors for real-time, one-on-one learning.

**Hackathon:** 4-Day Sprint · Teams of 3 · Full-Stack Challenge

**The Core Problem:** Athira has mastered the "before" (matching, scheduling) and "after" (recaps) of a tutoring session. But the live 60-minute session itself is just a generic video call — a generic tool for a specialized task.

**Our Mission:** Build an **Innovation Layer** that transforms the live 60-minute session into a *high-signal, collaborative workspace* where learning is amplified, not just observed.

**The Fundamental Shift We Are Building:**

| Dimension | Generic Video Call | Our Athira Innovation Layer |
|---|---|---|
| Session Entry | Cold start, tutor guesses student level | Pre-flight diagnostic surfaces the *Danger Zone* before a word is spoken |
| During (Student) | Passive listener, loses context, shy to interrupt | Sidecar + Parking Lot = active, low-friction participation |
| During (Tutor) | Guesses what isn't landing, improvises explanations | Analogy engine + student analogy poll = real-time pedagogical adaptation |
| Session Exit | Call ends, context evaporates | Study Pack = session becomes a durable, exportable learning artifact |

---

## 2. PROBLEM STATEMENT

Direct quote from Athira's hackathon brief:

> *"A tutoring session is more than a conversation — it is a structured, collaborative, and intelligent event. We want you to bridge the gap between a standard video call and a specialized learning environment."*

**Scoring Weights (from brief):**
- Foundation (login, scheduling, dashboards): **10% of score**
- Innovation Workspace (Dual-Pane Session Room): **90% of score**
- Key scoring driver: **Originality** in how you upgrade the live learning moment

**Deliverables Required:**
1. GitHub Repository with README and WebSocket event schema
2. Live Functional Demo (deployed, judges can join as tutor or student)
3. Architecture Doc (one-page: synchronization strategy + pedagogical reasoning)
4. 5-Minute Video (focused on live session features)

---

## 3. OUR SOLUTION PHILOSOPHY

### The Three Learning Science Principles We're Building On

**Principle 1 — Diagnostic Precision (Bloom's Taxonomy)**
Traditional tutors start sessions with small talk or a vague "what did you struggle with?" Our Pre-Flight Diagnostic surfaces *exactly* where the student is — including the dangerous quadrant of "confident but wrong" (Bloom's Level 1 misconceptions). This is impossible to detect in a generic call.

**Principle 2 — Active Participation & Learner Agency**
Research shows students retain ~70% more when they are active participants rather than passive observers. The Sidecar gives students a structured, low-friction mechanism to mark moments, park questions, and write reflections *during* the session without interrupting the flow.

**Principle 3 — Pedagogical Adaptation & Cognitive Fit**
Different students have different cognitive styles (spatial, narrative, abstract-mathematical). The Instant Analogy Engine doesn't just suggest analogies — it enforces *modality diversity* and lets the *student* choose which frame resonates. This is learner-directed teaching, impossible in a generic call.

---

## 4. FEATURE SPECIFICATIONS (DEEP DIVE)

### FEATURE 1: Topic-Driven Pre-Flight Diagnostic

#### What It Is
When a student books a session on a topic (e.g., "Advanced Calculus — Implicit Differentiation"), the system AI-generates 3–5 diagnostic questions. Before the tutor joins, the student completes a ~5-minute interactive knowledge check. The tutor enters the session room to find a fully populated "Proficiency Dashboard."

#### The Confidence Gap Matrix (Our Originality Spike)
We measure TWO dimensions, not one:
- **Correctness:** Did the student answer correctly?
- **Confidence:** Self-reported 1–5 slider before each question

This creates four quadrants displayed as a 2x2 matrix on the tutor dashboard:

```
HIGH CONFIDENCE + CORRECT    → 🟢 MASTERED         → Skip, move forward
HIGH CONFIDENCE + WRONG      → 🔴 DANGER ZONE       → Misconception. Prioritize immediately.
LOW CONFIDENCE  + CORRECT    → 🟡 LUCKY GUESS       → Reinforce, they got it but don't know why
LOW CONFIDENCE  + WRONG      → 🟠 KNOWN GAP         → Standard teaching needed
```

The **DANGER ZONE** is the most valuable pedagogical signal. A student who is *confidently wrong* will resist correction. No generic video call surfaces this. This is our primary originality claim.

#### Adaptive Question Branching
- Questions are NOT sent all at once. They branch based on prior answers.
- If Q1 is answered wrongly → Q2 targets a prerequisite sub-topic.
- If Q1 is answered correctly with high confidence → Q2 advances difficulty.
- Implemented as a simple decision tree in FastAPI (no ML required).

#### The Session Contract
After the diagnostic completes, the system auto-generates a one-sentence "Session Contract" shown to BOTH student and tutor simultaneously when the session room loads:

> *"Today's focus: Implicit Differentiation (🔴 Danger Zone) → Chain Rule Review (🟡). Polynomial basics are solid — skip forward."*

This is a **shared artifact** that sets mutual expectations before the first word is spoken.

#### Data Flow
```
Student books session with topic
        ↓
Backend calls AI → generates 3-5 questions with sub-topic tags
        ↓
Student joins room early → sees Pre-Flight UI (tutor not yet admitted)
        ↓
Student answers each question + confidence slider
        ↓
Backend processes answers → computes quadrant for each sub-topic
        ↓
Tutor joins → sees populated Proficiency Dashboard + Session Contract
        ↓
WebSocket event: DIAGNOSTIC_COMPLETE sent to tutor client
```

#### UI Components
- `PreFlightScreen.jsx` — Full-screen student pre-flight experience
- `QuestionCard.jsx` — Single question with confidence slider
- `ProficiencyDashboard.jsx` — Tutor-side traffic light grid + confidence matrix
- `SessionContract.jsx` — Shared banner at top of session room for both parties

---

### FEATURE 2: The Interactive Private Sidecar (Student Dashboard)

#### What It Is
A persistent right-side panel visible ONLY to the student during the live session. It captures structured learning moments without interrupting the session flow.

#### Sub-Feature 2A: Contextual Snapshot
- Student clicks **"📸 Snapshot"** button at any moment
- System captures:
  1. A screenshot/render of the current shared whiteboard state
  2. The last 30 seconds of live transcript text (timestamped)
  3. An auto-generated context tag from AI (e.g., "Tutor explaining: Exception to Product Rule")
- Snapshot is stored privately — the tutor CANNOT see individual snapshots

#### Sub-Feature 2B: Tutor Intent Tag (The Architectural Highlight)
When a student takes a Snapshot, a **WebSocket event fires to the tutor's side** — a subtle toast notification:

> *"📸 Student captured this moment"* [10-second auto-dismiss]

The tutor gets a **10-second window** to type a one-line "Teaching Intent" tag:
> *"This diagram shows the KEY exception — it's the most tested exam trap"*

If the tutor doesn't act, it dismisses silently. If they do, the tag is attached to that snapshot in the student's sidecar. This is **asynchronous collaborative annotation** — tutor context enriching student artifacts without interrupting the lesson.

#### Sub-Feature 2C: Question Parking Lot
A dedicated **"🅿️ Park This Question"** button — different from a generic note. One tap, zero friction. It captures:
- The exact timestamp
- The last 15 seconds of transcript (auto-tagged as context)
- Auto-label: "❓ Unresolved Question"

The parking lot creates a **structured interrupt queue**. At session end, the tutor sees:
> *"Student parked 3 questions during this session."*

They can address these in the final 10 minutes — closing the loop on the questions students were too shy to ask.

#### Sub-Feature 2D: Private Reflection Notes
A simple text area anchored to the current session timestamp. Student can write reflections, personal notes, mnemonics. Fully private.

#### Sub-Feature 2E: Post-Session Study Pack (Session Artifact)
At session end, the system compiles everything into an exportable **Study Pack**:
- Ordered list of all Snapshots (with whiteboard images + transcript snippets + tutor intent tags)
- All Parked Questions (with context)
- Student reflection notes
- The original Session Contract
- Rendered as a styled HTML page, downloadable as PDF

This transforms an ephemeral 60-minute call into a **durable learning artifact**.

#### Data Flow
```
Student clicks Snapshot
        ↓
Frontend: capture whiteboard canvas state as base64 PNG
Frontend: grab last 30s from transcript buffer
        ↓
WebSocket: SNAPSHOT_TAKEN event → Backend stores snapshot
WebSocket: TUTOR_INTENT_PROMPT event → fires to tutor's socket
        ↓
[Optional] Tutor types intent tag → WebSocket: TUTOR_INTENT_ADDED event → Backend updates snapshot
        ↓
Sidecar re-renders with new snapshot card
        ↓
[Session End] GET /sessions/{id}/study-pack → returns compiled artifact
```

#### UI Components
- `Sidecar.jsx` — Main right-panel container (student-only)
- `SnapshotCard.jsx` — Individual snapshot with image, transcript, tutor tag
- `ParkingLot.jsx` — List of parked questions with context
- `ReflectionEditor.jsx` — Private notes text area
- `StudyPack.jsx` — Post-session compiled artifact view
- `TutorIntentToast.jsx` — 10-second dismissible toast on tutor side

---

### FEATURE 3: The "Instant Analogy" Engine (AI Tutor Support)

#### What It Is
A **"💡 Help Me Explain"** button on the tutor's panel. When clicked, the AI analyzes the last ~2 minutes of live transcript and suggests THREE analogies to help bridge a student's understanding gap — one per distinct cognitive modality.

#### The Three Modality Constraint (Our Prompt Engineering Strategy)
We don't just ask the AI for "3 analogies." We enforce three *cognitively distinct* frames in our system prompt:

1. **🌊 Spatial/Physical** — Uses movement, space, tangible objects (e.g., "Electric current is like water flowing through pipes — voltage is the pressure, resistance is the pipe diameter")
2. **👥 Social/Narrative** — Uses human situations, stories, relationships (e.g., "Resistance is like a bouncer at a club — the stricter the bouncer, the fewer electrons get through per second")
3. **📐 Mathematical/Abstract** — Uses ratios, scaling, formal patterns (e.g., "Current I = V/R means if you double the voltage while keeping resistance fixed, the flow doubles proportionally")

Different students have different cognitive styles. Enforcing modality diversity makes this feature *educationally rigorous*, not just a "ChatGPT button."

#### Student Analogy Poll (The Learner Agency Moment)
After the tutor reviews the analogies, they can **push them to the student's sidecar** as a quick poll:

> *"Which of these makes most sense to you intuitively?"*
> - 🌊 The water flow one
> - 👥 The bouncer one  
> - 📐 The ratio one

The student picks one. The tutor's panel highlights the chosen analogy. The tutor now teaches *that specific frame* — the one the student's own brain pre-selected. This is **learner-directed teaching**.

#### The "Analogy Worked" Signal
After the analogy is used, a subtle **"✅ This clicked!"** button appears in the student's sidecar. If clicked, the system logs: `{ session_id, topic, modality: "spatial", signal: "understood" }`.

This data seeds a future **Learner Cognitive Profile** — even though we're not building the profile in 4 days, *architecting for it* and showing the data model to judges demonstrates product thinking.

#### Data Flow
```
Tutor clicks "Help Me Explain"
        ↓
Backend: grabs last 120s of transcript from session transcript buffer
Backend: calls AI API with enforced 3-modality system prompt
AI returns: { spatial: "...", social: "...", abstract: "..." }
        ↓
WebSocket: ANALOGIES_READY event → tutor's panel populates
        ↓
Tutor optionally clicks "Send to Student"
WebSocket: ANALOGY_POLL_SENT event → student's sidecar shows poll
        ↓
Student selects analogy
WebSocket: ANALOGY_SELECTED event → tutor's panel highlights selection
        ↓
[Optional] Student clicks "This clicked!"
WebSocket: ANALOGY_WORKED event → backend logs cognitive signal
```

#### UI Components
- `AnalogyPanel.jsx` — Tutor-side panel showing 3 modality cards
- `AnalogyPoll.jsx` — Student-side poll with 3 options
- `AnalogyCard.jsx` — Individual analogy with modality icon + text

---

## 5. TECH STACK & TOOLING

### Frontend
```
Framework:        Vite + React 18
Language:         JavaScript (JSX) — no TypeScript to save time
Styling:          Tailwind CSS v3
State Management: Zustand (lightweight, no Redux boilerplate)
WebSocket Client: Native browser WebSocket API (wrapped in custom hook)
Video/Audio:      Daily.co (free tier, simplest embed) OR Agora.io
Whiteboard:       Excalidraw (open source, embeddable React component)
HTTP Client:      Axios
Transcript:       Web Speech API (SpeechRecognition) — browser-native, free
Routing:          React Router v6
Export/PDF:       html2canvas + jsPDF (for Study Pack export)
Icons:            Lucide React
Notifications:    React Hot Toast
```

### Backend
```
Framework:        FastAPI (Python 3.11+)
WebSocket:        FastAPI WebSocket (built-in)
Database:         SQLite (dev) → PostgreSQL (prod via SQLAlchemy)
ORM:              SQLAlchemy 2.0 (async)
Auth:             JWT (python-jose + passlib)
AI:               OpenAI API (GPT-4o) or Anthropic Claude API
Session Store:    In-memory dict for active session state (Redis optional)
CORS:             FastAPI CORS middleware
Server:           Uvicorn
Migrations:       Alembic
```

### Infrastructure
```
Deployment:       Railway.app (backend) + Vercel (frontend) — both free tier
Database:         Railway PostgreSQL plugin
Environment:      python-dotenv (backend) + Vite .env (frontend)
```

---

## 6. COMPLETE PROJECT STRUCTURE

```
athira-hackathon/
├── CLAUDE.md                          ← This file
├── README.md                          ← Public-facing README
├── .gitignore
│
├── backend/                           ← FastAPI application
│   ├── main.py                        ← App entry point, router registration
│   ├── requirements.txt
│   ├── .env.example
│   ├── alembic.ini
│   ├── alembic/
│   │   └── versions/
│   │
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py                  ← Settings from env vars
│   │   ├── database.py                ← SQLAlchemy async engine + session
│   │   │
│   │   ├── models/                    ← SQLAlchemy ORM models
│   │   │   ├── __init__.py
│   │   │   ├── user.py                ← User (role: student | tutor)
│   │   │   ├── session.py             ← TutoringSession
│   │   │   ├── diagnostic.py          ← DiagnosticQuestion, DiagnosticResponse
│   │   │   ├── snapshot.py            ← Snapshot, TutorIntentTag
│   │   │   ├── parked_question.py     ← ParkedQuestion
│   │   │   ├── analogy_log.py         ← AnalogyLog, CognitiveSignal
│   │   │   └── transcript.py          ← TranscriptSegment
│   │   │
│   │   ├── schemas/                   ← Pydantic schemas (request/response)
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── session.py
│   │   │   ├── diagnostic.py
│   │   │   ├── snapshot.py
│   │   │   └── analogy.py
│   │   │
│   │   ├── routers/                   ← FastAPI route handlers
│   │   │   ├── __init__.py
│   │   │   ├── auth.py                ← /auth/* endpoints
│   │   │   ├── sessions.py            ← /sessions/* endpoints
│   │   │   ├── diagnostic.py          ← /diagnostic/* endpoints
│   │   │   ├── snapshots.py           ← /snapshots/* endpoints
│   │   │   └── study_pack.py          ← /study-pack/* endpoints
│   │   │
│   │   ├── websocket/
│   │   │   ├── __init__.py
│   │   │   ├── manager.py             ← ConnectionManager class
│   │   │   └── handler.py             ← WebSocket route + event dispatcher
│   │   │
│   │   ├── services/                  ← Business logic layer
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py        ← JWT creation/validation
│   │   │   ├── diagnostic_service.py  ← Question generation, quadrant computation
│   │   │   ├── analogy_service.py     ← AI analogy generation
│   │   │   ├── transcript_service.py  ← Transcript buffer management
│   │   │   └── study_pack_service.py  ← Study pack compilation
│   │   │
│   │   └── dependencies.py            ← FastAPI dependency injection (get_db, get_current_user)
│   │
│   └── tests/
│       ├── test_auth.py
│       ├── test_diagnostic.py
│       └── test_websocket.py
│
└── frontend/                          ← Vite + React application
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── package.json
    ├── .env.example
    │
    └── src/
        ├── main.jsx                   ← React root
        ├── App.jsx                    ← Router setup
        ├── index.css                  ← Tailwind + CSS variables
        │
        ├── store/                     ← Zustand global state
        │   ├── authStore.js           ← User, token, role
        │   ├── sessionStore.js        ← Active session state
        │   ├── diagnosticStore.js     ← Pre-flight state
        │   └── sidecarStore.js        ← Snapshots, parked questions, notes
        │
        ├── hooks/                     ← Custom React hooks
        │   ├── useWebSocket.js        ← WS connection, send, event dispatch
        │   ├── useTranscript.js       ← Web Speech API wrapper
        │   ├── useTimer.js            ← Session countdown
        │   └── useTutorIntent.js      ← 10-second toast countdown
        │
        ├── lib/
        │   ├── api.js                 ← Axios instance with auth interceptor
        │   ├── wsEvents.js            ← WebSocket event type constants
        │   └── utils.js               ← Helpers (formatTime, truncate, etc.)
        │
        ├── pages/
        │   ├── LandingPage.jsx
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── StudentDashboard.jsx
        │   ├── TutorDashboard.jsx
        │   └── SessionRoom.jsx        ← Main session room (the core product)
        │
        └── components/
            │
            ├── auth/
            │   ├── LoginForm.jsx
            │   └── RegisterForm.jsx
            │
            ├── dashboard/
            │   ├── UpcomingSessions.jsx
            │   ├── SessionCard.jsx
            │   └── BookingModal.jsx
            │
            ├── session/               ← SESSION ROOM COMPONENTS (90% of effort)
            │   │
            │   ├── layout/
            │   │   ├── SessionRoom.jsx         ← Top-level layout orchestrator
            │   │   ├── DualPane.jsx             ← Left video/board | Right sidecar
            │   │   └── SessionHeader.jsx        ← Timer, contract banner, status
            │   │
            │   ├── preflight/                   ← FEATURE 1
            │   │   ├── PreFlightScreen.jsx      ← Full-screen pre-flight wrapper
            │   │   ├── QuestionCard.jsx          ← Question + confidence slider
            │   │   ├── ProgressBar.jsx
            │   │   └── SessionContractBanner.jsx ← Shared contract shown to both
            │   │
            │   ├── proficiency/                 ← FEATURE 1 (tutor view)
            │   │   ├── ProficiencyDashboard.jsx ← Traffic light grid
            │   │   ├── ConfidenceMatrix.jsx      ← 2x2 quadrant visual
            │   │   └── TrafficLight.jsx          ← Individual sub-topic indicator
            │   │
            │   ├── sidecar/                     ← FEATURE 2
            │   │   ├── Sidecar.jsx              ← Main container (student-only)
            │   │   ├── SnapshotButton.jsx        ← Capture button
            │   │   ├── SnapshotCard.jsx          ← Snapshot with image + meta
            │   │   ├── ParkingLot.jsx            ← Parked questions list
            │   │   ├── ParkButton.jsx            ← "Park This Question" CTA
            │   │   ├── ReflectionEditor.jsx      ← Private notes
            │   │   └── TutorIntentToast.jsx      ← 10s toast on TUTOR side
            │   │
            │   ├── analogy/                     ← FEATURE 3
            │   │   ├── AnalogyPanel.jsx          ← Tutor-side panel
            │   │   ├── AnalogyCard.jsx           ← Single modality card
            │   │   ├── AnalogyPoll.jsx           ← Student-side poll
            │   │   └── HelpExplainButton.jsx     ← "Help Me Explain" CTA
            │   │
            │   ├── video/
            │   │   ├── VideoPane.jsx             ← Daily.co embed
            │   │   └── VideoControls.jsx
            │   │
            │   ├── whiteboard/
            │   │   └── SharedWhiteboard.jsx      ← Excalidraw embed
            │   │
            │   └── studypack/                   ← POST-SESSION
            │       ├── StudyPackModal.jsx
            │       └── StudyPackExport.jsx
            │
            └── ui/                   ← Reusable design system primitives
                ├── Button.jsx
                ├── Card.jsx
                ├── Badge.jsx
                ├── Modal.jsx
                ├── Slider.jsx
                ├── Toast.jsx
                └── Spinner.jsx
```

---

## 7. DATABASE & DATA MODELS

### users
```sql
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) UNIQUE NOT NULL,
    name        VARCHAR(255) NOT NULL,
    role        VARCHAR(10) NOT NULL CHECK (role IN ('student', 'tutor')),
    password_hash VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);
```

### tutoring_sessions
```sql
CREATE TABLE tutoring_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID REFERENCES users(id),
    tutor_id        UUID REFERENCES users(id),
    topic           VARCHAR(500) NOT NULL,       -- e.g. "Advanced Calculus — Implicit Differentiation"
    sub_topics      JSONB,                        -- ["Implicit Differentiation", "Chain Rule", "Product Rule"]
    status          VARCHAR(20) DEFAULT 'scheduled'
                    CHECK (status IN ('scheduled','preflight','live','completed','cancelled')),
    session_contract TEXT,                        -- Auto-generated after diagnostic
    scheduled_at    TIMESTAMP NOT NULL,
    started_at      TIMESTAMP,
    ended_at        TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW()
);
```

### diagnostic_questions
```sql
CREATE TABLE diagnostic_questions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID REFERENCES tutoring_sessions(id),
    sub_topic       VARCHAR(255) NOT NULL,        -- Which sub-topic this tests
    question_text   TEXT NOT NULL,
    options         JSONB NOT NULL,               -- ["option A", "option B", "option C", "option D"]
    correct_index   INTEGER NOT NULL,             -- 0-indexed
    difficulty      VARCHAR(10) CHECK (difficulty IN ('easy','medium','hard')),
    parent_question_id UUID REFERENCES diagnostic_questions(id), -- For branching
    branch_on_wrong UUID REFERENCES diagnostic_questions(id),    -- Next Q if wrong
    branch_on_right UUID REFERENCES diagnostic_questions(id),    -- Next Q if correct
    sequence_order  INTEGER NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW()
);
```

### diagnostic_responses
```sql
CREATE TABLE diagnostic_responses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID REFERENCES tutoring_sessions(id),
    question_id     UUID REFERENCES diagnostic_questions(id),
    student_id      UUID REFERENCES users(id),
    selected_index  INTEGER NOT NULL,
    is_correct      BOOLEAN NOT NULL,
    confidence      INTEGER NOT NULL CHECK (confidence BETWEEN 1 AND 5),
    quadrant        VARCHAR(20) NOT NULL
                    CHECK (quadrant IN ('mastered','danger_zone','lucky_guess','known_gap')),
    time_taken_ms   INTEGER,
    answered_at     TIMESTAMP DEFAULT NOW()
);
```

### sub_topic_proficiency
```sql
-- Computed after diagnostic completes, one row per sub-topic per session
CREATE TABLE sub_topic_proficiency (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID REFERENCES tutoring_sessions(id),
    sub_topic       VARCHAR(255) NOT NULL,
    quadrant        VARCHAR(20) NOT NULL,
    traffic_light   VARCHAR(10) CHECK (traffic_light IN ('green','yellow','red','danger')),
    avg_confidence  FLOAT,
    correct_count   INTEGER DEFAULT 0,
    total_count     INTEGER DEFAULT 0
);
```

### snapshots
```sql
CREATE TABLE snapshots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID REFERENCES tutoring_sessions(id),
    student_id      UUID REFERENCES users(id),
    whiteboard_png  TEXT,                         -- base64 PNG of whiteboard state
    transcript_snippet TEXT,                      -- Last 30s of transcript at capture time
    timestamp_ms    BIGINT NOT NULL,              -- ms into session
    ai_context_tag  TEXT,                         -- AI-generated: "Tutor explaining: X"
    tutor_intent    TEXT,                         -- Tutor's optional one-line annotation
    created_at      TIMESTAMP DEFAULT NOW()
);
```

### parked_questions
```sql
CREATE TABLE parked_questions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID REFERENCES tutoring_sessions(id),
    student_id      UUID REFERENCES users(id),
    transcript_context TEXT,                      -- Last 15s of transcript
    timestamp_ms    BIGINT NOT NULL,
    is_resolved     BOOLEAN DEFAULT FALSE,
    resolution_note TEXT,                         -- Tutor's end-of-session response
    created_at      TIMESTAMP DEFAULT NOW()
);
```

### reflection_notes
```sql
CREATE TABLE reflection_notes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID REFERENCES tutoring_sessions(id),
    student_id      UUID REFERENCES users(id),
    content         TEXT NOT NULL,
    timestamp_ms    BIGINT NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW()
);
```

### analogy_logs
```sql
CREATE TABLE analogy_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID REFERENCES tutoring_sessions(id),
    tutor_id        UUID REFERENCES users(id),
    trigger_transcript TEXT,                      -- Transcript that triggered the request
    spatial_analogy TEXT NOT NULL,
    social_analogy  TEXT NOT NULL,
    abstract_analogy TEXT NOT NULL,
    sent_to_student BOOLEAN DEFAULT FALSE,
    student_selection VARCHAR(20)
                    CHECK (student_selection IN ('spatial','social','abstract')),
    analogy_worked  BOOLEAN,                      -- Student's "This clicked!" signal
    created_at      TIMESTAMP DEFAULT NOW()
);
```

### transcript_segments
```sql
CREATE TABLE transcript_segments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID REFERENCES tutoring_sessions(id),
    speaker_id      UUID REFERENCES users(id),
    speaker_role    VARCHAR(10) CHECK (speaker_role IN ('student','tutor')),
    text            TEXT NOT NULL,
    timestamp_ms    BIGINT NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW()
);
```

---

## 8. WEBSOCKET EVENT SCHEMA

All WebSocket messages follow this envelope format:

```json
{
  "event": "EVENT_TYPE",
  "session_id": "uuid",
  "sender_id": "uuid",
  "sender_role": "student | tutor",
  "timestamp_ms": 1234567890,
  "payload": { }
}
```

### Connection
```
WS URL: ws://localhost:8000/ws/{session_id}?token={jwt_token}
```

### Event Type Constants (wsEvents.js)

#### Session Lifecycle
```javascript
// CLIENT → SERVER
WS_JOIN_SESSION         // Sent on connect; backend broadcasts PARTICIPANT_JOINED
WS_LEAVE_SESSION        // Sent on disconnect

// SERVER → CLIENT
PARTICIPANT_JOINED      // { user_id, role, name }
PARTICIPANT_LEFT        // { user_id, role }
SESSION_STATUS_CHANGED  // { new_status: 'preflight'|'live'|'completed' }
```

#### Feature 1: Diagnostic
```javascript
// SERVER → CLIENT (student only)
DIAGNOSTIC_QUESTIONS_READY  // { questions: [...] } — sent after session scheduled

// CLIENT → SERVER (student)
DIAGNOSTIC_ANSWER_SUBMITTED // { question_id, selected_index, confidence }

// SERVER → CLIENT (tutor only)
DIAGNOSTIC_COMPLETE         // { proficiency: [...sub_topic_proficiency], session_contract: "..." }
DIAGNOSTIC_PROGRESS         // { answered: 3, total: 5 } — live progress while student answers
```

#### Feature 2: Sidecar / Snapshots
```javascript
// CLIENT → SERVER (student)
SNAPSHOT_TAKEN              // { whiteboard_png: "base64...", transcript_snippet: "..." }
QUESTION_PARKED             // { transcript_context: "..." }
REFLECTION_SAVED            // { content: "...", timestamp_ms: ... }

// SERVER → CLIENT (tutor only — the intent prompt)
TUTOR_INTENT_PROMPT         // { snapshot_id: "uuid", student_name: "..." }
  // Tutor has 10 seconds to respond

// CLIENT → SERVER (tutor)
TUTOR_INTENT_ADDED          // { snapshot_id: "uuid", intent_text: "..." }

// SERVER → CLIENT (student)
SNAPSHOT_ENRICHED           // { snapshot_id: "uuid", tutor_intent: "..." }
PARKED_QUESTION_RESOLVED    // { parked_id: "uuid", resolution_note: "..." }
```

#### Feature 3: Analogy Engine
```javascript
// CLIENT → SERVER (tutor)
ANALOGY_REQUESTED           // {} — triggers backend to grab transcript + call AI

// SERVER → CLIENT (tutor only)
ANALOGIES_READY             // { analogy_log_id: "uuid", spatial: "...", social: "...", abstract: "..." }

// CLIENT → SERVER (tutor)
ANALOGY_POLL_SEND           // { analogy_log_id: "uuid" } — tutor pushes poll to student

// SERVER → CLIENT (student only)
ANALOGY_POLL_RECEIVED       // { analogy_log_id: "uuid", spatial: "...", social: "...", abstract: "..." }

// CLIENT → SERVER (student)
ANALOGY_SELECTED            // { analogy_log_id: "uuid", selection: "spatial|social|abstract" }

// SERVER → CLIENT (tutor only)
ANALOGY_SELECTION_RECEIVED  // { analogy_log_id: "uuid", selection: "spatial" } — highlight it

// CLIENT → SERVER (student)
ANALOGY_WORKED              // { analogy_log_id: "uuid" } — "This clicked!" signal
```

#### Transcript Streaming
```javascript
// CLIENT → SERVER (both, streaming from Web Speech API)
TRANSCRIPT_SEGMENT          // { text: "...", is_final: true|false }

// SERVER → CLIENT (both)
TRANSCRIPT_BROADCAST        // { speaker_id, speaker_role, text, timestamp_ms }
```

#### Whiteboard (via Excalidraw's built-in sync or relay)
```javascript
// CLIENT → SERVER (both)
WHITEBOARD_DELTA            // { elements: [...excalidraw_elements], appState: {...} }

// SERVER → CLIENT (both, relayed to other participant)
WHITEBOARD_UPDATE           // { elements: [...], appState: {...} }
```

---

## 9. REST API ENDPOINTS

### Auth
```
POST   /auth/register          Register student or tutor
POST   /auth/login             Returns JWT token
GET    /auth/me                Returns current user from token
```

### Sessions
```
POST   /sessions               Create/book a session { tutor_id, topic, sub_topics[], scheduled_at }
GET    /sessions               List sessions for current user
GET    /sessions/{id}          Get session details + proficiency data
PATCH  /sessions/{id}/status   Update status { status: "live" }
```

### Diagnostic
```
GET    /diagnostic/{session_id}/questions     Get generated questions for student
POST   /diagnostic/{session_id}/generate      Trigger AI question generation (called at booking)
POST   /diagnostic/{session_id}/submit        Submit all answers, compute proficiency
GET    /diagnostic/{session_id}/proficiency   Get proficiency results for tutor
```

### Snapshots
```
POST   /snapshots                             Create snapshot { session_id, whiteboard_png, transcript_snippet }
GET    /snapshots/{session_id}                Get all snapshots for session (student's own)
PATCH  /snapshots/{snapshot_id}/intent        Tutor adds intent tag { intent_text }
```

### Parked Questions
```
POST   /parked-questions                      Park a question { session_id, transcript_context }
GET    /parked-questions/{session_id}         Get all parked questions
PATCH  /parked-questions/{id}/resolve         Tutor resolves { resolution_note }
```

### Analogy
```
POST   /analogies/generate                    Trigger AI analogy generation { session_id }
GET    /analogies/{session_id}                Get analogy history for session
```

### Study Pack
```
GET    /study-pack/{session_id}               Compile and return full study pack JSON
GET    /study-pack/{session_id}/export        Return rendered HTML for download
```

---

## 10. FRONTEND ARCHITECTURE

### State Management (Zustand Stores)

#### authStore.js
```javascript
{
  user: null,          // { id, name, email, role }
  token: null,
  isAuthenticated: false,
  login: (token, user) => void,
  logout: () => void
}
```

#### sessionStore.js
```javascript
{
  session: null,            // Full session object from API
  status: 'idle',           // idle | preflight | live | completed
  participants: {},         // { [user_id]: { name, role, connected: bool } }
  transcriptBuffer: [],     // Last N transcript segments (rolling buffer)
  sessionContract: null,    // String — shared contract text
  proficiency: [],          // Array of sub_topic_proficiency rows
  elapsedMs: 0,             // Session timer
  
  // Actions
  setSession, setStatus, addTranscriptSegment,
  setSessionContract, setProficiency, tick
}
```

#### diagnosticStore.js
```javascript
{
  questions: [],            // Array of question objects
  currentIndex: 0,
  answers: {},              // { [question_id]: { selected_index, confidence } }
  isComplete: false,
  
  // Actions
  setQuestions, submitAnswer, markComplete
}
```

#### sidecarStore.js
```javascript
{
  snapshots: [],            // Array of snapshot objects
  parkedQuestions: [],      // Array of parked question objects
  reflectionNotes: [],      // Array of { content, timestamp_ms }
  pendingIntentSnapshot: null, // snapshot_id waiting for tutor intent
  intentCountdown: 0,       // 10-second countdown
  
  // Actions
  addSnapshot, enrichSnapshot, addParkedQuestion,
  addReflection, setPendingIntent, decrementCountdown
}
```

### Custom Hook: useWebSocket.js
```javascript
// Responsibilities:
// 1. Open WS connection on mount, close on unmount
// 2. Authenticate with JWT on connect
// 3. Dispatch incoming events to the correct Zustand store action
// 4. Provide a send(event, payload) helper
// 5. Handle reconnection with exponential backoff

const useWebSocket = (sessionId) => {
  // Returns: { send, connectionStatus }
  // Side effects: dispatches to stores on incoming events
}
```

### Custom Hook: useTranscript.js
```javascript
// Responsibilities:
// 1. Initialize Web Speech API SpeechRecognition
// 2. On interim/final result → send TRANSCRIPT_SEGMENT WS event
// 3. Maintain local rolling buffer (last 120 seconds) in sessionStore
// 4. Handle browser compatibility gracefully

const useTranscript = (send) => {
  // Returns: { isListening, startListening, stopListening }
}
```

### Page: SessionRoom.jsx — The Orchestrator
```javascript
// This is the most important file in the codebase.
// Rendering logic:

if (status === 'preflight' && role === 'student') {
  return <PreFlightScreen />          // Full screen — tutor waits
}

if (status === 'preflight' && role === 'tutor') {
  return <TutorWaitingScreen />       // Shows "Student completing check-in..."
                                      // Proficiency dashboard populates in real-time
}

if (status === 'live') {
  return (
    <DualPane
      left={<VideoAndWhiteboardPane />}   // Video call + shared whiteboard
      right={
        role === 'student'
          ? <Sidecar />                   // FEATURE 2: Full sidecar
          : <TutorPanel />               // FEATURE 1 proficiency + FEATURE 3 analogy
      }
    />
  )
}

if (status === 'completed') {
  return <StudyPackModal />
}
```

---

## 11. BACKEND ARCHITECTURE

### main.py — App Setup
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, sessions, diagnostic, snapshots, study_pack
from app.websocket.handler import router as ws_router

app = FastAPI(title="Athira API")

app.add_middleware(CORSMiddleware, allow_origins=["*"], ...)

app.include_router(auth.router, prefix="/auth")
app.include_router(sessions.router, prefix="/sessions")
app.include_router(diagnostic.router, prefix="/diagnostic")
app.include_router(snapshots.router, prefix="/snapshots")
app.include_router(study_pack.router, prefix="/study-pack")
app.include_router(ws_router)  # /ws/{session_id}
```

### websocket/manager.py — ConnectionManager
```python
class ConnectionManager:
    # active_connections: Dict[session_id, Dict[user_id, WebSocket]]
    
    async def connect(session_id, user_id, role, websocket)
    async def disconnect(session_id, user_id)
    
    async def send_to_user(session_id, user_id, event, payload)
    async def send_to_role(session_id, role, event, payload)  # send to all tutors/students
    async def broadcast(session_id, event, payload)            # send to all in session
    
    # In-memory session state (cleared when session ends)
    def get_transcript_buffer(session_id) -> List[str]  # rolling 120s buffer
    def append_transcript(session_id, segment)
    def get_session_state(session_id) -> dict
```

### websocket/handler.py — Event Dispatcher
```python
@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket, session_id, token):
    user = verify_jwt(token)
    await manager.connect(session_id, user.id, user.role, websocket)
    
    try:
        while True:
            data = await websocket.receive_json()
            event = data["event"]
            
            # Dispatch to handler
            match event:
                case "SNAPSHOT_TAKEN":      await handle_snapshot(data, session_id, user)
                case "QUESTION_PARKED":     await handle_park(data, session_id, user)
                case "ANALOGY_REQUESTED":   await handle_analogy_request(data, session_id, user)
                case "TUTOR_INTENT_ADDED":  await handle_intent(data, session_id, user)
                case "TRANSCRIPT_SEGMENT":  await handle_transcript(data, session_id, user)
                case "ANALOGY_SELECTED":    await handle_analogy_selected(data, session_id, user)
                case "ANALOGY_WORKED":      await handle_analogy_worked(data, session_id, user)
                case "WHITEBOARD_DELTA":    await handle_whiteboard(data, session_id, user)
                case "DIAGNOSTIC_ANSWER_SUBMITTED": await handle_diag_answer(data, session_id, user)
    except WebSocketDisconnect:
        await manager.disconnect(session_id, user.id)
```

### services/diagnostic_service.py — Key Logic
```python
class DiagnosticService:
    
    async def generate_questions(session_id, topic, sub_topics) -> List[Question]:
        """
        Calls AI API with prompt:
        - Generate 5 diagnostic MCQ questions on {topic}
        - Sub-topics: {sub_topics}
        - For each question, include: sub_topic_tag, difficulty, branch_on_wrong (prerequisite), branch_on_right (advancement)
        - Return as JSON array
        """
    
    def compute_quadrant(is_correct: bool, confidence: int) -> str:
        """
        confidence 4-5 + correct   → 'mastered'
        confidence 4-5 + wrong     → 'danger_zone'   ← THE KEY INSIGHT
        confidence 1-3 + correct   → 'lucky_guess'
        confidence 1-3 + wrong     → 'known_gap'
        """
    
    def compute_traffic_light(quadrant: str) -> str:
        """
        mastered     → 'green'
        lucky_guess  → 'yellow'
        known_gap    → 'red'
        danger_zone  → 'danger'  (special red with ⚠️ icon)
        """
    
    async def generate_session_contract(proficiency_results) -> str:
        """
        Calls AI: given these sub-topic proficiency results, 
        write a ONE SENTENCE session contract.
        Focus on the danger_zone first, then known_gaps.
        """
```

### services/analogy_service.py — Key Logic
```python
ANALOGY_SYSTEM_PROMPT = """
You are an expert tutor helping another tutor explain a concept.
Given the last 2 minutes of tutoring transcript, generate EXACTLY 3 analogies.
Each analogy must use a DIFFERENT cognitive modality:
1. SPATIAL: Uses physical space, movement, tangible objects
2. SOCIAL: Uses human relationships, stories, social situations  
3. ABSTRACT: Uses mathematical ratios, scaling, formal patterns

Return JSON: { "spatial": "...", "social": "...", "abstract": "..." }
Keep each analogy to 1-2 sentences maximum.
Make them vivid, memorable, and genuinely illuminating.
"""

class AnalogyService:
    
    async def generate_analogies(session_id) -> dict:
        transcript = manager.get_transcript_buffer(session_id)
        transcript_text = " ".join([s["text"] for s in transcript[-20:]])  # last ~2 min
        
        response = await ai_client.chat(
            system=ANALOGY_SYSTEM_PROMPT,
            user=f"Transcript: {transcript_text}\n\nGenerate the 3 analogies now."
        )
        return parse_json_response(response)
```

---

## 12. AI INTEGRATION LAYER

### AI Provider Setup
```python
# Use OpenAI GPT-4o OR Anthropic Claude API
# Primary use cases:
# 1. Diagnostic question generation (at session booking time — not time-critical)
# 2. Session contract generation (after diagnostic — not time-critical)
# 3. Analogy generation (during session — time-critical, target <5s response)
# 4. Snapshot context tagging (on snapshot — near-real-time, <3s)
```

### Prompt Templates

#### 1. Question Generation Prompt
```
SYSTEM: You are an expert diagnostic assessment designer for one-on-one tutoring.

USER:
Topic: {topic}
Sub-topics: {sub_topics_json}
Student level: University undergraduate

Generate 5 multiple-choice diagnostic questions.
Rules:
- Each question must clearly target ONE specific sub-topic
- Include 4 answer options (only one correct)
- Mark correct_index (0-3)
- Set difficulty: easy|medium|hard
- For each question, specify:
  - branch_on_wrong: which sub-topic to probe next if student gets this wrong
  - branch_on_right: which sub-topic to probe next if student gets this right

Return ONLY valid JSON array. No preamble. No markdown.
Schema: [{ question_text, options, correct_index, sub_topic, difficulty, branch_on_wrong_sub_topic, branch_on_right_sub_topic }]
```

#### 2. Session Contract Prompt
```
SYSTEM: You are a concise academic advisor.

USER:
Sub-topic proficiency results: {proficiency_json}

Write ONE sentence (max 25 words) that:
1. Starts with "Today's focus:"
2. Names the danger_zone or known_gap sub-topics first  
3. Notes any mastered sub-topics to skip
4. Uses plain, direct language a student and tutor can act on immediately

Return ONLY the sentence. No preamble.
```

#### 3. Snapshot Context Tag Prompt
```
SYSTEM: You generate brief, accurate context labels for learning snapshots.

USER:
Transcript snippet: "{last_30s_transcript}"

In 10 words or fewer, complete this sentence:
"Tutor explaining: ___"

Return ONLY the completion. No preamble.
```

#### 4. Analogy Generation Prompt
```
[See services/analogy_service.py section above]
```

---

## 13. IMPLEMENTATION ORDER (DAY-BY-DAY SPRINT PLAN)

### DAY 1 — Foundation (must finish by midnight)

**Morning (4 hours) — Backend skeleton**
1. Set up FastAPI project structure, install dependencies
2. Configure SQLite database + SQLAlchemy models (all 8 tables)
3. Run Alembic migration
4. Implement `/auth/register` and `/auth/login` with JWT
5. Implement `/sessions` CRUD endpoints (basic)
6. Implement `ConnectionManager` class (connect/disconnect/broadcast)
7. Basic WebSocket endpoint at `/ws/{session_id}` — echo test working

**Afternoon (4 hours) — Frontend skeleton**
1. Set up Vite + React project, install Tailwind, Zustand, Axios, Lucide
2. Set up React Router — routes for `/login`, `/register`, `/dashboard`, `/session/:id`
3. Build `authStore`, `sessionStore` (basic)
4. Build `LoginPage` and `RegisterPage` (functional, not pretty yet)
5. Build stub `StudentDashboard` and `TutorDashboard`
6. Implement `useWebSocket` hook — connect, disconnect, send, receive

**Evening (2 hours) — Integration test**
1. End-to-end: register → login → create session → join session room → WS connects
2. Both student and tutor can open separate browser tabs and see each other's connection status

---

### DAY 2 — Feature 1: Pre-Flight Diagnostic (must finish by midnight)

**Morning (4 hours) — Backend**
1. Implement `DiagnosticService.generate_questions()` with AI API call
2. Implement `/diagnostic/{session_id}/generate` endpoint (called at booking)
3. Implement adaptive branching logic (select next question based on prior answer)
4. Implement `compute_quadrant()` and `compute_traffic_light()` functions
5. Implement `/diagnostic/{session_id}/submit` — compute all proficiency rows
6. Implement `generate_session_contract()` AI call
7. Wire up WS events: `DIAGNOSTIC_PROGRESS`, `DIAGNOSTIC_COMPLETE`, `SESSION_STATUS_CHANGED`

**Afternoon (4 hours) — Frontend**
1. Build `PreFlightScreen.jsx` — full-screen student experience
2. Build `QuestionCard.jsx` with confidence slider (1-5 stars or slider UI)
3. Wire diagnostic WS events: submit answers, receive progress
4. Build `ProficiencyDashboard.jsx` — tutor's traffic light grid
5. Build `ConfidenceMatrix.jsx` — the 2x2 quadrant visual (the originality spike)
6. Build `SessionContractBanner.jsx` — shared banner at top of session room

**Evening (2 hours)**
1. Test full diagnostic flow end-to-end
2. Verify session contract appears for both users on session room load

---

### DAY 3 — Features 2 & 3: Sidecar + Analogy Engine

**Morning (4 hours) — Feature 2: Sidecar**
1. Backend: `handle_snapshot()` — store PNG + transcript snippet + AI context tag
2. Backend: Fire `TUTOR_INTENT_PROMPT` WS event to tutor
3. Backend: `handle_intent()` — update snapshot with tutor intent, fire `SNAPSHOT_ENRICHED`
4. Backend: `handle_park()` — store parked question, fire `QUESTION_PARKED`
5. Frontend: `Sidecar.jsx` with tab navigation (Snapshots | Parking Lot | Notes)
6. Frontend: `SnapshotButton.jsx` — capture whiteboard canvas as base64 PNG
7. Frontend: `SnapshotCard.jsx` — render snapshot with image, transcript, tutor tag
8. Frontend: `TutorIntentToast.jsx` — 10-second countdown with input field on tutor side
9. Frontend: `ParkButton.jsx` and `ParkingLot.jsx`
10. Frontend: `ReflectionEditor.jsx`

**Afternoon (3 hours) — Feature 3: Analogy Engine**
1. Backend: `AnalogyService.generate_analogies()` — grab transcript buffer + AI call
2. Backend: `handle_analogy_request()` — call service, fire `ANALOGIES_READY`
3. Backend: `handle_analogy_worked()` — log cognitive signal
4. Frontend: `HelpExplainButton.jsx` on tutor panel
5. Frontend: `AnalogyPanel.jsx` — 3 modality cards with icons (🌊 👥 📐)
6. Frontend: "Send to Student" button → fires `ANALOGY_POLL_SEND`
7. Frontend: `AnalogyPoll.jsx` on student sidecar — receive poll, select, fire `ANALOGY_SELECTED`
8. Frontend: Tutor panel highlights selected analogy + `ANALOGY_SELECTION_RECEIVED`
9. Frontend: "This clicked!" button in sidecar

**Evening (2 hours) — Transcript + Whiteboard**
1. Implement `useTranscript.js` with Web Speech API
2. Wire `TRANSCRIPT_SEGMENT` → backend buffer → `TRANSCRIPT_BROADCAST` → both clients
3. Embed Excalidraw in `SharedWhiteboard.jsx`
4. Wire `WHITEBOARD_DELTA` events for real-time sync

---

### DAY 4 — Polish, Study Pack, Deployment

**Morning (3 hours) — Study Pack + Post-Session**
1. Backend: `StudyPackService.compile()` — aggregate all session artifacts
2. Backend: `GET /study-pack/{session_id}` and `/export` endpoints
3. Frontend: `StudyPackModal.jsx` — shown when session status becomes 'completed'
4. Frontend: Export to PDF using html2canvas + jsPDF

**Afternoon (3 hours) — UI Polish**
1. Apply design system consistently (colors, typography, spacing — see Section 15)
2. Add loading states, error states, toast notifications
3. Mobile-responsive check for session room

**Late Afternoon (2 hours) — Deployment**
1. Deploy backend to Railway.app
2. Deploy frontend to Vercel
3. Update environment variables for production URLs
4. End-to-end smoke test on production

**Evening (2 hours) — Demo Prep**
1. Record 5-minute demo video
2. Write Architecture Doc (one page)
3. Clean up README with WS event schema
4. Final push to GitHub

---

## 14. ENVIRONMENT VARIABLES

### backend/.env
```bash
# Database
DATABASE_URL=sqlite+aiosqlite:///./athira.db
# For production: postgresql+asyncpg://user:pass@host/db

# Auth
JWT_SECRET_KEY=your-super-secret-key-change-this
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440

# AI API (choose one)
OPENAI_API_KEY=sk-...
# OR
ANTHROPIC_API_KEY=sk-ant-...
AI_PROVIDER=openai  # or: anthropic

# App
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:5173
```

### frontend/.env
```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000

# Video provider (Daily.co is easiest)
VITE_DAILY_ROOM_URL=https://your-domain.daily.co/your-room

# For production
# VITE_API_BASE_URL=https://your-app.railway.app
# VITE_WS_BASE_URL=wss://your-app.railway.app
```

---

## 15. UI/UX DESIGN SYSTEM

### Color Palette
```css
:root {
  /* Brand */
  --color-primary:       #2563EB;   /* Athira blue */
  --color-primary-light: #EFF6FF;
  --color-primary-dark:  #1D4ED8;

  /* Proficiency Traffic Lights */
  --color-mastered:      #16A34A;   /* Green */
  --color-lucky-guess:   #CA8A04;   /* Yellow/amber */
  --color-known-gap:     #DC2626;   /* Red */
  --color-danger-zone:   #7C3AED;   /* Purple — distinct from standard red */

  /* Sidecar / Neutral */
  --color-surface:       #F8FAFC;
  --color-border:        #E2E8F0;
  --color-text-primary:  #0F172A;
  --color-text-secondary:#64748B;

  /* Session room background */
  --color-session-bg:    #0F172A;   /* Dark — focuses attention on content */
  --color-session-panel: #1E293B;
  --color-session-border:#334155;
}
```

### Typography
```css
/* Import in index.css */
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');

body          { font-family: 'DM Sans', sans-serif; }
code, .mono   { font-family: 'DM Mono', monospace; }

.text-hero    { font-size: 2rem; font-weight: 600; line-height: 1.2; }
.text-section { font-size: 1.125rem; font-weight: 600; }
.text-body    { font-size: 0.875rem; line-height: 1.6; }
.text-label   { font-size: 0.75rem; font-weight: 500; letter-spacing: 0.05em; text-transform: uppercase; }
```

### Session Room Layout
```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER: Session Contract Banner | Timer | Status               │
├──────────────────────────────────────┬──────────────────────────┤
│                                      │                          │
│  LEFT PANE (60% width)               │  RIGHT PANE (40% width)  │
│                                      │                          │
│  ┌──────────────────────────────┐   │  STUDENT VIEW:           │
│  │                              │   │  └─ Sidecar              │
│  │   VIDEO CALL (top half)      │   │     ├─ Snapshots tab      │
│  │   Daily.co embed            │   │     ├─ Parking Lot tab    │
│  │                              │   │     └─ Notes tab          │
│  └──────────────────────────────┘   │                          │
│  ┌──────────────────────────────┐   │  TUTOR VIEW:             │
│  │                              │   │  ├─ Proficiency Grid     │
│  │   SHARED WHITEBOARD          │   │  ├─ Analogy Panel        │
│  │   Excalidraw embed          │   │  └─ Parking Lot (view)   │
│  │   (bottom half)              │   │                          │
│  └──────────────────────────────┘   │                          │
│                                      │                          │
├──────────────────────────────────────┴──────────────────────────┤
│  TRANSCRIPT TICKER (scrolling live transcript, both see)        │
└─────────────────────────────────────────────────────────────────┘
```

### Key UI Principles
1. **Session room is DARK** — dark background (#0F172A) to reduce eye strain and focus on content
2. **Sidecar slides in** — animate from right with `transform: translateX` on mount
3. **Toast notifications** — all WS events that need acknowledgment use top-right toasts (react-hot-toast)
4. **Confidence slider** — custom styled range input, NOT a default browser slider
5. **Traffic lights** — use filled circles with pulse animation for DANGER ZONE items
6. **Modality icons** — 🌊 Spatial, 👥 Social, 📐 Abstract — always shown consistently

---

## 16. JUDGING CRITERIA ALIGNMENT

### Originality (Primary Score Driver)
| Our Feature | Originality Claim |
|---|---|
| Confidence Gap Matrix (2x2) | No tutoring platform surfaces the "confident but wrong" signal — the hardest gap to detect in a conversation |
| Tutor Intent Tag (10-second async annotation) | Bi-directional, time-bounded collaborative annotation on live moments — novel UX pattern |
| Analogy Modality Diversity + Student Selection | Learner-directed teaching: student picks the cognitive frame they're taught in |
| Study Pack as Session Artifact | Session has a durable output — the 60 minutes produces a deliverable, not just memories |

### Pedagogical Reasoning (Architecture Doc)
| Feature | Learning Science Justification |
|---|---|
| Pre-Flight Diagnostic | Bloom's Taxonomy — baseline assessment before instruction is foundational pedagogy |
| Danger Zone Quadrant | Constructivism — misconceptions must be surfaced explicitly; students resist correction when confidently wrong |
| Parking Lot | Reduces cognitive load during learning — defer unresolved questions, address in batch |
| Analogy Modality Selection | Cognitive style theory (Gardner, Felder-Silverman) — matching explanation to learner's dominant mode improves retention |
| Session Contract | Goal-setting theory (Locke & Latham) — explicit, shared goals improve performance and focus |

### WebSocket Synchronization Strategy (Architecture Doc)
- **Relay model:** Backend is the single source of truth. All events pass through the server, never peer-to-peer.
- **Role-scoped delivery:** Backend uses `ConnectionManager.send_to_role()` to ensure student-only and tutor-only events are never cross-delivered. The sidecar is architecturally private — not just hidden on the frontend.
- **In-memory session state:** Active session data (transcript buffer, connection map) lives in server memory for low-latency access. Persistent data (snapshots, parked questions) is written to DB asynchronously, never blocking the WS event loop.
- **Transcript buffer:** Rolling 120-second buffer in memory (last ~20 segments). Used as context for analogy generation and snapshot tagging. Periodically flushed to `transcript_segments` table.

---

## FINAL NOTES FOR CLAUDE CODE

1. **Build in this order:** Auth → WS Connection → Diagnostic → Sidecar → Analogy → Study Pack
2. **Prioritize WebSocket events over REST** — the judges will be looking at the live session, not the API
3. **Never build the transcript buffer on the frontend alone** — it must be server-side so both analogy generation and snapshot context work correctly
4. **The ConfidenceMatrix 2x2 component is the most important UI component** — give it visual polish. Use colored quadrant backgrounds with icons.
5. **The Danger Zone traffic light must visually differ from the standard red** — use purple (#7C3AED) with a ⚠️ icon and a subtle pulse animation
6. **Test with two browser tabs** — always test features with Tab 1 as student and Tab 2 as tutor simultaneously
7. **If the AI API call fails** (timeout, quota), gracefully degrade — show "Analogy generation failed, try again" rather than crashing the session
8. **The Study Pack export should work even if called mid-session** — compile whatever data exists at that point

---

*This document is the complete source of truth. Do not deviate from the data models, WebSocket event schemas, or feature specifications without good reason. When in doubt, build the simplest version of a feature that still demonstrates the core pedagogical value.*