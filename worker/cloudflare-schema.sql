CREATE TABLE IF NOT EXISTS player_saves (
 save_key TEXT PRIMARY KEY,
 payload TEXT NOT NULL,
 revision INTEGER NOT NULL CHECK (revision >= 1)
);
