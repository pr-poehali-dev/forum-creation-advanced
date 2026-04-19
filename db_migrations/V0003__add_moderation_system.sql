ALTER TABLE t_p64611023_forum_creation_advan.users
  ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ban_reason TEXT,
  ADD COLUMN IF NOT EXISTS ban_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_muted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS mute_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS warnings INTEGER NOT NULL DEFAULT 0;

CREATE TABLE t_p64611023_forum_creation_advan.maintenance (
    id SERIAL PRIMARY KEY,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    message TEXT NOT NULL DEFAULT 'Ведутся технические работы. Скоро вернёмся!',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO t_p64611023_forum_creation_advan.maintenance (is_active, message) VALUES (false, 'Ведутся технические работы. Скоро вернёмся!');

CREATE TABLE t_p64611023_forum_creation_advan.mod_log (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES t_p64611023_forum_creation_advan.users(id),
    target_id INTEGER REFERENCES t_p64611023_forum_creation_advan.users(id),
    action VARCHAR(32) NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
