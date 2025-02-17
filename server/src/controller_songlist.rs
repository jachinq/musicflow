#![allow(dead_code, unused_variables)]
use std::str;

use actix_web::{web, HttpResponse, Responder};
use lib_utils::database::service::{self, SongList, SongListSong};
use serde::Deserialize;

use crate::{IntoVec, JsonResult};

pub async fn handle_song_list() -> impl Responder {
    let result = service::get_song_list();
    match result {
        Ok(list) => HttpResponse::Ok().json(JsonResult::<Vec<SongList>>::success(list)),
        Err(e) => HttpResponse::InternalServerError()
            .json(JsonResult::<()>::error(&format!("Error: {}", e))),
    }
}

pub async fn handle_song_list_songs(song_list_id: web::Path<i64>) -> impl Responder {
    let result = service::get_song_list_songs(song_list_id.into_inner());
    if result.is_err() {
        println!(
            "<handle_song_list_songs>get_song_list_songs error: {}",
            result.err().unwrap()
        );
        return HttpResponse::InternalServerError().json(JsonResult::<()>::error("检查歌单失败"));
    }
    HttpResponse::Ok().json(JsonResult::success(result.unwrap().into_vec()))
}

pub async fn handle_song_song_list(song_id: web::Path<String>) -> impl Responder {
    let result = service::get_song_song_list(&song_id.into_inner());
    match result {
        Ok(list) => HttpResponse::Ok().json(JsonResult::success(list)),
        Err(e) => HttpResponse::InternalServerError()
            .json(JsonResult::<()>::error(&format!("Error: {}", e))),
    }
}

pub async fn handle_delete_song_list(song_list_id: web::Path<i64>) -> impl Responder {
    let result = service::delete_song_list(song_list_id.into_inner());
    match result {
        Ok(size) => HttpResponse::Ok().json(JsonResult::success(size)),
        Err(e) => HttpResponse::Ok().json(JsonResult::<()>::error(&format!("Error: {}", e))),
    }
}

pub async fn handle_create_song_list(song_list: web::Json<SongList>) -> impl Responder {
    let song_list = song_list.into_inner();
    let result = service::add_song_list(&song_list);
    match result {
        Ok(_) => HttpResponse::Ok().json(JsonResult::<()>::success(())),
        Err(e) => HttpResponse::Ok().json(JsonResult::<()>::error(&format!("Error: {}", e))),
    }
}

pub async fn handle_update_song_list(song_list: web::Json<SongList>) -> impl Responder {
    let song_list = song_list.into_inner();
    let result = service::update_song_list(&song_list);
    match result {
        Ok(size) => HttpResponse::Ok().json(JsonResult::success(size)),
        Err(e) => HttpResponse::Ok().json(JsonResult::<()>::error(&format!("Error: {}", e))),
    }
}

pub async fn handle_remove_song_from_songlist(path: web::Path<(i64, String)>) -> impl Responder {
    let (song_list_id, song_id) = path.into_inner();
    let result = service::delete_song_list_song(song_list_id, &song_id);
    match result {
        Ok(_) => HttpResponse::Ok().json(JsonResult::<()>::success(())),
        Err(e) => HttpResponse::Ok().json(JsonResult::<()>::error(&format!("Error: {}", e))),
    }
}

#[derive(Deserialize, Debug)]
pub struct SongListSongBody {
    song_list_id: i64,
    song_ids: Vec<String>,
}
pub async fn handle_add_song_list_song(body: web::Json<SongListSongBody>) -> impl Responder {
    let body = body.into_inner();
    if body.song_list_id <= 0 {
        return HttpResponse::BadRequest().json(JsonResult::<()>::error("歌单id错误"));
    }
    // println!("body: {:?}", body);
    let songs = service::get_song_list_songs(body.song_list_id);
    if songs.is_err() {
        println!(
            "<handle_add_song_list_song>get_song_list_songs error: {}",
            songs.err().unwrap()
        );
        return HttpResponse::InternalServerError().json(JsonResult::<()>::error("检查歌单失败"));
    }
    let songs = songs.unwrap();
    let song_ids = songs.iter().map(|s| s.id.clone()).collect::<Vec<_>>();
    // 过滤掉已经存在的歌曲，只添加不存在的歌曲
    let diff_add = body
        .song_ids
        .iter()
        .filter(|id| !song_ids.contains(id))
        .collect::<Vec<_>>();
    // exist 1 2 3 4 5
    // body 3 4 5 6 7 8
    // diff_add 6 7 8
    // diff_remove 1 2
    let diff_remove = song_ids
        .iter()
        .filter(|id| !body.song_ids.contains(id))
        .collect::<Vec<_>>();

    let song_list_song = body
        .song_ids
        .iter()
        .map(|id| SongListSong {
            song_list_id: body.song_list_id,
            song_id: id.to_string(),
            user_id: 1,
            order_num: 0,
        })
        .collect::<Vec<_>>();
    // println!("song_list_song: {:?}", song_list_song);
    let result = service::add_song_list_song(body.song_list_id, &song_list_song);
    match result {
        Ok(size) => {
            HttpResponse::Ok().json(JsonResult::success(diff_add.len() + diff_remove.len()))
        }
        Err(e) => HttpResponse::Ok().json(JsonResult::<()>::error(&format!("Error: {}", e))),
    }
}
