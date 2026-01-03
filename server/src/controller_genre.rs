use actix_web::{web, HttpResponse, Responder};
use lib_utils::database::service;
use serde::{Deserialize, Serialize};

use crate::{AppState, JsonResult, MetadataVo, adapters};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Genre {
    id: String,
    name: String,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct GenreList {
    list: Vec<Genre>,
}

pub async fn handle_get_genres(app_state: web::Data<AppState>) -> impl Responder {
    let genres = app_state.data_source.list_genres().await;
    if genres.is_err() {
        return HttpResponse::Ok().json(JsonResult::<()>::error("获取歌曲风格失败"));
    }
    let genres = genres.unwrap();
    let genres= genres.iter().map(|g| Genre {
        id: g.value.to_string(),
        name: g.value.to_string()
    }).collect::<Vec<_>>();
  
    HttpResponse::Ok().json(JsonResult::success(GenreList { list: genres }))
}

pub async fn handle_get_song_genres(
    song_id: web::Path<String>,
    app_state: web::Data<AppState>,
) -> impl Responder {
    let metadata = app_state.data_source.get_metadata(&song_id).await;
    if let Ok(metadata) = metadata {
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
pub async fn handle_add_song_genre(
    info: web::Json<QueryAddTagToMusic>,
    app_state: web::Data<AppState>,
) -> impl Responder {
    // 检查数据源类型,Subsonic 模式不支持修改 genre
    if !app_state.config.is_local_mode() {
        return HttpResponse::Ok()
            .json(JsonResult::<()>::error("仅支持本地数据源模式修改歌曲风格"));
    }

    let song_id = info.song_id.clone();
    let genre = info.genre.clone();

    // 本地模式:使用数据库服务修改
    let metadata = app_state.data_source.get_metadata(&song_id).await;
    if metadata.is_err() {
        return HttpResponse::Ok().json(JsonResult::<()>::error("歌曲不存在"));
    }
    let song = metadata.unwrap();

    let mut genres = song.split_genre();
    if genres.iter().find(|g| *g == &genre).is_some() {
        return HttpResponse::Ok().json(JsonResult::<()>::error("歌曲已有该风格"));
    }

    genres.push(genre.clone());
    let new_genres = genres.join(",");
    // 判断风格是否已存在
    let exist_tags = service::set_metadata_genre(&new_genres, &song_id);
    if let Ok(_) = exist_tags {
        // 操作完后,拿到新的歌曲风格
        if let Ok(m) = app_state.data_source.get_metadata(&song_id).await {
            return HttpResponse::Ok().json(JsonResult::success(adapters::unified_to_vo(m)));
        } else {
            return HttpResponse::Ok().json(JsonResult::<MetadataVo>::error("添加风格失败"));
        }
    } else {
        return HttpResponse::Ok().json(JsonResult::<MetadataVo>::error("添加风格失败"));
    }
}

// 删除歌曲风格
pub async fn handle_delete_song_genre(
    path: web::Path<(String, String)>,
    app_state: web::Data<AppState>,
) -> impl Responder {
    // 检查数据源类型,Subsonic 模式不支持修改 genre
    if !app_state.config.is_local_mode() {
        return HttpResponse::Ok()
            .json(JsonResult::<()>::error("仅支持本地数据源模式删除歌曲风格"));
    }

    let (song_id, genre) = path.into_inner();

    // 本地模式:使用数据库服务修改
    let metadata = app_state.data_source.get_metadata(&song_id).await;
    if metadata.is_err() {
        return HttpResponse::Ok().json(JsonResult::<()>::error("歌曲不存在"));
    }
    let song = metadata.unwrap();

    let mut genres = song.split_genre();
    if !genres.contains(&genre) {
        return HttpResponse::Ok().json(JsonResult::<()>::error("歌曲无该风格"));
    }

    if let Some(index) = genres.iter().position(|g| *g == genre.to_string()) {
        genres.remove(index);
    }
    let new_genres = genres.join(",");
    if let Ok(_) = service::set_metadata_genre(&new_genres, &song_id) {
        if let Ok(m) = app_state.data_source.get_metadata(&song_id).await {
            return HttpResponse::Ok().json(JsonResult::success(adapters::unified_to_vo(m)));
        } else {
            return HttpResponse::Ok().json(JsonResult::<MetadataVo>::error("风格删除失败"));
        }
    } else {
        return HttpResponse::Ok().json(JsonResult::<MetadataVo>::error("风格删除失败"));
    }
}

/// 根据风格获取歌曲列表
pub async fn handle_get_songs_by_genre(
    genre: web::Path<String>,
    app_state: web::Data<AppState>,
) -> impl Responder {
    use crate::adapters;

   let songs = app_state.data_source.get_genre_songs(&genre).await;
    if songs.is_err() {
        return HttpResponse::Ok().json(JsonResult::<()>::error("获取歌曲失败"));
    }
    let songs = songs.unwrap();

    // 转换为 VO
    let list = adapters::unified_list_to_vo(songs);

    HttpResponse::Ok().json(JsonResult::success(list))
}
