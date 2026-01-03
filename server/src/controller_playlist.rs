/// 和播放列表相关的接口，注意与歌单的接口区别，歌单接口在 controller_songlist.rs 中
use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};

use crate::{adapters, controller_song::MetadataVo, AppState, JsonResult};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct ListMusic {
    list: Vec<MetadataVo>,
    total: usize,
    current_song: Option<MetadataVo>,
}

/// 获取播放队列
pub async fn handle_get_play_queue(app_state: web::Data<AppState>) -> impl Responder {
    match app_state.data_source.get_play_queue().await {
        Ok(Some(queue)) => {
            let current_song = match queue.current_song {
                Some(v) => Some(adapters::unified_to_vo(v)),
                None => None,
            };
            return HttpResponse::Ok().json(JsonResult::success(ListMusic {
                total: queue.songs.len(),
                list: adapters::unified_list_to_vo(queue.songs),
                current_song,
            }));
        }
        Ok(None) => {
            HttpResponse::InternalServerError().json(JsonResult::<()>::error("PlayList not found"))
        }
        Err(e) => HttpResponse::InternalServerError().json(JsonResult::<()>::error(&format!(
            "get play queue failed, error: {:?}",
            e
        ))),
    }
}

#[derive(Deserialize)]
pub struct SavePlayQueueRequest {
    song_ids: Vec<String>,
    current_id: Option<String>,
    position: Option<u64>,
}

/// 保存播放队列
pub async fn handle_save_play_queue(
    request: web::Json<SavePlayQueueRequest>,
    app_state: web::Data<AppState>,
) -> impl Responder {
    let song_ids = request.song_ids.clone();
    let current_id = request.current_id.clone();
    let position = request.position;

    match app_state
        .data_source
        .save_play_queue(song_ids, current_id, position)
        .await
    {
        Ok(()) => HttpResponse::Ok().json(JsonResult::success("ok")),
        Err(e) => HttpResponse::InternalServerError().json(JsonResult::<()>::error(&format!(
            "save play queue failed, error: {:?}",
            e
        ))),
    }
}
