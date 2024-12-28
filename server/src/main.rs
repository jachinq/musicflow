use actix_cors::Cors;
use actix_web::middleware::Logger;
use actix_web::{web, App, HttpResponse, HttpServer, Responder};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io;
use walkdir::WalkDir; // 引入 CORS 中间件

mod controller_playlist;
mod controller_song;
mod controller_tag;
mod controller_user;
mod dbservice;

use controller_song::*;
use controller_playlist::*;
use controller_tag::*;
use controller_user::*;
use dbservice::*;

struct AppState {
    music_path: String,
    music_map: HashMap<String, Metadata>,
}

#[actix_web::main]
async fn main() -> io::Result<()> {
    // 从 conf/config.json 中读取配置信息，获取启动端口和音乐文件存放路径
    let config_path = "./conf/config.json";
    let config = std::fs::read_to_string(config_path).unwrap();
    let config: serde_json::Value = serde_json::from_str(&config).unwrap();
    let ip = config["ip"].as_str().unwrap() as &str;
    let port = config["port"].as_u64().unwrap() as u16;
    println!("Server listening on port: {}", port);

    // 扫描音乐文件，构建音乐 ID 到 Music 实例的映射表
    let music_dir = config["music_dir"].as_str().unwrap().to_string();
    // let music_dir = music_dir.replace("\\", "/");
    println!("Music dir: {}", music_dir);

    let music_map = init_music_map(&music_dir).await;

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
                music_path: music_dir.to_string(),
                music_map: music_map.clone(),
            }))
            .route("/api/list", web::get().to(list_musics))
            .route("/api/detail/{path}", web::get().to(get_music_link))
            .route("/tag", web::post().to(tag_music))
            .route("/api/log", web::post().to(frontend_log))
            .route("/api/cover/small/{path}", web::get().to(get_cover_small))
            .route("/api/lyrics/{path}", web::get().to(get_lyrics))
            // 添加静态文件服务
            .service(actix_files::Files::new("/music", &music_dir).show_files_listing())
            .service(actix_files::Files::new("/", "./web/dist").index_file("index.html"))
    })
    .bind(&format!("{}:{}", ip, port))?
    .run()
    .await
}

async fn init_music_map(music_dir: &str) -> HashMap<String, Metadata> {
    // 初始化数据库
    let res = get_metadata_list().await;
    // print!("db result: {:?}", res);
    let metadata_list = res.unwrap_or_default();
    let mut path_metadata_map = HashMap::new();
    for metadata in metadata_list {
        path_metadata_map.insert(metadata.file_path.to_string(), metadata);
    }


    let mut music_map = HashMap::new();
    for entry in WalkDir::new(music_dir).into_iter().filter_map(|e| e.ok()) {
        if entry.file_type().is_file() {
            let ext = entry.path().extension().unwrap_or_default();
            if ext != "mp3" && ext != "flac" {
                continue;
            }
            let path = entry.path().display().to_string();
            let metadata = path_metadata_map.get(&path);
            if metadata.is_none() {
                println!("Metadata not found for {}", path);
                continue;
            }
            let mut metadata = metadata.unwrap().clone();
            let url = metadata.file_url.replace("\\", "/");
            metadata.file_url = format!("/music{}", url);
            music_map.insert(metadata.id.to_string(), metadata.clone());
        }
    }
    println!("Music count: {}", music_map.len());
    music_map
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