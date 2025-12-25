use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};

use crate::{AppState, JsonResult, adapters, controller_song::MetadataVo};
use lib_utils::datasource::types::Pagination;

#[derive(Deserialize)]
pub struct SearchQuery {
    q: String,                    // 搜索关键字
    page: Option<usize>,          // 页码(默认1)
    page_size: Option<usize>,     // 每页数量(默认30)
}

#[derive(Serialize)]
pub struct SearchResponse {
    songs: Vec<MetadataVo>,    // 音乐列表
    albums: Vec<lib_utils::datasource::types::AlbumInfo>,
    artists: Vec<lib_utils::datasource::types::ArtistInfo>,
    total_songs: usize,
    total_albums: usize,
    total_artists: usize,
}

pub async fn handle_search(
    query: web::Query<SearchQuery>,
    app_state: web::Data<AppState>,
) -> impl Responder {
    let keyword = query.q.trim();

    if keyword.is_empty() {
        return HttpResponse::BadRequest()
            .json(JsonResult::<()>::error("搜索关键字不能为空"));
    }

    let pagination = Pagination::new(
        query.page.unwrap_or(1),
        query.page_size.unwrap_or(30)
    );

    // 调用 DataSource 的 search 方法
    let result = app_state.data_source.search(keyword, pagination).await;

    match result {
        Ok(search_result) => {
            // 转换音乐列表为 VO
            let songs = adapters::unified_list_to_vo(search_result.songs);

            let response = SearchResponse {
                total_songs: songs.len(),
                total_albums: search_result.albums.len(),
                total_artists: search_result.artists.len(),
                songs,
                albums: search_result.albums,
                artists: search_result.artists,
            };

            HttpResponse::Ok().json(JsonResult::success(response))
        }
        Err(e) => HttpResponse::InternalServerError()
            .json(JsonResult::<()>::error(&e.to_string())),
    }
}
