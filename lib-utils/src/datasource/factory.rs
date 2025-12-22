// 数据源工厂
// 根据配置创建合适的数据源实例

use std::sync::Arc;
use crate::datasource::trait_def::MusicDataSource;
use crate::datasource::local::LocalDataSource;
// use crate::datasource::subsonic::SubsonicDataSource; // 后续实现时启用
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
pub fn create_data_source(_config: &Config) -> Arc<dyn MusicDataSource> {
    // TODO: 从 config 中读取数据源配置
    // 现在先返回本地数据源
    Arc::new(LocalDataSource::new(
        String::from("../music"),
        String::from("../data/musicflow.db"),
    ))
}
