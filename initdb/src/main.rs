use anyhow::Error;
use anyhow::Result;
use lib_utils::database::service::add_artist;
use lib_utils::database::service::album_song_by_id;
use lib_utils::database::service::artist_by_name;
use lib_utils::database::service::artist_song_by_song_id;
use lib_utils::database::service::get_cover;
use lib_utils::database::service::get_lyric;
use lib_utils::log::log_file;
use lib_utils::thread_pool::ThreadPool;
use lib_utils::{
    config::get_config,
    database::{
        service::{
            add_album, add_album_song, add_artist_songs, add_covers, add_lyrics, add_metadata,
            get_album_by_name, get_metadata_by_title_artist,
        },
        table,
    },
    readmeta::read_metadata,
};
use std::sync::Arc;
use std::sync::Mutex;
use std::{path::Path, time};

const LOG_PATH: &str = "./initdb.log";

fn main() {
    // print_metadata("multiartist.flac");
    let start = time::Instant::now();
    let result = table::init();
    if result.is_err() {
        let _ = log_file(LOG_PATH, "error", &format!("init table error: {}", result.err().unwrap()));
        return;
    }
    let result = metadata_to_db_task();
    if result.is_err() {
        let _ = log_file(LOG_PATH, "error", &format!("read_music error: {}", result.err().unwrap()));
    }
    let elapsed = start.elapsed();
    let _ = log_file(LOG_PATH, "info", &format!("init db done.elapsed: {:.2?}", elapsed));
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
            let result = single_build_metadata(file_path.clone(), music_dir.clone());
            if let Err(e) = result {
                if let Ok(mut err_vec) = err_count.lock() {
                    err_vec.push(e.to_string());
                }
            }
            
            let mut count = count_arc.lock().unwrap();
            *count += 1.0;
            let count = *count;
            let elapsed = start.elapsed();
            let _ = log_file(LOG_PATH, "info", &format!(
                "------ {}/{} done, progress: {:.2}%, cost: {:.2?} ------",
                count,
                total,
                count / total as f64 * 100.0,
                elapsed
            ));
        });
    }
    Ok(())
}

fn single_build_metadata(file_path: String, music_dir: String) -> Result<(), Error> {
    let file_path = &file_path;
    let music_dir = &music_dir;
    let path = Path::new(&file_path);
    let file_name = path.file_name();
    if file_name.is_none() {
        let _ = log_file(LOG_PATH, "error", &format!("file_name is none: {}", file_path));
        return Err(Error::msg("file_name is none"));
    }
    let file_name = file_name.unwrap().to_str().unwrap().to_string();

    // print_metadata(f);
    let metadata = read_metadata(file_path);
    if let Ok(mut mymetadata) = metadata {
        mymetadata.build_genre(file_path, &music_dir);
        let mut metadata = mymetadata.build_metadata();
        metadata.file_name = file_name.clone().replace("\\", "/");
        metadata.file_path = file_path.replace("\\", "/");
        metadata.file_url = file_path.replace(music_dir, "").replace("\\", "/");

        let exist = get_metadata_by_title_artist(&metadata.title, &metadata.artist)?;
        let song_id = if exist.is_none() {
            let _ = add_metadata(&metadata)?;
            metadata.id.clone()
        } else {
            exist.unwrap().id.clone()
        };

        let album = mymetadata.build_album();
        let album_id = if let Some(exist) = get_album_by_name(&album.name)? {
            exist.id
        } else {
            add_album(&album)?
        };

        let album_song = mymetadata.build_album_song(&song_id, album_id);
        let album_song_size = if let Some(_) = album_song_by_id(&song_id, album_id)? {
            0
        } else {
            add_album_song(&album_song)?
        };

        let artists = mymetadata.build_artist();
        let mut artist_ids = Vec::new();
        for artist in artists {
            if let Some(exist) = artist_by_name(&artist.name)? {
                if exist.id > 0 && !artist_ids.contains(&exist.id) {
                    artist_ids.push(exist.id);
                }
            } else {
                artist_ids.push(add_artist(&artist)?);
            }
        }

        let mut artist_songs = mymetadata.build_artist_songs(&song_id, &artist_ids);
        if let Some(exist) = artist_song_by_song_id(&song_id)? {
            artist_songs.retain(|a| exist.artist_id != a.artist_id && exist.song_id != a.song_id);
        };
        let artist_song_size = add_artist_songs(&artist_songs)?;

        let mut covers = mymetadata.build_covers(album_id, "album");
        let mut exist_cover = vec![];
        for cover in &covers {
            if let Some(exist) = get_cover(album_id, "", &cover.size)? {
                exist_cover.push(exist.size);
            }
        }
        covers.retain(|c| !exist_cover.contains(&c.size));
        let cover_size = add_covers(covers)?;

        let lyrics = mymetadata.build_lyrics(&metadata.id);
        let exist = get_lyric(&song_id)?;
        let lyric_size = if exist.len() > 0 {
            exist.len()
        } else {
            add_lyrics(lyrics)?
        };

        let _ = log_file(LOG_PATH, "info", &format!(
            "title: {}, album: {}-{}({}), artists: {}({}), covers: {}, lyrics: {}",
            metadata.title,
            album.name,
            album_id,
            album_song_size,
            artist_ids.len(),
            artist_song_size,
            cover_size,
            lyric_size
        ));
    }
    Ok(())
}
