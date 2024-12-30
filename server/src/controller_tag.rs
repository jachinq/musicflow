use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};

use crate::{dbservice, JsonResult, SongTag, Tag};

pub async fn handle_get_tags() -> impl Responder {
    let tags = crate::dbservice::get_tags().await;
    if let Ok(tags) = tags {
        HttpResponse::Ok().json(JsonResult::success(tags))
    } else {
        HttpResponse::Ok().json(JsonResult::<Vec<Tag>>::error("获取标签失败"))
    }
}

pub async fn handle_get_song_tags(song_id: web::Path<String>) -> impl Responder {
    let tags = crate::dbservice::get_song_tags(&song_id).await;
    if let Ok(tags) = tags {
        HttpResponse::Ok().json(JsonResult::success(tags))
    } else {
        HttpResponse::Ok().json(JsonResult::<Vec<Tag>>::error("获取歌曲标签失败"))
    }
}

// pub async fn tag_songs(tag_id: web::Path<i64>) -> impl Responder {
//     let songs = crate::dbservice::get_tag_songs(*tag_id).await;
//     if let Ok(songs) = songs {
//         HttpResponse::Ok().json(JsonResult::success(songs))
//     } else {
//         HttpResponse::Ok().json(JsonResult::<Vec<SongTag>>::error("获取标签歌曲失败"))
//     }
// }

#[derive(Serialize, Deserialize)]
pub struct QueryAddTagToMusic {
    song_id: String,
    tagname: String,
}

/// 对音乐进行分组打标签
pub async fn handle_add_song_tag(info: web::Json<QueryAddTagToMusic>) -> impl Responder {
    let song_id = info.song_id.clone();
    let tagname = info.tagname.clone();

    let exist_song = dbservice::get_metadata_by_id(&song_id).await;
    if exist_song.is_err() || exist_song.unwrap().is_none() {
        return HttpResponse::Ok().json(JsonResult::<SongTag>::error("歌曲不存在"));
    }

    // 判断标签是否已存在
    let exist_tags = dbservice::get_tags().await.unwrap_or_default();
    let exist_tag = exist_tags.iter().find(|t| t.name == tagname);
    let tag_id = match exist_tag {
        Some(tag) => tag.id,
        None => {
            // 先添加标签
            let new_tag = Tag {
                name: tagname,
                ..Default::default()
            };
            match dbservice::add_tag(&new_tag).await {
                Ok(id) => id,
                Err(_) => {
                    return HttpResponse::Ok().json(JsonResult::<SongTag>::error("标签添加失败"))
                }
            }
        }
    };

    // 再过滤掉当前歌曲已关联的标签
    let exist_song_tags = dbservice::get_song_tags(&song_id).await.unwrap_or_default();
    if exist_song_tags.iter().find(|t| t.id == tag_id).is_some() {
        return HttpResponse::Ok().json(JsonResult::<SongTag>::error("歌曲已有该标签"));
    }

    let song_id_get = song_id.clone();
    let list = vec![SongTag { song_id, tag_id }];

    if let Ok(_) = dbservice::add_song_tag(list).await {
        // 查新添加的标签
        let new_song_tags = dbservice::get_song_tags(&song_id_get).await.unwrap();
        HttpResponse::Ok().json(JsonResult::success(new_song_tags))
    } else {
        HttpResponse::Ok().json(JsonResult::<SongTag>::error("标签添加失败"))
    }
}

// 删除歌曲标签
pub async fn handle_delete_song_tag(path: web::Path<(String, i64)>) -> impl Responder {
    let (song_id, tag_id) = path.into_inner();

    if let Ok(_) = dbservice::delete_song_tag(&song_id, tag_id).await {
        // 操作完后，拿到新的歌曲标签
        let new_song_tags = dbservice::get_song_tags(&song_id).await.unwrap();
        HttpResponse::Ok().json(JsonResult::success(new_song_tags))
    } else {
        HttpResponse::Ok().json(JsonResult::<SongTag>::error("标签删除失败"))
    }
}