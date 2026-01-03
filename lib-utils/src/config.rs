use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Config {
    pub ip: String,        // 绑定的 IP 地址
    pub port: u64,         // 绑定的端口号
    pub web_dir: String,   // 前端静态文件目录
    #[serde(default)]
    pub music_dir: String, // 音乐文件目录 (本地模式使用)
    pub db_path: String,   // 数据库文件路径
    pub debug: bool,       // 是否开启调试模式

    // 数据源配置
    #[serde(default)]
    pub data_source: DataSourceConfig,
}

impl Config {
    pub fn is_local_mode(&self) -> bool {
        self.data_source.mode == "local"
    }

    pub fn is_subsonic_mode(&self) -> bool {
        self.data_source.mode == "subsonic"
    }
    
}

/// 数据源配置
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DataSourceConfig {
    /// 数据源模式: "local" 或 "subsonic"
    #[serde(default = "default_mode")]
    pub mode: String,

    /// 本地文件配置 (mode = "local" 时使用)
    #[serde(default)]
    pub local: Option<LocalConfig>,

    /// Subsonic 服务器配置 (mode = "subsonic" 时使用)
    pub subsonic: Option<SubsonicConfig>,
}

impl Default for DataSourceConfig {
    fn default() -> Self {
        Self {
            mode: "local".to_string(),
            local: Some(LocalConfig::default()),
            subsonic: None,
        }
    }
}

fn default_mode() -> String {
    "local".to_string()
}

/// 本地文件配置
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LocalConfig {
    /// 音乐文件目录
    pub music_dir: String,
}

impl Default for LocalConfig {
    fn default() -> Self {
        Self {
            music_dir: "../music".to_string(),
        }
    }
}

/// Subsonic 服务器配置
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SubsonicConfig {
    /// Subsonic 服务器地址
    pub server_url: String,

    /// 用户名
    pub username: String,

    /// 密码 (或 token)
    pub password: String,

    /// 是否使用 token 认证 (推荐)
    #[serde(default = "default_use_token")]
    pub use_token_auth: bool,

    /// API 版本
    #[serde(default = "default_api_version")]
    pub api_version: String,

    /// 客户端名称
    #[serde(default = "default_client_name")]
    pub client_name: String,

    /// 最大比特率 (kbps)
    #[serde(default = "default_max_bitrate")]
    pub max_bitrate: u32,

    /// 首选格式
    #[serde(default = "default_format")]
    pub prefer_format: String,

    /// 缓存 TTL (秒)
    #[serde(default = "default_cache_ttl")]
    pub cache_ttl_seconds: u64,
}

fn default_use_token() -> bool {
    true
}

fn default_api_version() -> String {
    "1.16.1".to_string()
}

fn default_client_name() -> String {
    "MusicFlow".to_string()
}

fn default_max_bitrate() -> u32 {
    320
}

fn default_format() -> String {
    "mp3".to_string()
}

fn default_cache_ttl() -> u64 {
    3600
}

// 获取 config.json 中的配置信息
pub fn get_config() -> Config {
    let mut config_path = "./conf/config.json";
    // 判断配置文件是否存在
    if !Path::new(config_path).exists() {
        config_path = "../conf/config.json"; // 尝试从上级目录查找配置文件
    }
    if !Path::new(config_path).exists() {
        println!("config.json not found, please check the file path: ./conf/config.json or ../conf/config.json");
        std::process::exit(1);
    }
    let config =
        std::fs::read_to_string(config_path).expect("Failed to read config.json to string");
    let config = serde_json::from_str::<Config>(&config)
        .expect("Failed to parse config.json to json, please check the file content");
    config
}
