use actix_web::{web, HttpResponse, Responder};
use base64::Engine;
use lib_utils::{
    config::get_config,
    database::service::{self, Metadata},
    datasource::types::MetadataFilter,
    log::log_err,
    readmeta,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::{adapters, AppState, JsonResult};

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
    pub album_id: String,
    pub artist_id: String,
    pub cover_art: String,
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
                id_album_id_map.insert(album_song.song_id.clone(), album_song.album_id.to_string());
            }
        } else {
            log_err(&format!("album_songs error: {}", album_songs.unwrap_err()));
        }

        if let Ok(artist_songs) = artist_songs {
            for artist_song in artist_songs {
                id_artist_id_map.insert(
                    artist_song.song_id.clone(),
                    artist_song.artist_id.to_string(),
                );
            }
        } else {
            log_err(&format!(
                "artist_songs error: {}",
                artist_songs.unwrap_err()
            ));
        }

        self.iter()
            .map(|m| {
                let mut vo = MetadataVo::convert(m);
                vo.album_id = id_album_id_map.get(&vo.id).cloned().unwrap_or_default();
                vo.artist_id = id_artist_id_map.get(&vo.id).cloned().unwrap_or_default();
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
    page: Option<usize>,
    page_size: Option<usize>,
    genres: Option<Vec<String>>,
    artist: Option<Vec<i64>>,
    album: Option<Vec<i64>>,
    any: Option<String>,
}

/// 获取服务器上所有音乐文件 (使用 DataSource)
pub async fn handle_get_metadatas(
    query: web::Json<MusicListQuery>,
    app_state: web::Data<AppState>,
) -> impl Responder {
    // 使用 DataSource 获取元数据
    let filter = MetadataFilter {
        keyword: query.any.clone(),
        genres: query.genres.clone(),
        page: query.page,
        page_size: query.page_size,
        ..Default::default()
    };

    let result = app_state.data_source.list_metadata(filter.clone()).await;
    if let Err(e) = result {
        return HttpResponse::InternalServerError()
            .json(JsonResult::<ListMusic>::error(&e.to_string()));
    }

    let mut metadata_list = result.unwrap();
    // println!("{:?} size={}", filter, metadata_list.len());

    // 根据艺术家过滤 (仅本地模式)
    if let Some(artist_ids) = &query.artist {
        if !artist_ids.is_empty() {
            let song_ids = get_song_id_by_artist_ids(artist_ids).await;
            metadata_list.retain(|m| song_ids.contains(&m.id));
        }
    }

    // 根据专辑过滤 (仅本地模式)
    if let Some(album_ids) = &query.album {
        if !album_ids.is_empty() {
            let song_ids = get_song_id_by_album_ids(album_ids).await;
            metadata_list.retain(|m| song_ids.contains(&m.id));
        }
    }

    let total = metadata_list.len() as u32;

    // 转换为 VO
    let list = adapters::unified_list_to_vo(metadata_list);

    HttpResponse::Ok().json(JsonResult::success(ListMusic { list, total }))
}

pub async fn handle_get_metadata(
    song_id: web::Path<String>,
    app_state: web::Data<AppState>,
) -> impl Responder {
    let result = app_state.data_source.get_metadata(&song_id).await;
    match result {
        Ok(metadata) => {
            let vo = adapters::unified_to_vo(metadata);
            HttpResponse::Ok().json(JsonResult::success(vo))
        }
        Err(e) => HttpResponse::InternalServerError().json(JsonResult::<()>::error(&e.to_string())),
    }
}

pub async fn get_cover_small(
    song_id: web::Path<String>,
    app_state: web::Data<AppState>,
) -> impl Responder {
    let data = get_cover_size(&song_id, "small", &app_state).await;
    HttpResponse::Ok().content_type("image/webp").body(data)
}

pub async fn get_cover_medium(
    song_id: web::Path<String>,
    app_state: web::Data<AppState>,
) -> impl Responder {
    let data = get_cover_size(&song_id, "medium", &app_state).await;
    HttpResponse::Ok().content_type("image/webp").body(data)
}

pub async fn get_cover_size(song_id: &str, size: &str, app_state: &AppState) -> Vec<u8> {
    use lib_utils::datasource::types::CoverSize;
    if song_id.len() == 0 {
        return default_cover();
    }

    let cover_size = match size {
        "small" => CoverSize::Small,
        "medium" => CoverSize::Medium,
        "large" => CoverSize::Large,
        _ => CoverSize::Medium,
    };

    // 使用 DataSource 获取封面
    let result = app_state.data_source.get_cover(song_id, cover_size).await;
    // println!("get_cover_size: {} {} {:?}", song_id, size, result);

    match result {
        Ok(data) => {
            if data.len() == 0 {
                default_cover()
            } else {
                data
            }
        }
        Err(e) => {
            println!("Cover not found for {}, error: {}", song_id, e);
            default_cover()
        }
    }
}

fn default_cover() -> Vec<u8> {
    // 默认封面 (WebP 格式的 base64)
    let default_cover = "UklGRpYBAABXRUJQVlA4IIoBAACQEgCdASrAAMAAP3G42GK0sayopLkoEpAuCWVu4QXUMQU4nn/pWmF9o0DPifE+JlGhgZqOyVZgoy7NXUtGklgA0aiSG2RF2Kbm5jQ3eoKwLpyF9R8oVd509SVeXb/tHglG1W4wL8vovtTUJhW/Jxy+Dz2kkbDPiXZ2AE9bwGmE/rM3PifIKeoZRVuuc6yX3BGpY5qSDk0eFGcLFyoAAP1V/+KHvw994S1rsgmSb8eM4Ys0mSvZP+IPrAhBml27fCTgPcHy1S6f9iSr6o2btNKixxetBHWT70dP+hIZITsA3mwH6GT6Jph31q2YsJASsCnDSmiO9ctjViN5bcVXcoIwwUZTu+9jQATMseG7OR/yl1R++egpeBnLRwGRtbdMgxlpe/+cJM8j1XCD0gwSVPZDBJ2Ke/IK/iCzWPuDO2Nw6aGgfb5Rbhor4l+4FDZjWdPVG9qP3AimXDGjWyUPw1fYuf4rBYVj4XiNln/QypsIcatiR5DVPn/YR0CBfMXURwr5Dg+721oAAAAA";
    // 解码默认封面
    let engine = base64::engine::general_purpose::STANDARD;
    engine.decode(default_cover).unwrap_or_default()
}

pub async fn get_lyrics(
    song_id: web::Path<String>,
    app_state: web::Data<AppState>,
) -> impl Responder {
    let result = app_state.data_source.get_lyrics(&song_id).await;

    let lyrics = match result {
        Ok(lyrics) => lyrics,
        Err(e) => {
            println!("Lyrics not found for {}: {}", song_id, e);
            vec![]
        }
    };

    HttpResponse::Ok().json(lyrics)
}

pub async fn del_lyrics(song_id: web::Path<String>) -> impl Responder {
    let lyrics = service::del_lyrics(&song_id);

    let lyrics = if let Ok(lyrics) = lyrics {
        lyrics
    } else {
        println!("Lyrics not found for {}", song_id);
        0
    };

    if let Ok(Some(meta)) = service::get_metadata_by_id(&song_id) {
        let config = get_config();
        if let Err(e) = readmeta::read_metadata_into_db(&meta.file_path, &config.music_dir) {
            return HttpResponse::Ok().json(JsonResult::<()>::error(&format!(
                "删除成功，重新扫描时出错:{}",
                &e.to_string()
            )));
        }
    }
    HttpResponse::Ok().json(JsonResult::success(lyrics))
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

/// 查询参数结构
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RandomSongsQuery {
    /// 返回的最大歌曲数量,默认 150,最大 500
    pub size: Option<usize>,
    /// 按流派筛选
    pub genre: Option<String>,
    /// 只返回此年份之后(含)发布的歌曲
    #[serde(rename = "fromYear")]
    pub from_year: Option<String>,
    /// 只返回此年份之前(含)发布的歌曲
    #[serde(rename = "toYear")]
    pub to_year: Option<String>,
    /// 按音乐文件夹筛选(暂不支持)
    #[serde(rename = "musicFolderId")]
    pub music_folder_id: Option<String>,
}

/// 获取随机歌曲
///
/// 路由: GET /api/random_songs
///
/// 查询参数:
/// - size: 返回的最大歌曲数量,默认 150,最大 500
/// - genre: 按流派筛选
/// - fromYear: 只返回此年份之后(含)发布的歌曲
/// - toYear: 只返回此年份之前(含)发布的歌曲
///
/// 返回: 随机歌曲列表
pub async fn handle_get_random_songs(
    query: web::Query<RandomSongsQuery>,
    app_state: web::Data<AppState>,
) -> impl Responder {
    // 使用 DataSource 获取随机歌曲(支持本地数据库和 Subsonic 服务器)
    let result = app_state
        .data_source
        .get_random_songs(
            query.size,
            query.genre.as_deref(),
            query.from_year.as_deref(),
            query.to_year.as_deref(),
        )
        .await;

    match result {
        Ok(metadata_list) => {
            let total = metadata_list.len() as u32;
            // 转换为 VO
            let list = adapters::unified_list_to_vo(metadata_list);
            HttpResponse::Ok().json(JsonResult::success(ListMusic { list, total }))
        }
        Err(e) => {
            log_err(&format!("get_random_songs error: {}", e));
            HttpResponse::InternalServerError()
                .json(JsonResult::<ListMusic>::error(&e.to_string()))
        }
    }
}
