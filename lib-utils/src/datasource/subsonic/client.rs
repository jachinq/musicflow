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

    /// 搜索
    pub async fn search3(&self, query: &str) -> Result<SubsonicSearchResult> {
        let params = vec![("query", query.to_string())];
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

    /// 构建流式URL
    pub fn get_stream_url(&self, id: &str, max_bitrate: u32, format: &str) -> String {
        let mut params = self.auth.get_auth_params();
        params.extend(vec![
            ("v", self.api_version.clone()),
            ("c", self.client_name.clone()),
            ("f", "json".to_string()),
            ("id", id.to_string()),
            ("maxBitRate", max_bitrate.to_string()),
            ("format", format.to_string()),
        ]);

        let query_string = params
            .iter()
            .map(|(k, v)| format!("{}={}", k, urlencoding::encode(v)))
            .collect::<Vec<_>>()
            .join("&");

        format!("{}/rest/stream?{}", self.base_url, query_string)
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
    pub bit_depth: Option<u32>,
    pub track: Option<String>,
    #[serde(deserialize_with = "deserialize_year")]
    pub year: Option<u32>,
    pub parent: Option<u32>,
    pub genre: Option<String>,
    pub duration: Option<u32>,
    pub bit_rate: Option<u32>,
    pub sampling_rate: Option<u32>,
    pub disc_number: Option<u32>,
    pub channel_count: Option<u32>,
    pub cover_art: Option<String>,
    pub size: Option<u64>,
    pub content_type: Option<String>,
    pub created: Option<String>,
    pub suffix: Option<String>,
    pub path: Option<String>,
    pub media_type: Option<String>,
    pub sort_name: Option<String>,
    pub user_rating: Option<u32>,
    pub r#type: Option<String>,
    pub is_dir: Option<bool>,
    pub is_video: Option<bool>,
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
    #[serde(deserialize_with = "deserialize_year")]
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

/// 艺术家响应包装
#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct ArtistsWrapper {
    #[serde(flatten)]
    base: BaseResponse,
    artists: Option<Artists>,
}

#[derive(Debug, Deserialize)]
struct Artists {
    index: Vec<ArtistIndex>,
}

#[derive(Debug, Deserialize)]
struct ArtistIndex {
    artist: Vec<SubsonicArtist>,
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
