use rusqlite::Result;

// use crate::log;

use super::connect_db;

// use crate::connect_db;

pub fn init() -> Result<()> {
    // log::log_info("Initializing database...");
    let conn = connect_db()?;
    let sql = sql();
    conn.execute_batch(&sql)?;
    // log::log_info(&format!("Database initialized, sql={}", sql));
    Ok(())
}

fn sql() -> String {
    return r#"
  BEGIN TRANSACTION;

  CREATE TABLE
    IF NOT EXISTS metadata (
      id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_url TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '未知歌曲',
      artist TEXT NOT NULL DEFAULT '未知艺术家',
      album TEXT NOT NULL DEFAULT '未知专辑',
      year TEXT NOT NULL DEFAULT '未知年份',
      duration REAL,
      bitrate REAL,
      samplerate REAL,
      language TEXT NOT NULL DEFAULT '未知语言',
      genre TEXT NOT NULL DEFAULT '未知风格',
      track TEXT NOT NULL DEFAULT '未知曲目',
      disc TEXT NOT NULL DEFAULT '未知碟片',
      comment TEXT NOT NULL DEFAULT ''
    );
  
  CREATE TABLE
    IF NOT EXISTS lyric (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      song_id TEXT NOT NULL,
      time REAL NOT NULL,
      text TEXT NOT NULL,
      language TEXT NOT NULL DEFAULT ''
    );
  
  CREATE TABLE
    IF NOT EXISTS cover (
      type TEXT NOT NULL,
      link_id INTEGER NOT NULL DEFAULT 0,
      format TEXT NOT NULL,
      size TEXT NOT NULL,
      length INTEGER,
      width INTEGER,
      height INTEGER,
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
      description TEXT NOT NULL DEFAULT '',
      year TEXT NOT NULL DEFAULT '',
      artist TEXT NOT NULL DEFAULT ''
    );
  
  CREATE TABLE
    IF NOT EXISTS album_song (
      album_id INTEGER NOT NULL, 
      song_id TEXT NOT NULL,
      album_name TEXT NOT NULL,
      song_title TEXT NOT NULL,
      album_artist TEXT NOT NULL
    );

  CREATE TABLE
    IF NOT EXISTS playlist (
      user_id INTEGER NOT NULL,
      song_id TEXT NOT NULL,
      status INTEGER NOT NULL DEFAULT 0,
      offset INTEGER NOT NULL DEFAULT 0
    );
  
  COMMIT;  
  "#
    .to_string();
}
