use std::collections::HashSet;

use actix_web::{web, HttpResponse, Responder};
use lib_utils::database::service;
use serde::{Deserialize, Serialize};

use crate::{JsonResult, MetadataVo};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Genre {
    id: i64,
    name: String,
}

pub async fn handle_get_genres() -> impl Responder {
    let metadatas = service::get_metadata_list();
    if metadatas.is_err() {
        return HttpResponse::Ok().json(JsonResult::<()>::error("获取歌曲风格失败"));
    }

    let metadatas = metadatas.unwrap();
    let mut genres = Vec::new();
    metadatas.iter().for_each(|m| {
        m.split_genre()
            .iter()
            .for_each(|g| genres.push(g.to_string()));
    });

    let mut set = HashSet::new();
    genres.iter().for_each(|g| {
        set.insert(g);
    });
    let genres = set.iter().map(|n| n.to_string()).collect::<Vec<_>>();

    HttpResponse::Ok().json(JsonResult::success(genres))
}

pub async fn handle_get_song_genres(song_id: web::Path<String>) -> impl Responder {
    let metadata = service::get_metadata_by_id(&song_id);
    if let Ok(Some(metadata)) = metadata {
        let genres = metadata.split_genre();
        HttpResponse::Ok().json(JsonResult::success(genres))
    } else {
        HttpResponse::Ok().json(JsonResult::<()>::error("歌曲不存在"))
    }
}

#[derive(Serialize, Deserialize)]
pub struct QueryAddTagToMusic {
    song_id: String,
    genre: String,
}

/// 对音乐进行分组打风格
pub async fn handle_add_song_genre(info: web::Json<QueryAddTagToMusic>) -> impl Responder {
    let song_id = info.song_id.clone();
    let genre = info.genre.clone();

    let metadata = service::get_metadata_by_id(&song_id);
    if let Ok(Some(_)) = metadata {
    } else {
        return HttpResponse::Ok().json(JsonResult::<()>::error("歌曲不存在"));
    }
    let song = metadata.unwrap().unwrap();

    let mut genres = song.split_genre();
    if genres.iter().find(|g| *g == &genre).is_some() {
        return HttpResponse::Ok().json(JsonResult::<()>::error("歌曲已有该风格"));
    }

    genres.push(genre.clone());
    let new_genres = genres.join(",");
    // 判断风格是否已存在
    let exist_tags = service::set_metadata_genre(&new_genres, &song_id);
    if let Ok(_) = exist_tags {
        // 操作完后，拿到新的歌曲风格
        if let Ok(Some(m)) = service::get_metadata_by_id(&song_id) {
            let vo = MetadataVo::from(&m);
            return HttpResponse::Ok().json(JsonResult::success(vo));
        } else {
            return HttpResponse::Ok().json(JsonResult::<MetadataVo>::error("添加风格失败"));
        }
    } else {
        return HttpResponse::Ok().json(JsonResult::<MetadataVo>::error("添加风格失败"));
    }
}

// 删除歌曲风格
pub async fn handle_delete_song_genre(path: web::Path<(String, String)>) -> impl Responder {
    let (song_id, genre) = path.into_inner();

    let metadata = service::get_metadata_by_id(&song_id);
    if let Ok(Some(_)) = metadata {
    } else {
        return HttpResponse::Ok().json(JsonResult::<()>::error("歌曲不存在"));
    }
    let song = metadata.unwrap().unwrap();

    let mut genres = song.split_genre();
    if !genres.contains(&genre) {
        return HttpResponse::Ok().json(JsonResult::<()>::error("歌曲无该风格"));
    }

    if let Some(index) = genres.iter().position(|g| *g == genre.to_string()) {
        genres.remove(index);
    }
    let new_genres = genres.join(",");
    if let Ok(_) = service::set_metadata_genre(&new_genres, &song_id) {
        if let Ok(Some(m)) = service::get_metadata_by_id(&song_id) {
            let vo = MetadataVo::from(&m);
            return HttpResponse::Ok().json(JsonResult::success(vo));
        } else {
            return HttpResponse::Ok().json(JsonResult::<MetadataVo>::error("风格删除失败"));
        }
    } else {
        return HttpResponse::Ok().json(JsonResult::<MetadataVo>::error("风格删除失败"));
    }
}
