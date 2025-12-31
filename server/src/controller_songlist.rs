#![allow(dead_code, unused_variables)]

/// 歌单相关接口
use std::str;

use actix_web::{web, HttpResponse, Responder};
use serde::Deserialize;

use crate::{AppState, JsonResult};

pub async fn handle_song_list(data: web::Data<AppState>) -> impl Responder {
    let data_source = &data.data_source;
    let result = data_source.list_playlists().await;
    println!("handle_song_list. result:{:?}", result);

    match result {
        Ok(list) => HttpResponse::Ok().json(JsonResult::success(list)),
        Err(e) => HttpResponse::InternalServerError()
            .json(JsonResult::<()>::error(&format!("Error: {}", e))),
    }
}

pub async fn handle_song_list_songs(
    song_list_id: web::Path<String>,
    data: web::Data<AppState>,
) -> impl Responder {
    let data_source = &data.data_source;
    let result = data_source.get_playlist(&song_list_id.into_inner()).await;

    match result {
        Ok(playlist_detail) => {
            HttpResponse::Ok().json(JsonResult::success(playlist_detail.songs))
        }
        Err(e) => HttpResponse::InternalServerError()
            .json(JsonResult::<()>::error(&format!("Error: {}", e))),
    }
}

pub async fn handle_song_song_list(
    song_id: web::Path<String>,
    data: web::Data<AppState>,
) -> impl Responder {
    // 这个接口需要查询某个歌曲属于哪些歌单
    // 暂时使用原有的数据库实现
    use lib_utils::database::service;

    let result = service::get_song_song_list(&song_id.into_inner());
    match result {
        Ok(list) => HttpResponse::Ok().json(JsonResult::success(list)),
        Err(e) => HttpResponse::InternalServerError()
            .json(JsonResult::<()>::error(&format!("Error: {}", e))),
    }
}

pub async fn handle_delete_song_list(
    song_list_id: web::Path<String>,
    data: web::Data<AppState>,
) -> impl Responder {
    let data_source = &data.data_source;
    let result = data_source.delete_playlist(&song_list_id.into_inner()).await;

    match result {
        Ok(()) => HttpResponse::Ok().json(JsonResult::success(())),
        Err(e) => HttpResponse::Ok().json(JsonResult::<()>::error(&format!("Error: {}", e))),
    }
}

#[derive(Deserialize, Debug)]
pub struct CreateSongListBody {
    name: String,
    description: Option<String>,
}

pub async fn handle_create_song_list(
    body: web::Json<CreateSongListBody>,
    data: web::Data<AppState>,
) -> impl Responder {
    let data_source = &data.data_source;
    let body = body.into_inner();

    let result = data_source
        .create_playlist(&body.name, body.description.as_deref(), &[])
        .await;

    match result {
        Ok(playlist) => HttpResponse::Ok().json(JsonResult::success(playlist)),
        Err(e) => HttpResponse::Ok().json(JsonResult::<()>::error(&format!("Error: {}", e))),
    }
}

#[derive(Deserialize, Debug)]
pub struct UpdateSongListBody {
    id: String,
    name: Option<String>,
    description: Option<String>,
}

pub async fn handle_update_song_list(
    body: web::Json<UpdateSongListBody>,
    data: web::Data<AppState>,
) -> impl Responder {
    let data_source = &data.data_source;
    let body = body.into_inner();

    let result = data_source
        .update_playlist(
            &body.id,
            body.name.as_deref(),
            body.description.as_deref(),
            None,
        )
        .await;

    match result {
        Ok(()) => HttpResponse::Ok().json(JsonResult::success(())),
        Err(e) => HttpResponse::Ok().json(JsonResult::<()>::error(&format!("Error: {}", e))),
    }
}

pub async fn handle_remove_song_from_songlist(
    path: web::Path<(String, String)>,
    data: web::Data<AppState>,
) -> impl Responder {
    let (song_list_id, song_id) = path.into_inner();
    let data_source = &data.data_source;

    // 获取现有播放列表
    let playlist_result = data_source.get_playlist(&song_list_id).await;
    if let Err(e) = playlist_result {
        return HttpResponse::InternalServerError()
            .json(JsonResult::<()>::error(&format!("Error: {}", e)));
    }

    let playlist = playlist_result.unwrap();
    // 过滤掉要删除的歌曲
    let new_song_ids: Vec<String> = playlist
        .songs
        .into_iter()
        .filter(|s| s.id != song_id)
        .map(|s| s.id)
        .collect();

    let result = data_source
        .update_playlist(&song_list_id, None, None, Some(&new_song_ids))
        .await;

    match result {
        Ok(()) => HttpResponse::Ok().json(JsonResult::success(())),
        Err(e) => HttpResponse::Ok().json(JsonResult::<()>::error(&format!("Error: {}", e))),
    }
}

#[derive(Deserialize, Debug)]
pub struct SongListSongBody {
    song_list_id: String,
    song_ids: Vec<String>,
}

pub async fn handle_add_song_list_song(
    body: web::Json<SongListSongBody>,
    data: web::Data<AppState>,
) -> impl Responder {
    let data_source = &data.data_source;
    let body = body.into_inner();

    // 使用新的歌曲列表更新播放列表
    let result = data_source
        .update_playlist(&body.song_list_id, None, None, Some(&body.song_ids))
        .await;

    match result {
        Ok(()) => HttpResponse::Ok().json(JsonResult::success(body.song_ids.len())),
        Err(e) => HttpResponse::Ok().json(JsonResult::<()>::error(&format!("Error: {}", e))),
    }
}
