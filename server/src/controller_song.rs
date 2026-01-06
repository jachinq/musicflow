use actix_web::{web, HttpResponse, Responder};
use base64::Engine;
use lib_utils::{
    config::get_config,
    datasource::local::service,
    datasource::{types::MetadataFilter, CoverSize},
    log::log_err,
    readmeta,
};
use serde::{Deserialize, Serialize};

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
    pub starred: bool,
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

    if app_state.config.is_local_mode() {
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
    let data = get_cover_size(&song_id, CoverSize::Small, &app_state).await;
    HttpResponse::Ok().content_type("image/webp").body(data)
}

pub async fn get_cover_medium(
    song_id: web::Path<String>,
    app_state: web::Data<AppState>,
) -> impl Responder {
    let data = get_cover_size(&song_id, CoverSize::Medium, &app_state).await;
    HttpResponse::Ok().content_type("image/webp").body(data)
}
pub async fn get_cover_large(
    song_id: web::Path<String>,
    app_state: web::Data<AppState>,
) -> impl Responder {
    let data = get_cover_size(&song_id, CoverSize::Large, &app_state).await;
    HttpResponse::Ok().content_type("image/webp").body(data)
}

pub async fn get_cover_size(song_id: &str, cover_size: CoverSize, app_state: &AppState) -> Vec<u8> {
    if song_id.len() == 0 {
        return default_cover();
    }

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

pub async fn del_lyrics(song_id: web::Path<String>, app_state: web::Data<AppState>) -> impl Responder {
    if !app_state.config.is_local_mode() {
        return HttpResponse::Forbidden().json(JsonResult::<()>::error("仅本地模式下可删除歌词"));
    }

    let lyrics = service::del_lyrics(&song_id);

    let lyrics = if let Ok(lyrics) = lyrics {
        lyrics
    } else {
        println!("Lyrics not found for {}", song_id);
        0
    };

    if let Ok(meta) = app_state.data_source.get_metadata(&song_id).await {
        if let Some(file_path) = meta.file_path {
            let config = get_config();
            if let Err(e) = readmeta::read_metadata_into_db(&file_path, &config.music_dir) {
                return HttpResponse::Ok().json(JsonResult::<()>::error(&format!(
                    "删除成功，重新扫描时出错:{}",
                    &e.to_string()
                )));
            }
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
    // 从每日缓存获取数据
    let result = app_state
        .daily_random_songs
        .get_or_refresh(&app_state.data_source)
        .await;

    match result {
        Ok(mut metadata_list) => {
            // 应用查询参数过滤
            if let Some(genre) = &query.genre {
                metadata_list.retain(|m| {
                    !m.genre.is_empty() && m.genre.to_lowercase().contains(&genre.to_lowercase())
                });
            }

            if let Some(from_year) = &query.from_year {
                metadata_list.retain(|m| !m.year.is_empty() && &m.year >= from_year);
            }

            if let Some(to_year) = &query.to_year {
                metadata_list.retain(|m| !m.year.is_empty() && &m.year <= to_year);
            }

            // 限制返回数量
            let size = query.size.unwrap_or(150).min(500);
            metadata_list.truncate(size);

            let total = metadata_list.len() as u32;
            // 转换为 VO
            let list = adapters::unified_list_to_vo(metadata_list);
            HttpResponse::Ok().json(JsonResult::success(ListMusic { list, total }))
        }
        Err(e) => {
            log_err(&format!("get_random_songs error: {}", e));
            HttpResponse::InternalServerError().json(JsonResult::<ListMusic>::error(&e.to_string()))
        }
    }
}

/// Scrobble 请求参数
#[derive(Debug, Deserialize)]
pub struct ScrobbleRequest {
    pub song_id: String,
    #[serde(default)]
    pub submission: Option<bool>,
    #[serde(default)]
    pub timestamp: Option<u64>,
}

/// 记录播放历史
///
/// 路由: POST /api/scrobble
///
/// 请求参数:
/// - song_id: 歌曲 ID（必需）
/// - submission: true=已播放，false=正在播放（可选，默认 true）
/// - timestamp: Unix 时间戳（毫秒）（可选）
///
/// 返回: 成功/失败状态
pub async fn handle_scrobble(
    app_state: web::Data<AppState>,
    req: web::Json<ScrobbleRequest>,
) -> impl Responder {
    let result = app_state
        .data_source
        .scrobble(&req.song_id, req.submission, req.timestamp)
        .await;

    match result {
        Ok(()) => HttpResponse::Ok().json(JsonResult::success(())),
        Err(e) => {
            log_err(&format!("scrobble error: {}", e));
            HttpResponse::Ok().json(JsonResult::<()>::error(&e.to_string()))
        }
    }
}
