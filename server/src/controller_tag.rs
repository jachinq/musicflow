use std::{collections::HashSet, sync::Mutex};

use actix_web::{web, HttpResponse, Responder};
use lib_utils::database::service;
use serde::{Deserialize, Serialize};

use crate::{AppState, JsonResult, MetadataVo};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Genre {
    id: i64,
    name: String,
}

pub async fn handle_get_tags(app: web::Data<AppState>) -> impl Responder {
    let music_map = app.music_map.clone();
    let mut genres = Vec::new();

    music_map.values().for_each(|m| {
        m.genres.iter().for_each(|g| genres.push(g.to_string()));
    });

    let mut set = HashSet::new();
    genres.iter().for_each(|g| {
        set.insert(g);
    });
    let genres = set
        .iter()
        .enumerate()
        .map(|(id, n)| Genre {
            id: id as i64 + 1,
            name: n.to_string(),
        })
        .collect::<Vec<_>>();

    HttpResponse::Ok().json(JsonResult::success(genres))
}

pub async fn handle_get_song_tags(
    song_id: web::Path<String>,
    app: web::Data<AppState>,
) -> impl Responder {
    let music_map = app.music_map.clone();
    let song_id = song_id.clone();
    if let Some(m) = music_map.get(&song_id) {
        let tags = m.genres.clone();
        HttpResponse::Ok().json(JsonResult::success(tags))
    } else {
        HttpResponse::Ok().json(JsonResult::<Vec<String>>::error("歌曲不存在"))
    }
}

#[derive(Serialize, Deserialize)]
pub struct QueryAddTagToMusic {
    song_id: String,
    tagname: String,
}

/// 对音乐进行分组打标签
pub async fn handle_add_song_tag(
    info: web::Json<QueryAddTagToMusic>,
    app: web::Data<Mutex<AppState>>,
) -> impl Responder {
    let song_id = info.song_id.clone();
    let tagname = info.tagname.clone();

    let app = app.as_ref().lock();
    if app.is_err() {
        return HttpResponse::Ok().json(JsonResult::<()>::error("服务器内部错误"));
    }
    let mut app = app.unwrap();

    // 判断歌曲是否存在
    let music_map = app.music_map.clone();
    let song = music_map.get(&song_id);
    if let None = song {
        return HttpResponse::Ok().json(JsonResult::<()>::error("歌曲不存在"));
    }
    let song = song.unwrap();
    let genres = song.genres.clone();
    if genres.iter().find(|g| *g == &tagname).is_some() {
        return HttpResponse::Ok().json(JsonResult::<()>::error("歌曲已有该标签"));
    }

    let new_genres = genres.join(",");
    // 判断标签是否已存在
    let exist_tags = service::set_metadata_genre(&new_genres, &song_id);
    if let Ok(_) = exist_tags {
        // 操作完后，拿到新的歌曲标签
        if let Ok(Some(m)) = service::get_metadata_by_id(&song_id) {
            let vo = MetadataVo::from(m);
            app.set_music(&song_id, vo.clone());
            return HttpResponse::Ok().json(JsonResult::success(vo));
        } else {
            return HttpResponse::Ok().json(JsonResult::<MetadataVo>::error("标签添加失败"));
        }
    } else {
        return HttpResponse::Ok().json(JsonResult::<MetadataVo>::error("标签添加失败"));
    }
}

// 删除歌曲标签
pub async fn handle_delete_song_tag(
    path: web::Path<(String, i64)>,
    app: web::Data<Mutex<AppState>>,
) -> impl Responder {
    let (song_id, tag_id) = path.into_inner();

    let app = app.as_ref().lock();
    if app.is_err() {
        return HttpResponse::Ok().json(JsonResult::<()>::error("服务器内部错误"));
    }
    let mut app = app.unwrap();

    if let Some(m) = app.music_map.get(&song_id) {
        let mut genres = m.genres.clone();
        if let Some(index) = genres.iter().position(|g| *g == tag_id.to_string()) {
            genres.remove(index);
        }
        let new_genres = genres.join(",");
        if let Ok(_) = service::set_metadata_genre(&new_genres, &song_id) {
            if let Ok(Some(m)) = service::get_metadata_by_id(&song_id) {
                let vo = MetadataVo::from(m);
                app.set_music(&song_id, vo.clone());
                return HttpResponse::Ok().json(JsonResult::success(vo));
            } else {
                return HttpResponse::Ok().json(JsonResult::<MetadataVo>::error("标签删除失败"));
            }
        } else {
            return HttpResponse::Ok().json(JsonResult::<MetadataVo>::error("标签删除失败"));
        }
    } else {
        return HttpResponse::Ok().json(JsonResult::<MetadataVo>::error("歌曲不存在"));
    }
}
