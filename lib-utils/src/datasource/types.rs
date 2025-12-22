use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

/// 数据源类型
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DataSourceType {
    /// 本地文件系统
    Local,
    /// Subsonic 服务器
    Subsonic,
}

/// 统一的音乐元数据结构
/// 兼容本地文件和 Subsonic 两种数据源
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct UnifiedMetadata {
    /// 统一 ID (本地模式为数字字符串, Subsonic 模式为服务器ID)
    pub id: String,

    // 基本元数据
    pub title: String,
    pub artist: String,
    pub album: String,
    pub year: String,
    pub duration: f64,
    pub genre: String,
    pub track: String,
    pub disc: String,
    pub language: String,
    pub comment: String,

    // 技术参数
    pub bitrate: String,
    pub samplerate: String,

    // 数据源信息
    pub source: DataSourceType,

    // 本地文件模式专有字段
    pub file_name: Option<String>,
    pub file_path: Option<String>,
    pub file_url: Option<String>,

    // Subsonic 模式专有字段
    pub subsonic_id: Option<String>,
    pub stream_url: Option<String>,
    pub cover_art_id: Option<String>,
}

impl Default for UnifiedMetadata {
    fn default() -> Self {
        Self {
            id: String::new(),
            title: String::new(),
            artist: String::new(),
            album: String::new(),
            year: String::new(),
            duration: 0.0,
            genre: String::new(),
            track: String::new(),
            disc: String::new(),
            language: String::new(),
            comment: String::new(),
            bitrate: String::new(),
            samplerate: String::new(),
            source: DataSourceType::Local,
            file_name: None,
            file_path: None,
            file_url: None,
            subsonic_id: None,
            stream_url: None,
            cover_art_id: None,
        }
    }
}

/// 音频流类型
#[derive(Debug, Clone)]
pub enum AudioStream {
    /// 本地文件路径
    LocalFile(PathBuf),
    /// Subsonic 流式URL
    SubsonicStream {
        url: String,
        headers: HashMap<String, String>,
    },
}

/// 封面图片尺寸
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CoverSize {
    /// 小尺寸 (140px)
    Small,
    /// 中等尺寸 (600px)
    Medium,
    /// 大尺寸 (原始)
    Large,
}

impl CoverSize {
    pub fn as_str(&self) -> &'static str {
        match self {
            CoverSize::Small => "small",
            CoverSize::Medium => "medium",
            CoverSize::Large => "large",
        }
    }
}

/// 元数据查询过滤器
#[derive(Debug, Clone, Default)]
pub struct MetadataFilter {
    /// 分页 - 页码 (从1开始)
    pub page: Option<u32>,
    /// 分页 - 每页数量
    pub page_size: Option<u32>,
    /// 流派过滤
    pub genres: Option<Vec<String>>,
    /// 艺术家ID过滤
    pub artist_ids: Option<Vec<String>>,
    /// 专辑ID过滤
    pub album_ids: Option<Vec<String>>,
    /// 关键字搜索
    pub keyword: Option<String>,
}

/// 音乐库扫描进度
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanProgress {
    /// 扫描状态
    pub status: ScanStatus,
    /// 已处理文件数
    pub processed: usize,
    /// 总文件数
    pub total: usize,
    /// 当前处理的文件
    pub current_file: Option<String>,
    /// 错误消息
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ScanStatus {
    /// 未开始
    Idle,
    /// 扫描中
    Scanning,
    /// 已完成
    Completed,
    /// 失败
    Failed,
}

/// 搜索结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    /// 歌曲结果
    pub songs: Vec<UnifiedMetadata>,
    /// 专辑结果
    pub albums: Vec<AlbumInfo>,
    /// 艺术家结果
    pub artists: Vec<ArtistInfo>,
}

/// 专辑信息
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AlbumInfo {
    pub id: String,
    pub name: String,
    pub artist: String,
    pub year: String,
    pub cover_art_id: Option<String>,
    pub song_count: usize,
}

/// 艺术家信息
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ArtistInfo {
    pub id: String,
    pub name: String,
    pub album_count: usize,
    pub cover: Option<String>,
}

/// 歌词行
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct LyricLine {
    pub time: f64,
    pub text: String,
}

impl Default for LyricLine {
    fn default() -> Self {
        Self {
            time: 0.0,
            text: String::new(),
        }
    }
}
