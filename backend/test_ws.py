import asyncio
import websockets
import json
import urllib.request
import sqlite3

async def test_ws():
    conn = sqlite3.connect('athira.db')
    cur = conn.cursor()
    # Get a student
    cur.execute('SELECT email FROM users WHERE role="student" LIMIT 1')
    student = cur.fetchone()
    if not student:
        print('No student found')
        return
        
    req = urllib.request.Request(
        'http://127.0.0.1:8000/auth/login', 
        data=json.dumps({'email': student[0], 'password': 'password'}).encode(), 
        headers={'Content-Type': 'application/json'}
    )
    try:
        resp = urllib.request.urlopen(req)
        data = json.loads(resp.read().decode())
        token = data['access_token']
    except Exception as e:
        print('Login failed', e)
        return

    cur.execute('SELECT id FROM tutoring_sessions LIMIT 1')
    session = cur.fetchone()
    if not session:
        print('No session found')
        return
        
    url = f'ws://127.0.0.1:8000/ws/{session[0]}?token={token}'
    print(f"Connecting to {url}")
    try:
        async with websockets.connect(url) as ws:
            print('Connected!')
            # Let's see if we get the participant list
            res = await ws.recv()
            print('Received:', res)
            
            # Now let's try sending an answer submission
            # First, we need a valid question_id for this session
            cur.execute('SELECT id FROM diagnostic_questions WHERE session_id=? LIMIT 1', (session[0],))
            q = cur.fetchone()
            if not q:
                print('No questions found for this session')
                return
                
            payload = {
                "event": "DIAGNOSTIC_ANSWER_SUBMITTED",
                "session_id": session[0],
                "payload": {
                    "question_id": q[0],
                    "selected_index": 0,
                    "confidence": 3,
                    "time_taken_ms": None
                }
            }
            print("Sending payload:", payload)
            await ws.send(json.dumps(payload))
            
            # Let's wait a second and then check the database again
            await asyncio.sleep(1)
            
            cur.execute('SELECT * FROM diagnostic_responses WHERE session_id=?', (session[0],))
            rs = cur.fetchall()
            print("Responses after send:", rs)
            
    except Exception as e:
        print('WS ERROR:', e)

asyncio.run(test_ws())
