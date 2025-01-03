use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};

use crate::{dbservice, pick_metadata, Artist, JsonResult};

#[derive(Deserialize)]
pub struct ArtistBody {
    page: Option<usize>,
    page_size: Option<usize>,
    filter_text: Option<String>,
}
#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct ListArtistResponse {
    list: Vec<Artist>,
    total: usize,
}

pub async fn handle_get_artist(body: web::Json<ArtistBody>) -> impl Responder {
    // 分页
    let mut current_page = 1;
    let mut page_size = 10;
    if let Some(page) = body.page {
        current_page = page;
    }
    if let Some(page_size1) = body.page_size {
        page_size = page_size1;
    }

    let albums = dbservice::artist().await;
    if albums.is_err() {
        return HttpResponse::InternalServerError().json(JsonResult::<()>::error(&format!(
            "Error: {}",
            albums.err().unwrap()
        )));
    }
    let mut list = albums.unwrap();
    if let Some(filter_text) = &body.filter_text {
        list.retain(|a| a.name.contains(filter_text));
    }

    let total = list.len();

    let start = (current_page - 1) * page_size;
    let end = start + page_size;
    let end = end.min(total); // 防止超过总数
    let list = list.get(start..end).unwrap_or(&[]).to_vec();
    HttpResponse::Ok().json(JsonResult::success(ListArtistResponse { list, total }))
}

pub async fn handle_get_artist_songs(
    artist_id: web::Path<i64>,
    app_data: web::Data<crate::AppState>,
) -> impl Responder {
    let songs = dbservice::artist_songs(artist_id.into_inner()).await;
    match songs {
        Ok(list) => HttpResponse::Ok().json(JsonResult::success(pick_metadata(
            &list,
            &app_data.music_map,
        ))),
        Err(e) => HttpResponse::InternalServerError()
            .json(JsonResult::<()>::error(&format!("Error: {}", e))),
    }
}

pub async fn handle_get_artist_by_id(id: web::Path<i64>) -> impl Responder {
    if let Ok(Some(artist)) = dbservice::artist_by_id(id.into_inner()).await {
        HttpResponse::Ok().json(JsonResult::success(artist))
    }
    else {
        HttpResponse::NotFound().json(JsonResult::<()>::error("Artist not found"))
    }
}