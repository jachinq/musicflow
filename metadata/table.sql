BEGIN TRANSACTION;

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
    type TEXT NOT NULL,
    link_id INTEGER NOT NULL DEFAULT 0,
    format TEXT NOT NULL,
    size TEXT NOT NULL,
    width REAL,
    height REAL,
    base64 TEXT NOT NULL
  );

CREATE TABLE
  IF NOT EXISTS song_list (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    cover TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );

CREATE TABLE
  IF NOT EXISTS song_list_song (
    user_id INTEGER NOT NULL,
    song_list_id INTEGER NOT NULL,
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

CREATE TABLE
  IF NOT EXISTS album (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    year INTEGER,
    artist TEXT NOT NULL
  );

CREATE TABLE
  IF NOT EXISTS album_song (
    album_id INTEGER NOT NULL, 
    song_id TEXT NOT NULL,
    album_name TEXT NOT NULL,
    song_title TEXT NOT NULL,
    song_artist TEXT NOT NULL
  );

CREATE TABLE
  IF NOT EXISTS playlist (
    user_id INTEGER NOT NULL,
    song_id TEXT NOT NULL,
    status INTEGER NOT NULL DEFAULT 0,
    offset INTEGER NOT NULL DEFAULT 0
  );

COMMIT;