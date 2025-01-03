use rusqlite::{Connection, Result, Row};
use serde::{Deserialize, Serialize};

fn connect_db() -> Result<Connection> {
    let conn = Connection::open("data/musicflow.db")?;
    Ok(conn)
}

fn convert_single<T>(row: Option<&Row>, f: fn(&Row) -> Result<T>) -> Option<T> {
    if row.is_none() {
        return None;
    }
    let row = row.as_ref().unwrap();
    if let Ok(row) = f(&row) {
        Some(row)
    } else {
        None
    }
}

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
        r#type: row.get(0)?,
        link_id: row.get(1)?,
        format: row.get(2)?,
        size: row.get(3)?,
        width: row.get(4)?,
        height: row.get(5)?,
        base64: row.get(6)?,
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

fn covert_row_to_tag(row: &rusqlite::Row) -> Result<Tag> {
    Ok(Tag {
        id: row.get(0)?,
        name: row.get(1)?,
        color: row.get(2)?,
        text_color: row.get(3)?,
    })
}

fn covert_row_to_song_tag(row: &rusqlite::Row) -> Result<SongTag> {
    Ok(SongTag {
        song_id: row.get(0)?,
        tag_id: row.get(1)?,
    })
}

fn covert_row_to_song_list(row: &rusqlite::Row) -> Result<SongList> {
    Ok(SongList {
        id: row.get(0)?,
        user_id: row.get(1)?,
        name: row.get(2)?,
        description: row.get(3)?,
        cover: row.get(4)?,
        created_at: row.get(5)?,
    })
}

fn covert_row_to_song_list_song(row: &rusqlite::Row) -> Result<SongListSong> {
    Ok(SongListSong {
        user_id: row.get(0)?,
        song_list_id: row.get(1)?,
        song_id: row.get(2)?,
        order_num: row.get(3)?,
    })
}

fn covert_row_to_user(row: &rusqlite::Row) -> Result<User> {
    Ok(User {
        id: row.get(0)?,
        name: row.get(1)?,
        password: row.get(2)?,
        email: row.get(3)?,
        role: row.get(4)?,
        created_at: row.get(5)?,
        updated_at: row.get(6)?,
    })
}

fn covert_row_to_user_token(row: &rusqlite::Row) -> Result<UserToken> {
    Ok(UserToken {
        user_id: row.get(0)?,
        token: row.get(1)?,
        expire_at: row.get(2)?,
    })
}

fn covert_row_to_user_favorite(row: &rusqlite::Row) -> Result<UserFavorite> {
    Ok(UserFavorite {
        user_id: row.get(0)?,
        song_id: row.get(1)?,
        created_at: row.get(2)?,
    })
}

fn covert_row_to_artist(row: &rusqlite::Row) -> Result<Artist> {
    Ok(Artist {
        id: row.get(0)?,
        name: row.get(1)?,
        cover: row.get(2)?,
        description: row.get(3)?,
    })
}

fn covert_row_to_artist_song(row: &rusqlite::Row) -> Result<ArtistSong> {
    Ok(ArtistSong {
        artist_id: row.get(0)?,
        song_id: row.get(1)?,
    })
}

fn covert_row_to_album(row: &rusqlite::Row) -> Result<Album> {
    Ok(Album {
        id: row.get(0)?,
        name: row.get(1)?,
        description: row.get(2)?,
        year: row.get(3)?,
    })
}

fn covert_row_to_album_song(row: &rusqlite::Row) -> Result<AlbumSong> {
    Ok(AlbumSong {
        album_id: row.get(0)?,
        song_id: row.get(1)?,
        album_name: row.get(2)?,
        song_title: row.get(3)?,
        song_artist: row.get(4)?,
    })
}

pub async fn get_metadata_by_id(id: &str) -> Result<Option<Metadata>> {
    let conn = connect_db()?;
    let mut stmt = conn.prepare("SELECT * FROM metadata WHERE id = ?")?;
    let mut rows = stmt.query([id])?;

    let metadata = rows
        .next()
        .map(|row| convert_single(row, covert_row_to_metadata))
        .unwrap_or(None);

    Ok(metadata)
}

pub async fn get_metadata_list() -> Result<Vec<Metadata>> {
    // 打开数据库连接（如果数据库文件不存在，会自动创建）
    let conn = connect_db()?;

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

pub async fn get_cover(link_id: i64, cover_type: &str, size: &str) -> Result<Option<Cover>> {
    let conn = connect_db()?;
    let mut stmt = conn.prepare("SELECT * FROM cover WHERE link_id = ? AND type = ? AND size = ?")?;
    let mut rows = stmt.query([link_id.to_string(), cover_type.to_string(), size.to_string()])?;

    let cover = rows
        .next()
        .map(|row| convert_single(row, covert_row_to_cover))
        .unwrap_or(None);

    Ok(cover)
}

pub async fn get_lyric(song_id: &str) -> Result<Vec<Lyric>> {
    // 打开数据库连接（如果数据库文件不存在，会自动创建）
    let conn = connect_db()?;
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

// 标签相关接口
pub async fn get_tags() -> Result<Vec<Tag>> {
    let conn = connect_db()?;
    let mut stmt = conn.prepare("SELECT * FROM tag")?;
    let rows = stmt.query_map([], |row| covert_row_to_tag(row))?;

    let mut tag_list = Vec::new();
    for tag in rows {
        if let Ok(tag) = tag {
            tag_list.push(tag);
        } else {
            println!("getTags Error: {}", tag.unwrap_err());
        }
    }
    Ok(tag_list)
}

pub async fn get_tags_by_like_name(name: &str) -> Result<Vec<Tag>> {
    let conn = connect_db()?;
    let mut stmt = conn.prepare("SELECT * FROM tag WHERE name LIKE ?")?;
    let rows = stmt.query_map([format!("%{}%", name)], |row| covert_row_to_tag(row))?;

    let mut tag_list = Vec::new();
    for tag in rows {
        if let Ok(tag) = tag {
            tag_list.push(tag);
        } else {
            println!("getTags Error: {}", tag.unwrap_err());
        }
    }
    Ok(tag_list)
}
pub async fn get_song_tags(song_id: &str) -> Result<Vec<Tag>> {
    let conn = connect_db()?;
    let mut stmt = conn.prepare("SELECT tag.id, tag.name, tag.color, tag.text_color FROM tag INNER JOIN song_tag ON tag.id = song_tag.tag_id WHERE song_tag.song_id = ?")?;
    let rows = stmt.query_map([song_id], |row| covert_row_to_tag(row))?;

    let mut tag_list = Vec::new();
    for tag in rows {
        if let Ok(tag) = tag {
            tag_list.push(tag);
        } else {
            println!("getTags Error: {}", tag.unwrap_err());
        }
    }
    Ok(tag_list)
}

pub async fn get_tag_songs(tag_id: i64) -> Result<Vec<Metadata>> {
    let conn = connect_db()?;
    let mut stmt = conn.prepare("SELECT metadata.id, metadata.file_name, metadata.file_path, metadata.file_url, metadata.title, metadata.artist, metadata.artists, metadata.album, metadata.year, metadata.duration, metadata.bitrate, metadata.samplerate FROM metadata INNER JOIN song_tag ON metadata.id = song_tag.song_id WHERE song_tag.tag_id = ?")?;
    let rows = stmt.query_map([tag_id], |row| covert_row_to_metadata(row))?;

    let mut song_list = Vec::new();
    for song in rows {
        if let Ok(song) = song {
            song_list.push(song);
        } else {
            println!("getTags Error: {}", song.unwrap_err());
        }
    }
    Ok(song_list)
}
pub async fn get_song_tag_by_tag_ids(tag_ids: Vec<i64>) -> Result<Vec<SongTag>> {
    let conn = connect_db()?;
    let ids = tag_ids.iter().map(|id| id.to_string()).collect::<Vec<String>>();
    let ids = ids.join(",");
    let mut stmt = conn.prepare("SELECT * from song_tag WHERE tag_id IN (?)")?;
    let rows = stmt.query_map([&ids], |row| covert_row_to_song_tag(row))?;

    let mut song_tag_list = Vec::new();
    for song in rows {
        if let Ok(song) = song {
            song_tag_list.push(song);
        } else {
            println!("getTags Error: {}", song.unwrap_err());
        }
    }
    Ok(song_tag_list)
}

pub async fn add_tag(tag: &Tag) -> Result<i64> {
    let conn = connect_db()?;
    let mut stmt = conn.prepare("INSERT INTO tag (name, color, text_color) VALUES (?, ?, ?)")?;
    let _ = stmt.execute([tag.name.clone(), tag.color.clone(), tag.text_color.clone()])?;
    // 拿到自增id
    let id = conn.last_insert_rowid();
    Ok(id)
}

// 歌单相关接口
pub async fn get_song_list() -> Result<Vec<SongList>> {
    let conn = connect_db()?;
    let mut stmt = conn.prepare("SELECT * FROM song_list")?;
    let rows = stmt.query_map([], |row| covert_row_to_song_list(row))?;

    let mut song_list_list = Vec::new();
    for song_list in rows {
        if let Ok(song_list) = song_list {
            song_list_list.push(song_list);
        } else {
            println!("getPlaylist Error: {}", song_list.unwrap_err());
        }
    }
    Ok(song_list_list)
}

pub async fn add_song_tag(list: Vec<SongTag>) -> Result<usize> {
    let mut conn = connect_db()?;
    let tx = conn.transaction()?;

    for song_tag in &list {
        let mut stmt = tx.prepare("INSERT INTO song_tag (song_id, tag_id) VALUES (?, ?)")?;
        stmt.execute([song_tag.song_id.to_string(), song_tag.tag_id.to_string()])?;
    }
    tx.commit()?;
    Ok(list.len())
}

pub async fn delete_song_tag(song_id: &str, tag_id: i64) -> Result<usize> {
    let conn = connect_db()?;
    let mut stmt = conn.prepare("DELETE FROM song_tag WHERE song_id = ? AND tag_id = ?")?;
    Ok(stmt.execute([song_id, &tag_id.to_string()])?)
}

pub async fn add_song_list(song_list: &SongList) -> Result<i64> {
    let conn = connect_db()?;
    let mut stmt = conn.prepare("INSERT INTO song_list (user_id, name, description, cover, created_at) VALUES (?, ?, ?, ?, ?)")?;
    let _ = stmt.execute([
        &song_list.user_id.to_string(),
        &song_list.name.clone(),
        &song_list.description.clone(),
        &song_list.cover.clone(),
        &song_list.created_at.clone(),
    ])?;
    // 拿到自增id
    let id = conn.last_insert_rowid();
    Ok(id)
}

pub async fn update_song_list(song_list: &SongList) -> Result<usize> {
    let conn = connect_db()?;
    let mut stmt =
        conn.prepare("UPDATE song_list SET name = ?, description = ?, cover = ? WHERE id = ?")?;
    let size = stmt.execute([
        &song_list.name.clone(),
        &song_list.description.clone(),
        &song_list.cover.clone(),
        &song_list.id.to_string(),
    ])?;
    Ok(size)
}

pub async fn delete_song_list(id: i64) -> Result<(usize, usize)> {
    let mut conn = connect_db()?;
    let tx = conn.transaction()?; // 事务

    // 删除歌单歌曲关系
    let song_size = tx.execute(
        "DELETE FROM song_list_song WHERE song_list_id = ?",
        &[&id.to_string()],
    )?;

    // 删除歌单
    let list_size = tx.execute("DELETE FROM song_list WHERE id = ?", &[&id.to_string()])?;

    tx.commit()?;
    Ok((list_size, song_size))
}

pub async fn add_song_list_song(song_list_id: i64, list: &Vec<SongListSong>) -> Result<usize> {
    let mut conn = connect_db()?;
    let tx = conn.transaction()?;

    // 先删除原有关系
    tx.execute(
        "DELETE FROM song_list_song WHERE song_list_id = ?",
        &[&song_list_id.to_string()],
    )?;

    // 再插入新关系
    for song_list_song in list {
        let mut stmt = tx.prepare("INSERT INTO song_list_song (user_id, song_list_id, song_id, order_num) VALUES (?, ?, ?, ?)")?;
        stmt.execute([
            &song_list_song.user_id.to_string(),
            &song_list_song.song_list_id.to_string(),
            &song_list_song.song_id.clone(),
            &song_list_song.order_num.to_string(),
        ])?;
    }
    tx.commit()?;
    Ok(list.len())
}

pub async fn delete_song_list_song(song_list_id: i64, song_id: &str) -> Result<usize> {
    let conn = connect_db()?;
    let mut stmt =
        conn.prepare("DELETE FROM song_list_song WHERE song_list_id = ? AND song_id = ?")?;
    Ok(stmt.execute([&song_list_id.to_string(), &song_id.to_string()])?)
}

pub async fn get_song_list_songs(song_list_id: i64) -> Result<Vec<Metadata>> {
    let conn = connect_db()?;
    let mut stmt = conn.prepare("SELECT metadata.id, metadata.file_name, metadata.file_path, metadata.file_url, metadata.title, metadata.artist, metadata.artists, metadata.album, metadata.year, metadata.duration, metadata.bitrate, metadata.samplerate FROM metadata INNER JOIN song_list_song ON metadata.id = song_list_song.song_id WHERE song_list_song.song_list_id = ?")?;
    let rows = stmt.query_map([&song_list_id.to_string()], |row| {
        covert_row_to_metadata(row)
    })?;

    let mut song_list = Vec::new();
    for song in rows {
        if let Ok(song) = song {
            song_list.push(song);
        } else {
            println!("getPlaylist Error: {}", song.unwrap_err());
        }
    }
    Ok(song_list)
}

pub async fn get_song_song_list(song_id: &str) -> Result<Vec<SongList>> {
    let conn = connect_db()?;
    let mut stmt = conn.prepare("SELECT song_list.id, song_list.user_id, song_list.name, song_list.description, song_list.cover, song_list.created_at FROM song_list INNER JOIN song_list_song ON song_list.id = song_list_song.song_list_id WHERE song_list_song.song_id = ?")?;
    let rows = stmt.query_map([song_id], |row| covert_row_to_song_list(row))?;

    let mut song_list_list = Vec::new();
    for song_list in rows {
        if let Ok(song_list) = song_list {
            song_list_list.push(song_list);
        } else {
            println!("getPlaylist Error: {}", song_list.unwrap_err());
        }
    }
    Ok(song_list_list)
}

// 专辑相关接口
pub async fn get_album_list() -> Result<Vec<Album>> {
    let conn = connect_db()?;
    let mut stmt = conn.prepare("SELECT * FROM album")?;
    let rows = stmt.query_map([], |row| covert_row_to_album(row))?;

    let mut album_list = Vec::new();
    for album in rows {
        if let Ok(album) = album {
            album_list.push(album);
        } else {
            println!("getAlbumList Error: {}", album.unwrap_err());
        }
    }
    Ok(album_list)
}

pub async fn album_by_id(id: i64) -> Result<Option<Album>> {
    let conn = connect_db()?;
    let mut stmt = conn.prepare("SELECT * FROM album WHERE id = ?")?;
    let mut rows = stmt.query([id])?;

    let album = rows
        .next()
        .map(|row| convert_single(row, covert_row_to_album))
        .unwrap_or(None);

    Ok(album)
}

pub async fn album_songs(album_id: i64) -> Result<Vec<Metadata>> {
    let conn = connect_db()?;
    let mut stmt = conn.prepare("SELECT metadata.id, metadata.file_name, metadata.file_path, metadata.file_url, metadata.title, metadata.artist, metadata.artists, metadata.album, metadata.year, metadata.duration, metadata.bitrate, metadata.samplerate FROM metadata INNER JOIN album_song ON metadata.id = album_song.song_id WHERE album_song.album_id = ?")?;
    let rows = stmt.query_map([&album_id.to_string()], |row| covert_row_to_metadata(row))?;

    let mut song_list = Vec::new();
    for song in rows {
        if let Ok(song) = song {
            song_list.push(song);
        } else {
            println!("getAlbumSongs Error: {}", song.unwrap_err());
        }
    }
    Ok(song_list)
}

pub async fn album_song_by_song_id(song_id: &str) -> Result<Option<AlbumSong>> {
    let conn = connect_db()?;
    let mut stmt = conn.prepare("SELECT * FROM album_song WHERE song_id = ?")?;
    let mut rows = stmt.query([song_id])?;

    let album_song = rows
        .next()
        .map(|row| convert_single(row, covert_row_to_album_song))
        .unwrap_or(None);

    Ok(album_song)
}

pub async fn album_song_by_album_id(album_id: i64) -> Result<Vec<AlbumSong>> {
    let conn = connect_db()?;
    let mut stmt = conn.prepare("SELECT * FROM album_song WHERE album_id = ?")?;
    let rows = stmt.query_map([&album_id.to_string()], |row| covert_row_to_album_song(row))?;

    let mut album_song_list = Vec::new();
    for album_song in rows {
        if let Ok(album_song) = album_song {
            album_song_list.push(album_song);
        } else {
            println!("getAlbumSongByAlbumId Error: {}", album_song.unwrap_err());
        }
    }
    Ok(album_song_list)
}

// 艺术家相关接口
pub async fn artist() -> Result<Vec<Artist>> {
    let conn = connect_db()?;
    let mut stmt = conn.prepare("SELECT * FROM artist")?;
    let rows = stmt.query_map([], |row| covert_row_to_artist(row))?;

    let mut artist_list = Vec::new();
    for artist in rows {
        if let Ok(artist) = artist {
            artist_list.push(artist);
        } else {
            println!("getArtist Error: {}", artist.unwrap_err());
        }
    }
    Ok(artist_list)
}

pub async fn artist_by_id(id: i64) -> Result<Option<Artist>> {
    let conn = connect_db()?;
    let mut stmt = conn.prepare("SELECT * FROM artist WHERE id = ?")?;
    let mut rows = stmt.query([id])?;

    let artist = rows
        .next()
        .map(|row| convert_single(row, covert_row_to_artist))
        .unwrap_or(None);

    Ok(artist)
}

pub async fn artist_songs(artist_id: i64) -> Result<Vec<Metadata>> {
    let conn = connect_db()?;
    let mut stmt = conn.prepare("SELECT metadata.id, metadata.file_name, metadata.file_path, metadata.file_url, metadata.title, metadata.artist, metadata.artists, metadata.album, metadata.year, metadata.duration, metadata.bitrate, metadata.samplerate FROM metadata INNER JOIN artist_song ON metadata.id = artist_song.song_id WHERE artist_song.artist_id = ?")?;
    let rows = stmt.query_map([&artist_id.to_string()], |row| covert_row_to_metadata(row))?;

    let mut song_list = Vec::new();
    for song in rows {
        if let Ok(song) = song {
            song_list.push(song);
        } else {
            println!("getArtistSongs Error: {}", song.unwrap_err());
        }
    }
    Ok(song_list)
}

pub async fn artist_song_by_song_id(song_id: &str) -> Result<Option<ArtistSong>> {
    let conn = connect_db()?;
    let mut stmt = conn.prepare("SELECT * FROM artist_song WHERE song_id = ?")?;
    let mut rows = stmt.query([song_id])?;

    let artist_song = rows
        .next()
        .map(|row| convert_single(row, covert_row_to_artist_song))
        .unwrap_or(None);

    Ok(artist_song)
}


#[derive(Debug, Serialize, Deserialize, Default, Clone, PartialEq)]
pub struct Cover {
    pub r#type: String,
    pub link_id: i64,
    pub format: String,
    pub size: String,
    pub width: f32,
    pub height: f32,
    pub base64: String,
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
pub struct SongList {
    pub id: i64,
    pub user_id: i64,
    pub name: String,
    pub description: String,
    pub cover: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Default, Clone, PartialEq)]
pub struct SongListSong {
    pub user_id: i64,
    pub song_list_id: i64,
    pub song_id: String,
    pub order_num: i64,
}

#[derive(Debug, Serialize, Deserialize, Default, Clone, PartialEq)]
pub struct User {
    pub id: i64,
    pub name: String,
    pub password: String,
    pub email: String,
    pub role: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Default, Clone, PartialEq)]
pub struct UserToken {
    pub user_id: i64,
    pub token: String,
    pub expire_at: i64,
}

#[derive(Debug, Serialize, Deserialize, Default, Clone, PartialEq)]
pub struct UserFavorite {
    pub user_id: i64,
    pub song_id: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Default, Clone, PartialEq)]
pub struct Tag {
    pub id: i64,
    pub name: String,
    pub color: String,
    pub text_color: String,
}

#[derive(Debug, Serialize, Deserialize, Default, Clone, PartialEq)]
pub struct SongTag {
    pub song_id: String,
    pub tag_id: i64,
}

#[derive(Debug, Serialize, Deserialize, Default, Clone, PartialEq)]
pub struct Artist {
    pub id: i64,
    pub name: String,
    pub cover: String,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize, Default, Clone, PartialEq)]
pub struct ArtistSong {
    pub artist_id: i64,
    pub song_id: String,
}

#[derive(Debug, Serialize, Deserialize, Default, Clone, PartialEq)]
pub struct Song {
    pub id: String,
    // 其他字段...
}

#[derive(Debug, Serialize, Deserialize, Default, Clone, PartialEq)]
pub struct Album {
    pub id: i64,
    pub name: String,
    pub description: String,
    pub year: i64,
}
#[derive(Debug, Serialize, Deserialize, Default, Clone, PartialEq)]
pub struct AlbumSong {
    pub album_id: i64,
    pub song_id: String,
    pub album_name: String,
    pub song_title: String,
    pub song_artist: String,
}

impl Album {
    pub fn new(name: String) -> Self {
        let mut album = Self::default();
        album.name = name;
        album
    }
}
