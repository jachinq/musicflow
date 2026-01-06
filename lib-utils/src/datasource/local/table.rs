use rusqlite::Result;

// use crate::log;

use super::connect_db;

// use crate::connect_db;

pub fn init() -> Result<()> {
    // log::log_info("Initializing database...");
    let conn = connect_db()?;
    let sql = sql();
    conn.execute_batch(&sql)?;

    // 执行数据库迁移
    migrate()?;

    // log::log_info(&format!("Database initialized, sql={}", sql));
    Ok(())
}

/// 数据库迁移函数
/// 检测数据库版本并执行必要的迁移
pub fn migrate() -> Result<()> {
    let conn = connect_db()?;

    // 获取当前数据库版本
    let version: i32 = conn.pragma_query_value(None, "user_version", |row| row.get(0))?;

    // 版本 0 -> 版本 1: 添加 album.created_at 字段 (如果不存在)
    if version < 1 {
        // 检查 album 表是否存在 created_at 字段
        let has_created_at: bool = conn
            .prepare("SELECT COUNT(*) FROM pragma_table_info('album') WHERE name='created_at'")?
            .query_row([], |row| {
                let count: i32 = row.get(0)?;
                Ok(count > 0)
            })?;

        if !has_created_at {
            // 添加 created_at 字段
            conn.execute("ALTER TABLE album ADD COLUMN created_at TEXT NOT NULL DEFAULT ''", [])?;

            // 为现有专辑填充创建时间 (使用当前时间)
            let now = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
            conn.execute("UPDATE album SET created_at = ? WHERE created_at = ''", [&now])?;
        }

        // 更新版本号
        conn.pragma_update(None, "user_version", 1)?;
    }

    // 版本 1 -> 版本 2: 扩展 user_favorite 表以支持专辑和艺术家收藏
    if version < 2 {
        // 检查 user_favorite 表是否存在 item_type 字段
        let has_item_type: bool = conn
            .prepare("SELECT COUNT(*) FROM pragma_table_info('user_favorite') WHERE name='item_type'")?
            .query_row([], |row| {
                let count: i32 = row.get(0)?;
                Ok(count > 0)
            })?;

        if !has_item_type {
            // 创建临时表
            conn.execute(
                "CREATE TABLE user_favorite_new (
                    user_id INTEGER NOT NULL,
                    item_id TEXT NOT NULL,
                    item_type TEXT NOT NULL DEFAULT 'song',
                    created_at TEXT NOT NULL,
                    PRIMARY KEY (user_id, item_id, item_type)
                )",
                [],
            )?;

            // 迁移数据（将 song_id 重命名为 item_id，并设置 item_type 为 'song'）
            conn.execute(
                "INSERT INTO user_favorite_new (user_id, item_id, item_type, created_at)
                 SELECT user_id, song_id, 'song', created_at FROM user_favorite",
                [],
            )?;

            // 删除旧表
            conn.execute("DROP TABLE user_favorite", [])?;

            // 重命名新表
            conn.execute("ALTER TABLE user_favorite_new RENAME TO user_favorite", [])?;
        }

        // 更新版本号
        conn.pragma_update(None, "user_version", 2)?;
    }

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
      artist TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT ''
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

  CREATE TABLE
    IF NOT EXISTS scrobble (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL DEFAULT 1,
      song_id TEXT NOT NULL,
      album_id INTEGER,
      submission INTEGER NOT NULL,
      timestamp INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

  CREATE INDEX IF NOT EXISTS idx_scrobble_song_id ON scrobble(song_id);
  CREATE INDEX IF NOT EXISTS idx_scrobble_album_id ON scrobble(album_id);
  CREATE INDEX IF NOT EXISTS idx_scrobble_timestamp ON scrobble(timestamp DESC);

  COMMIT;
  "#
    .to_string();
}
