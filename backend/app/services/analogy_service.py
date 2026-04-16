import json
import re
from app.config import settings

ANALOGY_SYSTEM_PROMPT = """You are an expert tutor helping another tutor explain a concept.
Given the last 2 minutes of tutoring transcript, generate EXACTLY 3 analogies.
Each analogy must use a DIFFERENT cognitive modality:
1. SPATIAL: Uses physical space, movement, tangible objects
2. SOCIAL: Uses human relationships, stories, social situations
3. ABSTRACT: Uses mathematical ratios, scaling, formal patterns

Return JSON only: { "spatial": "...", "social": "...", "abstract": "..." }
Keep each analogy to 1-2 sentences maximum.
Make them vivid, memorable, and genuinely illuminating."""

CONTEXT_TAG_SYSTEM = "You generate brief, accurate context labels for learning snapshots."


class AnalogyService:
    @staticmethod
    async def generate_analogies(transcript_text: str) -> dict:
        user_prompt = f"Transcript: {transcript_text}\n\nGenerate the 3 analogies now."
        try:
            raw = await _call_ai(ANALOGY_SYSTEM_PROMPT, user_prompt)
            try:
                return json.loads(raw)
            except Exception:
                match = re.search(r'\{.*\}', raw, re.DOTALL)
                if match:
                    return json.loads(match.group())
                # Fallback: parse manually
                spatial = re.search(r'"spatial"\s*:\s*"([^"]+)"', raw)
                social = re.search(r'"social"\s*:\s*"([^"]+)"', raw)
                abstract = re.search(r'"abstract"\s*:\s*"([^"]+)"', raw)
                return {
                    "spatial": spatial.group(1) if spatial else "Think of it like water flowing through pipes.",
                    "social": social.group(1) if social else "Imagine two people negotiating a deal.",
                    "abstract": abstract.group(1) if abstract else "Consider the ratio relationship between the quantities.",
                }
        except Exception as e:
            print(f"AI analogy generation failed (check API keys): {e}")
            return {
                "spatial": "Think of it like water flowing through pipes.",
                "social": "Imagine two people negotiating a deal.",
                "abstract": "Consider the ratio relationship between the quantities."
            }


async def generate_context_tag(transcript_snippet: str) -> str:
    if not transcript_snippet or len(transcript_snippet.strip()) < 10:
        return "Session moment captured"
    prompt = f'Transcript snippet: "{transcript_snippet[:500]}"\n\nIn 10 words or fewer, complete this sentence:\n"Tutor explaining: ___"\n\nReturn ONLY the completion. No preamble.'
    try:
        result = await _call_ai(CONTEXT_TAG_SYSTEM, prompt)
        return f"Tutor explaining: {result.strip()}"
    except Exception:
        return "Tutor explaining: key concept"


async def _call_ai(system: str, user: str) -> str:
    if settings.AI_PROVIDER == "anthropic":
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        msg = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=512,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
        return msg.content[0].text
    elif settings.AI_PROVIDER == "gemini":
        from google import genai
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=user,
            config=getattr(genai.types, 'GenerateContentConfig', lambda **kw: kw)(
                system_instruction=system,
                temperature=0.7,
            ),
        )
        return response.text
    else:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        resp = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            max_tokens=512,
        )
        return resp.choices[0].message.content
