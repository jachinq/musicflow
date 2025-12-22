// Subsonic 数据格式映射
// 将 Subsonic API 响应转换为统一的数据结构

use crate::datasource::types::*;
use super::client::SubsonicSong;

impl From<SubsonicSong> for UnifiedMetadata {
    fn from(song: SubsonicSong) -> Self {
        UnifiedMetadata {
            id: song.id.clone(),
            title: song.title.clone(),
            artist: song.artist.unwrap_or_default(),
            album: song.album.unwrap_or_default(),
            year: song.year.map(|y| y.to_string()).unwrap_or_default(),
            duration: song.duration.unwrap_or(0) as f64,
            genre: song.genre.unwrap_or_default(),
            track: song.track.map(|t| t.to_string()).unwrap_or_default(),
            disc: String::new(),
            language: String::new(),
            comment: String::new(),
            bitrate: song.bitrate.map(|b| b.to_string()).unwrap_or_default(),
            samplerate: String::new(),
            source: DataSourceType::Subsonic,
            file_name: song.suffix.clone(),
            file_path: song.path.clone(),
            file_url: None,
            subsonic_id: Some(song.id.clone()),
            stream_url: None, // 会在 DataSource 中设置
            cover_art_id: song.cover_art.clone(),
        }
    }
}
