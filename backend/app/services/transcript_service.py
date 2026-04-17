"""
Transcript processing service using Groq (or fallback to other providers).
Cleans up a single speech segment: removes filler words, fixes grammar,
and structures it into a clear readable sentence.
"""
from app.config import settings

CLEAN_SEGMENT_SYSTEM = (
    "You are a real-time speech cleanup assistant for a tutoring session. "
    "Your ONLY job: take a raw speech-to-text segment and return a clean, structured version. "
    "Rules: (1) Remove filler words (um, uh, like, you know, basically, so). "
    "(2) Fix grammar and punctuation. "
    "(3) Keep the original meaning — do NOT add information. "
    "(4) Keep it SHORT — max 1-2 sentences. "
    "(5) Return ONLY the cleaned text. No explanations, no labels, no preamble."
)


async def process_segment(text: str) -> str:
    """
    Clean and structure a single speech-to-text segment using LLM.
    Returns the processed text, or the original text if processing fails.
    """
    if not text or len(text.strip()) < 5:
        return text.strip()

    prompt = f'Raw speech: "{text.strip()}"\n\nCleaned version:'

    try:
        result = await _call_ai(CLEAN_SEGMENT_SYSTEM, prompt)
        # Remove any accidental quotes the LLM might wrap around the answer
        result = result.strip().strip('"').strip("'")
        print(f"[TranscriptService] '{text[:40]}...' → '{result[:40]}...'")
        return result if result else text.strip()
    except Exception as e:
        print(f"[TranscriptService] Segment processing failed: {e}")
        return text.strip()   # Fall back to raw text


# ─── Keep the rolling summary as well (used by analogy engine) ───────────────

SUMMARIZE_SYSTEM = (
    "You are a real-time tutor-session assistant. "
    "Summarize the following tutoring transcript in 2-3 clear bullet points. "
    "Focus on: key concepts explained, student questions, and action items. "
    "Be brief — this is a live summary card shown during the session."
)


async def summarize_transcript(text: str) -> str:
    """Summarize a rolling block of transcript text."""
    if not text or len(text.strip()) < 20:
        return ""
    prompt = f"Transcript:\n\n{text}\n\nSummarize in 2-3 bullet points:"
    try:
        return await _call_ai(SUMMARIZE_SYSTEM, prompt)
    except Exception as e:
        print(f"[TranscriptService] Summarization failed: {e}")
        return ""


async def _call_ai(system: str, user: str, max_tokens: int = 200) -> str:
    provider = settings.AI_PROVIDER.lower()

    if provider == "groq":
        from groq import AsyncGroq
        client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        resp = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            max_tokens=max_tokens,
            temperature=0.2,   # Low temp for deterministic cleanup
        )
        return resp.choices[0].message.content.strip()

    elif provider == "gemini":
        from google import genai
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=user,
            config=getattr(genai.types, "GenerateContentConfig", lambda **kw: kw)(
                system_instruction=system,
                temperature=0.2,
                max_output_tokens=max_tokens,
            ),
        )
        return response.text.strip()

    elif provider == "anthropic":
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        msg = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
        return msg.content[0].text.strip()

    else:  # openai
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        resp = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            max_tokens=max_tokens,
            temperature=0.2,
        )
        return resp.choices[0].message.content.strip()

async def generate_full_session_summary(session_id: str, db) -> str:
    from sqlalchemy import select
    from app.models.transcript import TranscriptSegment
    from app.models.session import TutoringSession

    result = await db.execute(select(TranscriptSegment).where(TranscriptSegment.session_id == session_id).order_by(TranscriptSegment.timestamp_ms))
    segments = result.scalars().all()
    if not segments:
        return ""

    text = "\n".join([f"{s.speaker_role.capitalize()}: {s.processed_text or s.text}" for s in segments])

    system = (
        "You are an expert educational AI assistant summarizing a tutoring session. "
        "Write a comprehensive 2-3 paragraph summary detailing the core topics discussed, the student's areas of struggle or confusion, "
        "and any key takeaways, analogies, or progress made. Format clearly using Markdown. Structure it nicely without preamble."
    )
    prompt = f"Transcript:\n\n{text}\n\nWrite a comprehensive summary of this tutoring session:"

    try:
        summary = await _call_ai(system, prompt, max_tokens=800)
    except Exception as e:
        print(f"[TranscriptService] Full session summarization failed: {e}")
        summary = "AI Summary generation failed due to a server error."

    session_res = await db.execute(select(TutoringSession).where(TutoringSession.id == session_id))
    session = session_res.scalar_one_or_none()
    if session:
        session.session_summary = summary
        await db.commit()

    return summary
