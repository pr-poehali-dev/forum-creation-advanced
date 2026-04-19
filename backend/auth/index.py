"""
Аутентификация: регистрация, вход, проверка сессии, выход.
Вход и регистрация — только по логину и паролю (без email).
Параметр action передаётся через query string: ?action=register|login|me|logout
"""
import json
import os
import hashlib
import secrets
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p64611023_forum_creation_advan")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Token",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def make_token() -> str:
    return secrets.token_hex(32)

def resp(status: int, data: dict):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, ensure_ascii=False)}

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    # POST ?action=register
    if method == "POST" and action == "register":
        username = (body.get("username") or "").strip()
        password = body.get("password") or ""

        if not username or len(username) < 3:
            return resp(400, {"error": "Логин должен быть не менее 3 символов"})
        if not password or len(password) < 6:
            return resp(400, {"error": "Пароль должен быть не менее 6 символов"})
        if len(username) > 32:
            return resp(400, {"error": "Логин слишком длинный (макс. 32 символа)"})

        ph = hash_password(password)
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE username = %s", (username,))
        if cur.fetchone():
            conn.close()
            return resp(409, {"error": "Этот логин уже занят"})

        cur.execute(
            f"INSERT INTO {SCHEMA}.users (username, password_hash, role, rank, avatar) VALUES (%s, %s, 'member', 'Новичок', '🎮') RETURNING id",
            (username, ph)
        )
        user_id = cur.fetchone()[0]
        token = make_token()
        cur.execute(
            f"INSERT INTO {SCHEMA}.sessions (token, user_id) VALUES (%s, %s)",
            (token, user_id)
        )
        conn.commit()
        conn.close()
        return resp(200, {"token": token, "user": {"id": user_id, "username": username, "role": "member", "rank": "Новичок", "avatar": "🎮"}})

    # POST ?action=login
    if method == "POST" and action == "login":
        username = (body.get("username") or "").strip()
        password = body.get("password") or ""

        if not username or not password:
            return resp(400, {"error": "Введи логин и пароль"})

        ph = hash_password(password)
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, username, role, rank, avatar FROM {SCHEMA}.users WHERE username = %s AND password_hash = %s",
            (username, ph)
        )
        row = cur.fetchone()
        if not row:
            conn.close()
            return resp(401, {"error": "Неверный логин или пароль"})

        user_id, uname, role, rank, avatar = row
        token = make_token()
        cur.execute(f"INSERT INTO {SCHEMA}.sessions (token, user_id) VALUES (%s, %s)", (token, user_id))
        conn.commit()
        conn.close()
        return resp(200, {"token": token, "user": {"id": user_id, "username": uname, "role": role, "rank": rank, "avatar": avatar}})

    # GET ?action=me
    if method == "GET" and action == "me":
        token = (event.get("headers") or {}).get("X-Session-Token") or (event.get("headers") or {}).get("x-session-token")
        if not token:
            return resp(401, {"error": "Не авторизован"})
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT u.id, u.username, u.role, u.rank, u.avatar FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON u.id = s.user_id WHERE s.token = %s AND s.expires_at > NOW()",
            (token,)
        )
        row = cur.fetchone()
        conn.close()
        if not row:
            return resp(401, {"error": "Сессия истекла"})
        uid, uname, role, rank, avatar = row
        return resp(200, {"user": {"id": uid, "username": uname, "role": role, "rank": rank, "avatar": avatar}})

    # POST ?action=logout
    if method == "POST" and action == "logout":
        token = (event.get("headers") or {}).get("X-Session-Token") or (event.get("headers") or {}).get("x-session-token")
        if token:
            conn = get_conn()
            cur = conn.cursor()
            cur.execute(f"UPDATE {SCHEMA}.sessions SET expires_at = NOW() WHERE token = %s", (token,))
            conn.commit()
            conn.close()
        return resp(200, {"ok": True})

    return resp(400, {"error": "Укажи параметр action"})
