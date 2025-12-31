// Subsonic HTTP 客户端
// 实现 Subsonic REST API 的调用

use anyhow::{Context, Result};
use reqwest::Client;
use serde::{Deserialize, Serialize};

use super::auth::SubsonicAuth;

/// Subsonic API 客户端
pub struct SubsonicClient {
    base_url: String,
    auth: SubsonicAuth,
    client: Client,
    api_version: String,
    client_name: String,
}

impl SubsonicClient {
    /// 创建新的 Subsonic 客户端
    ///
    /// # 参数
    /// * `base_url` - Subsonic 服务器地址 (如 "http://music.example.com")
    /// * `username` - 用户名
    /// * `password` - 密码
    /// * `use_token` - 是否使用 token 认证
    /// * `api_version` - API 版本 (如 "1.16.1")
    /// * `client_name` - 客户端名称 (如 "MusicFlow")
    pub fn new(
        base_url: String,
        username: String,
        password: String,
        use_token: bool,
        api_version: String,
        client_name: String,
    ) -> Self {
        // 移除 base_url 末尾的斜杠
        let base_url = base_url.trim_end_matches('/').to_string();

        Self {
            base_url,
            auth: SubsonicAuth::new(username, password, use_token),
            client: Client::new(),
            api_version,
            client_name,
        }
    }

    /// Ping 服务器,检查连接状态
    pub async fn ping(&self) -> Result<()> {
        let response: SubsonicResponse<BaseResponse> = self.get("rest/ping", vec![]).await?;

        if response.subsonic_response.status == "ok" {
            Ok(())
        } else {
            Err(anyhow::anyhow!(
                "Ping failed: {:?}",
                response.subsonic_response.error
            ))
        }
    }

    /// 扫描音乐库
    pub async fn scan_music(&self) -> Result<()> {
        let response: SubsonicResponse<BaseResponse> = self.get("rest/startScan", vec![]).await?;
        match response.subsonic_response.status == "ok" {
            true => Ok(()),
            false => Err(anyhow::anyhow!(
                "Scan music failed: {:?}",
                response.subsonic_response.error
            )),
        }
    }

    /// 获取扫描状态
    pub async fn get_scan_status(&self) -> Result<SubsonicScanStatus> {
        let response: SubsonicResponse<ScanStatusWrapper> = self.get("rest/getScanStatus", vec![]).await?;

        response
            .subsonic_response
            .scan_status
            .ok_or_else(|| anyhow::anyhow!("Failed to get scan status"))
    }

    /// 获取单个歌曲信息
    pub async fn get_song(&self, id: &str) -> Result<SubsonicSong> {
        let params = vec![("id", id.to_string())];
        let response: SubsonicResponse<SongWrapper> = self.get("rest/getSong", params).await?;

        response
            .subsonic_response
            .song
            .ok_or_else(|| anyhow::anyhow!("Song not found: {}", id))
    }

    /// 获取专辑列表
    pub async fn get_album_list2(
        &self,
        list_type: &str,
        size: usize,
        offset: usize,
    ) -> Result<Vec<SubsonicAlbum>> {
        let params = vec![
            ("type", list_type.to_string()),
            ("size", size.to_string()),
            ("offset", offset.to_string()),
        ];
        let response: SubsonicResponse<AlbumList2Wrapper> =
            self.get("rest/getAlbumList2", params).await?;

        Ok(response
            .subsonic_response
            .album_list2
            .map(|list| list.album)
            .unwrap_or_default())
    }

    /// 获取专辑详情
    pub async fn get_album(&self, id: &str) -> Result<SubsonicAlbum> {
        let params = vec![("id", id.to_string())];
        let response: SubsonicResponse<AlbumWrapper> = self.get("rest/getAlbum", params).await?;

        response
            .subsonic_response
            .album
            .ok_or_else(|| anyhow::anyhow!("Album not found: {}", id))
    }

    /// 获取艺术家列表
    pub async fn get_artists(&self) -> Result<Vec<SubsonicArtist>> {
        let response: SubsonicResponse<ArtistsWrapper> =
            self.get("rest/getArtists", vec![]).await?;

        let artists = response
            .subsonic_response
            .artists
            .map(|a| {
                a.index
                    .into_iter()
                    .flat_map(|idx| idx.artist)
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();

        Ok(artists)
    }

    /// 获取单个艺术家信息
    pub async fn get_artist(&self, id: &str) -> Result<SubsonicArtistDetail> {
        let params = vec![("id", id.to_string())];
        let response: SubsonicResponse<ArtistWrapper> = self.get("rest/getArtist", params).await?;

        response
            .subsonic_response
            .artist
            .ok_or_else(|| anyhow::anyhow!("Artist not found: {}", id))
    }

    /// 获取单个艺术家的歌曲列表
    pub async fn get_top_songs(&self, artist_name: &str) -> Result<Vec<SubsonicSong>> {
        let params = vec![("artist", artist_name.to_string())];
        let response: SubsonicResponse<TopSongsWrapper> =
            self.get("rest/getTopSongs", params).await?;

        response
            .subsonic_response
            .top_songs
            .unwrap_or(TopSongs { song: None })
            .song
            // .map(|t| t.song.unwrap_or_default())
            .ok_or_else(|| anyhow::anyhow!("top songs not found: {}", artist_name))
    }

    /// 获取风格列表
    pub async fn get_genres(&self) -> Result<Vec<Genre>> {
        let response: SubsonicResponse<GenreWrapper> = self.get("rest/getGenres", vec![]).await?;

        Ok(response
            .subsonic_response
            .genres
            .unwrap_or(GenreList {
                genre: Some(vec![]),
            })
            .genre
            .unwrap_or_default())
    }

    /// 获取风格歌曲列表
    pub async fn get_genre_songs(&self, genre: &str) -> Result<Vec<SubsonicSong>> {
        let params = vec![("genre", genre.to_string())];
        let response: SubsonicResponse<SongsByGenreWrapper> =
            self.get("rest/getSongsByGenre", params).await?;

        response
            .subsonic_response
            .songs_by_genre
            .song
            .ok_or_else(|| anyhow::anyhow!("genre songs not found: {}", genre))
    }
    /// 搜索
    pub async fn search3(
        &self,
        query: &str,
        offset: usize,
        page_size: usize,
    ) -> Result<SubsonicSearchResult> {
        let params = vec![
            ("query", query.to_string()),
            ("songOffset", offset.to_string()),
            ("songCount", page_size.to_string()),
            ("albumOffset", offset.to_string()),
            ("albumCount", page_size.to_string()),
            ("artistOffset", offset.to_string()),
            ("artistCount", page_size.to_string()),
        ];
        let response: SubsonicResponse<SearchResult3Wrapper> =
            self.get("rest/search3", params).await?;

        Ok(response
            .subsonic_response
            .search_result3
            .unwrap_or_default())
    }

    /// 获取封面 URL
    pub fn get_cover_art_url(&self, id: &str, size: &str) -> String {
        let mut params = self.auth.get_auth_params();
        params.extend(vec![
            ("v", self.api_version.clone()),
            ("c", self.client_name.clone()),
            ("f", "json".to_string()),
            ("id", id.to_string()),
            ("size", size.to_string()),
        ]);

        let query_string = params
            .iter()
            .map(|(k, v)| format!("{}={}", k, urlencoding::encode(v)))
            .collect::<Vec<_>>()
            .join("&");

        format!("{}/rest/getCoverArt?{}", self.base_url, query_string)
    }

    /// 获取歌词
    pub async fn get_lyrics(&self, artist: &str, title: &str) -> Result<Option<SubsonicLyrics>> {
        let params = vec![("artist", artist.to_string()), ("title", title.to_string())];
        let response: SubsonicResponse<LyricsWrapper> = self.get("rest/getLyrics", params).await?;

        Ok(response.subsonic_response.lyrics)
    }

    /// 获取随机歌曲
    ///
    /// # 参数
    /// * `size` - 返回的最大歌曲数量,默认 10,最大 500
    /// * `genre` - 可选,按流派筛选
    /// * `from_year` - 可选,只返回此年份之后(含)发布的歌曲
    /// * `to_year` - 可选,只返回此年份之前(含)发布的歌曲
    pub async fn get_random_songs(
        &self,
        size: Option<usize>,
        genre: Option<&str>,
        from_year: Option<&str>,
        to_year: Option<&str>,
    ) -> Result<Vec<SubsonicSong>> {
        let mut params = vec![("size", size.unwrap_or(10).min(500).to_string())];

        if let Some(g) = genre {
            if !g.is_empty() {
                params.push(("genre", g.to_string()));
            }
        }

        if let Some(fy) = from_year {
            if !fy.is_empty() {
                params.push(("fromYear", fy.to_string()));
            }
        }

        if let Some(ty) = to_year {
            if !ty.is_empty() {
                params.push(("toYear", ty.to_string()));
            }
        }

        let response: SubsonicResponse<RandomSongsWrapper> =
            self.get("rest/getRandomSongs", params).await?;

        Ok(response
            .subsonic_response
            .random_songs
            .and_then(|rs| rs.song)
            .unwrap_or_default())
    }

    /// 获取音频流(返回 Response 供代理使用)
    pub async fn stream_song(&self, id: &str, range: Option<String>) -> Result<reqwest::Response> {
        let mut params = self.auth.get_auth_params();
        params.extend(vec![
            ("v", self.api_version.clone()),
            ("c", self.client_name.clone()),
            ("f", "json".to_string()),
            ("id", id.to_string()),
        ]);

        let url = format!("{}/rest/stream", self.base_url);

        let mut request = self.client.get(&url).query(&params);

        // 如果有 Range 请求头,转发给 Subsonic
        if let Some(range) = range {
            request = request.header("Range", range);
        }

        let response = request
            .send()
            .await
            .context("Failed to stream from Subsonic server")?;

        Ok(response)
    }

    /// 构建流式URL(返回本地代理URL)
    pub fn get_stream_url(&self, id: &str, _max_bitrate: u32, _format: &str) -> String {
        // 返回本地代理端点,而不是直接的 Subsonic URL
        format!("/api/stream/{}", id)
    }

    /// 获取所有播放列表
    pub async fn get_playlists(&self) -> Result<Vec<SubsonicPlaylist>> {
        let response: SubsonicResponse<PlaylistsWrapper> =
            self.get("rest/getPlaylists", vec![]).await?;

        Ok(response
            .subsonic_response
            .playlists)
    }

    /// 获取播放列表详情
    pub async fn get_playlist(&self, id: &str) -> Result<SubsonicPlaylist> {
        let params = vec![("id", id.to_string())];
        let response: SubsonicResponse<PlaylistWrapper> =
            self.get("rest/getPlaylist", params).await?;

        response
            .subsonic_response
            .playlist
            .ok_or_else(|| anyhow::anyhow!("Playlist not found: {}", id))
    }

    /// 创建播放列表
    pub async fn create_playlist(&self, name: &str, song_ids: &[String]) -> Result<()> {
        let mut params = vec![("name", name.to_string())];

        // 添加歌曲 ID
        for song_id in song_ids {
            params.push(("songId", song_id.clone()));
        }

        let response: SubsonicResponse<BaseResponse> =
            self.get("rest/createPlaylist", params).await?;

        if response.subsonic_response.status != "ok" {
            return Err(anyhow::anyhow!("Failed to create playlist: {:?}", response.subsonic_response.error));
        }
        Ok(())
    }

    /// 更新播放列表
    pub async fn update_playlist(
        &self,
        playlist_id: &str,
        name: Option<&str>,
        comment: Option<&str>,
        public: Option<bool>,
        song_ids_to_add: &[String],
        song_indexes_to_remove: &[u32],
    ) -> Result<()> {
        let mut params = vec![("playlistId", playlist_id.to_string())];

        if let Some(n) = name {
            params.push(("name", n.to_string()));
        }

        if let Some(c) = comment {
            params.push(("comment", c.to_string()));
        }

        if let Some(p) = public {
            params.push(("public", p.to_string()));
        }

        // 添加要添加的歌曲
        for song_id in song_ids_to_add {
            params.push(("songIdToAdd", song_id.clone()));
        }

        // 添加要删除的歌曲索引
        for index in song_indexes_to_remove {
            params.push(("songIndexToRemove", index.to_string()));
        }

        let response: SubsonicResponse<BaseResponse> =
            self.get("rest/updatePlaylist", params).await?;

        if response.subsonic_response.status == "ok" {
            Ok(())
        } else {
            Err(anyhow::anyhow!(
                "Update playlist failed: {:?}",
                response.subsonic_response.error
            ))
        }
    }

    /// 删除播放列表
    pub async fn delete_playlist(&self, id: &str) -> Result<()> {
        let params = vec![("id", id.to_string())];
        let response: SubsonicResponse<BaseResponse> =
            self.get("rest/deletePlaylist", params).await?;

        if response.subsonic_response.status == "ok" {
            Ok(())
        } else {
            Err(anyhow::anyhow!(
                "Delete playlist failed: {:?}",
                response.subsonic_response.error
            ))
        }
    }

    /// 发送 GET 请求
    async fn get<T>(&self, endpoint: &str, mut params: Vec<(&str, String)>) -> Result<T>
    where
        T: for<'de> Deserialize<'de>,
    {
        // 添加认证参数
        let auth_params = self.auth.get_auth_params();
        params.extend(auth_params.iter().map(|(k, v)| (*k, v.clone())));

        // 添加通用参数
        params.push(("v", self.api_version.clone()));
        params.push(("c", self.client_name.clone()));
        params.push(("f", "json".to_string()));

        let url = format!("{}/{}", self.base_url, endpoint);
        println!(
            "send {}?{}",
            url,
            params
                .iter()
                .map(|(k, v)| format!("{}={}", k, v))
                .collect::<Vec<_>>()
                .join("&")
        );

        let response = self
            .client
            .get(&url)
            .query(&params)
            .send()
            .await
            .context("Failed to send request to Subsonic server")?;

        let status = response.status();
        if !status.is_success() {
            return Err(anyhow::anyhow!("HTTP error: {}", status));
        }

        let response = response.json::<T>().await;

        match response {
            Ok(json) => Ok(json),
            Err(e) => {
                println!("url={} response={:?}", url, e);

                let response = self
                    .client
                    .get(&url)
                    .query(&params)
                    .send()
                    .await
                    .context("Failed to send request to Subsonic server")?;
                println!("json fail={:?}", response.text().await);

                return Err(anyhow::anyhow!("Failed to parse Subsonic response"));
            }
        }
    }
}

/// Subsonic API 响应包装
#[derive(Debug, Deserialize)]
#[serde(rename_all = "kebab-case")]
struct SubsonicResponse<T> {
    #[serde(rename = "subsonic-response")]
    subsonic_response: T,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct BaseResponse {
    status: String,
    #[serde(default)]
    version: Option<String>,
    #[serde(default)]
    error: Option<SubsonicError>,
    // 兼容 Qm-Music 和 OpenSubsonic 的额外字段
    #[serde(default, rename = "type")]
    server_type: Option<String>,
    #[serde(default, rename = "openSubsonic")]
    open_subsonic: Option<bool>,
    #[serde(default, rename = "serverVersion")]
    server_version: Option<String>,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct SubsonicError {
    code: i32,
    message: String,
}

/// 歌曲响应
#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct SongWrapper {
    #[serde(flatten)]
    base: BaseResponse,
    song: Option<SubsonicSong>,
}

/// 艺术家歌曲响应
#[derive(Debug, Deserialize)]
#[allow(dead_code)]
#[serde(rename_all = "camelCase")]
struct TopSongsWrapper {
    #[serde(flatten)]
    base: BaseResponse,
    top_songs: Option<TopSongs>,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct TopSongs {
    song: Option<Vec<SubsonicSong>>,
}

/// Subsonic 歌曲信息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubsonicSong {
    pub id: String,
    pub title: String,
    pub album: Option<String>,
    pub album_id: Option<String>,
    pub album_artists: Option<Vec<SubsonicArtist>>,
    pub artist: Option<String>,
    pub artist_id: Option<String>,
    pub artists: Option<Vec<SubsonicArtist>>,
    pub display_album_artist: Option<String>,
    pub display_artist: Option<String>,
    // pub bit_depth: Option<u32>,
    #[serde(default, deserialize_with = "deserialize_year")]
    pub track: Option<u32>,
    #[serde(default, deserialize_with = "deserialize_year")]
    pub year: Option<u32>,
    // #[serde(default, deserialize_with = "deserialize_year")]
    // pub parent: Option<u32>,
    pub genre: Option<String>,
    pub duration: Option<u32>,
    pub bit_rate: Option<u32>,
    // pub sampling_rate: Option<u32>,
    // pub disc_number: Option<u32>,
    // pub channel_count: Option<u32>,
    pub cover_art: Option<String>,
    // pub size: Option<u64>,
    pub content_type: Option<String>,
    // pub created: Option<String>,
    pub suffix: Option<String>,
    pub path: Option<String>,
    // pub media_type: Option<String>,
    // pub sort_name: Option<String>,
    // pub user_rating: Option<u32>,
    // pub r#type: Option<String>,
    // pub is_dir: Option<bool>,
    // pub is_video: Option<bool>,
}

/// Subsonic 专辑信息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubsonicAlbum {
    pub id: String,
    pub name: String,
    pub artist: Option<String>,
    pub display_artist: Option<String>,
    pub artist_id: Option<String>,
    pub artists: Option<Vec<SubsonicArtist>>,
    pub cover_art: Option<String>,
    pub song_count: Option<u32>,
    pub duration: Option<u32>,
    pub created: Option<String>,
    #[serde(default, deserialize_with = "deserialize_year")]
    pub year: Option<u32>,
    pub genre: Option<String>,
    pub song: Option<Vec<SubsonicSong>>,
    pub sort_name: Option<String>,
    pub user_rating: Option<u32>,
}

/// 专辑列表响应包装
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)]
struct AlbumList2Wrapper {
    #[serde(flatten)]
    base: BaseResponse,
    album_list2: Option<AlbumList2>,
}

#[derive(Debug, Deserialize)]
struct AlbumList2 {
    album: Vec<SubsonicAlbum>,
}

/// 专辑详情响应包装
#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct AlbumWrapper {
    #[serde(flatten)]
    base: BaseResponse,
    album: Option<SubsonicAlbum>,
}

/// Subsonic 艺术家信息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubsonicArtist {
    pub id: Option<String>,
    pub name: Option<String>,
    pub album_count: Option<u32>,
    pub cover_art: Option<String>,
}

/// Subsonic 艺术家详细信息(包含专辑列表)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubsonicArtistDetail {
    pub id: Option<String>,
    pub name: Option<String>,
    pub album_count: Option<u32>,
    pub song_count: Option<u32>,
    pub user_rating: Option<u32>,
    pub cover_art: Option<String>,
    pub album: Option<Vec<SubsonicAlbum>>,
}

/// 艺术家响应包装
#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct ArtistsWrapper {
    #[serde(flatten)]
    base: BaseResponse,
    artists: Option<Artists>,
}

/// 单个艺术家响应包装
#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct ArtistWrapper {
    #[serde(flatten)]
    base: BaseResponse,
    artist: Option<SubsonicArtistDetail>,
}

#[derive(Debug, Deserialize)]
struct Artists {
    index: Vec<ArtistIndex>,
}

#[derive(Debug, Deserialize)]
struct ArtistIndex {
    artist: Vec<SubsonicArtist>,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct GenreWrapper {
    #[serde(flatten)]
    base: BaseResponse,
    pub genres: Option<GenreList>,
}
#[derive(Debug, Deserialize)]
struct GenreList {
    pub genre: Option<Vec<Genre>>,
}
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Genre {
    pub value: Option<String>,
    pub album_count: Option<u32>,
    pub song_count: Option<u32>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SongsByGenreWrapper {
    pub songs_by_genre: SongsByGenre,
}
#[derive(Debug, Deserialize)]
pub struct SongsByGenre {
    pub song: Option<Vec<SubsonicSong>>,
}

/// 搜索结果
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SubsonicSearchResult {
    pub song: Option<Vec<SubsonicSong>>,
    pub album: Option<Vec<SubsonicAlbum>>,
    pub artist: Option<Vec<SubsonicArtist>>,
}

/// 搜索结果响应包装
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)]
struct SearchResult3Wrapper {
    #[serde(flatten)]
    base: BaseResponse,
    search_result3: Option<SubsonicSearchResult>,
}

/// Subsonic 歌词信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubsonicLyrics {
    pub artist: Option<String>,
    pub text: Option<String>, // 歌词文本
}

/// 歌词响应包装
#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct LyricsWrapper {
    #[serde(flatten)]
    base: BaseResponse,
    lyrics: Option<SubsonicLyrics>,
}

/// 随机歌曲响应
#[derive(Debug, Deserialize)]
#[allow(dead_code)]
#[serde(rename_all = "camelCase")]
struct RandomSongsWrapper {
    #[serde(flatten)]
    base: BaseResponse,
    random_songs: Option<RandomSongs>,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct RandomSongs {
    song: Option<Vec<SubsonicSong>>,
}

// 自定义反序列化函数，同时支持 String 和 u32 类型的 year 字段
fn deserialize_year<'de, D>(deserializer: D) -> Result<Option<u32>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    use serde::de::{self, Deserialize};

    #[derive(Deserialize)]
    #[serde(untagged)]
    enum YearValue {
        Number(u32),
        String(String),
    }

    match Option::<YearValue>::deserialize(deserializer)? {
        None => Ok(None),
        Some(YearValue::Number(n)) => Ok(Some(n)),
        Some(YearValue::String(s)) => {
            if s.is_empty() {
                Ok(None)
            } else {
                s.parse::<u32>().map(Some).map_err(de::Error::custom)
            }
        }
    }
}

// 添加 urlencoding 辅助函数
mod urlencoding {
    pub fn encode(s: &str) -> String {
        url::form_urlencoded::byte_serialize(s.as_bytes()).collect()
    }
}

/// Subsonic 扫描状态
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubsonicScanStatus {
    pub scanning: bool,
    pub count: Option<u32>,
}

/// 扫描状态响应包装
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)]
struct ScanStatusWrapper {
    #[serde(flatten)]
    base: BaseResponse,
    scan_status: Option<SubsonicScanStatus>,
}

/// Subsonic 播放列表信息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubsonicPlaylist {
    pub id: String,
    pub name: String,
    pub owner: Option<String>,
    pub public: Option<bool>,
    pub song_count: Option<u32>,
    pub duration: Option<u32>,
    pub created: Option<String>,
    pub changed: Option<String>,
    pub comment: Option<String>,
    pub cover_art: Option<String>,
    pub entry: Option<Vec<SubsonicSong>>,
}

/// 播放列表列表响应包装
#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct PlaylistsWrapper {
    #[serde(flatten)]
    base: BaseResponse,
    playlists: Vec<SubsonicPlaylist>,
}

/// 单个播放列表响应包装
#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct PlaylistWrapper {
    #[serde(flatten)]
    base: BaseResponse,
    playlist: Option<SubsonicPlaylist>,
}
