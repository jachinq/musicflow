use actix_web::{web, HttpResponse, Responder};
use lib_utils::database::service::{self, Album};
use serde::{Deserialize, Serialize};

use crate::{IntoVec, JsonResult};

#[derive(Deserialize)]
pub struct AlbumsBody {
    page: Option<usize>,
    page_size: Option<usize>,
    filter_text: Option<String>,
}
#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct ListAlbumResponse {
    list: Vec<Album>,
    total: usize,
}

/* pub async fn handle_get_album(
    body: web::Json<AlbumsBody>,
    app_data: web::Data<crate::AppState>,
) -> impl Responder {
    // 分页
    let mut current_page = 1;
    let mut page_size = 10;
    if let Some(page) = body.page {
        current_page = page;
    }
    if let Some(page_size1) = body.page_size {
        page_size = page_size1;
    }

    let mut list = app_data.album_list.clone();
    if let Some(filter) = &body.filter_text {
        let filter = filter.to_lowercase();
        list.retain(|album| album.name.to_lowercase().contains(&filter));
    }

    let total = list.len();

    let start = (current_page - 1) * page_size;
    let end = start + page_size;
    let end = end.min(total); // 防止超过总数
    let list = list.get(start..end).unwrap_or(&[]).to_vec();
    HttpResponse::Ok().json(JsonResult::success(ListAlbumResponse { list, total }))
}

pub async fn handle_get_album_songs(
    album_name: web::Path<String>,
    app_data: web::Data<crate::AppState>,
) -> impl Responder {
    let list: Vec<Metadata> = app_data
        .music_map
        .clone()
        .into_iter()
        .filter(|(_, metadata)| metadata.album.to_string() == album_name.clone())
        .map(|(_, meta)| meta)
        .collect();
    HttpResponse::Ok().json(JsonResult::success(list))
}
 */
pub async fn handle_get_album(body: web::Json<AlbumsBody>) -> impl Responder {
    // 分页
    let mut current_page = 1;
    let mut page_size = 10;
    if let Some(page) = body.page {
        current_page = page;
    }
    if let Some(page_size1) = body.page_size {
        page_size = page_size1;
    }

    let albums = service::get_album_list();
    match albums {
        Ok(mut list) => {
            if let Some(filter) = &body.filter_text {
                let filter = filter.to_lowercase();
                list.retain(|album| album.name.to_lowercase().contains(&filter));
            }

            let total = list.len();

            let start = (current_page - 1) * page_size;
            let end = start + page_size;
            let end = end.min(total); // 防止超过总数
            let list = list.get(start..end).unwrap_or(&[]).to_vec();
            HttpResponse::Ok().json(JsonResult::success(ListAlbumResponse { list, total }))
        }
        Err(e) => HttpResponse::InternalServerError()
            .json(JsonResult::<()>::error(&format!("Error: {}", e))),
    }
}

pub async fn handle_get_album_songs(album_id: web::Path<i64>) -> impl Responder {
    let songs = service::album_songs(album_id.into_inner());
    if songs.is_err() {
        return HttpResponse::InternalServerError().json(JsonResult::<()>::error(&format!(
            "Error: {}",
            songs.err().unwrap()
        )));
    }
    HttpResponse::Ok().json(JsonResult::success(songs.unwrap().into_vec()))
}

pub async fn handle_get_album_by_id(id: web::Path<i64>) -> impl Responder {
    if let Ok(Some(album)) = service::album_by_id(id.into_inner()) {
        HttpResponse::Ok().json(JsonResult::success(album))
    } else {
        HttpResponse::NotFound().json(JsonResult::<()>::error("Album not found"))
    }
}
