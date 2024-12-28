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
    let music_path = data.music_path.clone();
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
    let default_cover = "UklGRggDAABXRUJQVlA4IPwCAAAwGgCdASqAAIAAP3GqyFy0rLsmKxRsw2AuCU20SyTUF69PjGpQdYlQVA3J+SRShYBVUl8iHKN5gCO2/owbthxIT7L/ldjtjIglUOlLb0VKvHdhfgQIRJNhdK2WeV//0G9Lf8fgkaJKIOsop3YT7i4A/FO974g72iagMyv98SdaQeQO3xLViJxqs/xXLXffVURZnUiqmwwbNpg9RZ4Hhc550zDfSgphm93VNw0JEz9FjYlFem3Q3wpYwnYP9Mnl45fClrHHMxw2XTgffylmB7vC4mDoghKMxPjYgAD+wu/b1l2vEtOCjp5W0JQ4NPrFm6WzlipzMgSbBAb5ILVwkL4zlm+3qcZPInlx/bQ1xeG/d3Wdu44ZOXIm06NTzjgjY8oX6IWqNTthXAZmxs0Sr10AVpltpQb2XGy1brDwS1PzKPSJri2854/HQFJJiWOZiTkpng38VmFdimDQQF3TUhpeXEtxb9UIbJhkn9Y0DHffAWe/SQLiUIktNrdw/Hl5iSmSrMRPmfMd6ko81qf9uYgETwoC8j4GOYrZg0VEtlHUqfOJYkmN6xRAJl+0uEJPBX67pe0dd4I2pSiEXbotVOTi24J1tb9JA3uAPCwNPL/141vC/hpMw8j/H2aKTuyow54G+oMcsoCC2sE7kX33/V2d01OzdgLaUCWWYHeRtXpb51aYt4qhF52ojRWAZL2sNOSu73qB8TFtFxbgZuX/9Zwc+cls/b7iEaDtMsfas+iCoPlNGPH9mLb1c+U+mGhSHww0p9h053PezDAvhOd08ty3cifhmhJGQuzgH7kN7Sonq9zQ/uCunXmTYhnbL8vF07zlIpXP8ZS73MRlgfWuA0AiYWSt3Obi1hp+naWD4it/lkxw16BXS8TgX+Ub7zmVIPCHBYpbuiYgheZ+beYlVhqZzikZbUJ1+7kM0dO8gXFTNp98jpAYQyHqMaNrnl6vddU58X3VLSQIw2uLbcT2iyD9fjXXlJhGA/qMYraKYzPHNOx2du+4Wuf0UIAAAA==";

    let base64str = if let Ok(Some(cover)) = cover {
        cover.base64
    } else {
        println!("Cover not found for {}, cover: {:?}", song_id, cover);
        default_cover.to_string()
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
