# Athira EdTech Platform

A zero-dependency, ultra-fast real-time tutoring platform leveraging native browser capabilities and WebSockets.

## 🚀 Key Features

*   **Native P2P Video Communication**: Uses fully native WebRTC (via WebSocket signaling) to establish video/audio streams, eliminating expensive 3rd-party dependencies like Daily.co.
*   **Zero-Dependency Collaborative Whiteboard**: A completely custom HTML5 `<canvas>` whiteboard that supports real-time multi-user strokes, drawing, dynamic color/size selection, and text-box overlays synchronized over WebSockets.
*   **Real-time Live Transcript**: Integrates the native Browser Web Speech API to transcribe sessions live. Interim strings and optimized debouncing handle UI buffering seamlessly while broadcasting to students in real-time.
*   **Live Collaborative Code/Text Editor**: A low-latency text sink allowing the tutor and student to instantly share document states dynamically.
*   **Gemini AI Diagnostics Engine**: Utilizes Google's `gemini-2.5-flash` to evaluate check-in tests, process learning analytics, and generate immediate educational analogies dynamically parsed over WebSockets.

---

## 🛠️ Tech Stack

**Frontend**
*   React (Vite)
*   Zustand (Global Session State & Buffer Management)
*   Tailwind CSS (UI & Layouts)

**Backend**
*   Python (FastAPI)
*   Uvicorn (ASGI Server)
*   SQLite + SQLAlchemy (Database/ORM)

---

## 💻 Local Setup Instructions

### 1. Backend Setup
1.  Navigate into the backend directory: `cd backend`
2.  Set up your Python virtual environment:
    ```bash
    python -m venv venv
    .\venv\Scripts\activate  # On Windows
    ```
3.  Install dependencies: `pip install -r requirements.txt`
4.  Configure Environment Variables:
    *   Create a `.env` file in the `backend/` directory.
    *   Add your Gemini API Key: `GEMINI_API_KEY=your_key_here`
5.  Run the server:
    ```bash
    python -m uvicorn main:app --reload
    ```
    *(The backend runs on `localhost:8000`)*

### 2. Frontend Setup
1.  Navigate into the frontend directory: `cd frontend`
2.  Install packages: `npm install`
3.  Start the development server:
    ```bash
    npm run dev
    ```
    *(The frontend usually runs on `http://localhost:5173`)*

---

## 🏗️ How Real-Time State Works

All real-time collaboration (Whiteboard, Text Editor, WebRTC Signaling) routes through a single unified `WebSocket` connection (`backend/app/websocket/handler.py`).

The client connects and listens to events via `frontend/src/hooks/useWebSocket.js`. When a local action occurs (like drawing a stroke), the client packages a custom envelope (e.g., `WHITEBOARD_DELTA`) and sends it.

The Python backend `ConnectionManager` dynamically caches the connection pool and securely broadcasts the exact payload to the peer using a precise `exclude_conn_id` mechanism (which safely allows local testing with multi-tabs on the same development account)!
