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
    """Личные и групповые чаты Бобинь (DM + группы)"""
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
        "Content-Type": "application/json"
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}

    token  = (event.get("headers") or {}).get("X-Auth-Token", "")
    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}

    conn = get_conn()
    cur  = conn.cursor()

    user = get_user_by_token(cur, token)
    if not user:
        conn.close()
        return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Не авторизован"})}
    user_id, username, avatar = user

    if method == "GET":
        action = params.get("action", "list")

        if action == "list":
            # Список всех чатов пользователя
            cur.execute("""
                SELECT c.id, c.type, c.name, c.avatar_emoji,
                       (SELECT dm.text FROM bobyn_dm_messages dm WHERE dm.conversation_id = c.id ORDER BY dm.created_at DESC LIMIT 1) as last_msg,
                       (SELECT dm.created_at FROM bobyn_dm_messages dm WHERE dm.conversation_id = c.id ORDER BY dm.created_at DESC LIMIT 1) as last_at,
                       (SELECT dm.username FROM bobyn_dm_messages dm WHERE dm.conversation_id = c.id ORDER BY dm.created_at DESC LIMIT 1) as last_user,
                       (SELECT COUNT(*) FROM bobyn_conversation_members cm2 WHERE cm2.conversation_id = c.id) as member_count
                FROM bobyn_conversations c
                JOIN bobyn_conversation_members cm ON cm.conversation_id = c.id AND cm.user_id = %s
                ORDER BY last_at DESC NULLS LAST
            """, (user_id,))
            rows = cur.fetchall()
            chats = []
            for r in rows:
                conv_id = r[0]
                # Для DM — получаем имя и аватар собеседника
                display_name  = r[2]
                display_avatar = r[3]
                if r[1] == "dm":
                    cur.execute("""
                        SELECT u.username, u.avatar_emoji FROM bobyn_conversation_members cm
                        JOIN bobyn_users u ON u.id = cm.user_id
                        WHERE cm.conversation_id = %s AND cm.user_id != %s LIMIT 1
                    """, (conv_id, user_id))
                    other = cur.fetchone()
                    if other:
                        display_name   = other[0]
                        display_avatar = other[1]
                chats.append({
                    "id": conv_id, "type": r[1], "name": display_name,
                    "avatar": display_avatar, "last_msg": r[4],
                    "last_at": r[5].isoformat() if r[5] else None,
                    "last_user": r[6], "member_count": r[7]
                })
            conn.close()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"chats": chats})}

        elif action == "messages":
            conv_id = params.get("id")
            # Проверяем доступ
            cur.execute("SELECT 1 FROM bobyn_conversation_members WHERE conversation_id = %s AND user_id = %s", (conv_id, user_id))
            if not cur.fetchone():
                conn.close()
                return {"statusCode": 403, "headers": headers, "body": json.dumps({"error": "Нет доступа"})}
            cur.execute("""
                SELECT id, user_id, username, avatar_emoji, text, created_at
                FROM bobyn_dm_messages WHERE conversation_id = %s
                ORDER BY created_at ASC LIMIT 200
            """, (conv_id,))
            msgs = [{"id": r[0], "user_id": r[1], "username": r[2], "avatar": r[3], "text": r[4], "created_at": r[5].isoformat()} for r in cur.fetchall()]

            # Участники группы
            cur.execute("""
                SELECT u.id, u.username, u.avatar_emoji FROM bobyn_conversation_members cm
                JOIN bobyn_users u ON u.id = cm.user_id WHERE cm.conversation_id = %s
            """, (conv_id,))
            members = [{"id": r[0], "username": r[1], "avatar": r[2]} for r in cur.fetchall()]
            conn.close()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"messages": msgs, "members": members})}

    elif method == "POST":
        body   = json.loads(event.get("body") or "{}")
        action = body.get("action")

        if action == "create_dm":
            target_id = body.get("target_id")
            # Проверяем нет ли уже DM между ними
            cur.execute("""
                SELECT c.id FROM bobyn_conversations c
                JOIN bobyn_conversation_members m1 ON m1.conversation_id = c.id AND m1.user_id = %s
                JOIN bobyn_conversation_members m2 ON m2.conversation_id = c.id AND m2.user_id = %s
                WHERE c.type = 'dm' LIMIT 1
            """, (user_id, target_id))
            existing = cur.fetchone()
            if existing:
                conn.close()
                return {"statusCode": 200, "headers": headers, "body": json.dumps({"id": existing[0], "existing": True})}

            cur.execute("INSERT INTO bobyn_conversations (type, created_by) VALUES ('dm', %s) RETURNING id", (user_id,))
            conv_id = cur.fetchone()[0]
            cur.execute("INSERT INTO bobyn_conversation_members (conversation_id, user_id) VALUES (%s, %s)", (conv_id, user_id))
            cur.execute("INSERT INTO bobyn_conversation_members (conversation_id, user_id) VALUES (%s, %s)", (conv_id, target_id))
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"id": conv_id})}

        elif action == "create_group":
            name       = body.get("name", "Группа бобей").strip()[:100]
            member_ids = body.get("member_ids", [])
            grp_avatar = body.get("avatar", "🦉")

            cur.execute(
                "INSERT INTO bobyn_conversations (type, name, avatar_emoji, created_by) VALUES ('group', %s, %s, %s) RETURNING id",
                (name, grp_avatar, user_id)
            )
            conv_id = cur.fetchone()[0]
            cur.execute("INSERT INTO bobyn_conversation_members (conversation_id, user_id) VALUES (%s, %s)", (conv_id, user_id))
            for mid in member_ids:
                if mid != user_id:
                    cur.execute("INSERT INTO bobyn_conversation_members (conversation_id, user_id) VALUES (%s, %s)", (conv_id, int(mid)))
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"id": conv_id, "name": name})}

        elif action == "send":
            conv_id = body.get("conversation_id")
            text    = body.get("text", "").strip()
            if not text:
                conn.close()
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Пустое сообщение"})}
            cur.execute("SELECT 1 FROM bobyn_conversation_members WHERE conversation_id = %s AND user_id = %s", (conv_id, user_id))
            if not cur.fetchone():
                conn.close()
                return {"statusCode": 403, "headers": headers, "body": json.dumps({"error": "Нет доступа"})}
            cur.execute(
                "INSERT INTO bobyn_dm_messages (conversation_id, user_id, username, avatar_emoji, text) VALUES (%s, %s, %s, %s, %s) RETURNING id, created_at",
                (conv_id, user_id, username, avatar, text)
            )
            msg_id, created_at = cur.fetchone()
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({
                "message": {"id": msg_id, "user_id": user_id, "username": username, "avatar": avatar, "text": text, "created_at": created_at.isoformat()}
            })}

        elif action == "add_member":
            conv_id   = body.get("conversation_id")
            target_id = body.get("user_id")
            cur.execute("SELECT type, created_by FROM bobyn_conversations WHERE id = %s", (conv_id,))
            conv = cur.fetchone()
            if not conv or conv[1] != user_id:
                conn.close()
                return {"statusCode": 403, "headers": headers, "body": json.dumps({"error": "Только создатель может добавлять"})}
            cur.execute("INSERT INTO bobyn_conversation_members (conversation_id, user_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", (conv_id, target_id))
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

    conn.close()
    return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Неизвестный запрос"})}
