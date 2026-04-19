CREATE TABLE t_p64611023_forum_creation_advan.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(32) NOT NULL UNIQUE,
    password_hash VARCHAR(256) NOT NULL,
    role VARCHAR(16) NOT NULL DEFAULT 'member',
    rank VARCHAR(32) NOT NULL DEFAULT 'Новичок',
    avatar VARCHAR(8) NOT NULL DEFAULT '🎮',
    reputation INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p64611023_forum_creation_advan.sessions (
    token VARCHAR(64) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p64611023_forum_creation_advan.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days'
);
