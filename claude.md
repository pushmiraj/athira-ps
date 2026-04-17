# Agent Handoff / Architecture Context

Hello Claude / Next AI Developer! 

This document serves as the architectural truth for the `Athira EdTech Platform`. This platform was explicitly designed to strip out bloated third-party dependencies (like Excalidraw or Daily.co) and replace them with native, highly performant browser equivalents synchronized via a custom Python FastAPI WebSocket router.

---

## What Has Been Completed ✅

1. **Centralized WebSocket Router (`app/websocket/handler.py`)**
   - Built a robust `manager.broadcast` system.
   - Handled an edge case where testing via a single local testing user payload caused dropped packets by using `id(websocket)` as the connection pointer (`conn_id`).

2. **Native Video (WebRTC)**
   - Replaced Daily.co. We handle custom `WEBRTC_OFFER`, `WEBRTC_ANSWER`, and `WEBRTC_ICE_CANDIDATE` signaling packets over the central WebSocket.

3. **Shared Canvas Whiteboard (`SharedWhiteboard.jsx`)**
   - Implemented a vanilla HTML5 `<canvas>` rendering engine.
   - Supports freehand stroke replication, clearing, and an interactive Text Box payload engine (`tool: 'text'`).
   - Uses `WHITEBOARD_UPDATE` packets. 

4. **Speech-to-Text Transcripts (`useTranscript.js`)**
   - Implemented `window.SpeechRecognition` (Web Speech API).
   - Patched memory leak/abort loops using a 1-second debounce and interim parsing logic.
   - Transcripts sync live via `TRANSCRIPT_BROADCAST`.

5. **AI Services (`gemini-2.5-flash`)**
   - Migrated from OpenAI/Anthropic to Gemini across all Python service workers (`diagnostic_service.py`, `analogy_service.py`) for cost-efficiency.

6. **Real-time Text Editor**
   - Simple `<textarea>` binding synced locally through Zustand `sessionStore.js` and updated via `TEXT_EDITOR_UPDATE`.

---

## Known Quirks / Engineering Details 🛠️

1. **Speech API Local Testing**: The native browser Web Speech API forbids having multiple open tabs listening to the microphone simulatenously under local testing. The secondary tab will infinitely throw `"aborted"` errors. The code explicitly implements a 1s backoff to prevent browser crashing, but you cannot test Voice locally with 2 tabs unless using two separate hardware instances or separate browser profiles.
2. **WebSocket Exclusion Strategy**: `manager.py` uses `exclude_conn_id=user["conn_id"]` (injected inside `handler.py` upon JWT parsing) when broadcasting. This ensures a local developer logged into both tabs as "Student" won't have their packets dropped by the backend's "exclude sender" filter.
3. **UI Layouts**: The `canvas` UI overlay explicitly places `textInput` html overlay inputs over the raw canvas. React injects raw `px` values via style. Never remove `px` string interpolation or the rendering will break.

---

## What Needs To Be Done Next 📝

1. **Scale Out WebSockets**
   - The current `ConnectionManager` lives in standard FastAPI memory (`active_connections` dict). If the server scales horizontally to multiple Gunicorn/Uvicorn workers, this dict will branch. **Action:** Implement Redis Pub/Sub for the WebSocket manager to route packets between workers.
2. **True Authentication Linking**
   - Move past the basic `.env` dev testing JWT tokens and implement hard `Tutor` -> `Student` session ID routing from the SQL database session lookup table.
3. **Whiteboard Resize/Scaling Edge Cases**
   - Coordinates currently calculate absolute x/y locally. If the Tutor is on a 27" monitor and the Student is on an iPad, the bounding-box math will diverge. **Action:** Map mouse events into normalized coordinate strings (`%` relative to bounding box) before parsing to backend `WHITEBOARD_DELTA` payload.
4. **Database Archiving**
   - Set up async crons or hooks to dump `strokesRef` JSON schemas into immutable database BLOB storage after a session officially ends. 
5. **Deployment Configuration**
   - Create a `Dockerfile` + `docker-compose.yml` to package both Vite (built via NGINX as static assets) and Uvicorn.