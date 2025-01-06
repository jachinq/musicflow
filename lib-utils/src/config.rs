use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Config {
    pub ip: String,        // 绑定的 IP 地址
    pub port: u64,         // 绑定的端口号
    pub web_dir: String,   // 前端静态文件目录
    pub music_dir: String, // 音乐文件目录
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
