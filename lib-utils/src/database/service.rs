#![allow(dead_code)]

use rusqlite::{Result, Row};
use serde::{Deserialize, Serialize};

use super::connect_db;

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
        album: row.get(6)?,
        year: row.get(7)?,
        duration: row.get(8)?,
        bitrate: row.get(9)?,
        samplerate: row.get(10)?,
        language: row.get(11)?,
        genre: row.get(12)?,
        track: row.get(13)?,
        disc: row.get(14)?,
        comment: row.get(15)?,
    })
}

fn covert_row_to_cover(row: &rusqlite::Row) -> Result<Cover> {
    Ok(Cover {
        r#type: row.get(0)?,
        link_id: row.get(1)?,
        format: row.get(2)?,
        size: row.get(3)?,
        length: row.get(4)?,
        width: row.get(5)?,
        height: row.get(6)?,
        base64: row.get(7)?,
    })
}

fn covert_row_to_lyric(row: &rusqlite::Row) -> Result<Lyric> {
    Ok(Lyric {
        id: row.get(0)?,
        song_id: row.get(1)?,
        time: row.get(2)?,
        text: row.get(3)?,
        language: row.get(4)?,
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
        artist: row.get(4)?,
    })
}

fn covert_row_to_album_song(row: &rusqlite::Row) -> Result<AlbumSong> {
    Ok(AlbumSong {
        album_id: row.get(0)?,
        song_id: row.get(1)?,
        album_name: row.get(2)?,
        song_title: row.get(3)?,
        album_artist: row.get(4)?,
    })
}

pub fn get_metadata_by_id(id: &str) -> Result<Option<Metadata>> {
    let conn = connect_db()?;
    let mut stmt = conn.prepare("SELECT * FROM metadata WHERE id = ?")?;
    let mut rows = stmt.query([id])?;

    let metadata = rows
        .next()
        .map(|row| convert_single(row, covert_row_to_metadata))
        .unwrap_or(None);

    Ok(metadata)
}

pub fn get_metadata_list() -> Result<Vec<Metadata>> {
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

pub fn get_metadata_by_title_artist(title: &str, artist: &str) -> Result<Option<Metadata>> {
    let conn = connect_db()?;
    let mut stmt = conn.prepare("SELECT * FROM metadata WHERE title = ? AND artist = ?")?;
    let mut rows = stmt.query([title, artist])?;

    let metadata = rows
        .next()
        .map(|row| convert_single(row, covert_row_to_metadata))
        .unwrap_or(None);

    Ok(metadata)
}

pub fn add_metadata(metadata: &Metadata) -> Result<()> {
    let conn = connect_db()?;
    let mut stmt = conn.prepare("INSERT INTO metadata (id, file_name, file_path, file_url, title, artist, album, year, duration, bitrate, samplerate, language, genre, track, disc, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")?;
    let _ = stmt.execute([
        metadata.id.clone(),
        metadata.file_name.clone(),
        metadata.file_path.clone(),
        metadata.file_url.clone(),
        metadata.title.clone(),
        metadata.artist.clone(),
        metadata.album.clone(),
        metadata.year.clone(),
        metadata.duration.to_string(),
        metadata.bitrate.to_string(),
        metadata.samplerate.to_string(),
        metadata.language.clone(),
        metadata.genre.clone(),
        metadata.track.to_string(),
        metadata.disc.to_string(),
        metadata.comment.clone(),
    ])?;
    Ok(())
}

pub fn set_metadata_genre(genre: &str, song_id: &str) -> Result<usize> {
    let conn = connect_db()?;
    let mut stmt = conn.prepare("UPDATE metadata SET genre = ? WHERE id = ?")?;
    let size = stmt.execute([genre, song_id])?;
    Ok(size)
}

pub fn get_cover(link_id: i64, cover_type: &str, size: &str) -> Result<Option<Cover>> {
    let conn = connect_db()?;
    let mut stmt =
        conn.prepare("SELECT * FROM cover WHERE link_id = ? AND type = ? AND size = ?")?;
    let mut rows = stmt.query([
        link_id.to_string(),
        cover_type.to_string(),
        size.to_string(),
    ])?;

    let cover = rows
        .next()
        .map(|row| convert_single(row, covert_row_to_cover))
        .unwrap_or(None);

    Ok(cover)
}

pub fn add_covers(cover_list: Vec<Cover>) -> Result<usize> {
    let mut conn = connect_db()?;
    let tx = conn.transaction()?;
    let mut count = 0;
    for cover in cover_list {
        let mut stmt = tx.prepare("INSERT INTO cover (type, link_id, format, size, length, width, height, base64) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")?;
        let _ = stmt.execute([
            cover.r#type.clone(),
            cover.link_id.to_string(),
            cover.format.clone(),
            cover.size.clone(),
            cover.length.to_string(),
            cover.width.to_string(),
            cover.height.to_string(),
            cover.base64.clone(),
        ])?;
        count += 1;
    }
    tx.commit()?;
    Ok(count)
}

pub fn get_lyric(song_id: &str) -> Result<Vec<Lyric>> {
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

pub fn add_lyrics(lyric_list: Vec<Lyric>) -> Result<usize> {
    let mut conn = connect_db()?;
    let tx = conn.transaction()?;
    let mut count = 0;
    for lyric in lyric_list {
        let mut stmt = tx.prepare("INSERT INTO lyric (song_id, time, text, language) VALUES (?, ?, ?, ?)")?;
        let _ = stmt.execute([
            lyric.song_id.clone(),
            lyric.time.to_string(),
            lyric.text.clone(),
            lyric.language.clone(),
        ])?;
        count += 1;
    }
    tx.commit()?;
    Ok(count)
}

// 歌单相关接口
pub fn get_song_list() -> Result<Vec<SongList>> {
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

pub fn add_song_list(song_list: &SongList) -> Result<i64> {
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

pub fn update_song_list(song_list: &SongList) -> Result<usize> {
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

pub fn delete_song_list(id: i64) -> Result<(usize, usize)> {
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

pub fn add_song_list_song(song_list_id: i64, list: &Vec<SongListSong>) -> Result<usize> {
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

pub fn delete_song_list_song(song_list_id: i64, song_id: &str) -> Result<usize> {
    let conn = connect_db()?;
    let mut stmt =
        conn.prepare("DELETE FROM song_list_song WHERE song_list_id = ? AND song_id = ?")?;
    Ok(stmt.execute([&song_list_id.to_string(), &song_id.to_string()])?)
}

pub fn get_song_list_songs(song_list_id: i64) -> Result<Vec<Metadata>> {
    let conn = connect_db()?;
    let mut stmt = conn.prepare("SELECT metadata.id, metadata.file_name, metadata.file_path, metadata.file_url, metadata.title, metadata.artist, metadata.album, metadata.year, metadata.duration, metadata.bitrate, metadata.samplerate, metadata.language, metadata.genre, metadata.track, metadata.disc, metadata.comment FROM metadata INNER JOIN song_list_song ON metadata.id = song_list_song.song_id WHERE song_list_song.song_list_id = ?")?;
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

pub fn get_song_song_list(song_id: &str) -> Result<Vec<SongList>> {
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
pub fn add_album(album: &Album) -> Result<i64> {
    let conn = connect_db()?;
    let mut stmt =
        conn.prepare("INSERT INTO album (name, description, year, artist) VALUES (?, ?, ?, ?)")?;
    let _ = stmt.execute([
        &album.name.clone(),
        &album.description.clone(),
        &album.year.clone(),
        &album.artist.clone(),
    ])?;
    // 拿到自增id
    let id = conn.last_insert_rowid();
    Ok(id)
}

pub fn get_album_list() -> Result<Vec<Album>> {
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

pub fn album_by_id(id: i64) -> Result<Option<Album>> {
    let conn = connect_db()?;
    let mut stmt = conn.prepare("SELECT * FROM album WHERE id = ?")?;
    let mut rows = stmt.query([id])?;

    let album = rows
        .next()
        .map(|row| convert_single(row, covert_row_to_album))
        .unwrap_or(None);

    Ok(album)
}

pub fn get_album_by_name(name: &str) -> Result<Option<Album>> {
    let conn = connect_db()?;
    let mut stmt = conn.prepare("SELECT * FROM album WHERE name = ?")?;
    let mut rows = stmt.query([name])?;

    let album = rows    
        .next()
        .map(|row| convert_single(row, covert_row_to_album))
        .unwrap_or(None);

    Ok(album)
}

pub fn add_album_song(album_song: &AlbumSong) -> Result<usize> {
    let conn = connect_db()?;

    let mut stmt = conn.prepare("INSERT INTO album_song (album_id, song_id, album_name, song_title, album_artist) VALUES (?, ?, ?, ?, ?)")?;
    let _ = stmt.execute([
        &album_song.album_id.to_string(),
        &album_song.song_id.clone(),
        &album_song.album_name.clone(),
        &album_song.song_title.clone(),
        &album_song.album_artist.clone(),
    ])?;
    Ok(1)
}

pub fn album_songs(album_id: i64) -> Result<Vec<Metadata>> {
    let conn = connect_db()?;
    let mut stmt = conn.prepare("SELECT metadata.id, metadata.file_name, metadata.file_path, metadata.file_url, metadata.title, metadata.artist, metadata.album, metadata.year, metadata.duration, metadata.bitrate, metadata.samplerate, metadata.language, metadata.genre, metadata.track, metadata.disc, metadata.comment FROM metadata INNER JOIN album_song ON metadata.id = album_song.song_id WHERE album_song.album_id = ?")?;
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

pub fn album_song_by_song_id(song_id: &str) -> Result<Option<AlbumSong>> {
    let conn = connect_db()?;
    let mut stmt = conn.prepare("SELECT * FROM album_song WHERE song_id = ?")?;
    let mut rows = stmt.query([song_id])?;

    let album_song = rows
        .next()
        .map(|row| convert_single(row, covert_row_to_album_song))
        .unwrap_or(None);

    Ok(album_song)
}

pub fn album_song_by_album_id(album_id: i64) -> Result<Vec<AlbumSong>> {
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

pub fn album_song_by_id(song_id: &str, album_id: i64) -> Result<Option<AlbumSong>> {
    let conn = connect_db()?;
    let mut stmt = conn.prepare("SELECT * FROM album_song WHERE song_id = ? AND album_id = ?")?;
    let mut rows = stmt.query([song_id, &album_id.to_string()])?;

    let album_song = rows
        .next()
        .map(|row| convert_single(row, covert_row_to_album_song))
        .unwrap_or(None);

    Ok(album_song)
}



// 艺术家相关接口
pub fn add_artists(artist: &Vec<Artist>) -> Result<Vec<i64>> {
    let conn = connect_db()?;
    let mut stmt =
        conn.prepare("INSERT INTO artist (name, cover, description) VALUES (?, ?, ?)")?;
    let mut ids = Vec::new();
    for a in artist {
        let _ = stmt.execute([&a.name.clone(), &a.cover.clone(), &a.description.clone()])?;
        // 拿到自增id
        let id = conn.last_insert_rowid();
        ids.push(id);
    }
    Ok(ids)
}

pub fn add_artist(artist: &Artist) -> Result<i64> {
    let conn = connect_db()?;
    let mut stmt =
        conn.prepare("INSERT INTO artist (name, cover, description) VALUES (?, ?, ?)")?;
    let _ = stmt.execute([&artist.name.clone(), &artist.cover.clone(), &artist.description.clone()])?;
    // 拿到自增id
    let id = conn.last_insert_rowid();
    Ok(id)
}

pub fn artist() -> Result<Vec<Artist>> {
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

pub fn artist_by_id(id: i64) -> Result<Option<Artist>> {
    let conn = connect_db()?;
    let mut stmt = conn.prepare("SELECT * FROM artist WHERE id = ?")?;
    let mut rows = stmt.query([id])?;

    let artist = rows
        .next()
        .map(|row| convert_single(row, covert_row_to_artist))
        .unwrap_or(None);

    Ok(artist)
}

pub fn artist_by_name(name: &str) -> Result<Option<Artist>> {
    let conn = connect_db()?;
    let mut stmt = conn.prepare("SELECT * FROM artist WHERE name = ?")?;
    let mut rows = stmt.query([name])?;

    let artist = rows
        .next()
        .map(|row| convert_single(row, covert_row_to_artist))
        .unwrap_or(None);

    Ok(artist)
}

pub fn add_artist_songs(artist_songs: &Vec<ArtistSong>) -> Result<usize> {
    let mut conn = connect_db()?;
    let tx = conn.transaction()?;

    for artist_song in artist_songs {
        let mut stmt = tx.prepare("INSERT INTO artist_song (artist_id, song_id) VALUES (?, ?)")?;
        stmt.execute([
            &artist_song.artist_id.to_string(),
            &artist_song.song_id.clone(),
        ])?;
    }
    tx.commit()?;
    Ok(artist_songs.len())
}

pub fn artist_songs(artist_id: i64) -> Result<Vec<Metadata>> {
    let conn = connect_db()?;
    let mut stmt = conn.prepare("SELECT metadata.id, metadata.file_name, metadata.file_path, metadata.file_url, metadata.title, metadata.artist,  metadata.album, metadata.year, metadata.duration, metadata.bitrate, metadata.samplerate, metadata.language, metadata.genre, metadata.track, metadata.disc, metadata.comment FROM metadata INNER JOIN artist_song ON metadata.id = artist_song.song_id WHERE artist_song.artist_id = ?")?;
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

pub fn artist_song_by_song_id(song_id: &str) -> Result<Option<ArtistSong>> {
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
    pub length: usize,
    pub width: u32,
    pub height: u32,
    pub base64: String,
}

#[derive(Debug, Serialize, Deserialize, Default, Clone, PartialEq)]
pub struct Lyric {
    pub id: usize,
    pub song_id: String,
    pub time: f64,
    pub text: String,
    pub language: String,
}

#[derive(Debug, Serialize, Deserialize, Default, Clone, PartialEq)]
pub struct Metadata {
    pub id: String,
    pub file_name: String,
    pub file_path: String,
    pub file_url: String,
    pub title: String,
    pub artist: String,
    pub album: String,
    pub year: String,
    pub duration: f64,
    pub bitrate: String,
    pub samplerate: String,
    pub language: String,
    pub genre: String,
    pub track: String,
    pub disc: String,
    pub comment: String,
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
    pub year: String,
    pub artist: String,
}

#[derive(Debug, Serialize, Deserialize, Default, Clone, PartialEq)]
pub struct AlbumSong {
    pub album_id: i64,
    pub song_id: String,
    pub album_name: String,
    pub song_title: String,
    pub album_artist: String,
}

impl Album {
    pub fn new(name: String) -> Self {
        let mut album = Self::default();
        album.name = name;
        album
    }
}
