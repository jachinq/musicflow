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
        let response: SubsonicResponse<()> = self.get("rest/ping", vec![]).await?;

        if response.subsonic_response.status == "ok" {
            Ok(())
        } else {
            Err(anyhow::anyhow!("Ping failed: {:?}", response.subsonic_response.error))
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

        response
            .json()
            .await
            .context("Failed to parse Subsonic response")
    }
}

/// Subsonic API 响应包装
#[derive(Debug, Deserialize)]
#[serde(rename_all = "kebab-case")]
struct SubsonicResponse<T> {
    subsonic_response: SubsonicResponseInner<T>,
}

#[derive(Debug, Deserialize)]
struct SubsonicResponseInner<T> {
    status: String,
    version: Option<String>,
    #[serde(flatten)]
    data: Option<T>,
    error: Option<SubsonicError>,
    song: Option<SubsonicSong>,
}

#[derive(Debug, Deserialize)]
struct SubsonicError {
    code: i32,
    message: String,
}

/// 歌曲响应包装
#[derive(Debug, Deserialize)]
struct SongWrapper {
    song: Option<SubsonicSong>,
}

/// Subsonic 歌曲信息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubsonicSong {
    pub id: String,
    pub title: String,
    pub album: Option<String>,
    pub artist: Option<String>,
    pub track: Option<u32>,
    pub year: Option<u32>,
    pub genre: Option<String>,
    pub duration: Option<u32>,
    pub bitrate: Option<u32>,
    pub cover_art: Option<String>,
    pub size: Option<u64>,
    pub content_type: Option<String>,
    pub suffix: Option<String>,
    pub path: Option<String>,
}

// 添加 urlencoding 辅助函数
mod urlencoding {
    pub fn encode(s: &str) -> String {
        url::form_urlencoded::byte_serialize(s.as_bytes()).collect()
    }
}
