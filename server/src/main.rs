use actix_web::middleware::Logger;
use actix_web::{web, App, HttpResponse, HttpServer, Responder};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io;
use std::path::Path;
use walkdir::WalkDir;
use actix_cors::Cors; // 引入 CORS 中间件
// use music_metadata::get_format;
mod metadata_reader;
use metadata_reader::*;

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Music {
    id: String,
    name: String,
    path: String,
    tags: Vec<String>,
    metadata: MusicMetadata,
}

#[derive(Serialize, Deserialize)]
struct TagMusic {
    path: String,
    tags: Vec<String>,
}

#[derive(Serialize)]
struct MusicList {
    musics: Vec<Music>,
}

/// 获取服务器上所有音乐文件
async fn list_musics(data: web::Data<AppState>) -> impl Responder {
    let musics = data.music_map.values().cloned().collect::<Vec<Music>>();
    HttpResponse::Ok().json(MusicList { musics })
}

/// 根据音乐 ID 返回音乐文件的链接
async fn get_music_link(path: web::Path<String>, data: web::Data<AppState>) -> impl Responder {
    let path = path.into_inner();
    println!("get_music_link: {}", path);

    data.music_map.get(&path).map(|m| {
        HttpResponse::Ok().json(m)
    }).unwrap_or(HttpResponse::NotFound().body("Music not found"))
}

/// 对音乐进行分组打标签
async fn tag_music(info: web::Json<TagMusic>, data: web::Data<AppState>) -> impl Responder {
    let music_path = Path::new(&data.music_path).join(&info.path);
    if music_path.exists() && music_path.is_file() {
        // 这里你可能需要修改 Music 实例，保存标签信息等
        HttpResponse::Ok().body("Tags added successfully")
    } else {
        HttpResponse::NotFound().body("Music not found")
    }
}

struct AppState {
    music_path: String,
    music_map: HashMap<String, Music>,
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
    let music_dir = music_dir.replace("\\", "/");
    println!("Music dir: {}", music_dir);

    let mut music_map = HashMap::new();

    for entry in WalkDir::new(&music_dir)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        if entry.file_type().is_file() {
            let ext = entry.path().extension().unwrap_or_default();
            if ext != "mp3" && ext != "flac" {
                continue;
            }
            let file_name = entry.file_name().to_string_lossy().to_string();
            let path = entry.path().display().to_string();
            // Windows 下的路径 \\ 转为 /
            let path = path.replace("\\", "/");
            let path = path.replace(&music_dir, ""); // 去掉音乐路径前缀
            let id = format!("{}{}", file_name, path.len());

            // 读取元数据
            // let metadata = read_metadata(&entry.path().display().to_string()).unwrap_or_else(|_| MusicMetadata {
            //     title: None,
            //     artist: None,
            //     lyrics: None,
            //     cover: None,
            // });
            let metadata= MusicMetadata::default();

            music_map.insert(id.to_string(), Music {
                id,
                name: file_name,
                path,
                tags: vec![],
                metadata,
            });
        }
    }
    println!("Music count: {}", music_map.len());

    // 启动 HTTP 服务
    HttpServer::new(move || {
        App::new()
        .wrap(Cors::default() // 添加 CORS 中间件
            .allow_any_origin() // 允许所有来源的跨域请求，你可以根据需要更改为特定的域名
            .allow_any_method() // 允许所有方法，如 GET, POST, PUT, DELETE 等
            .allow_any_header() // 允许所有请求头，你可以根据需要更改为特定的请求头
        )
        .wrap(Logger::default()) // 日志记录中间件
        .app_data(web::Data::new(AppState {
            music_path: music_dir.to_string(),
            music_map: music_map.clone(),
        }))
        .route("/musics", web::get().to(list_musics))
        .route("/music-detail/{path}", web::get().to(get_music_link))
        .route("/tag", web::post().to(tag_music))
        // 添加静态文件服务
        .service(actix_files::Files::new("/music", &music_dir).show_files_listing()) 
        .service(actix_files::Files::new("/", "./web/dist").show_files_listing())
    })
    .bind(&format!("{}:{}", ip, port))?
    .run()
    .await
}
