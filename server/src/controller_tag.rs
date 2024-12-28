use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};

use crate::{dbservice, JsonResult, SongTag, Tag};

pub async fn tags() -> impl Responder {
    let tags = crate::dbservice::get_tags().await;
    if let Ok(tags) = tags {
        HttpResponse::Ok().json(JsonResult::success(tags))
    } else {
        HttpResponse::Ok().json(JsonResult::<Vec<Tag>>::error("获取标签失败"))
    }
}

pub async fn song_tags(song_id: web::Path<String>) -> impl Responder {
    let tags = crate::dbservice::get_song_tags(&song_id).await;
    if let Ok(tags) = tags {
        HttpResponse::Ok().json(JsonResult::success(tags))
    } else {
        HttpResponse::Ok().json(JsonResult::<Vec<Tag>>::error("获取歌曲标签失败"))
    }
}

pub async fn tag_songs(tag_id: web::Path<i32>) -> impl Responder {
    let songs = crate::dbservice::get_tag_songs(*tag_id).await;
    if let Ok(songs) = songs {
        HttpResponse::Ok().json(JsonResult::success(songs))
    } else {
        HttpResponse::Ok().json(JsonResult::<Vec<SongTag>>::error("获取标签歌曲失败"))
    }
}

#[derive(Serialize, Deserialize)]
pub struct QueryAddTagToMusic {
    song_id: String,
    tag_ids: Vec<i32>,
}

/// 对音乐进行分组打标签
pub async fn add_tag_to_song(info: web::Json<QueryAddTagToMusic>) -> impl Responder {
    let song_id = info.song_id.clone();
    let tag_ids = info.tag_ids.clone();
    if let Ok(Some(_)) = dbservice::get_metadata_by_id(&song_id).await {
        let list = tag_ids
            .iter()
            .map(|tag_id| SongTag {
                song_id: song_id.clone(),
                tag_id: *tag_id,
            })
            .collect();

        if let Ok(size) = dbservice::add_song_tag(list).await {
            HttpResponse::Ok().json(JsonResult::success(size))
        } else {
            HttpResponse::Ok().json(JsonResult::<SongTag>::error("标签添加失败"))
        }
    } else {
        HttpResponse::Ok().json(JsonResult::<SongTag>::error("歌曲不存在"))
    }
}
