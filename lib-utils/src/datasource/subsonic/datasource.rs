// Subsonic 数据源实现
// 实现 MusicDataSource trait,连接 Subsonic 服务器

use anyhow::Result;
use async_trait::async_trait;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

use super::client::SubsonicClient;
use super::mapper::parse_subsonic_lyrics;
use crate::datasource::trait_def::MusicDataSource;
use crate::datasource::types::*;

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

    async fn list_metadata(&self, filter: MetadataFilter) -> Result<Vec<UnifiedMetadata>> {
        let keyword = filter.keyword.unwrap_or_default();

        let pagination = Pagination::new(filter.page.unwrap_or(1), filter.page_size.unwrap_or(30));

        // 如果有关键字,使用搜索
        let search_result = self
            .client
            .search3(&keyword, pagination.start(), pagination.page_size)
            .await?;
        let songs = search_result.song.unwrap_or_default();

        let mut metadata_list: Vec<UnifiedMetadata> = songs.into_iter().map(|s| s.into()).collect();

        // 为每个歌曲设置流式 URL
        for meta in &mut metadata_list {
            meta.stream_url = Some(self.client.get_stream_url(
                &meta.id,
                self.max_bitrate,
                &self.prefer_format,
            ));
        }

        Ok(metadata_list)
    }

    async fn get_cover(&self, cover_art: &str, size: CoverSize) -> Result<Vec<u8>> {
        // // 根据 song_id 获取到 专辑 cover_art
        // let album = self.client.get_album(album_id).await?;
        // if album.cover_art.is_none() {
        //     println!("No cover art found for album album_id={}", album_id);
        //     return Err(anyhow::anyhow!("No cover art found for song"));
        // }
        // let cover_art = album.cover_art.unwrap();

        let size = match size {
            CoverSize::Small => "300",
            CoverSize::Medium => "600",
            CoverSize::Large => "1000",
        };
        // 获取封面 URL
        let cover_url = self.client.get_cover_art_url(&cover_art, size);
        // println!("Downloading cover art from {}", cover_url);

        // 下载图片
        let response = reqwest::get(&cover_url).await?;
        if response.status() != 200 {
            return Err(anyhow::anyhow!("Failed to download cover art"));
        }
        
        let bytes = response.bytes().await?;

        Ok(bytes.to_vec())
    }

    async fn get_lyrics(&self, song_id: &str) -> Result<Vec<LyricLine>> {
        // 首先获取歌曲信息以得到艺术家和标题
        let metadata = self.get_metadata(song_id).await?;

        println!(
            "song_id={}/{}, artist={}, title={}",
            song_id, metadata.id, metadata.artist, metadata.title
        );

        // 调用 getLyrics API
        if let Some(lyrics) = self
            .client
            .get_lyrics(&metadata.artist, &metadata.title)
            .await?
        {
            // println!("{:?}", lyrics);
            Ok(parse_subsonic_lyrics(lyrics))
        } else {
            Ok(vec![])
        }
    }

    async fn get_audio_stream(&self, song_id: &str) -> Result<AudioStream> {
        let stream_url = self
            .client
            .get_stream_url(song_id, self.max_bitrate, &self.prefer_format);

        Ok(AudioStream::SubsonicStream {
            url: stream_url,
            headers: HashMap::new(),
        })
    }

    async fn scan_library(&self) -> Result<ScanProgress> {
        // Subsonic 服务器端扫描
        // 注意: 大多数 Subsonic 服务器不提供扫描进度 API
        // 这里返回一个占位符
        Ok(ScanProgress {
            status: ScanStatus::Completed,
            processed: 0,
            total: 0,
            current_file: None,
            error: Some("Subsonic scan managed by server".to_string()),
        })
    }

    async fn list_albums(
        &self,
        pagination: Pagination,
        filter_text: Option<String>,
    ) -> Result<Vec<AlbumInfo>> {
        if let Some(filter_text) = filter_text {
            let filter_text = filter_text.trim();
            if !filter_text.is_empty() {
                let search_result = self
                    .client
                    .search3(filter_text, pagination.start(), pagination.page_size)
                    .await?;
                let albums = search_result.album.unwrap_or_default();
                let all_albums: Vec<AlbumInfo> = albums.into_iter().map(|a| a.into()).collect();
                return Ok(all_albums);
            }
        }

        let albums = self
            .client
            .get_album_list2(
                "alphabeticalByName",
                pagination.page_size,
                pagination.start(),
            )
            .await?;

        Ok(albums.into_iter().map(|a| a.into()).collect())
    }

    async fn get_album_by_id(&self, album_id: &str) -> Result<AlbumInfo> {
        let album = self.client.get_album(album_id).await?;
        Ok(album.into())
    }

    async fn get_album_songs(&self, album_id: &str) -> Result<Vec<UnifiedMetadata>> {
        let album = self.client.get_album(album_id).await?;

        let songs = album.song.unwrap_or_default();
        let mut metadata_list: Vec<UnifiedMetadata> = songs.into_iter().map(|s| s.into()).collect();

        // 为每个歌曲设置流式 URL
        for meta in &mut metadata_list {
            meta.stream_url = Some(self.client.get_stream_url(
                &meta.id,
                self.max_bitrate,
                &self.prefer_format,
            ));
        }

        Ok(metadata_list)
    }

    async fn list_artists(&self) -> Result<Vec<ArtistInfo>> {
        let artists = self.client.get_artists().await?;

        Ok(artists.into_iter().map(|a| a.into()).collect())
    }

    async fn get_artist_by_id(&self, artist_id: &str) -> Result<ArtistInfo> {
        let artist = self.client.get_artist(artist_id).await?;
        Ok(artist.into())
    }

    async fn get_artist_songs(&self, artist_id: &str) -> Result<Vec<UnifiedMetadata>> {
        let artist_detail = self.client.get_artist(artist_id).await?;

        let top_songs = self
            .client
            .get_top_songs(&artist_detail.name.unwrap_or_default())
            .await?;

        let mut metadata_list: Vec<UnifiedMetadata> =
            top_songs.into_iter().map(|s| s.into()).collect();

        // 为每个歌曲设置流式 URL
        for meta in &mut metadata_list {
            meta.stream_url = Some(self.client.get_stream_url(
                &meta.id,
                self.max_bitrate,
                &self.prefer_format,
            ));
        }

        Ok(metadata_list)
    }

    async fn list_genres(&self) -> Result<Vec<GenreInfo>> {
        let artist_detail = self.client.get_genres().await?;
        let genres: Vec<GenreInfo> = artist_detail
            .into_iter()
            .map(|g| GenreInfo {
                value: g.value.unwrap_or_default(),
                album_count: g.album_count.unwrap_or(0) as usize,
                song_count: g.song_count.unwrap_or(0) as usize,
            })
            .collect();

        Ok(genres)
    }

    async fn get_genre_songs(&self, genre: &str) -> Result<Vec<UnifiedMetadata>> {
        let songs = self.client.get_genre_songs(genre).await?;
        let mut metadata_list: Vec<UnifiedMetadata> =
            songs.into_iter().map(|s| s.into()).collect();

        // 为每个歌曲设置流式 URL
        for meta in &mut metadata_list {
            meta.stream_url = Some(self.client.get_stream_url(
                &meta.id,
                self.max_bitrate,
                &self.prefer_format,
            ));
        }

        Ok(metadata_list)
    }

    async fn get_random_songs(
        &self,
        size: Option<usize>,
        genre: Option<&str>,
        from_year: Option<&str>,
        to_year: Option<&str>,
    ) -> Result<Vec<UnifiedMetadata>> {
        let songs = self
            .client
            .get_random_songs(size, genre, from_year, to_year)
            .await?;
        let mut metadata_list: Vec<UnifiedMetadata> = songs.into_iter().map(|s| s.into()).collect();

        // 为每个歌曲设置流式 URL
        for meta in &mut metadata_list {
            meta.stream_url = Some(self.client.get_stream_url(
                &meta.id,
                self.max_bitrate,
                &self.prefer_format,
            ));
        }

        Ok(metadata_list)
    }

    async fn search(&self, query: &str, pagination: Pagination) -> Result<SearchResult> {
        let result = self
            .client
            .search3(query, pagination.start(), pagination.page_size)
            .await?;

        let songs: Vec<UnifiedMetadata> = result
            .song
            .unwrap_or_default()
            .into_iter()
            .map(|s| {
                let mut meta: UnifiedMetadata = s.into();
                meta.stream_url = Some(self.client.get_stream_url(
                    &meta.id,
                    self.max_bitrate,
                    &self.prefer_format,
                ));
                meta
            })
            .collect();

        let albums: Vec<AlbumInfo> = result
            .album
            .unwrap_or_default()
            .into_iter()
            .map(|a| a.into())
            .collect();

        let artists: Vec<ArtistInfo> = result
            .artist
            .unwrap_or_default()
            .into_iter()
            .map(|a| a.into())
            .collect();

        Ok(SearchResult {
            songs,
            albums,
            artists,
        })
    }

    fn source_type(&self) -> DataSourceType {
        DataSourceType::Subsonic
    }

    async fn health_check(&self) -> Result<()> {
        self.client.ping().await
    }

    async fn scan_music(&self) -> Result<()> {
        self.client.scan_music().await
    }

    async fn scan_status(&self) -> Result<ScanProgress> {
        let status = self.client.get_scan_status().await?;

        Ok(ScanProgress {
            status: if status.scanning {
                ScanStatus::Scanning
            } else {
                ScanStatus::Completed
            },
            processed: status.count.unwrap_or(0) as usize,
            total: status.count.unwrap_or(0) as usize,
            current_file: None,
            error: None,
        })
    }

    async fn stream_song(&self, song_id: &str, range: Option<String>) -> Result<reqwest::Response> {
        self.client.stream_song(song_id, range).await
    }

    async fn list_playlists(&self) -> Result<Vec<PlaylistInfo>> {
        let playlists = self.client.get_playlists().await?;

        Ok(playlists
            .into_iter()
            .map(|p| PlaylistInfo {
                id: p.id,
                name: p.name,
                description: p.comment,
                cover: p.cover_art,
                owner: p.owner,
                public: p.public,
                song_count: p.song_count.unwrap_or(0) as usize,
                duration: p.duration,
                created_at: p.created,
                updated_at: p.changed,
            })
            .collect())
    }

    async fn get_playlist(&self, playlist_id: &str) -> Result<PlaylistDetail> {
        let playlist = self.client.get_playlist(playlist_id).await?;

        // 转换歌曲列表
        let songs: Vec<UnifiedMetadata> = playlist
            .entry
            .unwrap_or_default()
            .into_iter()
            .map(|s| {
                let mut meta: UnifiedMetadata = s.into();
                meta.file_url = Some(self.client.get_stream_url(
                    &meta.id,
                    self.max_bitrate,
                    &self.prefer_format,
                ));
                meta
            })
            .collect();

        // 特殊获取封面，拿歌曲列表中的第一首歌的专辑封面
        let cover = if let Some(first_song) = songs.first() {
            first_song.cover_art.clone()
        } else {
            None
        };

        Ok(PlaylistDetail {
            id: playlist.id,
            name: playlist.name,
            description: playlist.comment,
            cover,
            owner: playlist.owner,
            public: playlist.public,
            song_count: songs.len(),
            duration: playlist.duration,
            created_at: playlist.created,
            updated_at: playlist.changed,
            songs,
        })
    }

    async fn create_playlist(
        &self,
        name: &str,
        _description: Option<&str>,
        song_ids: &[String],
    ) -> Result<()> {
        self.client.create_playlist(name, song_ids).await
    }

    async fn update_playlist(
        &self,
        playlist_id: &str,
        name: Option<&str>,
        description: Option<&str>,
        song_ids: Option<&[String]>,
    ) -> Result<()> {
        // 如果提供了新的歌曲列表,需要先获取现有歌曲,计算差异
        let (song_ids_to_add, song_indexes_to_remove) = if let Some(new_ids) = song_ids {
            // 获取现有播放列表
            let existing = self.client.get_playlist(playlist_id).await?;
            let existing_songs = existing.entry.unwrap_or_default();

            // 计算要添加的歌曲 (新列表中有,旧列表中没有)
            let existing_ids: Vec<String> = existing_songs.iter().map(|s| s.id.clone()).collect();
            let to_add: Vec<String> = new_ids
                .iter()
                .filter(|id| !existing_ids.contains(id))
                .cloned()
                .collect();

            // 计算要删除的歌曲索引 (旧列表中有,新列表中没有)
            let to_remove: Vec<u32> = existing_songs
                .iter()
                .enumerate()
                .filter(|(_, s)| !new_ids.contains(&s.id))
                .map(|(i, _)| i as u32)
                .collect();

            (to_add, to_remove)
        } else {
            (vec![], vec![])
        };

        self.client
            .update_playlist(
                playlist_id,
                name,
                description,
                None,
                &song_ids_to_add,
                &song_indexes_to_remove,
            )
            .await
    }

    async fn delete_playlist(&self, playlist_id: &str) -> Result<()> {
        self.client.delete_playlist(playlist_id).await
    }
}
