use anyhow::Result;
use async_trait::async_trait;

use super::types::*;

/// 音乐数据源抽象接口
///
/// 该 trait 定义了访问音乐数据的统一接口,允许从不同数据源
/// (本地文件系统、Subsonic服务器等)获取音乐元数据和音频流
#[async_trait]
pub trait MusicDataSource: Send + Sync {
    /// 获取单个歌曲的元数据
    ///
    /// # 参数
    /// * `id` - 歌曲唯一标识符
    ///
    /// # 返回
    /// * `Ok(UnifiedMetadata)` - 歌曲元数据
    /// * `Err` - 获取失败(歌曲不存在或网络错误)
    async fn get_metadata(&self, id: &str) -> Result<UnifiedMetadata>;

    /// 查询元数据列表
    ///
    /// # 参数
    /// * `filter` - 查询过滤条件(分页、流派、关键字等)
    ///
    /// # 返回
    /// * `Ok(Vec<UnifiedMetadata>)` - 符合条件的歌曲列表
    async fn list_metadata(&self, filter: MetadataFilter) -> Result<Vec<UnifiedMetadata>>;

    /// 获取封面图片
    ///
    /// # 参数
    /// * `link_id` - 关联ID(歌曲ID或专辑ID)
    /// * `size` - 图片尺寸(Small/Medium/Large)
    ///
    /// # 返回
    /// * `Ok(Vec<u8>)` - 图片二进制数据
    async fn get_cover(&self, link_id: &str, size: CoverSize) -> Result<Vec<u8>>;

    /// 获取歌词
    ///
    /// # 参数
    /// * `song_id` - 歌曲ID
    ///
    /// # 返回
    /// * `Ok(Vec<LyricLine>)` - 歌词行列表(包含时间戳)
    async fn get_lyrics(&self, song_id: &str) -> Result<Vec<LyricLine>>;

    /// 获取音频流
    ///
    /// # 参数
    /// * `song_id` - 歌曲ID
    ///
    /// # 返回
    /// * `Ok(AudioStream)` - 音频流(本地文件路径或网络流URL)
    async fn get_audio_stream(&self, song_id: &str) -> Result<AudioStream>;

    /// 代理音频流(用于从远程服务器流式传输音频)
    ///
    /// # 参数
    /// * `song_id` - 歌曲ID
    /// * `range` - 可选的 HTTP Range 请求头(用于断点续传)
    ///
    /// # 返回
    /// * `Ok(reqwest::Response)` - HTTP 响应流
    async fn stream_song(&self, song_id: &str, range: Option<String>) -> Result<reqwest::Response>;


    /// 扫描音乐库
    ///
    /// 触发音乐库扫描,更新元数据数据库
    /// - 本地模式: 遍历本地目录,提取元数据
    /// - Subsonic模式: 从服务器同步数据
    ///
    /// # 返回
    /// * `Ok(ScanProgress)` - 扫描进度信息
    async fn scan_library(&self) -> Result<ScanProgress>;

    /// 获取专辑列表
    ///
    /// # 返回
    /// * `Ok(Vec<AlbumInfo>)` - 专辑列表
    async fn list_albums(&self, pagination: Pagination, filter_text: Option<String>) -> Result<Vec<AlbumInfo>>;

    /// 根据ID获取专辑信息
    ///
    /// # 参数
    /// * `album_id` - 专辑ID
    ///
    /// # 返回
    /// * `Ok(AlbumInfo)` - 专辑信息
    async fn get_album_by_id(&self, album_id: &str) -> Result<AlbumInfo>;

    /// 获取专辑的歌曲列表
    ///
    /// # 参数
    /// * `album_id` - 专辑ID
    ///
    /// # 返回
    /// * `Ok(Vec<UnifiedMetadata>)` - 专辑的歌曲列表
    async fn get_album_songs(&self, album_id: &str) -> Result<Vec<UnifiedMetadata>>;

    /// 获取艺术家列表
    ///
    /// # 返回
    /// * `Ok(Vec<ArtistInfo>)` - 艺术家列表
    async fn list_artists(&self) -> Result<Vec<ArtistInfo>>;

    /// 根据ID获取艺术家信息
    ///
    /// # 参数
    /// * `artist_id` - 艺术家ID
    ///
    /// # 返回
    /// * `Ok(ArtistInfo)` - 艺术家信息
    async fn get_artist_by_id(&self, artist_id: &str) -> Result<ArtistInfo>;

    /// 获取艺术家的歌曲列表
    ///
    /// # 参数
    /// * `artist_id` - 艺术家ID
    ///
    /// # 返回
    /// * `Ok(Vec<UnifiedMetadata>)` - 艺术家的歌曲列表
    async fn get_artist_songs(&self, artist_id: &str) -> Result<Vec<UnifiedMetadata>>;

    /// 获取风格列表
    /// # 返回
    /// * `Ok(Vec<String>)` - 风格列表
    async fn list_genres(&self) -> Result<Vec<GenreInfo>>;
    
    /// 获取风格的歌曲列表
    ///
    /// # 参数
    /// * `genre` - 风格名称
    ///
    /// # 返回
    /// * `Ok(Vec<UnifiedMetadata>)` - 风格的歌曲列表
    async fn get_genre_songs(&self, genre: &str) -> Result<Vec<UnifiedMetadata>>;

    /// 获取随机歌曲
    ///
    /// # 参数
    /// * `size` - 返回的最大歌曲数量,默认 150,最大 500
    /// * `genre` - 可选,按流派筛选
    /// * `from_year` - 可选,只返回此年份之后(含)发布的歌曲
    /// * `to_year` - 可选,只返回此年份之前(含)发布的歌曲
    ///
    /// # 返回
    /// * `Ok(Vec<UnifiedMetadata>)` - 随机歌曲列表
    async fn get_random_songs(
        &self,
        size: Option<usize>,
        genre: Option<&str>,
        from_year: Option<&str>,
        to_year: Option<&str>,
    ) -> Result<Vec<UnifiedMetadata>>;

    /// 搜索音乐
    ///
    /// # 参数
    /// * `query` - 搜索关键字
    ///
    /// # 返回
    /// * `Ok(SearchResult)` - 搜索结果(歌曲、专辑、艺术家)
    async fn search(&self, query: &str, pagination: Pagination) -> Result<SearchResult>;

    /// 获取数据源类型
    ///
    /// # 返回
    /// * `DataSourceType` - 本地或Subsonic
    fn source_type(&self) -> DataSourceType;

    /// 健康检查
    ///
    /// 检查数据源是否可用
    /// - 本地模式: 检查数据库和音乐目录是否存在
    /// - Subsonic模式: ping 服务器
    ///
    /// # 返回
    /// * `Ok(())` - 数据源健康
    /// * `Err` - 数据源不可用
    async fn health_check(&self) -> Result<()>;

    /// 扫描音乐
    async fn scan_music(&self) -> Result<()>;

    /// 获取扫描状态
    ///
    /// # 返回
    /// * `Ok(ScanProgress)` - 扫描进度信息
    async fn scan_status(&self) -> Result<ScanProgress>;

    /// 获取所有播放列表
    ///
    /// # 返回
    /// * `Ok(Vec<PlaylistInfo>)` - 播放列表信息列表
    async fn list_playlists(&self) -> Result<Vec<PlaylistInfo>>;

    /// 获取播放列表详情
    ///
    /// # 参数
    /// * `playlist_id` - 播放列表 ID
    ///
    /// # 返回
    /// * `Ok(PlaylistDetail)` - 播放列表详情(包含歌曲列表)
    async fn get_playlist(&self, playlist_id: &str) -> Result<PlaylistDetail>;

    /// 创建播放列表
    ///
    /// # 参数
    /// * `name` - 播放列表名称
    /// * `description` - 描述(可选)
    /// * `song_ids` - 要添加的歌曲 ID 列表
    ///
    /// # 返回
    /// * `Ok(PlaylistInfo)` - 新创建的播放列表信息
    async fn create_playlist(
        &self,
        name: &str,
        description: Option<&str>,
        song_ids: &[String],
    ) -> Result<()>;

    /// 更新播放列表
    ///
    /// # 参数
    /// * `playlist_id` - 播放列表 ID
    /// * `name` - 新名称(可选)
    /// * `description` - 新描述(可选)
    /// * `song_ids` - 完整的歌曲 ID 列表(替换现有歌曲)
    ///
    /// # 返回
    /// * `Ok(())` - 更新成功
    async fn update_playlist(
        &self,
        playlist_id: &str,
        name: Option<&str>,
        description: Option<&str>,
        song_ids: Option<&[String]>,
    ) -> Result<()>;

    /// 删除播放列表
    ///
    /// # 参数
    /// * `playlist_id` - 播放列表 ID
    ///
    /// # 返回
    /// * `Ok(())` - 删除成功
    async fn delete_playlist(&self, playlist_id: &str) -> Result<()>;

    /// 获取播放队列（用于跨客户端同步）
    ///
    /// # 返回
    /// * `Ok(Some(PlayQueueInfo))` - 播放队列信息
    /// * `Ok(None)` - 没有播放队列
    async fn get_play_queue(&self) -> Result<Option<PlayQueueInfo>>;

    /// 保存播放队列（用于跨客户端同步）
    ///
    /// # 参数
    /// * `queue` - 播放队列信息
    ///
    /// # 返回
    /// * `Ok(())` - 保存成功
    async fn save_play_queue(&self, song_ids: Vec<String>, current_song_id: Option<String>, position: Option<u64>) -> Result<()>;
}
