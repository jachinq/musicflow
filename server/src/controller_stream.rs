use actix_web::{web, HttpRequest, HttpResponse, Result as ActixResult};
use futures::StreamExt;
use lib_utils::log;

use crate::AppState;

/// 代理音频流请求到数据源
pub async fn stream_song(
    song_id: web::Path<String>,
    req: HttpRequest,
    app_state: web::Data<AppState>,
) -> ActixResult<HttpResponse> {
    log::log_info(&format!("Stream request for song: {}", song_id));

    // 获取客户端的 Range 请求头(用于断点续传)
    let range_header = req
        .headers()
        .get("Range")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());

    if let Some(ref range) = range_header {
        log::log_info(&format!("Range request: {}", range));
    }

    // 从数据源获取音频流
    let response = app_state
        .data_source
        .stream_song(&song_id, range_header)
        .await
        .map_err(|e| {
            log::log_err(&format!("Failed to stream song {}: {:?}", song_id, e));
            actix_web::error::ErrorInternalServerError(format!("Failed to stream song: {}", e))
        })?;

    // 获取响应状态码
    let status = response.status();
    log::log_info(&format!("Subsonic response status: {}", status));

    // 构建响应
    let mut builder = HttpResponse::build(status);

    // 复制重要的响应头
    for (key, value) in response.headers() {
        let key_str = key.as_str();
        if matches!(
            key_str,
            "content-type"
                | "content-length"
                | "content-range"
                | "accept-ranges"
                | "cache-control"
                | "etag"
                | "last-modified"
        ) {
            builder.insert_header((key.clone(), value.clone()));
        }
    }

    // 流式传输响应体
    let stream = response.bytes_stream().map(|result| {
        result.map_err(|e| {
            log::log_err(&format!("Stream error: {:?}", e));
            actix_web::error::ErrorInternalServerError(e)
        })
    });

    Ok(builder.streaming(stream))
}
