#![allow(dead_code)]

use actix_cors::Cors;
use actix_files::NamedFile;
use actix_web::middleware::Logger;
use actix_web::{web, App, HttpServer};
use env_logger::Env;
use lib_utils::comm::is_music_file;
use lib_utils::config::get_config;
use lib_utils::database::table;
use lib_utils::datasource::factory::create_data_source;
use lib_utils::datasource::MusicDataSource;
use lib_utils::{database, log, readmeta};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io;
use std::path::Path;
use std::sync::Arc;
use walkdir::WalkDir; // 引入 CORS 中间件

mod controller_album;
mod controller_artist;
mod controller_genre;
mod controller_playlist;
mod controller_song;
mod controller_songlist;
mod controller_tool;
mod controller_user;
mod adapters;

use controller_album::*;
use controller_artist::*;
use controller_genre::*;
use controller_playlist::*;
use controller_song::*;
use controller_songlist::*;
use controller_tool::*;
use controller_user::*;

// 应用状态
#[derive(Clone)]
struct AppState {
    web_path: String,
    music_path: String,
    data_source: Arc<dyn MusicDataSource>,
}

#[actix_web::main]
async fn main() -> io::Result<()> {
    // 初始化日志记录
    std::env::set_var("RUST_LOG", "info");
    env_logger::init_from_env(Env::default().default_filter_or("info"));

    // 初始化数据库
    let result = table::init();
    if result.is_err() {
        let _ = log::log_err(&format!("init table error: {}", result.err().unwrap()));
        return Err(io::Error::new(io::ErrorKind::Other, "init table error"));
    }

    // 读取配置文件信息
    let config = get_config();
    let web_dir = config.web_dir.clone();
    let ip = config.ip.clone();
    let port = config.port.clone();

    // 创建数据源
    let data_source = create_data_source(&config);
    log::log_info(&format!("Data source created: {:?}", data_source.source_type()));

    // 扫描音乐文件，构建音乐 ID 到 Music 实例的映射表
    let music_dir = config.music_dir.clone();
    let music_dir = music_dir.replace("\\", "/");
    log::log_info(&format!("Music dir: {}, Web dir: {}", music_dir, web_dir));

    check_lost_file(&music_dir).await;
    // 映射音乐文件的静态路径
    let music_path = "/music";

    log::log_info(&format!("Server started on http://{}:{}", ip, port));
    // 启动 HTTP 服务
    HttpServer::new(move || {
        App::new()
            .wrap(
                Cors::default() // 添加 CORS 中间件
                    .allow_any_origin() // 允许所有来源的跨域请求，你可以根据需要更改为特定的域名
                    .allow_any_method() // 允许所有方法，如 GET, POST, PUT, DELETE 等
                    .allow_any_header(), // 允许所有请求头，你可以根据需要更改为特定的请求头
            )
            .wrap(Logger::default()) // 日志记录中间件
            .app_data(web::JsonConfig::default().error_handler(handle_server_error)) //
            .app_data(web::Data::new(AppState {
                web_path: web_dir.to_string(),
                music_path: music_path.to_string(),
                data_source: data_source.clone(),
            }))
            // 歌曲相关接口
            .route("/api/list", web::post().to(handle_get_metadatas))
            .route("/api/single/{song_id}", web::get().to(handle_get_metadata))
            .route("/api/random_songs", web::get().to(handle_get_random_songs))
            .route("/api/cover/small/{song_id}", web::get().to(get_cover_small))
            .route(
                "/api/cover/medium/{song_id}",
                web::get().to(get_cover_medium),
            )
            .route("/api/lyrics/{song_id}", web::get().to(get_lyrics))
            .route("/api/lyrics/delete/{song_id}", web::delete().to(del_lyrics))
            // 标签相关接口
            .route("/api/genres", web::get().to(handle_get_genres))
            .route(
                "/api/song_genres/{song_id}",
                web::get().to(handle_get_song_genres),
            )
            .route(
                "/api/add_genre_to_song",
                web::post().to(handle_add_song_genre),
            )
            .route(
                "/api/delete_song_genre/{song_id}/{genre}",
                web::delete().to(handle_delete_song_genre),
            )
            .route("/api/songs_by_genre/{genre}", web::get().to(handle_get_songs_by_genre))
            // 歌单相关接口
            .route("/api/songlist", web::get().to(handle_song_list))
            .route(
                "/api/songlist_songs/{songlist_id}",
                web::get().to(handle_song_list_songs),
            )
            .route(
                "/api/song_songlist/{song_id}",
                web::get().to(handle_song_song_list),
            )
            .route(
                "/api/delete_songlist/{songlist_id}",
                web::delete().to(handle_delete_song_list),
            )
            .route(
                "/api/create_songlist",
                web::post().to(handle_create_song_list),
            )
            .route(
                "/api/update_songlist",
                web::put().to(handle_update_song_list),
            )
            .route(
                "/api/remove_song_from_songlist/{songlist_id}/{song_id}",
                web::delete().to(handle_remove_song_from_songlist),
            )
            .route(
                "/api/add_song_to_songlist",
                web::put().to(handle_add_song_list_song),
            )
            // 专辑相关接口
            .route("/api/album", web::post().to(handle_get_album))
            .route(
                "/api/album_by_id/{id}",
                web::get().to(handle_get_album_by_id),
            )
            .route(
                "/api/album_songs/{album_id}",
                web::get().to(handle_get_album_songs),
            )
            // 艺术家相关接口
            .route("/api/artist", web::post().to(handle_get_artist))
            .route(
                "/api/artist_by_id/{id}",
                web::get().to(handle_get_artist_by_id),
            )
            .route(
                "/api/artist_songs/{artist_id}",
                web::get().to(handle_get_artist_songs),
            )
            .route(
                "/api/set_artist_cover/{artist_id}",
                web::put().to(handle_set_artist_cover),
            )
            // 用户相关接口
            .route("/api/user", web::get().to(handle_get_user))
            .route("/api/login", web::post().to(handle_login))
            .route("/api/logout", web::post().to(handle_logout))
            .route("/api/register", web::post().to(handle_register))
            .route("/api/update_user", web::put().to(handle_update_user))
            .route(
                "/api/change_password",
                web::post().to(handle_change_password),
            )
            // 播放列表相关接口
            .route("/api/playlist", web::post().to(handle_get_playlist))
            .route("/api/add_playlist", web::post().to(handle_add_playlist))
            .route("/api/set_playlist/{song_id}", web::put().to(handle_set_current))
            // 工具相关接口
            .route("/api/log", web::post().to(frontend_log))
            .route("/api/del/{song_id}", web::get().to(handle_delete_meta))
            .route("/api/scan_music", web::post().to(handle_scan_music))
            .route(
                "/api/handle_scan_music_progress",
                web::post().to(handle_scan_music_progress),
            )
            // 添加静态文件服务
            .service(actix_files::Files::new(music_path, &music_dir).show_files_listing())
            .service(actix_files::Files::new("/", &web_dir).index_file("index.html"))
            .default_service(web::get().to(handle_all_others))
    })
    .bind(&format!("{}:{}", ip, port))?
    .run()
    .await
}

// 处理所有其他请求，重定向到 index.html
async fn handle_all_others(app_data: web::Data<AppState>) -> Result<NamedFile, actix_web::Error> {
    let web_path = app_data.web_path.clone();
    let index_path = format!("{}/index.html", web_path);
    let path = Path::new(&index_path);
    NamedFile::open(path).map_err(|_| actix_web::error::ErrorNotFound("index.html not found"))
}

fn handle_server_error(
    err: actix_web::error::JsonPayloadError,
    _req: &actix_web::HttpRequest,
) -> actix_web::Error {
    let err2 = JsonResult::<()>::error(&err.to_string());
    let err2 = serde_json::to_string(&err2).unwrap_or_default();

    actix_web::error::ErrorInternalServerError(err2)
}
// 检查音乐文件是否缺失metadata，如果有缺失文件，启动后台线程重新扫描
async fn check_lost_file(music_dir: &str) {
    log::log_info("Start check lost file");
    let metas = lib_utils::database::service::get_metadata_list();
    let metas = metas.unwrap_or_default();
    let mut path_metadata_map = HashMap::new();
    for metadata in &metas {
        path_metadata_map.insert(metadata.file_path.to_string(), metadata);
    }

    let mut lost_files = Vec::new();
    // 第一种情况：遍历音乐目录，如果文件路径在metas中不存在，则认为是缺失文件
    for entry in WalkDir::new(music_dir).into_iter().filter_map(|e| e.ok()) {
        if entry.file_type().is_file() {
            let path = entry.path().display().to_string().replace("\\", "/");
            if !is_music_file(&path) {
                continue;
            }
            let path2 = path.clone().replace(music_dir, "/mnt/data/music");
            let metadata = path_metadata_map.get(&path);
            let metadata2 = path_metadata_map.get(&path2);
            if metadata.is_none() && metadata2.is_none() {
                println!("lost file: {}", path);
                lost_files.push(path);
                continue;
            }
        }
    }

    // 第二种情况：对应路径存在metadata，但是关联的封面、歌词等缺失，也需要重新扫描
    let album_list = if let Ok(list) = database::service::get_album_list() {
        list.iter().map(|album| album.name.to_string()).collect()
    } else {
        Vec::new()
    };
    let lyric_song_ids = if let Ok(list) = database::service::get_lyric_song_ids() {
        list
    } else {
        Vec::new()
    };
    // let mut lost_album = Vec::new();
    // let mut lost_lyric = Vec::new();
    for metadata in &metas {
        let path = metadata.file_path.to_string();
        let path = path.replace("\\", "/");
        if lost_files.contains(&path) {
            // 如果路径已经在待扫描列表，则跳过
            continue;
        }
        if !is_music_file(&path) {
            continue;
        }

        // 遍历metadata的封面、歌词等文件，如果文件不存在，则认为是缺失文件
        if !album_list.contains(&metadata.album) {
            log::log_info(&format!(
                "check lost Album {}; path={path}",
                &metadata.album
            ));
            lost_files.push(path.clone());
        }

        if !lyric_song_ids.contains(&metadata.id) {
            log::log_info(&format!(
                "check lost Lyric; path={path} sond_id={}",
                metadata.id
            ));
            lost_files.push(path.clone());
        }
    }

    let meta_cnt = metas.len();
    let lost_cnt = lost_files.len();
    log::log_info(&format!(
        "Music count: {meta_cnt}, Lost files count: {lost_cnt}"
    ));

    if lost_cnt > 0 {
        // 后台线程把缺失metadata的文件重新扫描到数据库中
        let _ = std::thread::spawn(move || {
            let start = std::time::Instant::now();
            log::log_info(&format!("Start scan lost files..."));
            let mut count = 0.0;
            for file_path in lost_files {
                let config = get_config();
                let music_dir = config.music_dir.clone();
                let start = std::time::Instant::now();
                if let Err(e) = readmeta::read_metadata_into_db(&file_path, &music_dir) {
                    log::log_info(&format!("path: {file_path}, read_meta error: {e:?}"));
                } else {
                    log::log_info(&format!("path: {file_path}, read_metad_into_db ok"));
                }

                count += 1.0;
                let elapsed = start.elapsed();
                println!(
                    "------ {}/{} done, progress: {:.2}%, cost: {:.2?} ------",
                    count,
                    lost_cnt,
                    count / lost_cnt as f64 * 100.0,
                    elapsed
                );
            }
            let elapsed = start.elapsed();
            log::log_info(&format!("Scan lost files done. Elapsed: {:.2?}", elapsed));
        });
    }
}

#[derive(Debug, Deserialize, Serialize, Clone)]
struct JsonResult<T: Serialize> {
    code: i32,
    success: bool,
    message: String,
    data: Option<T>,
}

impl<T: Serialize> JsonResult<T> {
    pub fn new(code: i32, success: bool, message: &str, data: Option<T>) -> Self {
        Self {
            code,
            success,
            message: message.to_string(),
            data,
        }
    }
    pub fn success(data: T) -> Self {
        Self::new(0, true, "success", Some(data))
    }

    pub fn error(message: &str) -> Self {
        Self::new(-1, false, message, None)
    }
    #[allow(dead_code)]
    pub fn default() -> Self {
        Self::new(0, true, "success", None)
    }
}
