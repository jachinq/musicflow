use rusqlite::{Connection, Result};
use serde::{Deserialize, Serialize};

fn covert_row_to_metadata(row: &rusqlite::Row) -> Result<Metadata> {
    Ok(Metadata {
        id: row.get(0)?,
        file_name: row.get(1)?,
        file_path: row.get(2)?,
        file_url: row.get(3)?,
        title: row.get(4)?,
        artist: row.get(5)?,
        artists: row.get(6)?,
        album: row.get(7)?,
        year: row.get(8)?,
        duration: row.get(9)?,
        bitrate: row.get(10)?,
        samplerate: row.get(11)?,
    })
}

fn covert_row_to_cover(row: &rusqlite::Row) -> Result<Cover> {
    Ok(Cover {
        song_id: row.get(0)?,
        format: row.get(1)?,
        width: row.get(2)?,
        height: row.get(3)?,
        base64: row.get(4)?,
        r#type: row.get(5)?,
        extra: row.get(6)?,
    })
}

fn covert_row_to_lyric(row: &rusqlite::Row) -> Result<Lyric> {
    Ok(Lyric {
        id: row.get(0)?,
        song_id: row.get(1)?,
        time: row.get(2)?,
        text: row.get(3)?,
    })
}

pub async fn get_metadata_list() -> Result<Vec<Metadata>> {
    // 打开数据库连接（如果数据库文件不存在，会自动创建）
    let conn = Connection::open("data/musicflow.db")?;

    // 查询数据
    let mut stmt = conn.prepare("SELECT * FROM metadata")?;
    let iter = stmt.query_map([], |row| covert_row_to_metadata(row))?;

    let mut list = Vec::new();
    for metadata in iter {
        if let Ok(metadata) = metadata {
            list.push(metadata);
        } else {
            println!("getMetadataList Error: {}", metadata.unwrap_err());
        }
    }

    Ok(list)
}

pub async fn get_cover(song_id: &str) -> Result<Option<Cover>> {
    // 打开数据库连接（如果数据库文件不存在，会自动创建）
    let conn = Connection::open("data/musicflow.db")?;

    // 查询数据
    let mut stmt = conn.prepare("SELECT * FROM cover WHERE song_id = ?")?;
    let mut rows = stmt.query([song_id])?;

    let cover = rows
        .next()
        .map(|row| {
            // println!("getCover row: {:?}", row);
            if let Some(row) = row {
                if let Ok(row) = covert_row_to_cover(&row) {
                    Some(row)
                } else {
                    None
                }
            } else {
                None
            }
        })
        .unwrap_or(None);

    Ok(cover)
}

pub async fn get_lyric(song_id: &str) -> Result<Vec<Lyric>> {
    // 打开数据库连接（如果数据库文件不存在，会自动创建）
    let conn = Connection::open("data/musicflow.db")?;

    // 查询数据
    let mut stmt = conn.prepare("SELECT * FROM lyric WHERE song_id = ?")?;
    let rows = stmt.query_map([song_id], |row| covert_row_to_lyric(row))?;

    let mut lyric_list = Vec::new();
    for lyric in rows {
        if let Ok(lyric) = lyric {
            lyric_list.push(lyric);
        } else {
            println!("getLyric Error: {}", lyric.unwrap_err());
        }
    }

    Ok(lyric_list)
}

#[derive(Debug, Serialize, Deserialize, Default, Clone, PartialEq)]
pub struct Cover {
    pub song_id: String,
    pub format: String,
    pub width: f32,
    pub height: f32,
    pub base64: String,
    pub r#type: String,
    pub extra: String,
}

#[derive(Debug, Serialize, Deserialize, Default, Clone, PartialEq)]
pub struct Lyric {
    pub id: usize,
    pub song_id: String,
    pub time: f64,
    pub text: String,
}

#[derive(Debug, Serialize, Deserialize, Default, Clone, PartialEq)]
pub struct Metadata {
    pub id: String,
    pub file_name: String,
    pub file_path: String,
    pub file_url: String,
    pub title: String,
    pub artist: String,
    pub artists: String,
    pub album: String,
    pub year: usize,
    pub duration: f64,
    pub bitrate: f64,
    pub samplerate: f64,
}

#[derive(Debug, Serialize, Deserialize, Default, Clone, PartialEq)]
pub struct Playlist {
    pub id: i32,
    pub user_id: i32,
    pub name: String,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize, Default, Clone, PartialEq)]
pub struct PlaylistSong {
    pub user_id: i32,
    pub playlist_id: i32,
    pub song_id: String,
    pub order_num: i32,
}

#[derive(Debug, Serialize, Deserialize, Default, Clone, PartialEq)]
pub struct User {
    pub id: i32,
    pub name: String,
    pub password: String,
    pub email: String,
    pub role: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Default, Clone, PartialEq)]
pub struct UserToken {
    pub user_id: i32,
    pub token: String,
    pub expire_at: i64,
}

#[derive(Debug, Serialize, Deserialize, Default, Clone, PartialEq)]
pub struct UserFavorite {
    pub user_id: i32,
    pub song_id: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Default, Clone, PartialEq)]
pub struct Tag {
    pub id: i32,
    pub name: String,
    pub color: String,
    pub text_color: String,
}

#[derive(Debug, Serialize, Deserialize, Default, Clone, PartialEq)]
pub struct SongTag {
    pub song_id: String,
    pub tag_id: i32,
}

#[derive(Debug, Serialize, Deserialize, Default, Clone, PartialEq)]
pub struct Artist {
    pub id: i32,
    pub name: String,
    pub cover: String,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize, Default, Clone, PartialEq)]
pub struct ArtistSong {
    pub artist_id: i32,
    pub song_id: String,
}

// 假设 Song 结构体已经定义，这里仅作为示例引用
#[derive(Debug, Serialize, Deserialize, Default, Clone, PartialEq)]
pub struct Song {
    pub id: String,
    // 其他字段...
}
