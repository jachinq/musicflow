use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};

use crate::{AppState, JsonResult};
use lib_utils::datasource::types::{AlbumInfo, Pagination};
use crate::adapters::unified_list_to_vo;

#[derive(Deserialize)]
pub struct AlbumsBody {
    page: Option<usize>,
    page_size: Option<usize>,
    filter_text: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct ListAlbumResponse {
    list: Vec<AlbumInfo>,
    total: usize,
}

pub async fn handle_get_album(app_data: web::Data<AppState>, pagination: web::Json<Pagination>) -> impl Responder {
    let albums = app_data.data_source.list_albums(pagination.into_inner()).await;
    match albums {
        Ok(list) => {
            let total = list.len();
            HttpResponse::Ok().json(JsonResult::success(ListAlbumResponse { list, total }))
        }
        Err(e) => HttpResponse::InternalServerError()
            .json(JsonResult::<()>::error(&format!("Error: {}", e))),
    }
}

pub async fn handle_get_album_songs(
    album_id: web::Path<String>,
    app_data: web::Data<AppState>,
) -> impl Responder {
    let songs = app_data
        .data_source
        .get_album_songs(&album_id.into_inner())
        .await;

    match songs {
        Ok(metadata_list) => {
            let vo_list = unified_list_to_vo(metadata_list);
            HttpResponse::Ok().json(JsonResult::success(vo_list))
        }
        Err(e) => HttpResponse::InternalServerError()
            .json(JsonResult::<()>::error(&format!("Error: {}", e))),
    }
}

pub async fn handle_get_album_by_id(
    id: web::Path<String>,
    app_data: web::Data<AppState>,
) -> impl Responder {
    let album = app_data
        .data_source
        .get_album_by_id(&id.into_inner())
        .await;

    match album {
        Ok(album_info) => HttpResponse::Ok().json(JsonResult::success(album_info)),
        Err(_) => HttpResponse::NotFound().json(JsonResult::<()>::error("Album not found")),
    }
}
