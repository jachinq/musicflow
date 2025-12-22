// Subsonic 数据源实现
// 实现 MusicDataSource trait,连接 Subsonic 服务器

use anyhow::Result;
use async_trait::async_trait;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::datasource::trait_def::MusicDataSource;
use crate::datasource::types::*;
use super::client::SubsonicClient;

/// Subsonic 数据源
pub struct SubsonicDataSource {
    client: SubsonicClient,
    max_bitrate: u32,
    prefer_format: String,
    // 简单的内存缓存
    cache: Arc<RwLock<HashMap<String, UnifiedMetadata>>>,
}

impl SubsonicDataSource {
    /// 创建新的 Subsonic 数据源
    pub fn new(
        server_url: String,
        username: String,
        password: String,
        use_token: bool,
        max_bitrate: u32,
        prefer_format: String,
    ) -> Self {
        Self {
            client: SubsonicClient::new(
                server_url,
                username,
                password,
                use_token,
                "1.16.1".to_string(),
                "MusicFlow".to_string(),
            ),
            max_bitrate,
            prefer_format,
            cache: Arc::new(RwLock::new(HashMap::new())),
        }
    }
}

#[async_trait]
impl MusicDataSource for SubsonicDataSource {
    async fn get_metadata(&self, id: &str) -> Result<UnifiedMetadata> {
        // 检查缓存
        {
            let cache = self.cache.read().await;
            if let Some(cached) = cache.get(id) {
                return Ok(cached.clone());
            }
        }

        // 从服务器获取
        let song = self.client.get_song(id).await?;
        let mut metadata: UnifiedMetadata = song.into();

        // 设置流式URL
        metadata.stream_url = Some(self.client.get_stream_url(
            id,
            self.max_bitrate,
            &self.prefer_format,
        ));

        // 更新缓存
        {
            let mut cache = self.cache.write().await;
            cache.insert(id.to_string(), metadata.clone());
        }

        Ok(metadata)
    }

    async fn list_metadata(&self, _filter: MetadataFilter) -> Result<Vec<UnifiedMetadata>> {
        // TODO: 实现列表查询
        // 需要调用 getAlbumList2, search3 等 API
        Ok(vec![])
    }

    async fn get_cover(&self, _link_id: &str, _size: CoverSize) -> Result<Vec<u8>> {
        // TODO: 实现封面获取
        // 需要调用 getCoverArt API
        Ok(vec![])
    }

    async fn get_lyrics(&self, _song_id: &str) -> Result<Vec<LyricLine>> {
        // TODO: 实现歌词获取
        // 需要调用 getLyrics API
        Ok(vec![])
    }

    async fn get_audio_stream(&self, song_id: &str) -> Result<AudioStream> {
        let stream_url = self.client.get_stream_url(
            song_id,
            self.max_bitrate,
            &self.prefer_format,
        );

        Ok(AudioStream::SubsonicStream {
            url: stream_url,
            headers: HashMap::new(),
        })
    }

    async fn scan_library(&self) -> Result<ScanProgress> {
        // TODO: 实现库扫描
        // 需要调用 startScan / getScanStatus API
        Ok(ScanProgress {
            status: ScanStatus::Idle,
            processed: 0,
            total: 0,
            current_file: None,
            error: None,
        })
    }

    async fn list_albums(&self) -> Result<Vec<AlbumInfo>> {
        // TODO: 实现专辑列表
        Ok(vec![])
    }

    async fn list_artists(&self) -> Result<Vec<ArtistInfo>> {
        // TODO: 实现艺术家列表
        Ok(vec![])
    }

    async fn search(&self, _query: &str) -> Result<SearchResult> {
        // TODO: 实现搜索
        Ok(SearchResult {
            songs: vec![],
            albums: vec![],
            artists: vec![],
        })
    }

    fn source_type(&self) -> DataSourceType {
        DataSourceType::Subsonic
    }

    async fn health_check(&self) -> Result<()> {
        self.client.ping().await
    }
}
