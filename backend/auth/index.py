"""
Аутентификация и модерация: регистрация, вход, сессия, выход.
Админские действия: баны, муты, варны, кики, режим техработ, управление ролями.
Вход и регистрация — только по логину и паролю (без email).
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
    return {
        "statusCode": status,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps(data, ensure_ascii=False, default=str)
    }

def get_session_user(token: str, conn):
    """Возвращает (id, role) по токену или None."""
    if not token:
        return None
    cur = conn.cursor()
    cur.execute(
        f"SELECT u.id, u.role FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON u.id = s.user_id "
        f"WHERE s.token = %s AND s.expires_at > NOW()",
        (token,)
    )
    return cur.fetchone()

def get_token(event: dict) -> str:
    h = event.get("headers") or {}
    return h.get("X-Session-Token") or h.get("x-session-token") or ""

def log_action(cur, admin_id: int, target_id, action: str, reason: str = ""):
    cur.execute(
        f"INSERT INTO {SCHEMA}.mod_log (admin_id, target_id, action, reason) VALUES (%s, %s, %s, %s)",
        (admin_id, target_id, action, reason)
    )

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    token = get_token(event)

    # ─── POST ?action=register ───────────────────────────────────────────────
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
            f"INSERT INTO {SCHEMA}.users (username, password_hash, role, rank, avatar) "
            f"VALUES (%s, %s, 'member', 'Новичок', '🎮') RETURNING id",
            (username, ph)
        )
        user_id = cur.fetchone()[0]
        tok = make_token()
        cur.execute(f"INSERT INTO {SCHEMA}.sessions (token, user_id) VALUES (%s, %s)", (tok, user_id))
        conn.commit()
        conn.close()
        return resp(200, {"token": tok, "user": {
            "id": user_id, "username": username, "role": "member", "rank": "Новичок", "avatar": "🎮"
        }})

    # ─── POST ?action=login ──────────────────────────────────────────────────
    if method == "POST" and action == "login":
        username = (body.get("username") or "").strip()
        password = body.get("password") or ""

        if not username or not password:
            return resp(400, {"error": "Введи логин и пароль"})

        # Проверка режима техработ (пропускаем только для admin)
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"SELECT is_active, message FROM {SCHEMA}.maintenance LIMIT 1")
        mrow = cur.fetchone()
        if mrow and mrow[0]:
            ph2 = hash_password(password)
            cur.execute(f"SELECT role FROM {SCHEMA}.users WHERE username = %s AND password_hash = %s", (username, ph2))
            rcheck = cur.fetchone()
            if not rcheck or rcheck[0] != "admin":
                conn.close()
                return resp(503, {"error": f"🔧 Технические работы: {mrow[1]}"})

        ph = hash_password(password)
        cur.execute(
            f"SELECT id, username, role, rank, avatar, is_banned, ban_reason, ban_until, is_muted, mute_until "
            f"FROM {SCHEMA}.users WHERE username = %s AND password_hash = %s",
            (username, ph)
        )
        row = cur.fetchone()
        if not row:
            conn.close()
            return resp(401, {"error": "Неверный логин или пароль"})

        uid, uname, role, rank, avatar, is_banned, ban_reason, ban_until, is_muted, mute_until = row

        if is_banned and role != "admin":
            msg = f"Аккаунт заблокирован. Причина: {ban_reason or 'не указана'}"
            if ban_until:
                msg += f" До: {ban_until.strftime('%d.%m.%Y %H:%M')}"
            conn.close()
            return resp(403, {"error": msg})

        tok = make_token()
        cur.execute(f"INSERT INTO {SCHEMA}.sessions (token, user_id) VALUES (%s, %s)", (tok, uid))
        conn.commit()
        conn.close()
        return resp(200, {"token": tok, "user": {
            "id": uid, "username": uname, "role": role, "rank": rank, "avatar": avatar,
            "is_muted": is_muted, "mute_until": str(mute_until) if mute_until else None
        }})

    # ─── GET ?action=me ──────────────────────────────────────────────────────
    if method == "GET" and action == "me":
        if not token:
            return resp(401, {"error": "Не авторизован"})
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT u.id, u.username, u.role, u.rank, u.avatar, u.is_banned, u.is_muted, u.warnings "
            f"FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON u.id = s.user_id "
            f"WHERE s.token = %s AND s.expires_at > NOW()",
            (token,)
        )
        row = cur.fetchone()
        conn.close()
        if not row:
            return resp(401, {"error": "Сессия истекла"})
        uid, uname, role, rank, avatar, is_banned, is_muted, warnings = row
        return resp(200, {"user": {
            "id": uid, "username": uname, "role": role, "rank": rank, "avatar": avatar,
            "is_banned": is_banned, "is_muted": is_muted, "warnings": warnings
        }})

    # ─── POST ?action=logout ─────────────────────────────────────────────────
    if method == "POST" and action == "logout":
        if token:
            conn = get_conn()
            cur = conn.cursor()
            cur.execute(f"UPDATE {SCHEMA}.sessions SET expires_at = NOW() WHERE token = %s", (token,))
            conn.commit()
            conn.close()
        return resp(200, {"ok": True})

    # ─── GET ?action=maintenance ─────────────────────────────────────────────
    if method == "GET" and action == "maintenance":
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"SELECT is_active, message FROM {SCHEMA}.maintenance LIMIT 1")
        row = cur.fetchone()
        conn.close()
        if not row:
            return resp(200, {"is_active": False, "message": ""})
        return resp(200, {"is_active": row[0], "message": row[1]})

    # ════════════════════════════════════════════════════════════════════════
    # ADMIN ENDPOINTS — все проверяют токен и роль admin
    # ════════════════════════════════════════════════════════════════════════

    conn = get_conn()
    session = get_session_user(token, conn)
    if action.startswith("admin_") and (not session or session[1] != "admin"):
        conn.close()
        return resp(403, {"error": "Нет прав администратора"})
    admin_id = session[0] if session else None

    # ─── GET ?action=admin_users ─────────────────────────────────────────────
    if method == "GET" and action == "admin_users":
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, username, role, rank, avatar, reputation, is_banned, ban_reason, ban_until, "
            f"is_muted, mute_until, warnings, created_at FROM {SCHEMA}.users ORDER BY created_at DESC"
        )
        rows = cur.fetchall()
        conn.close()
        users = [{
            "id": r[0], "username": r[1], "role": r[2], "rank": r[3], "avatar": r[4],
            "reputation": r[5], "is_banned": r[6], "ban_reason": r[7],
            "ban_until": str(r[8]) if r[8] else None,
            "is_muted": r[9], "mute_until": str(r[10]) if r[10] else None,
            "warnings": r[11], "created_at": r[12].isoformat()
        } for r in rows]
        return resp(200, {"users": users})

    # ─── GET ?action=admin_modlog ─────────────────────────────────────────────
    if method == "GET" and action == "admin_modlog":
        cur = conn.cursor()
        cur.execute(
            f"SELECT l.id, a.username as admin, t.username as target, l.action, l.reason, l.created_at "
            f"FROM {SCHEMA}.mod_log l "
            f"JOIN {SCHEMA}.users a ON a.id = l.admin_id "
            f"LEFT JOIN {SCHEMA}.users t ON t.id = l.target_id "
            f"ORDER BY l.created_at DESC LIMIT 100"
        )
        rows = cur.fetchall()
        conn.close()
        logs = [{"id": r[0], "admin": r[1], "target": r[2], "action": r[3], "reason": r[4], "created_at": str(r[5])} for r in rows]
        return resp(200, {"logs": logs})

    # ─── POST ?action=admin_set_role ─────────────────────────────────────────
    if method == "POST" and action == "admin_set_role":
        uid = body.get("user_id")
        role = body.get("role")
        if role not in ("admin", "member"):
            conn.close()
            return resp(400, {"error": "Недопустимая роль"})
        cur = conn.cursor()
        cur.execute(f"UPDATE {SCHEMA}.users SET role = %s WHERE id = %s AND username != 'admin'", (role, uid))
        log_action(cur, admin_id, uid, f"set_role:{role}")
        conn.commit()
        conn.close()
        return resp(200, {"ok": True})

    # ─── POST ?action=admin_ban ───────────────────────────────────────────────
    if method == "POST" and action == "admin_ban":
        uid = body.get("user_id")
        reason = body.get("reason", "")
        days = body.get("days")  # None = навсегда
        cur = conn.cursor()
        if days:
            cur.execute(
                f"UPDATE {SCHEMA}.users SET is_banned = TRUE, ban_reason = %s, ban_until = NOW() + INTERVAL '%s days' "
                f"WHERE id = %s AND username != 'admin'",
                (reason, int(days), uid)
            )
        else:
            cur.execute(
                f"UPDATE {SCHEMA}.users SET is_banned = TRUE, ban_reason = %s, ban_until = NULL "
                f"WHERE id = %s AND username != 'admin'",
                (reason, uid)
            )
        # Инвалидируем все сессии
        cur.execute(f"UPDATE {SCHEMA}.sessions SET expires_at = NOW() WHERE user_id = %s", (uid,))
        log_action(cur, admin_id, uid, "ban", reason)
        conn.commit()
        conn.close()
        return resp(200, {"ok": True})

    # ─── POST ?action=admin_unban ─────────────────────────────────────────────
    if method == "POST" and action == "admin_unban":
        uid = body.get("user_id")
        cur = conn.cursor()
        cur.execute(f"UPDATE {SCHEMA}.users SET is_banned = FALSE, ban_reason = NULL, ban_until = NULL WHERE id = %s", (uid,))
        log_action(cur, admin_id, uid, "unban")
        conn.commit()
        conn.close()
        return resp(200, {"ok": True})

    # ─── POST ?action=admin_mute ──────────────────────────────────────────────
    if method == "POST" and action == "admin_mute":
        uid = body.get("user_id")
        reason = body.get("reason", "")
        minutes = body.get("minutes", 60)
        cur = conn.cursor()
        cur.execute(
            f"UPDATE {SCHEMA}.users SET is_muted = TRUE, mute_until = NOW() + INTERVAL '{int(minutes)} minutes' "
            f"WHERE id = %s AND username != 'admin'",
            (uid,)
        )
        log_action(cur, admin_id, uid, f"mute:{minutes}min", reason)
        conn.commit()
        conn.close()
        return resp(200, {"ok": True})

    # ─── POST ?action=admin_unmute ────────────────────────────────────────────
    if method == "POST" and action == "admin_unmute":
        uid = body.get("user_id")
        cur = conn.cursor()
        cur.execute(f"UPDATE {SCHEMA}.users SET is_muted = FALSE, mute_until = NULL WHERE id = %s", (uid,))
        log_action(cur, admin_id, uid, "unmute")
        conn.commit()
        conn.close()
        return resp(200, {"ok": True})

    # ─── POST ?action=admin_warn ──────────────────────────────────────────────
    if method == "POST" and action == "admin_warn":
        uid = body.get("user_id")
        reason = body.get("reason", "")
        cur = conn.cursor()
        cur.execute(f"UPDATE {SCHEMA}.users SET warnings = warnings + 1 WHERE id = %s AND username != 'admin'", (uid,))
        log_action(cur, admin_id, uid, "warn", reason)
        conn.commit()
        conn.close()
        return resp(200, {"ok": True})

    # ─── POST ?action=admin_kick ──────────────────────────────────────────────
    if method == "POST" and action == "admin_kick":
        uid = body.get("user_id")
        reason = body.get("reason", "")
        cur = conn.cursor()
        # Кик = инвалидируем все сессии (пользователь вылетает, но может войти снова)
        cur.execute(f"UPDATE {SCHEMA}.sessions SET expires_at = NOW() WHERE user_id = %s", (uid,))
        log_action(cur, admin_id, uid, "kick", reason)
        conn.commit()
        conn.close()
        return resp(200, {"ok": True})

    # ─── POST ?action=admin_delete_user ──────────────────────────────────────
    if method == "POST" and action == "admin_delete_user":
        uid = body.get("user_id")
        cur = conn.cursor()
        cur.execute(f"UPDATE {SCHEMA}.sessions SET expires_at = NOW() WHERE user_id = %s", (uid,))
        cur.execute(f"DELETE FROM {SCHEMA}.users WHERE id = %s AND username != 'admin'", (uid,))
        log_action(cur, admin_id, None, "delete_user")
        conn.commit()
        conn.close()
        return resp(200, {"ok": True})

    # ─── POST ?action=admin_maintenance ──────────────────────────────────────
    if method == "POST" and action == "admin_maintenance":
        is_active = body.get("is_active", False)
        message = body.get("message", "Ведутся технические работы. Скоро вернёмся!")
        cur = conn.cursor()
        cur.execute(
            f"UPDATE {SCHEMA}.maintenance SET is_active = %s, message = %s, updated_at = NOW()",
            (is_active, message)
        )
        log_action(cur, admin_id, None, f"maintenance:{'on' if is_active else 'off'}", message)
        conn.commit()
        conn.close()
        return resp(200, {"ok": True})

    conn.close()
    return resp(400, {"error": "Укажи параметр action"})
