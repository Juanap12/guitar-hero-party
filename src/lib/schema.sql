CREATE TABLE IF NOT EXISTS songs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  band TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'AVAILABLE',
  singer TEXT,
  guitar_1 TEXT,
  guitar_2 TEXT,
  drums TEXT,
  reserved_at DATETIME
);
CREATE INDEX IF NOT EXISTS idx_songs_status_reserved ON songs(status, reserved_at);
CREATE INDEX IF NOT EXISTS idx_songs_band_title ON songs(band, title);
