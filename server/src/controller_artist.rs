use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};

use crate::{adapters::unified_list_to_vo, AppState, JsonResult};
use lib_utils::datasource::types::ArtistInfo;

#[derive(Deserialize)]
pub struct ArtistBody {
    page: Option<usize>,
    page_size: Option<usize>,
    filter_text: Option<String>,
}
#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct ListArtistResponse {
    list: Vec<ArtistInfo>,
    total: usize,
}

pub async fn handle_get_artist(
    app_data: web::Data<AppState>,
    body: web::Json<ArtistBody>,
) -> impl Responder {
    // 获取艺术家列表
    let artists = app_data.data_source.list_artists().await;
    match artists {
        Ok(mut list) => {
            // 应用过滤
            if let Some(filter_text) = &body.filter_text {
                list.retain(|a| a.name.contains(filter_text));
            }

            let total = list.len();

            // 应用分页
            let current_page = body.page.unwrap_or(1);
            let page_size = body.page_size.unwrap_or(10);
            let start = (current_page - 1) * page_size;
            let end = (start + page_size).min(total);
            let list = list.get(start..end).unwrap_or(&[]).to_vec();

            HttpResponse::Ok().json(JsonResult::success(ListArtistResponse { list, total }))
        }
        Err(e) => HttpResponse::InternalServerError()
            .json(JsonResult::<()>::error(&format!("Error: {}", e))),
    }
}

pub async fn handle_get_artist_songs(
    artist_id: web::Path<String>,
    app_data: web::Data<AppState>,
) -> impl Responder {
    let songs = app_data
        .data_source
        .get_artist_songs(&artist_id.into_inner())
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

pub async fn handle_get_artist_by_id(
    id: web::Path<String>,
    app_data: web::Data<AppState>,
) -> impl Responder {
    let artist = app_data
        .data_source
        .get_artist_by_id(&id.into_inner())
        .await;

    match artist {
        Ok(artist_info) => HttpResponse::Ok().json(JsonResult::success(artist_info)),
        Err(_) => HttpResponse::NotFound().json(JsonResult::<()>::error("Artist not found")),
    }
}

#[derive(Deserialize)]
pub struct SetArtistCoverBody {
    pub cover: String,
}

/// 设置艺术家封面
/// 注意: 此功能仅适用于本地数据源,Subsonic 数据源不支持修改封面
pub async fn handle_set_artist_cover(
    id: web::Path<i64>,
    body: web::Json<SetArtistCoverBody>,
) -> impl Responder {
    use lib_utils::database::service;

    let cover = body.cover.clone();
    // if cover.is_empty() {
    //     return HttpResponse::BadRequest().json(JsonResult::<()>::error("图片不能为空,可以是链接或者base64编码字符串"));
    // }
    // 实现上传图片并保存到数据库
    if let Ok(size) = service::set_artist_cover(*id, &cover) {
        HttpResponse::Ok().json(JsonResult::success(format!("{}个歌手封面保存成功", size)))
    } else {
        HttpResponse::NotFound().json(JsonResult::<()>::error("找不到该歌手"))
    }
}
