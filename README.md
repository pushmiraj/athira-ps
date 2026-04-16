# Athira — Live Session Innovation Workspace

> Transforming the 60-minute tutoring session from a generic video call into a high-signal, collaborative learning environment.

## Quick Start

### Backend
```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # fill in your API keys
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_BASE_URL and VITE_WS_BASE_URL
npm run dev            # opens at http://localhost:5173
```

## Feature Overview

| Feature | Description |
|---|---|
| Pre-Flight Diagnostic | AI-generated 5-question MCQ with confidence slider; produces 2×2 Confidence Gap Matrix |
| Sidecar | Student-only panel: Snapshots, Parking Lot, Reflection Notes; Tutor Intent Tags via 10s async toast |
| Analogy Engine | "Help Me Explain" → 3-modality AI analogies → student selection poll → cognitive signal logging |
| Study Pack | Post-session artifact: all snapshots + parked questions + notes + session contract, exportable as HTML |

## WebSocket Event Schema

All messages use this envelope:
```json
{ "event": "EVENT_TYPE", "session_id": "uuid", "sender_id": "uuid", "sender_role": "student|tutor", "timestamp_ms": 1234567890, "payload": {} }
```

### Connection
```
WS: ws://localhost:8000/ws/{session_id}?token={jwt_token}
```

### Events

| Event | Direction | Description |
|---|---|---|
| `PARTICIPANT_JOINED` | server→all | User connected to session |
| `PARTICIPANT_LEFT` | server→all | User disconnected |
| `SESSION_STATUS_CHANGED` | server→all | Status: preflight→live→completed |
| `DIAGNOSTIC_ANSWER_SUBMITTED` | student→server | Student submits answer + confidence |
| `DIAGNOSTIC_PROGRESS` | server→tutor | Live progress after each answer |
| `DIAGNOSTIC_COMPLETE` | server→tutor | All answers done; includes proficiency array + contract |
| `SNAPSHOT_TAKEN` | student→server | Whiteboard PNG + transcript snippet captured |
| `SNAPSHOT_CONFIRMED` | server→student | Snapshot stored with AI context tag |
| `TUTOR_INTENT_PROMPT` | server→tutor | 10-second window to annotate snapshot |
| `TUTOR_INTENT_ADDED` | tutor→server | Tutor submits intent text |
| `SNAPSHOT_ENRICHED` | server→student | Tutor's annotation attached to snapshot |
| `QUESTION_PARKED` | student→server | Student parks a question with transcript context |
| `QUESTION_PARKED_CONFIRMED` | server→student | Park stored |
| `REFLECTION_SAVED` | student→server | Private note saved |
| `ANALOGY_REQUESTED` | tutor→server | Trigger AI analogy generation |
| `ANALOGIES_READY` | server→tutor | 3 modality analogies returned |
| `ANALOGY_ERROR` | server→tutor | AI generation failed (graceful degrade) |
| `ANALOGY_POLL_SEND` | tutor→server | Push analogy poll to student |
| `ANALOGY_POLL_RECEIVED` | server→student | Student receives 3-option poll |
| `ANALOGY_SELECTED` | student→server | Student picks a modality |
| `ANALOGY_SELECTION_RECEIVED` | server→tutor | Highlights chosen card |
| `ANALOGY_WORKED` | student→server | "This clicked!" cognitive signal |
| `TRANSCRIPT_SEGMENT` | both→server | Speech Recognition segment |
| `TRANSCRIPT_BROADCAST` | server→both | Relay transcript to other participant |
| `WHITEBOARD_DELTA` | both→server | Excalidraw canvas change |
| `WHITEBOARD_UPDATE` | server→both | Relay whiteboard to other participant |

## Architecture

**Synchronization Strategy:** Server-relay model. All events pass through the FastAPI backend — never peer-to-peer. The `ConnectionManager` maintains `active_connections: Dict[session_id, Dict[user_id, WebSocket]]` and delivers events role-scoped (`send_to_role`) or user-scoped (`send_to_user`), ensuring the sidecar is architecturally private, not just hidden on the frontend.

**In-memory session state:** Active transcript buffers (rolling 60-segment window) live in server memory for low-latency AI access. Persistent data (snapshots, parked questions, analogy logs) is written to SQLite/PostgreSQL asynchronously.

**Pedagogical Reasoning:**
- **Pre-Flight Diagnostic** — Bloom's Taxonomy: baseline assessment before instruction
- **Danger Zone Quadrant** — Constructivism: confidently wrong students resist correction; must surface explicitly
- **Parking Lot** — Cognitive load theory: defer unresolved questions, address in structured batch
- **Analogy Modality Selection** — Felder-Silverman cognitive styles: match explanation to learner's dominant mode
- **Session Contract** — Locke & Latham goal-setting theory: explicit shared goals improve focus

## Stack

**Backend:** FastAPI · SQLAlchemy (async) · SQLite/PostgreSQL · JWT Auth · OpenAI/Anthropic API  
**Frontend:** Vite + React 18 · Tailwind CSS · Zustand · Excalidraw · Web Speech API  
**Deployment:** Railway.app (backend) · Vercel (frontend)
