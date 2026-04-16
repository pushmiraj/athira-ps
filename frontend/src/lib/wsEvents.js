// WebSocket event type constants — single source of truth for all WS events

// ─── Session Lifecycle ─────────────────────────────────────────────────────
export const WS_JOIN_SESSION = 'WS_JOIN_SESSION'
export const WS_LEAVE_SESSION = 'WS_LEAVE_SESSION'
export const PARTICIPANT_JOINED = 'PARTICIPANT_JOINED'
export const PARTICIPANT_LEFT = 'PARTICIPANT_LEFT'
export const SESSION_STATUS_CHANGED = 'SESSION_STATUS_CHANGED'
export const SESSION_PARTICIPANTS = 'SESSION_PARTICIPANTS'

// ─── Feature 1: Diagnostic ────────────────────────────────────────────────
export const DIAGNOSTIC_QUESTIONS_READY = 'DIAGNOSTIC_QUESTIONS_READY'
export const DIAGNOSTIC_ANSWER_SUBMITTED = 'DIAGNOSTIC_ANSWER_SUBMITTED'
export const DIAGNOSTIC_COMPLETE = 'DIAGNOSTIC_COMPLETE'
export const DIAGNOSTIC_PROGRESS = 'DIAGNOSTIC_PROGRESS'

// ─── Feature 2: Sidecar / Snapshots ──────────────────────────────────────
export const SNAPSHOT_TAKEN = 'SNAPSHOT_TAKEN'
export const SNAPSHOT_CONFIRMED = 'SNAPSHOT_CONFIRMED'
export const SNAPSHOT_ENRICHED = 'SNAPSHOT_ENRICHED'
export const TUTOR_INTENT_PROMPT = 'TUTOR_INTENT_PROMPT'
export const TUTOR_INTENT_ADDED = 'TUTOR_INTENT_ADDED'
export const QUESTION_PARKED = 'QUESTION_PARKED'
export const QUESTION_PARKED_CONFIRMED = 'QUESTION_PARKED_CONFIRMED'
export const REFLECTION_SAVED = 'REFLECTION_SAVED'
export const PARKED_QUESTION_RESOLVED = 'PARKED_QUESTION_RESOLVED'

// ─── Feature 3: Analogy Engine ────────────────────────────────────────────
export const ANALOGY_REQUESTED = 'ANALOGY_REQUESTED'
export const ANALOGIES_READY = 'ANALOGIES_READY'
export const ANALOGY_ERROR = 'ANALOGY_ERROR'
export const ANALOGY_POLL_SEND = 'ANALOGY_POLL_SEND'
export const ANALOGY_POLL_RECEIVED = 'ANALOGY_POLL_RECEIVED'
export const ANALOGY_SELECTED = 'ANALOGY_SELECTED'
export const ANALOGY_SELECTION_RECEIVED = 'ANALOGY_SELECTION_RECEIVED'
export const ANALOGY_WORKED = 'ANALOGY_WORKED'

// ─── Transcript ───────────────────────────────────────────────────────────
export const TRANSCRIPT_SEGMENT = 'TRANSCRIPT_SEGMENT'
export const TRANSCRIPT_BROADCAST = 'TRANSCRIPT_BROADCAST'

// ─── Whiteboard ───────────────────────────────────────────────────────────
export const WHITEBOARD_DELTA = 'WHITEBOARD_DELTA'
export const WHITEBOARD_UPDATE = 'WHITEBOARD_UPDATE'

// ─── WebRTC Signaling ─────────────────────────────────────────────────────
export const WEBRTC_OFFER = 'WEBRTC_OFFER'
export const WEBRTC_ANSWER = 'WEBRTC_ANSWER'
export const WEBRTC_ICE_CANDIDATE = 'WEBRTC_ICE_CANDIDATE'

