// 数据源抽象层模块
// 提供统一的接口来访问不同的音乐数据源(本地文件或Subsonic服务器)

pub mod trait_def;
pub mod types;
pub mod local;
pub mod subsonic;
pub mod factory;

// 重新导出核心类型和trait
pub use trait_def::MusicDataSource;
pub use types::{
    UnifiedMetadata, DataSourceType, AudioStream, MetadataFilter,
    CoverSize, ScanProgress, SearchResult,
};
pub use factory::create_data_source;
