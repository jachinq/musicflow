use actix_web::{HttpResponse, Responder};
use lib_utils::{
    config::get_config,
    database::service::Album, log,
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
    log::log("info", "start scan music");
    HttpResponse::Ok().json(JsonResult::success(0))
}

pub async fn handle_scan_music_progress() -> impl Responder {
    
    HttpResponse::Ok().json(JsonResult::success(0))
}
