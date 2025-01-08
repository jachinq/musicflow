use lib_utils::log::log_file;
use lib_utils::readmeta::read_metadata_into_db;
use lib_utils::thread_pool::ThreadPool;
use lib_utils::{config::get_config, database::table};
use std::sync::Arc;
use std::sync::Mutex;
use std::{path::Path, time};

const LOG_PATH: &str = "./initdb.log";

fn main() {
    // print_metadata("multiartist.flac");
    let start = time::Instant::now();
    let result = table::init();
    if result.is_err() {
        let _ = log_file(
            LOG_PATH,
            "error",
            &format!("init table error: {}", result.err().unwrap()),
        );
        return;
    }
    let result = metadata_to_db_task();
    if result.is_err() {
        let _ = log_file(
            LOG_PATH,
            "error",
            &format!("read_music error: {}", result.err().unwrap()),
        );
    }
    let elapsed = start.elapsed();
    let _ = log_file(
        LOG_PATH,
        "info",
        &format!("init db done.elapsed: {:.2?}", elapsed),
    );
}

fn read_file_recursive(path: &str) -> Vec<String> {
    let mut files = vec![];
    let path = Path::new(path);
    if path.is_dir() {
        for entry in path.read_dir().expect("Failed to read directory") {
            let entry = entry.expect("Failed to read directory entry");
            if entry.path().is_dir() {
                files.extend(read_file_recursive(&entry.path().to_str().unwrap()));
            } else {
                files.push(entry.path().to_str().unwrap().to_string());
            }
        }
    } else {
        files.push(path.to_str().unwrap().to_string());
    }

    let files = files
        .iter()
        .filter(|f| {
            let match_ext = f.ends_with(".flac") || f.ends_with(".mp3");
            if !match_ext {
                let _ = log_file(LOG_PATH, "info", &format!("ignore file: {}", f));
            }
            return match_ext;
        })
        .cloned()
        .collect();
    files
}

fn metadata_to_db_task() -> anyhow::Result<()> {
    // let limit = 16;
    let pool = ThreadPool::new(12);
    let config = get_config();
    let music_dir = config.music_dir.clone();
    let files = read_file_recursive(&music_dir);
    let total = files.len();
    let err_count = Arc::new(Mutex::new(vec![]));
    let count_arc = Arc::new(Mutex::new(0.0));
    for f in files.iter() {
        let file_path = f.clone();
        let music_dir = config.music_dir.clone();
        let err_count = err_count.clone();
        let count_arc = count_arc.clone();
        pool.execute(move || {
            let start = time::Instant::now();
            let result = read_metadata_into_db(file_path.clone(), music_dir.clone());
            if let Err(e) = result {
                if let Ok(mut err_vec) = err_count.lock() {
                    err_vec.push(e.to_string());
                }
            }

            let mut count = count_arc.lock().unwrap();
            *count += 1.0;
            let count = *count;
            let elapsed = start.elapsed();
            let _ = log_file(
                LOG_PATH,
                "info",
                &format!(
                    "------ {}/{} done, progress: {:.2}%, cost: {:.2?} ------",
                    count,
                    total,
                    count / total as f64 * 100.0,
                    elapsed
                ),
            );
        });
    }
    Ok(())
}
