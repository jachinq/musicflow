// Subsonic 数据格式映射
// 将 Subsonic API 响应转换为统一的数据结构

use crate::datasource::types::*;
use super::client::{SubsonicSong, SubsonicAlbum, SubsonicArtist, SubsonicLyrics};

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

impl From<SubsonicAlbum> for AlbumInfo {
    fn from(album: SubsonicAlbum) -> Self {
        AlbumInfo {
            id: album.id,
            name: album.name,
            artist: album.artist.unwrap_or_default(),
            year: album.year.map(|y| y.to_string()).unwrap_or_default(),
            cover_art_id: album.cover_art,
            song_count: album.song_count.unwrap_or(0) as usize,
        }
    }
}

impl From<SubsonicArtist> for ArtistInfo {
    fn from(artist: SubsonicArtist) -> Self {
        ArtistInfo {
            id: artist.id,
            name: artist.name,
            album_count: artist.album_count.unwrap_or(0) as usize,
            cover: artist.cover_art,
        }
    }
}

/// 解析 Subsonic 歌词为 LyricLine 列表
pub fn parse_subsonic_lyrics(lyrics: SubsonicLyrics) -> Vec<LyricLine> {
    if let Some(text) = lyrics.value {
        // Subsonic 歌词格式通常是 LRC 格式
        parse_lrc_lyrics(&text)
    } else {
        vec![]
    }
}

/// 简单的 LRC 歌词解析
fn parse_lrc_lyrics(text: &str) -> Vec<LyricLine> {
    let mut lines = vec![];

    for line in text.lines() {
        // LRC 格式: [mm:ss.xx]歌词文本
        if let Some(parsed) = parse_lrc_line(line) {
            lines.push(parsed);
        }
    }

    lines.sort_by(|a, b| a.time.partial_cmp(&b.time).unwrap());
    lines
}

/// 解析单行 LRC 歌词
fn parse_lrc_line(line: &str) -> Option<LyricLine> {
    let line = line.trim();
    if !line.starts_with('[') {
        return None;
    }

    let end_bracket = line.find(']')?;
    let time_str = &line[1..end_bracket];
    let text = &line[end_bracket + 1..];

    // 解析时间 mm:ss.xx
    let parts: Vec<&str> = time_str.split(':').collect();
    if parts.len() != 2 {
        return None;
    }

    let minutes: f64 = parts[0].parse().ok()?;
    let seconds: f64 = parts[1].parse().ok()?;
    let time = minutes * 60.0 + seconds;

    Some(LyricLine {
        time,
        text: text.to_string(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_lrc_line() {
        let line = "[00:12.50]这是一句歌词";
        let parsed = parse_lrc_line(line).unwrap();
        assert_eq!(parsed.time, 12.5);
        assert_eq!(parsed.text, "这是一句歌词");
    }

    #[test]
    fn test_parse_lrc_lyrics() {
        let text = "[00:12.50]第一句\n[00:15.00]第二句\n[00:10.00]第零句";
        let lyrics = parse_lrc_lyrics(text);
        assert_eq!(lyrics.len(), 3);
        assert_eq!(lyrics[0].time, 10.0);
        assert_eq!(lyrics[1].time, 12.5);
        assert_eq!(lyrics[2].time, 15.0);
    }
}
