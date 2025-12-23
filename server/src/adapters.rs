// 数据适配器 - 将 datasource 层的数据类型转换为 controller 层的 VO 类型

use lib_utils::datasource::types::*;
use crate::controller_song::MetadataVo;
use lib_utils::database::service;
use std::collections::HashMap;

/// 将 UnifiedMetadata 转换为 MetadataVo
pub fn unified_to_vo(metadata: UnifiedMetadata) -> MetadataVo {
    // 获取 album_id 和 artist_id (仅本地模式需要)
    let (album_id, artist_id) = if metadata.source == DataSourceType::Local {
        let album_id = service::album_song_by_song_ids(&vec![metadata.id.clone()])
            .ok()
            .and_then(|albums| albums.first().map(|a| a.album_id))
            .unwrap_or(0);

        let artist_id = service::artist_song_by_song_ids(&vec![metadata.id.clone()])
            .ok()
            .and_then(|artists| artists.first().map(|a| a.artist_id))
            .unwrap_or(0);

        (album_id, artist_id)
    } else {
        (0, 0)
    };

    // 生成 file_url
    let file_url = match metadata.source {
        DataSourceType::Local => {
            metadata.file_url.unwrap_or_default()
        },
        DataSourceType::Subsonic => {
            // Subsonic 使用 stream_url
            metadata.stream_url.unwrap_or_default()
        },
    };

    MetadataVo {
        id: metadata.id,
        file_name: metadata.file_name.unwrap_or_default(),
        file_path: metadata.file_path.unwrap_or_default(),
        file_url,
        title: metadata.title,
        artist: metadata.artist.clone(),
        artists: if metadata.artist.is_empty() {
            vec![]
        } else {
            vec![metadata.artist]
        },
        album: metadata.album,
        year: metadata.year,
        duration: metadata.duration,
        bitrate: metadata.bitrate,
        samplerate: metadata.samplerate,
        genre: metadata.genre.clone(),
        genres: if metadata.genre.is_empty() {
            vec![]
        } else {
            vec![metadata.genre]
        },
        track: metadata.track,
        disc: metadata.disc,
        comment: metadata.comment,
        album_id,
        artist_id,
    }
}

/// 批量转换 UnifiedMetadata 为 MetadataVo
pub fn unified_list_to_vo(metadata_list: Vec<UnifiedMetadata>) -> Vec<MetadataVo> {
    if metadata_list.is_empty() {
        return vec![];
    }

    // 检查数据源类型
    let source_type = metadata_list.first().map(|m| m.source.clone()).unwrap_or(DataSourceType::Local);

    if source_type == DataSourceType::Local {
        // 本地模式: 批量查询 album_id 和 artist_id
        let ids: Vec<String> = metadata_list.iter().map(|m| m.id.clone()).collect();

        let mut id_album_id_map = HashMap::new();
        let mut id_artist_id_map = HashMap::new();

        if let Ok(album_songs) = service::album_song_by_song_ids(&ids) {
            for album_song in album_songs {
                id_album_id_map.insert(album_song.song_id.clone(), album_song.album_id);
            }
        }

        if let Ok(artist_songs) = service::artist_song_by_song_ids(&ids) {
            for artist_song in artist_songs {
                id_artist_id_map.insert(artist_song.song_id.clone(), artist_song.artist_id);
            }
        }

        // 转换
        metadata_list
            .into_iter()
            .map(|m| {
                let album_id = *id_album_id_map.get(&m.id).unwrap_or(&0);
                let artist_id = *id_artist_id_map.get(&m.id).unwrap_or(&0);

                let file_url = m.file_url.clone().unwrap_or_default();

                MetadataVo {
                    id: m.id.clone(),
                    file_name: m.file_name.clone().unwrap_or_default(),
                    file_path: m.file_path.clone().unwrap_or_default(),
                    file_url,
                    title: m.title.clone(),
                    artist: m.artist.clone(),
                    artists: if m.artist.is_empty() {
                        vec![]
                    } else {
                        vec![m.artist.clone()]
                    },
                    album: m.album.clone(),
                    year: m.year.clone(),
                    duration: m.duration,
                    bitrate: m.bitrate.clone(),
                    samplerate: m.samplerate.clone(),
                    genre: m.genre.clone(),
                    genres: if m.genre.is_empty() {
                        vec![]
                    } else {
                        vec![m.genre.clone()]
                    },
                    track: m.track.clone(),
                    disc: m.disc.clone(),
                    comment: m.comment.clone(),
                    album_id,
                    artist_id,
                }
            })
            .collect()
    } else {
        // Subsonic 模式: 直接转换
        metadata_list.into_iter().map(unified_to_vo).collect()
    }
}
