#![allow(dead_code, unused_variables)]
use actix_web::{web, HttpResponse, Responder};

use crate::{dbservice, JsonResult, SongList, SongListSong};

pub async fn handle_song_list() -> impl Responder {
    let result = dbservice::get_song_list().await;
    match result {
        Ok(list) => HttpResponse::Ok().json(JsonResult::<Vec<SongList>>::success(list)),
        Err(e) => HttpResponse::InternalServerError()
            .json(JsonResult::<()>::error(&format!("Error: {}", e))),
    }
}

pub async fn handle_song_list_songs(song_list_id: web::Path<i64>) -> impl Responder {
    let result = dbservice::get_song_list_songs(song_list_id.into_inner()).await;
    match result {
        Ok(list) => HttpResponse::Ok().json(JsonResult::success(list)),
        Err(e) => HttpResponse::InternalServerError()
            .json(JsonResult::<()>::error(&format!("Error: {}", e))),
    }
}

pub async fn handle_song_song_list(song_id: web::Path<String>) -> impl Responder {
    let result = dbservice::get_song_song_list(&song_id.into_inner()).await;
    match result {
        Ok(list) => HttpResponse::Ok().json(JsonResult::success(list)),
        Err(e) => HttpResponse::InternalServerError()
            .json(JsonResult::<()>::error(&format!("Error: {}", e))),
    }
}

pub async fn handle_delete_song_list(song_list_id: web::Path<i64>) -> impl Responder {
    let result = dbservice::delete_song_list(song_list_id.into_inner()).await;
    match result {
        Ok(_) => HttpResponse::Ok().json(JsonResult::<()>::success(())),
        Err(e) => HttpResponse::Ok().json(JsonResult::<()>::error(&format!("Error: {}", e))),
    }
}

pub async fn handle_create_song_list(song_list: web::Json<SongList>) -> impl Responder {
    let song_list = song_list.into_inner();
    let result = dbservice::add_song_list(&song_list).await;
    match result {
        Ok(_) => HttpResponse::Ok().json(JsonResult::<()>::success(())),
        Err(e) => HttpResponse::Ok().json(JsonResult::<()>::error(&format!("Error: {}", e))),
    }
}

pub async fn handle_update_song_list(song_list: web::Json<SongList>) -> impl Responder {
    let song_list = song_list.into_inner();
    let result = dbservice::update_song_list(&song_list).await;
    match result {
        Ok(size) => HttpResponse::Ok().json(JsonResult::success(size)),
        Err(e) => HttpResponse::Ok().json(JsonResult::<()>::error(&format!("Error: {}", e))),
    }
}

pub async fn handle_remove_song_from_songlist(path: web::Path<(i64, String)>) -> impl Responder {
    let (song_list_id, song_id) = path.into_inner();
    let result = dbservice::delete_song_list_song(song_list_id, &song_id).await;
    match result {
        Ok(_) => HttpResponse::Ok().json(JsonResult::<()>::success(())),
        Err(e) => HttpResponse::Ok().json(JsonResult::<()>::error(&format!("Error: {}", e))),
    }
}

pub async fn handle_add_song_to_song_list(path: web::Path<(i64, String)>) -> impl Responder {
    let (song_list_id, song_id) = path.into_inner();
    let song_list_song = SongListSong {
        song_list_id,
        song_id,
        user_id: 1,
        order_num: 0,
    };
    let result = dbservice::add_song_list_song(&song_list_song).await;
    match result {
        Ok(_) => HttpResponse::Ok().json(JsonResult::<()>::success(())),
        Err(e) => HttpResponse::Ok().json(JsonResult::<()>::error(&format!("Error: {}", e))),
    }
}
