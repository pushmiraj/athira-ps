from typing import Dict, List, Any
from fastapi import WebSocket
import json
import time


class ConnectionManager:
    def __init__(self):
        # { session_id: { user_id: {"ws": WebSocket, "role": str, "name": str} } }
        self.active_connections: Dict[str, Dict[str, dict]] = {}
        # { session_id: [ {"speaker_id": str, "speaker_role": str, "text": str, "timestamp_ms": int} ] }
        self.transcript_buffers: Dict[str, List[dict]] = {}
        # { session_id: { elements: [], appState: {} } }
        self.whiteboard_state: Dict[str, dict] = {}

    async def connect(self, session_id: str, user_id: str, role: str, name: str, websocket: WebSocket):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = {}
            
        # Use a true unique connection ID so a single user can have multiple testing tabs open
        conn_id = str(id(websocket))
        self.active_connections[session_id][conn_id] = {
            "ws": websocket,
            "user_id": user_id,
            "role": role,
            "name": name,
        }

    async def disconnect(self, session_id: str, websocket: WebSocket):
        conn_id = str(id(websocket))
        if session_id in self.active_connections:
            self.active_connections[session_id].pop(conn_id, None)
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]

    def _make_envelope(self, session_id: str, event: str, payload: dict, sender_id: str = "server", sender_role: str = "server") -> dict:
        return {
            "event": event,
            "session_id": session_id,
            "sender_id": sender_id,
            "sender_role": sender_role,
            "timestamp_ms": int(time.time() * 1000),
            "payload": payload,
        }

    async def send_to_user(self, session_id: str, user_id: str, event: str, payload: dict):
        conn = self.active_connections.get(session_id, {}).get(user_id)
        if conn:
            try:
                await conn["ws"].send_json(self._make_envelope(session_id, event, payload))
            except Exception:
                pass

    async def send_to_role(self, session_id: str, role: str, event: str, payload: dict):
        for uid, conn in self.active_connections.get(session_id, {}).items():
            if conn["role"] == role:
                try:
                    await conn["ws"].send_json(self._make_envelope(session_id, event, payload))
                except Exception:
                    pass

    async def broadcast(self, session_id: str, event: str, payload: dict, exclude_conn_id: str = None):
        sent_count = 0
        for uid, conn in self.active_connections.get(session_id, {}).items():
            if uid == exclude_conn_id:
                continue
            try:
                await conn["ws"].send_json(self._make_envelope(session_id, event, payload))
                sent_count += 1
            except Exception:
                pass
        print(f"[WS] Broadcasted {event} to {sent_count} peers (excluded conn_id: {exclude_conn_id})")

    def append_transcript(self, session_id: str, segment: dict):
        if session_id not in self.transcript_buffers:
            self.transcript_buffers[session_id] = []
        self.transcript_buffers[session_id].append(segment)
        # Keep rolling 120-second window (approx 40 segments at ~3s each)
        if len(self.transcript_buffers[session_id]) > 60:
            self.transcript_buffers[session_id] = self.transcript_buffers[session_id][-60:]

    def get_transcript_buffer(self, session_id: str) -> List[dict]:
        return self.transcript_buffers.get(session_id, [])

    def get_last_n_transcript_text(self, session_id: str, n: int = 20) -> str:
        segments = self.get_transcript_buffer(session_id)[-n:]
        return " ".join(s["text"] for s in segments)

    def get_last_seconds_transcript(self, session_id: str, seconds: int = 30) -> str:
        all_segs = self.get_transcript_buffer(session_id)
        if not all_segs:
            return ""
        cutoff = int(time.time() * 1000) - (seconds * 1000)
        recent = [s["text"] for s in all_segs if s.get("timestamp_ms", 0) >= cutoff]
        return " ".join(recent) or " ".join(s["text"] for s in all_segs[-5:])

    def get_participant_count(self, session_id: str) -> int:
        return len(self.active_connections.get(session_id, {}))

    def get_participants(self, session_id: str) -> List[dict]:
        return [
            {"user_id": uid, "role": c["role"], "name": c["name"]}
            for uid, c in self.active_connections.get(session_id, {}).items()
        ]


manager = ConnectionManager()
