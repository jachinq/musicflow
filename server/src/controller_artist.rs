use actix_web::{web, HttpResponse, Responder};
use lib_utils::database::service::{self, Artist};
use serde::{Deserialize, Serialize};

use crate::{IntoVec, JsonResult};

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

    let albums = service::artists();
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

pub async fn handle_get_artist_songs(artist_id: web::Path<i64>) -> impl Responder {
    let songs = service::artist_songs(artist_id.into_inner());
    if songs.is_err() {
        return HttpResponse::InternalServerError().json(JsonResult::<()>::error(&format!(
            "Error: {}",
            songs.err().unwrap()
        )));
    }
    HttpResponse::Ok().json(JsonResult::success(songs.unwrap().into_vec()))
}

pub async fn handle_get_artist_by_id(id: web::Path<i64>) -> impl Responder {
    if let Ok(Some(artist)) = service::artist_by_id(id.into_inner()) {
        HttpResponse::Ok().json(JsonResult::success(artist))
    } else {
        HttpResponse::NotFound().json(JsonResult::<()>::error("Artist not found"))
    }
}

#[derive(Deserialize)]
pub struct SetArtistCoverBody {
    pub cover: String,
}
pub async fn handle_set_artist_cover(
    id: web::Path<i64>,
    body: web::Json<SetArtistCoverBody>,
) -> impl Responder {
    let cover = body.cover.clone();
    // if cover.is_empty() {
    //     return HttpResponse::BadRequest().json(JsonResult::<()>::error("图片不能为空，可以是链接或者base64编码字符串"));
    // }
    // 实现上传图片并保存到数据库
    if let Ok(size) = service::set_artist_cover(*id, &cover) {
        HttpResponse::Ok().json(JsonResult::success(format!("{}个歌手封面保存成功", size)))
    } else {
        HttpResponse::NotFound().json(JsonResult::<()>::error("找不到该歌手"))
    }
}
