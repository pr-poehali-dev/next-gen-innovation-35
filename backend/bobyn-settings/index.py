import json
import os
import psycopg2
import re

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_user_by_token(cur, token):
    cur.execute(
        "SELECT u.id, u.username, u.avatar_emoji, u.bobyz, u.theme, u.locale FROM bobyn_sessions s JOIN bobyn_users u ON u.id = s.user_id WHERE s.token = %s",
        (token,)
    )
    return cur.fetchone()

def handler(event: dict, context) -> dict:
    """Настройки пользователя Бобинь: тема, язык, бобиюз, поиск по бобиюзу"""
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
        action = params.get("action", "me")

        if action == "me":
            user = get_user_by_token(cur, token)
            if not user:
                conn.close()
                return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Не авторизован"})}
            conn.close()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({
                "user": {"id": user[0], "username": user[1], "avatar": user[2], "bobyz": user[3], "theme": user[4] or "dark", "locale": user[5] or "ru"}
            })}

        elif action == "search":
            query = params.get("q", "").strip()
            if len(query) < 2:
                conn.close()
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Слишком короткий запрос"})}
            cur.execute(
                "SELECT id, username, avatar_emoji, bobyz FROM bobyn_users WHERE username ILIKE %s OR bobyz ILIKE %s LIMIT 20",
                (f"%{query}%", f"%{query}%")
            )
            users = [{"id": r[0], "username": r[1], "avatar": r[2], "bobyz": r[3]} for r in cur.fetchall()]
            conn.close()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"users": users})}

    elif method == "POST":
        user = get_user_by_token(cur, token)
        if not user:
            conn.close()
            return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Не авторизован"})}
        user_id = user[0]

        body = json.loads(event.get("body") or "{}")
        action = body.get("action", "update")

        if action == "update":
            theme  = body.get("theme")
            locale = body.get("locale")
            bobyz  = body.get("bobyz", "").strip().lower()
            avatar = body.get("avatar")

            if bobyz:
                if not re.match(r'^[a-z0-9_]{3,32}$', bobyz):
                    conn.close()
                    return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Бобиюз: 3-32 символа, только a-z, 0-9, _"})}
                cur.execute("SELECT id FROM bobyn_users WHERE bobyz = %s AND id != %s", (bobyz, user_id))
                if cur.fetchone():
                    conn.close()
                    return {"statusCode": 409, "headers": headers, "body": json.dumps({"error": "Этот бобиюз уже занят другим бобом"})}

            fields = []
            values = []
            if theme  in ("dark", "light", "midnight", "bobyn"): fields.append("theme = %s");  values.append(theme)
            if locale in ("ru", "en"):                           fields.append("locale = %s"); values.append(locale)
            if bobyz:                                            fields.append("bobyz = %s");  values.append(bobyz)
            if avatar:                                           fields.append("avatar_emoji = %s"); values.append(avatar)

            if fields:
                values.append(user_id)
                cur.execute(f"UPDATE bobyn_users SET {', '.join(fields)} WHERE id = %s", values)
                conn.commit()

            cur.execute("SELECT id, username, avatar_emoji, bobyz, theme, locale FROM bobyn_users WHERE id = %s", (user_id,))
            u = cur.fetchone()
            conn.close()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({
                "user": {"id": u[0], "username": u[1], "avatar": u[2], "bobyz": u[3], "theme": u[4], "locale": u[5]}
            })}

    conn.close()
    return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Неизвестный запрос"})}
