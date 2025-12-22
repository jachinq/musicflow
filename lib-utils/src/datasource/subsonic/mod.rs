// Subsonic API 客户端模块
// 实现 Subsonic REST API 的调用和数据源适配

pub mod auth;
pub mod client;
pub mod mapper;
pub mod datasource;

// 重新导出核心类型
pub use datasource::SubsonicDataSource;
