import json
import os
import psycopg2
import time

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_user_by_token(cur, token):
    cur.execute(
        "SELECT u.id, u.username, u.avatar_emoji FROM bobyn_sessions s JOIN bobyn_users u ON u.id = s.user_id WHERE s.token = %s",
        (token,)
    )
    return cur.fetchone()

def handler(event: dict, context) -> dict:
    """Signaling-сервер WebRTC для голосовых комнат Бобинь"""
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
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

    # Чистим старые сигналы (старше 30 секунд) и старые комнаты (старше 10 минут)
    cur.execute("DELETE FROM bobyn_webrtc_signals WHERE created_at < NOW() - INTERVAL '30 seconds'")
    cur.execute("DELETE FROM bobyn_voice_rooms WHERE joined_at < NOW() - INTERVAL '10 minutes'")
    conn.commit()

    if method == "GET":
        action = params.get("action", "rooms")

        if action == "rooms":
            # Список комнат и участников
            cur.execute("""
                SELECT channel_name, username
                FROM bobyn_voice_rooms
                ORDER BY channel_name, joined_at
            """)
            rows = cur.fetchall()
            rooms: dict = {}
            for ch, uname in rows:
                if ch not in rooms:
                    rooms[ch] = []
                rooms[ch].append(uname)
            conn.close()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"rooms": rooms})}

        elif action == "poll":
            # Получить сигналы для меня
            user = get_user_by_token(cur, token)
            if not user:
                conn.close()
                return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Не авторизован"})}
            username = user[1]
            room = params.get("room", "")

            cur.execute("""
                SELECT id, from_user, type, payload
                FROM bobyn_webrtc_signals
                WHERE (to_user = %s OR to_user IS NULL)
                  AND from_user != %s
                  AND room = %s
                ORDER BY created_at ASC
                LIMIT 20
            """, (username, username, room))
            signals = [{"id": r[0], "from": r[1], "type": r[2], "payload": json.loads(r[3])} for r in cur.fetchall()]

            # Помечаем прочитанные (удаляем адресованные мне)
            if signals:
                ids = [str(s["id"]) for s in signals]
                cur.execute(f"DELETE FROM bobyn_webrtc_signals WHERE id IN ({','.join(ids)}) AND to_user = %s", (username,))
                conn.commit()

            conn.close()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"signals": signals})}

    elif method == "POST":
        user = get_user_by_token(cur, token)
        if not user:
            conn.close()
            return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Не авторизован"})}
        user_id, username, avatar = user

        body = json.loads(event.get("body") or "{}")
        action = body.get("action")

        if action == "join":
            room = body.get("room", "")
            # Удаляем старую запись если была
            cur.execute("DELETE FROM bobyn_voice_rooms WHERE user_id = %s", (user_id,))
            cur.execute(
                "INSERT INTO bobyn_voice_rooms (channel_name, user_id, username) VALUES (%s, %s, %s)",
                (room, user_id, username)
            )
            # Сообщаем всем в комнате что новый боб зашёл
            cur.execute(
                "INSERT INTO bobyn_webrtc_signals (room, from_user, to_user, type, payload) VALUES (%s, %s, NULL, 'joined', %s)",
                (room, username, json.dumps({"username": username, "avatar": avatar}))
            )
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True, "room": room})}

        elif action == "leave":
            room = body.get("room", "")
            cur.execute("DELETE FROM bobyn_voice_rooms WHERE user_id = %s AND channel_name = %s", (user_id, room))
            cur.execute(
                "INSERT INTO bobyn_webrtc_signals (room, from_user, to_user, type, payload) VALUES (%s, %s, NULL, 'left', %s)",
                (room, username, json.dumps({"username": username}))
            )
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

        elif action == "signal":
            room = body.get("room", "")
            to_user = body.get("to")
            sig_type = body.get("type")  # offer, answer, ice
            payload = body.get("payload", {})

            cur.execute(
                "INSERT INTO bobyn_webrtc_signals (room, from_user, to_user, type, payload) VALUES (%s, %s, %s, %s, %s)",
                (room, username, to_user, sig_type, json.dumps(payload))
            )
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

        elif action == "heartbeat":
            cur.execute(
                "UPDATE bobyn_voice_rooms SET joined_at = NOW() WHERE user_id = %s",
                (user_id,)
            )
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

    conn.close()
    return {"statusCode": 405, "headers": headers, "body": json.dumps({"error": "Метод не поддерживается"})}
