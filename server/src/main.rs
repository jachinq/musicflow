#![allow(dead_code)]

use actix_cors::Cors;
use actix_files::NamedFile;
use actix_web::middleware::Logger;
use actix_web::{web, App, HttpResponse, HttpServer, Responder};
use lib_utils::config::get_config;
use lib_utils::database::service::{self, Album, Metadata};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io;
use std::path::Path;
use walkdir::WalkDir; // 引入 CORS 中间件
use env_logger::Env;

mod controller_album;
mod controller_artist;
mod controller_song;
mod controller_songlist;
mod controller_tag;
mod controller_user;

use controller_album::*;
use controller_artist::*;
use controller_song::*;
use controller_songlist::*;
use controller_tag::*;
use controller_user::*;

// 应用状态
#[derive(Clone, Debug, Deserialize, Serialize, Default)]
struct AppState {
    web_path: String,
    music_path: String,
    music_map: HashMap<String, MetadataVo>, // 音乐 ID 到 Music 实例的映射表
    album_list: Vec<Album>,
}

impl AppState {
    fn set_music(&mut self, song_id: &str, metadata: MetadataVo) {
        self.music_map.insert(song_id.to_string(), metadata);
    }
}

#[actix_web::main]
async fn main() -> io::Result<()> {
    // 初始化日志记录
    env_logger::init_from_env(Env::default().default_filter_or("info"));
    // 读取配置文件信息
    let config = get_config();
    let web_dir = config.web_dir.clone();
    let ip = config.ip.clone();
    let port = config.port.clone();

    // 扫描音乐文件，构建音乐 ID 到 Music 实例的映射表
    let music_dir = config.music_dir.clone();
    // let music_dir = music_dir.replace("\\", "/");
    println!("Music dir: {}, Web dir: {}", music_dir, web_dir);

    let (music_map, album_list) = init_music_map(&music_dir).await;
    // 映射音乐文件的静态路径
    let music_path = "/music";

    println!("Server started on http://{}:{}", ip, port);
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
            .app_data(web::Data::new(AppState {
                web_path: web_dir.to_string(),
                music_path: music_path.to_string(),
                music_map: music_map.clone(),
                album_list: album_list.clone(),
            }))
            .route("/api/log", web::post().to(frontend_log))
            // 歌曲相关接口
            .route("/api/list", web::post().to(handle_get_metadatas))
            .route("/api/single/{song_id}", web::get().to(handle_get_metadata))
            .route("/api/cover/small/{song_id}", web::get().to(get_cover_small))
            .route(
                "/api/cover/medium/{song_id}",
                web::get().to(get_cover_medium),
            )
            .route("/api/lyrics/{song_id}", web::get().to(get_lyrics))
            // 标签相关接口
            .route("/api/tags", web::get().to(handle_get_tags))
            .route(
                "/api/song_tags/{song_id}",
                web::get().to(handle_get_song_tags),
            )
            .route("/api/add_tag_to_song", web::post().to(handle_add_song_tag))
            .route(
                "/api/delete_song_tag/{song_id}/{tag_id}",
                web::delete().to(handle_delete_song_tag),
            )
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
            .route("/api/album_by_id/{id}", web::get().to(handle_get_album_by_id))
            .route(
                "/api/album_songs/{album_name}",
                web::get().to(handle_get_album_songs),
            )
            // 艺术家相关接口
            .route("/api/artist", web::post().to(handle_get_artist))
            .route("/api/artist_by_id/{id}", web::get().to(handle_get_artist_by_id))
            .route(
                "/api/artist_songs/{artist_id}",
                web::get().to(handle_get_artist_songs),
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

async fn init_music_map(music_dir: &str) -> (HashMap<String, MetadataVo>, Vec<Album>) {
    // 初始化数据库
    let res = service::get_metadata_list();
    // print!("db result: {:?}", res);
    let metadata_list = res.unwrap_or_default();
    let mut path_metadata_map = HashMap::new();
    for metadata in metadata_list {
        path_metadata_map.insert(metadata.file_path.to_string(), metadata);
    }

    let mut music_map = HashMap::new();
    let mut album_list = Vec::new();
    for entry in WalkDir::new(music_dir).into_iter().filter_map(|e| e.ok()) {
        if entry.file_type().is_file() {
            let path = entry.path().display().to_string().replace("\\", "/");
            let metadata = path_metadata_map.get(&path);
            if metadata.is_none() {
                println!("Metadata not found for {}", path);
                continue;
            }
            let metadata = metadata.unwrap().clone();
            let metadata = MetadataVo::from(metadata);
            music_map.insert(metadata.id.to_string(), metadata);
        }
    }
    if let Ok(list) = service::get_album_list() {
        album_list = list.clone();
    }
    println!("Music count: {}", music_map.len());
    (music_map, album_list)
}

fn pick_metadata(list: &Vec<Metadata>, music_map: &HashMap<String, MetadataVo>) -> Vec<MetadataVo> {
    let musics: Vec<_> = music_map.values().cloned().collect();

    let ids: Vec<String> = list.into_iter().map(|s| s.id.clone()).collect();
    let list: Vec<_> = musics.into_iter().filter(|m| ids.contains(&m.id)).collect();
    list
}

// 前端日志记录
#[derive(Debug, Deserialize, Serialize, Clone, Default)]
struct FrontendLog {
    level: String,
    timestamp: String,
    message: String,
}

async fn frontend_log(log: web::Json<FrontendLog>) -> impl Responder {
    println!(
        "[frontend_log]: {} {} {}",
        log.level, log.timestamp, log.message
    );
    HttpResponse::Ok().json(log)
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
