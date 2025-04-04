use actix_web::{web, HttpResponse, Responder};
use base64::Engine;
use lib_utils::{
    config::get_config, database::service::{self, Metadata}, log::log_err
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::JsonResult;

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
    pub artists: Vec<String>,
    pub album: String,
    pub year: String,
    pub duration: f64,
    pub bitrate: String,
    pub samplerate: String,
    pub genre: String,
    pub genres: Vec<String>,
    pub track: String,
    pub disc: String,
    pub comment: String,
    pub album_id: i64,
    pub artist_id: i64,
}

pub trait IntoVec<T> {
    fn into_vec(&self) -> Vec<T>;
}
impl IntoVec<MetadataVo> for Vec<Metadata> {
    fn into_vec(&self) -> Vec<MetadataVo> {
        if self.len() == 0 {
            return vec![];
        }
        let ids = self.iter().map(|m| m.id.clone()).collect::<Vec<_>>();

        let album_songs = service::album_song_by_song_ids(&ids);
        let artist_songs = service::artist_song_by_song_ids(&ids);

        let mut id_album_id_map = HashMap::new();
        let mut id_artist_id_map = HashMap::new();

        if let Ok(album_songs) = album_songs {
            for album_song in album_songs {
                id_album_id_map.insert(album_song.song_id.clone(), album_song.album_id);
            }
        } else {
            log_err(
                &format!("album_songs error: {}", album_songs.unwrap_err()),
            );
        }

        if let Ok(artist_songs) = artist_songs {
            for artist_song in artist_songs {
                id_artist_id_map.insert(artist_song.song_id.clone(), artist_song.artist_id);
            }
        } else {
            log_err(
                &format!("artist_songs error: {}", artist_songs.unwrap_err()),
            );
        }

        self.iter()
            .map(|m| {
                let mut vo = MetadataVo::convert(m);
                vo.album_id = id_album_id_map.get(&vo.id).cloned().unwrap_or(0);
                vo.artist_id = id_artist_id_map.get(&vo.id).cloned().unwrap_or(0);
                vo
            })
            .collect::<Vec<_>>()
    }
}

impl MetadataVo {
    pub fn from(value: &Metadata) -> Self {
        let list = vec![value.clone()];
        let list = list.into_vec();
        if list.len() == 0 {
            return Self::default();
        }
        list.first().unwrap().clone()
    }

    pub fn convert(value: &Metadata) -> Self {
        let mut vo = MetadataVo::default();
        vo.id = value.id.to_string();
        vo.file_name = value.file_name.clone();
        vo.file_path = value.file_path.clone();
        vo.file_url = value.file_url.clone();
        vo.title = value.title.clone();
        vo.artist = value.artist.clone();
        vo.artists = value.split_artist();
        vo.album = value.album.clone();
        vo.year = value.year.clone();
        vo.duration = value.duration.clone();
        vo.bitrate = value.bitrate.clone();
        vo.samplerate = value.samplerate.clone();
        vo.genre = value.genre.clone();
        vo.genres = value.split_genre();
        vo.track = value.track.clone();
        vo.disc = value.disc.clone();
        vo.comment = value.comment.clone();
        // let url = vo.file_url.replace("\\", "/");

        let config = get_config();
        let music_dir = config.music_dir.replace("\\", "/").clone();
        vo.file_url = format!("/music{}", vo.file_path.replace(&music_dir, ""));
        vo
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct MusicListQuery {
    page: Option<u32>,
    page_size: Option<u32>,
    genres: Option<Vec<String>>,
    artist: Option<Vec<i64>>,
    album: Option<Vec<i64>>,
    any: Option<String>,
}

/// 获取服务器上所有音乐文件
pub async fn handle_get_metadatas(query: web::Json<MusicListQuery>) -> impl Responder {
    let result = service::get_metadata_list();
    if let Err(e) = result {
        return HttpResponse::InternalServerError()
            .json(JsonResult::<ListMusic>::error(&e.to_string()));
    }

    let mut list = result.unwrap();

    // 过滤
    if let Some(filter) = &query.any {
        let filter = filter.to_lowercase();
        list.retain(|m| {
            m.title.to_lowercase().contains(&filter)
                || m.artist.to_lowercase().contains(&filter)
                || m.album.to_lowercase().contains(&filter)
                || m.year.to_lowercase().contains(&filter)
                || m.genre.contains(&m.id)
        });
    }

    if let Some(genres) = &query.genres {
        if genres.len() > 0 {
            list.retain(|m| genres.iter().any(|g| m.split_genre().contains(g)));
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
    // println!(
    //     "current_page: {}, page_size: {}, {:?}",
    //     current_page, page_size, query
    // );
    let total = list.len() as u32;

    let start = (current_page - 1) * page_size;
    let end = start + page_size;
    let end = end.min(total); // 防止超过总数
    list = list
        .get(start as usize..end as usize)
        .unwrap_or(&[])
        .to_vec();

    let list = list.into_vec();
    HttpResponse::Ok().json(JsonResult::success(ListMusic { list, total }))
}

pub async fn handle_get_metadata(song_id: web::Path<String>) -> impl Responder {
    let metadata = service::get_metadata_by_id(&song_id);
    match metadata {
        Ok(metadata) => {
            if let Some(metadata) = metadata {
                let vo = MetadataVo::from(&metadata);
                HttpResponse::Ok().json(JsonResult::success(vo))
            } else {
                HttpResponse::Ok().json(JsonResult::<()>::error("not found"))
            }
        }
        Err(e) => HttpResponse::InternalServerError().json(JsonResult::<()>::error(&e.to_string())),
    }
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

    let cover = service::get_cover(album_id, "album", size);
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
    let lyrics = service::get_lyric(&song_id);

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
        let songs = service::artist_songs(*artist_id);
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
        let songs = service::album_song_by_album_id(*id);
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
