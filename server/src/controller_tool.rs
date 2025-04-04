use actix_web::{web, HttpResponse, Responder};
use lib_utils::{
    config::get_config,
    database::service::{self, Album},
    log,
};
use serde::{Deserialize, Serialize};

use crate::{check_lost_file, JsonResult};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct ListAlbumResponse {
    list: Vec<Album>,
    total: usize,
}

pub async fn handle_scan_music() -> impl Responder {
    let config = get_config();
    check_lost_file(&config.music_dir).await;
    log::log_info("start scan music");
    HttpResponse::Ok().json(JsonResult::success(0))
}

pub async fn handle_scan_music_progress() -> impl Responder {
    HttpResponse::Ok().json(JsonResult::success(0))
}

// 前端日志记录
#[derive(Debug, Deserialize, Serialize, Clone, Default)]
pub struct FrontendLog {
    level: String,
    timestamp: String,
    message: String,
}

pub async fn frontend_log(log: web::Json<FrontendLog>) -> impl Responder {
    log::log_info(&format!(
        "[frontend_log]: {} {} {}",
        log.level, log.timestamp, log.message
    ));
    HttpResponse::Ok().json(log)
}

pub async fn handle_delete_meta(song_id: web::Path<String>) -> impl Responder {
    log::log_info(&format!("delete meta: {}", song_id));
    match service::del_metadata_by_id(&song_id) {
        Ok(size) => HttpResponse::Ok().json(JsonResult::success(format!("影响行数: {size}"))),
        Err(e) => HttpResponse::InternalServerError()
            .json(JsonResult::<()>::error(&format!("Error: {}", e))),
    }
}
