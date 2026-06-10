import json
import os
import hashlib
import secrets
import psycopg2

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def handler(event: dict, context) -> dict:
    """Регистрация и вход пользователей Бобинь"""
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
        "Content-Type": "application/json"
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}

    body = json.loads(event.get("body") or "{}")
    action = body.get("action")

    conn = get_conn()
    cur = conn.cursor()

    if action == "register":
        username = body.get("username", "").strip()
        email = body.get("email", "").strip()
        password = body.get("password", "")
        avatar = body.get("avatar", "🦉")

        if not username or not email or not password:
            return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Заполни все поля, боб!"})}
        if len(password) < 8:
            return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Пароль слишком короткий"})}

        cur.execute("SELECT id FROM bobyn_users WHERE username = %s OR email = %s", (username, email))
        if cur.fetchone():
            conn.close()
            return {"statusCode": 409, "headers": headers, "body": json.dumps({"error": "Такой боб уже существует!"})}

        pw_hash = hash_password(password)
        cur.execute(
            "INSERT INTO bobyn_users (username, email, password_hash, avatar_emoji) VALUES (%s, %s, %s, %s) RETURNING id",
            (username, email, pw_hash, avatar)
        )
        user_id = cur.fetchone()[0]

        token = secrets.token_hex(32)
        cur.execute("INSERT INTO bobyn_sessions (user_id, token) VALUES (%s, %s)", (user_id, token))
        conn.commit()
        conn.close()

        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({"token": token, "user": {"id": user_id, "username": username, "avatar": avatar}})
        }

    elif action == "login":
        username = body.get("username", "").strip()
        password = body.get("password", "")

        pw_hash = hash_password(password)
        cur.execute(
            "SELECT id, username, avatar_emoji FROM bobyn_users WHERE (username = %s OR email = %s) AND password_hash = %s",
            (username, username, pw_hash)
        )
        row = cur.fetchone()
        if not row:
            conn.close()
            return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Неверный логин или пароль"})}

        user_id, uname, avatar = row
        token = secrets.token_hex(32)
        cur.execute("INSERT INTO bobyn_sessions (user_id, token) VALUES (%s, %s)", (user_id, token))
        conn.commit()
        conn.close()

        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({"token": token, "user": {"id": user_id, "username": uname, "avatar": avatar}})
        }

    elif action == "me":
        token = (event.get("headers") or {}).get("X-Auth-Token", "")
        cur.execute(
            "SELECT u.id, u.username, u.avatar_emoji FROM bobyn_sessions s JOIN bobyn_users u ON u.id = s.user_id WHERE s.token = %s",
            (token,)
        )
        row = cur.fetchone()
        conn.close()
        if not row:
            return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Не авторизован"})}
        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({"user": {"id": row[0], "username": row[1], "avatar": row[2]}})
        }

    conn.close()
    return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Неизвестное действие"})}
