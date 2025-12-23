// 数据源工厂
// 根据配置创建合适的数据源实例

use std::sync::Arc;
use crate::datasource::trait_def::MusicDataSource;
use crate::datasource::local::LocalDataSource;
use crate::datasource::subsonic::SubsonicDataSource;
use crate::config::Config;

/// 数据源模式
#[derive(Debug, Clone, PartialEq)]
pub enum DataSourceMode {
    /// 本地文件模式
    Local,
    /// Subsonic 服务器模式
    Subsonic,
}

/// 根据配置创建数据源
///
/// # 参数
/// * `config` - 应用配置
///
/// # 返回
/// * `Arc<dyn MusicDataSource>` - 数据源实例
pub fn create_data_source(config: &Config) -> Arc<dyn MusicDataSource> {
    let mode = config.data_source.mode.to_lowercase();

    match mode.as_str() {
        "subsonic" => {
            // 创建 Subsonic 数据源
            let subsonic_config = config
                .data_source
                .subsonic
                .as_ref()
                .expect("Subsonic config not found in config.json");

            println!("[DataSource] Creating Subsonic data source...");
            println!("  Server: {}", subsonic_config.server_url);
            println!("  Username: {}", subsonic_config.username);
            println!("  Max Bitrate: {} kbps", subsonic_config.max_bitrate);

            Arc::new(SubsonicDataSource::new(
                subsonic_config.server_url.clone(),
                subsonic_config.username.clone(),
                subsonic_config.password.clone(),
                subsonic_config.use_token_auth,
                subsonic_config.max_bitrate,
                subsonic_config.prefer_format.clone(),
            ))
        }
        "local" | _ => {
            // 创建本地文件数据源 (默认)
            let music_dir = if let Some(local_config) = &config.data_source.local {
                local_config.music_dir.clone()
            } else {
                // 兼容旧配置格式
                config.music_dir.clone()
            };

            println!("[DataSource] Creating Local data source...");
            println!("  Music Dir: {}", music_dir);
            println!("  DB Path: {}", config.db_path);

            Arc::new(LocalDataSource::new(music_dir, config.db_path.clone()))
        }
    }
}

/// 获取数据源模式
pub fn get_data_source_mode(config: &Config) -> DataSourceMode {
    match config.data_source.mode.to_lowercase().as_str() {
        "subsonic" => DataSourceMode::Subsonic,
        _ => DataSourceMode::Local,
    }
}
