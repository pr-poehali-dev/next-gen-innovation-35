import json
import os
import psycopg2

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_user_by_token(cur, token):
    cur.execute(
        "SELECT u.id, u.username, u.avatar_emoji FROM bobyn_sessions s JOIN bobyn_users u ON u.id = s.user_id WHERE s.token = %s",
        (token,)
    )
    return cur.fetchone()

def handler(event: dict, context) -> dict:
    """Отправка и получение сообщений в каналах Бобинь"""
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
        "Content-Type": "application/json"
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}

    token = (event.get("headers") or {}).get("X-Auth-Token", "")
    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}

    conn = get_conn()
    cur = conn.cursor()

    if method == "GET":
        channel_id = params.get("channel_id", "1")
        cur.execute("""
            SELECT m.id, m.text, m.created_at, u.username, u.avatar_emoji
            FROM bobyn_messages m
            JOIN bobyn_users u ON u.id = m.user_id
            WHERE m.channel_id = %s
            ORDER BY m.created_at ASC
            LIMIT 100
        """, (channel_id,))
        rows = cur.fetchall()
        messages = [
            {"id": r[0], "text": r[1], "created_at": r[2].isoformat(), "username": r[3], "avatar": r[4]}
            for r in rows
        ]

        cur.execute("SELECT id, name, type FROM bobyn_channels ORDER BY id")
        channels = [{"id": r[0], "name": r[1], "type": r[2]} for r in cur.fetchall()]

        conn.close()
        return {"statusCode": 200, "headers": headers, "body": json.dumps({"messages": messages, "channels": channels})}

    elif method == "POST":
        user = get_user_by_token(cur, token)
        if not user:
            conn.close()
            return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Надо войти, боб!"})}

        body = json.loads(event.get("body") or "{}")
        text = body.get("text", "").strip()
        channel_id = body.get("channel_id", 1)

        if not text:
            conn.close()
            return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Пустое сообщение!"})}

        if len(text) > 2000:
            conn.close()
            return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Слишком длинно для боба"})}

        cur.execute(
            "INSERT INTO bobyn_messages (channel_id, user_id, text) VALUES (%s, %s, %s) RETURNING id, created_at",
            (channel_id, user[0], text)
        )
        msg_id, created_at = cur.fetchone()
        conn.commit()
        conn.close()

        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({
                "message": {
                    "id": msg_id,
                    "text": text,
                    "created_at": created_at.isoformat(),
                    "username": user[1],
                    "avatar": user[2],
                    "channel_id": channel_id
                }
            })
        }

    conn.close()
    return {"statusCode": 405, "headers": headers, "body": json.dumps({"error": "Метод не поддерживается"})}
