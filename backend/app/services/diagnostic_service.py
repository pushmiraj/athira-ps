import json
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.diagnostic import DiagnosticQuestion, DiagnosticResponse, SubTopicProficiency
from app.models.session import TutoringSession
from app.config import settings


class DiagnosticService:
    def __init__(self, db: AsyncSession):
        self.db = db

    @staticmethod
    def compute_quadrant(is_correct: bool, confidence: int) -> str:
        high_confidence = confidence >= 4
        if high_confidence and is_correct:
            return "mastered"
        if high_confidence and not is_correct:
            return "danger_zone"
        if not high_confidence and is_correct:
            return "lucky_guess"
        return "known_gap"

    @staticmethod
    def compute_traffic_light(quadrant: str) -> str:
        mapping = {
            "mastered": "green",
            "lucky_guess": "yellow",
            "known_gap": "red",
            "danger_zone": "danger",
        }
        return mapping.get(quadrant, "red")

    async def generate_questions(self, session_id: str, topic: str, sub_topics: List[str]) -> List[DiagnosticQuestion]:
        prompt = f"""Topic: {topic}
Sub-topics: {json.dumps(sub_topics)}
Student level: University undergraduate

Generate 5 multiple-choice diagnostic questions.
Rules:
- Each question must clearly target ONE specific sub-topic from the list
- Include 4 answer options (only one correct)
- Mark correct_index (0-3)
- Set difficulty: easy|medium|hard
- For each question, specify:
  - branch_on_wrong_sub_topic: which sub-topic to probe next if student gets this wrong
  - branch_on_right_sub_topic: which sub-topic to probe next if student gets this right

Return ONLY valid JSON array. No preamble. No markdown.
Schema: [{{"question_text": "...", "options": ["A","B","C","D"], "correct_index": 0, "sub_topic": "...", "difficulty": "medium", "branch_on_wrong_sub_topic": "...", "branch_on_right_sub_topic": "..."}}]"""

        try:
            raw = await _call_ai(
                system="You are an expert diagnostic assessment designer for one-on-one tutoring.",
                user=prompt,
            )
            try:
                questions_data = json.loads(raw)
            except Exception:
                # Extract JSON array from response
                import re
                match = re.search(r'\[.*\]', raw, re.DOTALL)
                questions_data = json.loads(match.group()) if match else []
        except Exception as e:
            print(f"AI question generation failed (check API keys): {e}")
            questions_data = [
                {
                    "question_text": f"Mock diagnostic question {i+1} for {topic}",
                    "options": ["Correct Answer", "Wrong A", "Wrong B", "Wrong C"],
                    "correct_index": 0,
                    "sub_topic": sub_topics[0] if sub_topics else "General",
                    "difficulty": "medium",
                } for i in range(5)
            ]

        questions = []
        for i, q in enumerate(questions_data[:5]):
            dq = DiagnosticQuestion(
                session_id=session_id,
                sub_topic=q.get("sub_topic", sub_topics[0] if sub_topics else "General"),
                question_text=q["question_text"],
                options=q["options"],
                correct_index=q["correct_index"],
                difficulty=q.get("difficulty", "medium"),
                sequence_order=i,
            )
            self.db.add(dq)
            questions.append(dq)

        await self.db.commit()
        for q in questions:
            await self.db.refresh(q)

        # Wire branching by sub_topic name (best-effort)
        sub_topic_to_id = {q.sub_topic: q.id for q in questions}
        for i, (dq, raw_q) in enumerate(zip(questions, questions_data[:5])):
            wrong_sub = raw_q.get("branch_on_wrong_sub_topic", "")
            right_sub = raw_q.get("branch_on_right_sub_topic", "")
            dq.branch_on_wrong = sub_topic_to_id.get(wrong_sub)
            dq.branch_on_right = sub_topic_to_id.get(right_sub)
        await self.db.commit()

        return questions

    async def compute_proficiency(self, session_id: str, student_id: str) -> List[SubTopicProficiency]:
        result = await self.db.execute(
            select(DiagnosticResponse).where(
                DiagnosticResponse.session_id == session_id,
                DiagnosticResponse.student_id == student_id,
            )
        )
        responses = result.scalars().all()

        # Group by sub_topic via question
        sub_topic_data: dict = {}
        for resp in responses:
            q_result = await self.db.execute(
                select(DiagnosticQuestion).where(DiagnosticQuestion.id == resp.question_id)
            )
            question = q_result.scalar_one_or_none()
            if not question:
                continue
            sub_topic = question.sub_topic
            if sub_topic not in sub_topic_data:
                sub_topic_data[sub_topic] = {"confidences": [], "correct": 0, "total": 0, "quadrants": []}
            sub_topic_data[sub_topic]["confidences"].append(resp.confidence)
            sub_topic_data[sub_topic]["total"] += 1
            if resp.is_correct:
                sub_topic_data[sub_topic]["correct"] += 1
            sub_topic_data[sub_topic]["quadrants"].append(resp.quadrant)

        proficiency_rows = []
        for sub_topic, data in sub_topic_data.items():
            # Dominant quadrant = most frequent
            from collections import Counter
            dominant_quadrant = Counter(data["quadrants"]).most_common(1)[0][0]
            traffic_light = self.compute_traffic_light(dominant_quadrant)
            avg_conf = sum(data["confidences"]) / len(data["confidences"]) if data["confidences"] else None

            # Upsert
            existing = await self.db.execute(
                select(SubTopicProficiency).where(
                    SubTopicProficiency.session_id == session_id,
                    SubTopicProficiency.sub_topic == sub_topic,
                )
            )
            row = existing.scalar_one_or_none()
            if row:
                row.quadrant = dominant_quadrant
                row.traffic_light = traffic_light
                row.avg_confidence = avg_conf
                row.correct_count = data["correct"]
                row.total_count = data["total"]
            else:
                row = SubTopicProficiency(
                    session_id=session_id,
                    sub_topic=sub_topic,
                    quadrant=dominant_quadrant,
                    traffic_light=traffic_light,
                    avg_confidence=avg_conf,
                    correct_count=data["correct"],
                    total_count=data["total"],
                )
                self.db.add(row)
            proficiency_rows.append(row)

        await self.db.commit()
        return proficiency_rows

    async def generate_session_contract(self, proficiency: List[SubTopicProficiency]) -> str:
        proficiency_json = json.dumps([
            {
                "sub_topic": p.sub_topic,
                "quadrant": p.quadrant,
                "traffic_light": p.traffic_light,
                "avg_confidence": p.avg_confidence,
            }
            for p in proficiency
        ])
        prompt = f"""Sub-topic proficiency results: {proficiency_json}

Write ONE sentence (max 25 words) that:
1. Starts with "Today's focus:"
2. Names the danger_zone or known_gap sub-topics first
3. Notes any mastered sub-topics to skip
4. Uses plain, direct language a student and tutor can act on immediately

Return ONLY the sentence. No preamble."""

        try:
            return await _call_ai(
                system="You are a concise academic advisor.",
                user=prompt,
            )
        except Exception:
            # Fallback contract
            danger = [p.sub_topic for p in proficiency if p.quadrant == "danger_zone"]
            gaps = [p.sub_topic for p in proficiency if p.quadrant == "known_gap"]
            focus = (danger + gaps)[:2]
            mastered = [p.sub_topic for p in proficiency if p.quadrant == "mastered"]
            parts = []
            if focus:
                parts.append(f"focus on {', '.join(focus)}")
            if mastered:
                parts.append(f"skip {', '.join(mastered[:2])} (mastered)")
            return "Today's focus: " + "; ".join(parts) if parts else "Today's focus: cover all topics systematically."


async def _call_ai(system: str, user: str) -> str:
    if settings.AI_PROVIDER == "anthropic":
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        msg = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1024,
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
            max_tokens=1024,
        )
        return resp.choices[0].message.content
