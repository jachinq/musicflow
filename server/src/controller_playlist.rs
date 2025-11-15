use actix_web::{web, HttpResponse, Responder};
use lib_utils::database::service::{self, PlayList};
use serde::{Deserialize, Serialize};

use crate::{
    controller_song::{IntoVec, MetadataVo},
    JsonResult,
};

#[derive(Deserialize)]
pub struct AddPlayListRequest {
    song_ids: Vec<String>,
}

#[derive(Deserialize)]
pub struct GetPlayListRequest {
    page: Option<u32>,
    size: Option<u32>,
}
#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct ListMusic {
    list: Vec<MetadataVo>,
    total: u32,
    current_song: Option<MetadataVo>,
}

pub async fn handle_get_playlist(query: web::Json<GetPlayListRequest>) -> impl Responder {
    let play_lists = service::get_play_list(1);
    if let Ok(playlist) = play_lists {
        let current_song_id = playlist
            .iter()
            .find_map(|pl| {
                if pl.status == 1 {
                    Some(pl.song_id.clone())
                } else {
                    None
                }
            });

        // 分页
        let mut current_page = 1;
        let mut page_size = 10;
        if let Some(page) = query.page {
            current_page = page;
        }
        if let Some(page_size1) = query.size {
            page_size = page_size1;
        }
        // println!(
        //     "current_page: {}, page_size: {}, {:?}",
        //     current_page, page_size, query
        // );
        let total = playlist.len() as u32;

        let start = (current_page - 1) * page_size;
        let end = start + page_size;
        let end = end.min(total); // 防止超过总数
        let playlist_page = if end > start {
            playlist
                .get(start as usize..end as usize)
                .unwrap_or(&[])
                .to_vec()
        } else {
            playlist
        };

        let mut metalist = Vec::new();
        for pl in playlist_page {
            let song_id = pl.song_id.clone();
            if let Ok(Some(metadata)) = service::get_metadata_by_id(&song_id) {
                metalist.push(metadata);
            }
        }
        let list = metalist.into_vec();

        let current_song = if let Some(id) = current_song_id {
          match service::get_metadata_by_id(&id) {
              Ok(Some(metadata)) => {Some(MetadataVo::from(&metadata))},
              _ => None,
          }
        } else {
            None
        };

        HttpResponse::Ok().json(JsonResult::success(ListMusic { list, total, current_song }))
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
