use actix_web::{web, HttpResponse, Responder};
use lib_utils::{
    database::service::{self, Album},
    log,
};
use serde::{Deserialize, Serialize};

use crate::{AppState, JsonResult};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct ListAlbumResponse {
    list: Vec<Album>,
    total: usize,
}

pub async fn handle_scan_music(app_state: web::Data<AppState>) -> impl Responder {
    match app_state.data_source.scan_music().await {
        Ok(_) => HttpResponse::Ok().json(JsonResult::success(0)),
        Err(e) => HttpResponse::InternalServerError()
            .json(JsonResult::<()>::error(&format!("Error: {}", e))),
    }
}

pub async fn handle_scan_status(app_state: web::Data<AppState>) -> impl Responder {
    match app_state.data_source.scan_status().await {
        Ok(progress) => HttpResponse::Ok().json(JsonResult::success(progress)),
        Err(e) => HttpResponse::InternalServerError()
            .json(JsonResult::<()>::error(&format!("Error: {}", e))),
    }
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
