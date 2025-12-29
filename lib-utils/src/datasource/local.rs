// 本地文件数据源实现
// 封装现有的本地文件系统访问逻辑

use anyhow::{Ok, Result};
use async_trait::async_trait;
use base64::{engine::general_purpose, Engine};
use std::collections::HashSet;
use std::path::PathBuf;

use crate::config::get_config;
use crate::{database, log, readmeta};
use crate::database::service;
use crate::datasource::trait_def::MusicDataSource;
use crate::datasource::types::*;

/// 本地文件数据源
pub struct LocalDataSource {
    music_dir: String,
    #[allow(dead_code)]
    db_path: String,
}

impl LocalDataSource {
    /// 创建新的本地文件数据源
    pub fn new(music_dir: String, db_path: String) -> Self {
        Self { music_dir, db_path }
    }

    /// 将数据库 Metadata 转换为 UnifiedMetadata
    fn convert_metadata(&self, metadata: service::Metadata) -> UnifiedMetadata {
        UnifiedMetadata {
            id: metadata.id.clone(),
            title: metadata.title,
            artist: metadata.artist,
            album: metadata.album,
            year: metadata.year,
            duration: metadata.duration,
            genre: metadata.genre,
            track: metadata.track,
            disc: metadata.disc,
            language: metadata.language,
            comment: metadata.comment,
            bitrate: metadata.bitrate,
            samplerate: metadata.samplerate,
            source: DataSourceType::Local,
            file_name: Some(metadata.file_name),
            file_path: Some(metadata.file_path),
            file_url: Some(format!("/music{}", metadata.file_url)),
            subsonic_id: None,
            stream_url: None,
            cover_art: None,
            album_id: None,
            artist_id: None,
        }
    }

    /// 将数据库 Lyric 转换为 LyricLine
    fn convert_lyric(lyric: service::Lyric) -> LyricLine {
        LyricLine {
            time: lyric.time,
            text: lyric.text,
        }
    }
}

#[async_trait]
impl MusicDataSource for LocalDataSource {
    async fn get_metadata(&self, id: &str) -> Result<UnifiedMetadata> {
        let metadata = service::get_metadata_by_id(id)?
            .ok_or_else(|| anyhow::anyhow!("Metadata not found: {}", id))?;

        Ok(self.convert_metadata(metadata))
    }

    async fn list_metadata(&self, filter: MetadataFilter) -> Result<Vec<UnifiedMetadata>> {
        // 获取所有元数据
        let all_metadata = service::get_metadata_list()?;

        // 应用过滤器
        let mut filtered: Vec<_> = all_metadata
            .into_iter()
            .filter(|m| {
                // 关键字过滤
                if let Some(keyword) = &filter.keyword {
                    let keyword_lower = keyword.to_lowercase();
                    return m.title.to_lowercase().contains(&keyword_lower)
                        || m.artist.to_lowercase().contains(&keyword_lower)
                        || m.album.to_lowercase().contains(&keyword_lower);
                }
                true
            })
            .filter(|m| {
                // 流派过滤
                if let Some(genres) = &filter.genres {
                    if genres.is_empty() {
                        return true;
                    }
                    return genres.iter().any(|g| m.genre.contains(g));
                }
                true
            })
            .map(|m| self.convert_metadata(m))
            .collect();

        // 分页
        if let (Some(page), Some(page_size)) = (filter.page, filter.page_size) {
            let start = ((page - 1) * page_size) as usize;
            let end = (start + page_size as usize).min(filtered.len());

            if start < filtered.len() {
                filtered = filtered[start..end].to_vec();
            } else {
                filtered = vec![];
            }
        }

        Ok(filtered)
    }

    async fn get_cover(&self, link_id: &str, size: CoverSize) -> Result<Vec<u8>> {
        // link_id 在本地模式下是歌曲ID,需要转换为 i64
        let id = link_id
            .parse::<i64>()
            .unwrap_or_else(|_| link_id.parse::<i64>().unwrap_or(0));

        if link_id.len() > 150 {
            let url = base64::engine::general_purpose::STANDARD.decode(link_id.to_string()).unwrap_or_default();
            let url = String::from_utf8(url).unwrap_or_default();
            // println!("url={:?}", url);
            if url.is_empty() {
                return Err(anyhow::anyhow!("Invalid cover URL: {}", link_id));
            }

            // 下载图片
            let response = reqwest::get(url).await?;
            let bytes = response.bytes().await?;

            return Ok(bytes.to_vec());
        }

        let cover = service::get_cover(id, "album", size.as_str())?
            .ok_or_else(|| anyhow::anyhow!("Cover not found for song: {}", link_id))?;

        // println!("cover={:?}", cover);

        // 解码 base64
        let bytes = general_purpose::STANDARD
            .decode(&cover.base64)
            .map_err(|e| anyhow::anyhow!("Failed to decode base64 cover: {}", e))?;

        Ok(bytes)
    }

    async fn get_lyrics(&self, song_id: &str) -> Result<Vec<LyricLine>> {
        let lyrics = service::get_lyric(song_id)?;

        Ok(lyrics.into_iter().map(Self::convert_lyric).collect())
    }

    async fn get_audio_stream(&self, song_id: &str) -> Result<AudioStream> {
        let metadata = service::get_metadata_by_id(song_id)?
            .ok_or_else(|| anyhow::anyhow!("Song not found: {}", song_id))?;

        Ok(AudioStream::LocalFile(PathBuf::from(metadata.file_path)))
    }

    async fn scan_library(&self) -> Result<ScanProgress> {
        // TODO: 实现本地库扫描
        // 需要调用 readmeta 模块的逻辑
        // 这部分比较复杂,需要单独处理
        Ok(ScanProgress {
            status: ScanStatus::Idle,
            processed: 0,
            total: 0,
            current_file: None,
            error: Some("Local scan not implemented yet".to_string()),
        })
    }

    async fn list_albums(
        &self,
        pagination: Pagination,
        filter_text: Option<String>,
    ) -> Result<Vec<AlbumInfo>> {
        let mut albums = service::get_album_list()?;
        if filter_text.is_some() {
            let filter_text_lower = filter_text.as_ref().unwrap().to_lowercase();
            albums = albums
                .into_iter()
                .filter(|a| {
                    a.name.to_lowercase().contains(&filter_text_lower)
                        || a.artist.to_lowercase().contains(&filter_text_lower)
                })
                .collect();
        }

        // 分页
        let start = pagination.start();
        let end = pagination.end(albums.len());

        if start < albums.len() {
            albums = albums[start..end].to_vec();
        } else {
            albums = vec![];
        }

        Ok(albums
            .into_iter()
            .map(|album| AlbumInfo {
                id: album.id.to_string(),
                name: album.name,
                artist: album.artist,
                year: album.year,
                cover_art: Some(album.id.to_string()),
                song_count: 0,
            })
            .collect())
    }

    async fn get_album_by_id(&self, album_id: &str) -> Result<AlbumInfo> {
        let id = album_id
            .parse::<i64>()
            .map_err(|_| anyhow::anyhow!("Invalid album ID: {}", album_id))?;

        let album = service::album_by_id(id)?
            .ok_or_else(|| anyhow::anyhow!("Album not found: {}", album_id))?;

        Ok(AlbumInfo {
            id: album.id.to_string(),
            name: album.name,
            artist: album.artist,
            year: album.year,
            cover_art: Some(album.id.to_string()),
            song_count: 0, // TODO: 查询歌曲数量
        })
    }

    async fn get_album_songs(&self, album_id: &str) -> Result<Vec<UnifiedMetadata>> {
        let id = album_id
            .parse::<i64>()
            .map_err(|_| anyhow::anyhow!("Invalid album ID: {}", album_id))?;

        let songs = service::album_songs(id)?;

        Ok(songs
            .into_iter()
            .map(|s| self.convert_metadata(s))
            .collect())
    }

    async fn list_artists(&self) -> Result<Vec<ArtistInfo>> {
        let artists = service::artists()?;

        Ok(artists
            .into_iter()
            .map(|artist| ArtistInfo {
                id: artist.id.to_string(),
                name: artist.name,
                album_count: 0, // TODO: 查询专辑数量
                cover_art: if artist.cover.is_empty() {
                    None
                } else {
                    Some(base64::engine::general_purpose::STANDARD.encode(artist.cover.to_string()))
                },
            })
            .collect())
    }

    async fn get_artist_by_id(&self, artist_id: &str) -> Result<ArtistInfo> {
        let id = artist_id
            .parse::<i64>()
            .map_err(|_| anyhow::anyhow!("Invalid artist ID: {}", artist_id))?;

        let artist = service::artist_by_id(id)?
            .ok_or_else(|| anyhow::anyhow!("Artist not found: {}", artist_id))?;

        Ok(ArtistInfo {
            id: artist.id.to_string(),
            name: artist.name,
            album_count: 0, // TODO: 查询专辑数量
            cover_art: if artist.cover.is_empty() {
                None
            } else {
                Some(base64::engine::general_purpose::STANDARD.encode(artist.cover.to_string()))
            },
        })
    }

    async fn get_artist_songs(&self, artist_id: &str) -> Result<Vec<UnifiedMetadata>> {
        let id = artist_id
            .parse::<i64>()
            .map_err(|_| anyhow::anyhow!("Invalid artist ID: {}", artist_id))?;

        let songs = service::artist_songs(id)?;

        Ok(songs
            .into_iter()
            .map(|s| self.convert_metadata(s))
            .collect())
    }

    async fn list_genres(&self) -> Result<Vec<GenreInfo>> {
        let metadatas = service::get_metadata_list()?;
        if metadatas.is_empty() {
            return Ok(vec![]);
        }

        let mut genres = Vec::new();
        metadatas.iter().for_each(|m| {
            m.split_genre()
                .iter()
                .for_each(|g| genres.push(g.to_string()));
        });

        let mut set = HashSet::new();
        genres.iter().for_each(|g| {
            set.insert(g);
        });
        let mut genres = set
            .iter()
            .map(|n| GenreInfo {
                value: n.to_string(),
                album_count: 0,
                song_count: 0,
            })
            .collect::<Vec<_>>();
        // 排序
        genres.sort_by(|a, b| a.value.cmp(&b.value));
        return Ok(genres);
    }

    async fn get_genre_songs(&self, genre: &str) -> Result<Vec<UnifiedMetadata>> {
        // 使用数据源获取所有元数据(不分页,获取全部)
        let filter = MetadataFilter {
            page: Some(1),
            page_size: Some(100000), // 获取所有
            ..Default::default()
        };

        let metadatas = self.list_metadata(filter).await?;
        let genre_name = genre.to_string();

        // 筛选包含指定风格的歌曲
        let filtered_metadatas: Vec<_> = metadatas
            .into_iter()
            .filter(|m| {
                let genres = m.split_genre();
                genres.contains(&genre_name)
            })
            .collect();

        Ok(filtered_metadatas)
    }

    async fn get_random_songs(
        &self,
        size: Option<usize>,
        genre: Option<&str>,
        from_year: Option<&str>,
        to_year: Option<&str>,
    ) -> Result<Vec<UnifiedMetadata>> {
        // 调用数据库层的 get_random_songs
        let metadata_list = service::get_random_songs(size, genre, from_year, to_year)?;

        // 转换为 UnifiedMetadata
        Ok(metadata_list
            .into_iter()
            .map(|m| self.convert_metadata(m))
            .collect())
    }

    async fn search(&self, query: &str, pagination: Pagination) -> Result<SearchResult> {
        // 简单的搜索实现:使用 list_metadata 的关键字过滤
        let songs = self
            .list_metadata(MetadataFilter {
                keyword: Some(query.to_string()),
                ..Default::default()
            })
            .await?;

        // 分页
        let start = pagination.safe_start(songs.len());
        let end = pagination.end(songs.len());
        let songs = songs[start..end].to_vec();

        // TODO: 实现专辑和艺术家搜索
        Ok(SearchResult {
            songs,
            albums: vec![],
            artists: vec![],
        })
    }

    fn source_type(&self) -> DataSourceType {
        DataSourceType::Local
    }

    async fn health_check(&self) -> Result<()> {
        // 检查数据库连接
        database::connect_db()?;

        // 检查音乐目录
        let music_path = PathBuf::from(&self.music_dir);
        if !music_path.exists() {
            return Err(anyhow::anyhow!(
                "Music directory not found: {}",
                self.music_dir
            ));
        }

        Ok(())
    }

    async fn scan_music(&self) -> Result<()> {
        let config = get_config();
        readmeta::check_lost_file(&config.music_dir).await;
        log::log_info("start scan music");
        Ok(())
    }

    async fn scan_status(&self) -> Result<ScanProgress> {
        // 本地模式暂时返回空闲状态
        // TODO: 实现真正的扫描进度跟踪
        Ok(ScanProgress {
            status: ScanStatus::Idle,
            processed: 0,
            total: 0,
            current_file: None,
            error: None,
        })
    }

    async fn stream_song(&self, _song_id: &str, _range: Option<String>) -> Result<reqwest::Response> {
        // 本地数据源不支持流式传输,应该使用静态文件服务
        Err(anyhow::anyhow!("Local data source does not support streaming. Use file_url instead."))
    }
}
