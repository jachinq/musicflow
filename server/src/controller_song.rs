use actix_web::{web, HttpResponse, Responder};
use base64::Engine;
use serde::{Deserialize, Serialize};

use crate::{get_cover, get_lyric, get_tag_songs, AppState, Metadata};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct ListMusic {
    musics: Vec<Metadata>,
    total: u32,
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct MusicListQuery {
    page: Option<u32>,
    page_size: Option<u32>,
    filter: Option<String>,
    tag_ids: Option<Vec<i32>>,
}

/// 获取服务器上所有音乐文件
pub async fn list_musics(
    data: web::Data<AppState>,
    query: web::Json<MusicListQuery>,
) -> impl Responder {
    // let music_path = data.music_path.clone();
    let musics = data.music_map.values().cloned().collect::<Vec<Metadata>>();
    let mut musics = musics.clone();

    // 过滤
    if let Some(filter) = &query.filter {
        let filter = filter.to_lowercase();
        musics.retain(|m| {
            // m.tags.iter().any(|t| t.to_lowercase().contains(&filter)) ||
            m.title.to_lowercase().contains(&filter)
                || m.artist.to_lowercase().contains(&filter)
                || m.album.to_lowercase().contains(&filter)
        });
    }

    if let Some(tag_ids) = &query.tag_ids {
        // 根据标签查询
        let mut tag_song_ids = vec![];
        for tag_id in tag_ids {
            if let Ok(metadatas) = get_tag_songs(*tag_id).await {
                metadatas.iter().for_each(|m| {
                    tag_song_ids.push(m.id.to_string());
                });
            }
        }
        if tag_ids.len() > 0 {
            musics.retain(|m| tag_song_ids.contains(&m.id));
        }
    }

    // 分页
    let mut current_page = 1;
    let mut page_size = 10;
    if let Some(page) = query.page {
        current_page = page;
    }
    if let Some(page_size1) = query.page_size {
        page_size = page_size1;
    }
    // println!("current_page: {}, page_size: {}, {:?}", current_page, page_size, query);
    let total = musics.len() as u32;

    let start = (current_page - 1) * page_size;
    let end = start + page_size;
    let end = end.min(total); // 防止超过总数
    musics = musics
        .get(start as usize..end as usize)
        .unwrap_or(&[])
        .to_vec();

    HttpResponse::Ok().json(ListMusic { musics, total })
}

pub async fn get_cover_small(song_id: web::Path<String>) -> impl Responder {
    let cover = get_cover(&song_id).await;
    let default_cover = "UklGRpYBAABXRUJQVlA4IIoBAACQEgCdASrAAMAAP3G42GK0sayopLkoEpAuCWVu4QXUMQU4nn/pWmF9o0DPifE+JlGhgZqOyVZgoy7NXUtGklgA0aiSG2RF2Kbm5jQ3eoKwLpyF9R8oVd509SVeXb/tHglG1W4wL8vovtTUJhW/Jxy+Dz2kkbDPiXZ2AE9bwGmE/rM3PifIKeoZRVuuc6yX3BGpY5qSDk0eFGcLFyoAAP1V/+KHvw994S1rsgmSb8eM4Ys0mSvZP+IPrAhBml27fCTgPcHy1S6f9iSr6o2btNKixxetBHWT70dP+hIZITsA3mwH6GT6Jph31q2YsJASsCnDSmiO9ctjViN5bcVXcoIwwUZTu+9jQATMseG7OR/yl1R++egpeBnLRwGRtbdMgxlpe/+cJM8j1XCD0gwSVPZDBJ2Ke/IK/iCzWPuDO2Nw6aGgfb5Rbhor4l+4FDZjWdPVG9qP3AimXDGjWyUPw1fYuf4rBYVj4XiNln/QypsIcatiR5DVPn/YR0CBfMXURwr5Dg+721oAAAAA";

    let base64str = if let Ok(Some(cover)) = cover {
        cover.base64
    } else {
        println!("Cover not found for {}, cover: {:?}", song_id, cover);
        default_cover.to_string()
    };
    let base64str = if base64str.is_empty() {
        default_cover
    } else {
        &base64str
    };

    // 将base64编码的图片数据转换为二进制数据
    let engine = base64::engine::general_purpose::STANDARD;

    let data = engine.decode(base64str).unwrap_or_default();
    // let data = base64::decode(base64str).unwrap_or_default();
    // 返回图片数据
    HttpResponse::Ok().content_type("image/webp").body(data)
}

pub async fn get_lyrics(song_id: web::Path<String>) -> impl Responder {
    let lyrics = get_lyric(&song_id).await;

    let lyrics = if let Ok(lyrics) = lyrics {
        lyrics
    } else {
        println!("Lyrics not found for {}", song_id);
        vec![]
    };

    HttpResponse::Ok().json(lyrics)
}
