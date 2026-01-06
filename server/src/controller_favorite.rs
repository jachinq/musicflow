use actix_web::{web, Responder};
use lib_utils::datasource::types::StarItemType;
use serde::{Deserialize, Serialize};

use crate::{AppState, JsonResult};

/// 收藏请求参数
#[derive(Debug, Deserialize)]
pub struct StarRequest {
    pub id: String,
    pub item_type: String, // "song", "album", "artist"
}

/// 处理收藏
pub async fn handle_star(
    data: web::Data<AppState>,
    req: web::Json<StarRequest>,
) -> Result<impl Responder, actix_web::Error> {
    let item_type = StarItemType::from_str(&req.item_type)
        .ok_or_else(|| actix_web::error::ErrorBadRequest("Invalid item_type"))?;

    data.data_source
        .star(&req.id, item_type)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(web::Json(JsonResult::success(())))
}

/// 处理取消收藏
pub async fn handle_unstar(
    data: web::Data<AppState>,
    req: web::Json<StarRequest>,
) -> Result<impl Responder, actix_web::Error> {
    let item_type = StarItemType::from_str(&req.item_type)
        .ok_or_else(|| actix_web::error::ErrorBadRequest("Invalid item_type"))?;

    data.data_source
        .unstar(&req.id, item_type)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(web::Json(JsonResult::success(())))
}

/// 获取收藏列表
pub async fn handle_get_starred(
    data: web::Data<AppState>,
) -> Result<impl Responder, actix_web::Error> {
    let starred = data
        .data_source
        .get_starred()
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(web::Json(JsonResult::success(starred)))
}

/// 检查是否已收藏
#[derive(Debug, Deserialize)]
pub struct IsStarredQuery {
    pub id: String,
    pub item_type: String,
}

pub async fn handle_is_starred(
    data: web::Data<AppState>,
    query: web::Query<IsStarredQuery>,
) -> Result<impl Responder, actix_web::Error> {
    let item_type = StarItemType::from_str(&query.item_type)
        .ok_or_else(|| actix_web::error::ErrorBadRequest("Invalid item_type"))?;

    let is_starred = data
        .data_source
        .is_starred(&query.id, item_type)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    #[derive(Serialize)]
    struct IsStarredResponse {
        is_starred: bool,
    }

    Ok(web::Json(JsonResult::success(IsStarredResponse {
        is_starred,
    })))
}
