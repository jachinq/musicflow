use actix_web::{web, HttpResponse, Responder};
use base64::Engine;
use serde::{Deserialize, Serialize};

use crate::{dbservice, get_lyric, get_tag_songs, AppState, JsonResult, Metadata};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct ListMusic {
    list: Vec<MetadataVo>,
    total: u32,
}
#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct MetadataVo {
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
    pub album_id: i64,
    pub artist_id: i64,
}
impl From<Metadata> for MetadataVo {
    fn from(value: Metadata) -> Self {
        let mut vo = MetadataVo::default();
        vo.id = value.id.to_string();
        vo.file_name = value.file_name.clone();
        vo.file_path = value.file_path.clone();
        vo.file_url = value.file_url.clone();
        vo.title = value.title.clone();
        vo.artist = value.artist.clone();
        vo.artists = value.artists.clone();
        vo.album = value.album.clone();
        vo.year = value.year;
        vo.duration = value.duration;
        vo.bitrate = value.bitrate;
        vo.samplerate = value.samplerate;
        vo
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct MusicListQuery {
    page: Option<u32>,
    page_size: Option<u32>,
    tag_ids: Option<Vec<i64>>,
    artist: Option<Vec<i64>>,
    album: Option<Vec<i64>>,
    any: Option<String>,
}

/// 获取服务器上所有音乐文件
pub async fn handle_get_metadatas(
    data: web::Data<AppState>,
    query: web::Json<MusicListQuery>,
) -> impl Responder {
    // let music_path = data.music_path.clone();
    let musics = data.music_map.values().cloned().collect::<Vec<_>>();
    let mut list = musics.clone();

    // 过滤
    if let Some(filter) = &query.any {
        let filter = filter.to_lowercase();
        list.retain(|m| {
            // m.tags.iter().any(|t| t.to_lowercase().contains(&filter)) ||
            m.title.to_lowercase().contains(&filter)
                || m.artist.to_lowercase().contains(&filter)
                || m.album.to_lowercase().contains(&filter)
                || m.year.to_string().contains(&filter)
        });
    }

    if let Some(tag_ids) = &query.tag_ids {
        // 根据标签查询
        let mut tag_song_ids = vec![];
        for tag_id in tag_ids {
            if let Ok(metadatas) = get_tag_songs(*tag_id).await {
                metadatas.iter().for_each(|m| {
                    tag_song_ids.push(m.id.to_string());
                });
            }
        }
        if tag_ids.len() > 0 {
            list.retain(|m| tag_song_ids.contains(&m.id));
        }
    }

    if let Some(artist_ids) = &query.artist {
        if artist_ids.len() > 0 {
            let song_ids = get_song_id_by_artist_ids(artist_ids).await;
            list.retain(|m| song_ids.contains(&m.id));
        }
    }

    if let Some(ids) = &query.album {
        if ids.len() > 0 {
            let song_ids = get_song_id_by_album_ids(ids).await;
            list.retain(|m| song_ids.contains(&m.id));
        }
    }

    // 分页
    let mut current_page = 1;
    let mut page_size = 10;
    if let Some(page) = query.page {
        current_page = page;
    }
    if let Some(page_size1) = query.page_size {
        page_size = page_size1;
    }
    println!("current_page: {}, page_size: {}, {:?}", current_page, page_size, query);
    let total = list.len() as u32;

    let start = (current_page - 1) * page_size;
    let end = start + page_size;
    let end = end.min(total); // 防止超过总数
    list = list
        .get(start as usize..end as usize)
        .unwrap_or(&[])
        .to_vec();

    let mut list = list
        .iter()
        .map(|m| MetadataVo::from(m.clone()))
        .collect::<Vec<MetadataVo>>();
    for m in &mut list {
        if let Ok(Some(album_song)) =  dbservice::album_song_by_song_id(&m.id).await {
            m.album_id = album_song.album_id;
        }
    }

    HttpResponse::Ok().json(JsonResult::success(ListMusic { list, total }))
}

pub async fn handle_get_metadata(
    song_id: web::Path<String>,
    data: web::Data<AppState>,
) -> impl Responder {
    let metadata = data
        .music_map
        .get(&song_id.to_string())
        .cloned()
        .unwrap_or_default();

    HttpResponse::Ok().json(JsonResult::success(metadata))
}

pub async fn get_cover_small(album_id: web::Path<i64>) -> impl Responder {
    let data = get_cover_size(*album_id, "small").await;
    HttpResponse::Ok().content_type("image/webp").body(data)
}
pub async fn get_cover_medium(album_id: web::Path<i64>) -> impl Responder {
    let data = get_cover_size(*album_id, "medium").await;
    HttpResponse::Ok().content_type("image/webp").body(data)
}
pub async fn get_cover_size(album_id: i64, size: &str) -> Vec<u8> {
    // let album_song = dbservice::album_song_by_song_id(album_id).await;

    // let album_id = if let Ok(Some(album_song)) = album_song {
    //     album_song.album_id
    // } else {
    //     0
    // };

    let cover = dbservice::get_cover(album_id, "album", size).await;
    let default_cover = "UklGRpYBAABXRUJQVlA4IIoBAACQEgCdASrAAMAAP3G42GK0sayopLkoEpAuCWVu4QXUMQU4nn/pWmF9o0DPifE+JlGhgZqOyVZgoy7NXUtGklgA0aiSG2RF2Kbm5jQ3eoKwLpyF9R8oVd509SVeXb/tHglG1W4wL8vovtTUJhW/Jxy+Dz2kkbDPiXZ2AE9bwGmE/rM3PifIKeoZRVuuc6yX3BGpY5qSDk0eFGcLFyoAAP1V/+KHvw994S1rsgmSb8eM4Ys0mSvZP+IPrAhBml27fCTgPcHy1S6f9iSr6o2btNKixxetBHWT70dP+hIZITsA3mwH6GT6Jph31q2YsJASsCnDSmiO9ctjViN5bcVXcoIwwUZTu+9jQATMseG7OR/yl1R++egpeBnLRwGRtbdMgxlpe/+cJM8j1XCD0gwSVPZDBJ2Ke/IK/iCzWPuDO2Nw6aGgfb5Rbhor4l+4FDZjWdPVG9qP3AimXDGjWyUPw1fYuf4rBYVj4XiNln/QypsIcatiR5DVPn/YR0CBfMXURwr5Dg+721oAAAAA";

    let base64str = if let Ok(Some(cover)) = cover {
        cover.base64
    } else {
        println!("Cover not found for {}, cover: {:?}", album_id, cover);
        default_cover.to_string()
    };
    let base64str = if base64str.is_empty() {
        default_cover
    } else {
        &base64str
    };

    // 将base64编码的图片数据转换为二进制数据
    let engine = base64::engine::general_purpose::STANDARD;

    let data = engine.decode(base64str).unwrap_or_default();
    data
}

pub async fn get_lyrics(song_id: web::Path<String>) -> impl Responder {
    let lyrics = get_lyric(&song_id).await;

    let lyrics = if let Ok(lyrics) = lyrics {
        lyrics
    } else {
        println!("Lyrics not found for {}", song_id);
        vec![]
    };

    HttpResponse::Ok().json(lyrics)
}

async fn get_song_id_by_artist_ids(artist_ids: &Vec<i64>) -> Vec<String> {
    let mut song_ids = vec![];
    for artist_id in artist_ids {
        let songs = dbservice::artist_songs(*artist_id).await;
        songs.iter().for_each(|s| {
            s.into_iter().for_each(|m| {
                song_ids.push(m.id.to_string());
            });
        });
    }
    song_ids
}

async fn get_song_id_by_album_ids(ids: &Vec<i64>) -> Vec<String> {
    let mut song_ids = vec![];
    for id in ids {
        let songs = dbservice::album_song_by_album_id(*id).await;
        println!("get album_songs: {:#?}", id);
        println!("album_songs: {:#?}", songs);
        if let Ok(songs) = songs {
            songs.iter().for_each(|s| {
                song_ids.push(s.song_id.to_string());
            });
        }
    }
    song_ids
}
