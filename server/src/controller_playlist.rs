use actix_web::{web, HttpResponse, Responder};
use lib_utils::{database::service::{self, PlayList}, datasource::types::Pagination};
use serde::{Deserialize, Serialize};

use crate::{
    AppState, JsonResult, adapters, controller_song::MetadataVo
};

#[derive(Deserialize)]
pub struct AddPlayListRequest {
    song_ids: Vec<String>,
}

#[derive(Deserialize)]
pub struct GetPlayListRequest {
    page: Option<usize>,
    size: Option<usize>,
}
#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct ListMusic {
    list: Vec<MetadataVo>,
    total: usize,
    current_song: Option<MetadataVo>,
}

pub async fn handle_get_playlist(
    query: web::Json<GetPlayListRequest>,
    app_state: web::Data<AppState>,
) -> impl Responder {
    let play_lists = service::get_play_list(1);
    if let Ok(playlist) = play_lists {
        let current_song_id = playlist.iter().find_map(|pl| {
            if pl.status == 1 {
                Some(pl.song_id.clone())
            } else {
                None
            }
        });

        // 分页
        let page = query.page.unwrap_or(1);
        let page_size = query.size.unwrap_or(10);
        let total = playlist.len();
        let pagination = Pagination::new(page, page_size);

        let start = pagination.safe_start(total);
        let end = pagination.end(total);
        let playlist_page = if page_size == 0 {
            playlist.to_vec()
        } else if end > start {
            playlist[start..end].to_vec()
        } else {
            vec![]
        };
        // println!(
        //     "current_page: {}, page_size: {}, len={}, page={}",
        //     page,
        //     page_size,
        //     total,
        //     playlist_page.len()
        // );

        let mut metalist = Vec::new();
        for pl in playlist_page {
            if let Ok(metadata) = app_state.data_source.get_metadata(&pl.song_id).await {
                metalist.push(metadata);
            }
        }
        let list = adapters::unified_list_to_vo(metalist);

        let current_song = if let Some(id) = current_song_id {
            match app_state.data_source.get_metadata(&id).await {
                Ok(metadata) => Some(adapters::unified_to_vo(metadata)),
                _ => None,
            }
        } else {
            None
        };

        HttpResponse::Ok().json(JsonResult::success(ListMusic {
            list,
            total,
            current_song,
        }))
    } else {
        HttpResponse::InternalServerError().json(JsonResult::<()>::error("PlayList not found"))
    }
}

pub async fn handle_add_playlist(list: web::Json<AddPlayListRequest>) -> impl Responder {
    let playlist = list
        .song_ids
        .iter()
        .map(|i| PlayList {
            user_id: 1,
            song_id: i.to_string(),
            status: 0,
            offset: 0,
        })
        .collect();

    match service::add_play_list(1, &playlist) {
        Ok(size) => HttpResponse::Ok().json(JsonResult::success(size)),
        Err(e) => HttpResponse::InternalServerError().json(JsonResult::<()>::error(&format!(
            "add playlist failed, error: {:?}",
            e
        ))),
    }
}

pub async fn handle_set_current(song_id: web::Path<String>) -> impl Responder {
    match service::set_play_list_status(1, &song_id, 1) {
        Ok(size) => HttpResponse::Ok().json(JsonResult::success(size)),
        Err(e) => HttpResponse::InternalServerError().json(JsonResult::<()>::error(&format!(
            "set current song failed, error: {:?}",
            e
        ))),
    }
}
