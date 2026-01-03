use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

/// 分页数据
/// page: 当前页码
/// page_size: 每页数量
#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct Pagination {
    pub page: usize,
    pub page_size: usize,
}

impl Pagination {
    pub fn new(page: usize, page_size: usize) -> Self {
        Self { page, page_size }
    }
    pub fn is_valid(&self) -> bool {
        self.page > 0 && self.page_size > 0
    }
    // 起始位置
    pub fn start(&self) -> usize {
        (self.page - 1) * self.page_size
    }
    pub fn safe_start(&self, total: usize) -> usize {
        if self.page * self.page_size > total {
            total
        } else {
            self.start()
        }
    }
    // 结束位置
    pub fn end(&self, total: usize) -> usize {
        if self.page * self.page_size > total {
            total
        } else {
            self.page * self.page_size
        }
    }
}
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
    // 封面图片路径
    pub cover_art: Option<String>,
    pub album_id: Option<String>,
    pub artist_id: Option<String>,

    // 本地文件模式专有字段
    pub file_name: Option<String>,
    pub file_path: Option<String>,
    pub file_url: Option<String>,

    // Subsonic 模式专有字段
    pub subsonic_id: Option<String>,
    pub stream_url: Option<String>,
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
            cover_art: None,
            album_id: None,
            artist_id: None,
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
    pub page: Option<usize>,
    /// 分页 - 每页数量
    pub page_size: Option<usize>,
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
    pub cover_art: Option<String>,
    pub song_count: usize,
}

/// 艺术家信息
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ArtistInfo {
    pub id: String,
    pub name: String,
    pub album_count: usize,
    pub cover_art: Option<String>,
}

/// 风格信息
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct GenreInfo {
    pub value: String,
    pub album_count: usize,
    pub song_count: usize,
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

/// 播放列表信息
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PlaylistInfo {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub cover: Option<String>,
    pub owner: Option<String>,
    pub public: Option<bool>,
    pub song_count: usize,
    pub duration: Option<u32>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

/// 播放列表详情(包含歌曲列表)
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PlaylistDetail {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub cover: Option<String>,
    pub owner: Option<String>,
    pub public: Option<bool>,
    pub song_count: usize,
    pub duration: Option<u32>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    pub songs: Vec<UnifiedMetadata>,
}

/// 播放队列信息（用于跨客户端同步）
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PlayQueueInfo {
    /// 歌曲详情
    pub songs: Vec<UnifiedMetadata>,
    /// 当前播放的歌曲
    pub current_song: Option<UnifiedMetadata>,
    /// 当前播放位置（毫秒）
    pub position: Option<u64>,
}

impl UnifiedMetadata {
    /// 分割 genre 字符串为列表
    /// 本地模式使用逗号分隔,Subsonic 也使用逗号分隔
    pub fn split_genre(&self) -> Vec<String> {
        split_genre(&self.genre)
    }
}

/// 分割 genre 字符串(逗号分隔)
pub fn split_genre(genre: &str) -> Vec<String> {
    let mut list = Vec::new();
    for split in genre.split(',') {
        let word = split.trim().to_string();
        if !word.is_empty() {
            list.push(word);
        }
    }
    list
}

/// 专辑列表类型
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AlbumListType {
    /// 随机
    Random,
    /// 最新添加
    Newest,
    /// 评分最高
    Highest,
    /// 最常播放
    Frequent,
    /// 最近播放
    Recent,
    /// 已收藏
    Starred,
    /// 按流派
    ByGenre { genre: String },
    /// 按年份
    ByYear {
        from_year: Option<u32>,
        to_year: Option<u32>,
    },
    /// 按字母排序（默认）
    AlphabeticalByName,
}

impl AlbumListType {
    /// 转换为 Subsonic API 的 type 字符串
    pub fn to_subsonic_type(&self) -> &str {
        match self {
            AlbumListType::Random => "random",
            AlbumListType::Newest => "newest",
            AlbumListType::Highest => "highest",
            AlbumListType::Frequent => "frequent",
            AlbumListType::Recent => "recent",
            AlbumListType::Starred => "starred",
            AlbumListType::ByGenre { .. } => "byGenre",
            AlbumListType::ByYear { .. } => "byYear",
            AlbumListType::AlphabeticalByName => "alphabeticalByName",
        }
    }
}

impl Default for AlbumListType {
    fn default() -> Self {
        AlbumListType::AlphabeticalByName
    }
}
