CREATE TABLE
  IF NOT EXISTS metadata (
    id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '未知歌曲',
    artist TEXT NOT NULL DEFAULT '未知艺术家',
    artists TEXT NOT NULL DEFAULT '["未知艺术家"]',
    album TEXT NOT NULL DEFAULT '未知专辑',
    year INTEGER,
    duration REAL,
    bitrate REAL,
    samplerate REAL
  );

CREATE TABLE
  IF NOT EXISTS lyric (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    song_id TEXT NOT NULL,
    time REAL NOT NULL,
    text TEXT NOT NULL
  );

CREATE TABLE
  IF NOT EXISTS cover (
    song_id TEXT NOT NULL,
    format TEXT NOT NULL,
    width REAL,
    height REAL,
    base64 TEXT NOT NULL,
    type TEXT NOT NULL,
    extra TEXT
  );

CREATE TABLE
  IF NOT EXISTS playlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL
  );

CREATE TABLE
  IF NOT EXISTS playlist_song (
    user_id INTEGER NOT NULL,
    playlist_id INTEGER NOT NULL,
    song_id TEXT NOT NULL,
    order_num INTEGER NOT NULL
  );

CREATE TABLE
  IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

CREATE TABLE
  IF NOT EXISTS user_token (
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL,
    expire_at INTEGER NOT NULL
  );

CREATE TABLE
  IF NOT EXISTS user_favorite (
    user_id INTEGER NOT NULL,
    song_id TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

CREATE TABLE
  IF NOT EXISTS tag (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    text_color TEXT NOT NULL
  );

CREATE TABLE
  IF NOT EXISTS song_tag (song_id TEXT NOT NULL, tag_id INTEGER NOT NULL);

CREATE TABLE
  IF NOT EXISTS artist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cover TEXT NOT NULL,
    description TEXT NOT NULL
  );

CREATE TABLE
  IF NOT EXISTS artist_song (artist_id INTEGER NOT NULL, song_id TEXT NOT NULL);