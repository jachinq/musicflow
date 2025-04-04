use std::{
    fs::{self, OpenOptions},
    io::Write,
    path::Path,
    time::Instant,
};

#[derive(Debug, Clone)]
pub enum LogLevel {
    Info,
    Warn,
    Error,
    Debug,
}

pub fn log_info(info: &str) {
    log(LogLevel::Info, info);
}
pub fn log_warn(info: &str) {
    log(LogLevel::Warn, info);
}
pub fn log_err(info: &str) {
    log(LogLevel::Error, info);
}
pub fn log_debug(info: &str) {
    log(LogLevel::Debug, info);
}
pub fn log(level: LogLevel, info: &str) {
    let now = chrono::Local::now();
    let datetime = now.format("%Y-%m-%d %H:%M:%S");
    println!("<{:?}>[{}] {{{};}} ", level, datetime, info,);
}
pub fn log_time_used(start_time: Instant, info: &str) {
    let end_time = Instant::now();
    let now = chrono::Local::now();
    let datetime = now.format("%Y-%m-%d %H:%M:%S");
    println!(
        "<Info>[{}] {{cost={:?};i={};}}",
        datetime,
        end_time.duration_since(start_time),
        info,
    );
}

pub fn log_req(start: Instant, url: &str, ip: &str) {
    let app_name = "myimage";
    // 获取当前进程pid
    let pid = std::process::id();
    let now = chrono::Local::now();
    let datetime = now.format("%Y-%m-%d %H:%M:%S");
    // <app_name:pid>[datetime] {flow} {req;t=1;i=ip;u=url;}
    let end = Instant::now();
    let duration = end.duration_since(start);
    // 耗时请求重点关注：
    let focus = if duration.as_millis() > 1000 {
        "slow;"
    } else {
        ""
    };

    println!("<{app_name}:{pid}>[{datetime}] {{{focus}t={duration:?};i={ip};u={url};}}");
}

pub fn log_file(file_path: &str, level: &str, info: &str) -> Result<(), std::io::Error> {
    let now = chrono::Local::now();
    let datetime = now.format("%Y-%m-%d %H:%M:%S");
    let log_str = format!("<{}>[{}] {{{}}}\n", level, datetime, info,);
    println!("{}", log_str);

    // 确保路径存在
    let path = Path::new(file_path);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }

    // 以追加形式打开文件
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(file_path)?;

    // 写入日志
    file.write_all(log_str.as_bytes())?;
    Ok(())
}
