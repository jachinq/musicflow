use std::path::Path;

use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};

use crate::AppState;

#[derive(Serialize, Deserialize)]
pub struct TagMusic {
    path: String,
    tags: Vec<String>,
}

/// 对音乐进行分组打标签
pub async fn tag_music(info: web::Json<TagMusic>, data: web::Data<AppState>) -> impl Responder {
    let music_path = Path::new(&data.music_path).join(&info.path);
    if music_path.exists() && music_path.is_file() {
        // 这里你可能需要修改 Music 实例，保存标签信息等
        HttpResponse::Ok().body("Tags added successfully")
    } else {
        HttpResponse::NotFound().body("Music not found")
    }
}
