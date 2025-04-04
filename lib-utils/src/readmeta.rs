use anyhow::{Error, Ok, Result};
use image::GenericImageView;
use regex::Regex;
use std::fs::File;
use symphonia::core::formats::FormatOptions;
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::{MetadataOptions, Tag, Value, Visual};
use symphonia::core::probe::{Hint, ProbeResult};

use crate::comm::is_music_file;
use crate::database::service::Metadata;
use crate::database::service::*;
use crate::image::{compress_img, resize_image};
use crate::log::log_file;
use std::path::Path;

// 用于数据预处理的meta结构
#[derive(Debug, Clone, Default)]
pub struct PreMetadata {
    pub title: String,
    pub artist: String,
    pub album: String,
    pub album_artist: String,
    pub year: String,
    pub genre: String,
    pub duration: f64,
    pub track: String,
    pub language: String,
    pub bitrate: String,
    pub samplerate: String,
    pub disc: String,
    pub comment: String,
    pub covers: Vec<Cover>,
    pub lyrics: Vec<Lyric>,
}

#[derive(Debug, Clone, Default)]
pub struct Lyric {
    pub time: f64,
    pub text: String,
}

#[derive(Debug, Clone, Default)]
pub struct Cover {
    pub format: String,
    pub size: String,
    pub length: usize,
    pub width: u32,
    pub height: u32,
    pub base64: Vec<u8>,
}

pub struct Pair {
    pub key: String,
    pub value: String,
}

pub fn read_metadata(file_path: &str, is_proc_cover: bool) -> Result<PreMetadata, Error> {
    let file = File::open(file_path)?;
    let source = MediaSourceStream::new(Box::new(file), Default::default());
    let format_options = FormatOptions::default();
    let metadata_options = MetadataOptions::default();

    let hint = Hint::new();
    let mut probed = symphonia::default::get_probe().format(
        &hint,
        source,
        &format_options,
        &metadata_options,
    )?;

    let metadata = get_metadata(&mut probed, is_proc_cover);
    let metadata = metadata.unwrap_or_default();

    Ok(metadata)
}

pub fn print_metadata(file_path: &str) {
    let metadata = read_metadata(file_path, false);
    if metadata.is_err() {
        println!("No metadata found.");
    } else {
        let metadata = metadata.unwrap();
        println!("Title: {}", metadata.title);
        println!("Artist: {}", metadata.artist);
        println!("Album: {}", metadata.album);
        println!("Year: {}", metadata.year);
        println!("Genre: {}", metadata.genre);
        println!("Duration: {:.3}", metadata.duration);
        println!("Track: {}", metadata.track);
        println!("Lyrics: ");
        for lyric in metadata.lyrics.iter() {
            println!("{:.3} - {}", lyric.time, lyric.text);
        }
        println!("Cover: ");
        for cover in metadata.covers.iter() {
            let length = if cover.length > 1024 * 1024 {
                format!("{:.2} MB", cover.length as f64 / 1024.0 / 1024.0)
            } else if cover.length > 1024 {
                format!("{:.2} KB", cover.length as f64 / 1024.0)
            } else {
                format!("{} Bytes", cover.length)
            };
            println!(
                "{}: {} - {}x{} - {}",
                cover.size, cover.format, cover.width, cover.height, length
            );
        }
    }
}

// 获取 language, bitrate, samplerate, duration
fn pack_meta_from_track_flow(probed: &mut ProbeResult, metadata: &mut PreMetadata) {
    let tracks = probed.format.tracks();
    if tracks.is_empty() {
        println!("No tracks found.");
        return;
    }

    // Get the selected track using the track ID.
    let track = tracks.get(0).unwrap();
    let codec_params = track.codec_params.clone();

    let lan = track.language.clone();
    lan.map(|lang| metadata.language = lang.to_string());

    codec_params
        .bits_per_sample
        .map(|bits| metadata.bitrate = bits.to_string());
    codec_params
        .sample_rate
        .map(|sr| metadata.samplerate = sr.to_string());
    // codec_params
    // .bits_per_coded_sample
    // .map(|bps| println!("压缩率: {} bits/sample", bps));

    // Get the selected track's timebase and duration.
    let tb = codec_params.time_base;
    if tb.is_none() {
        println!("No timebase found.");
        return;
    }
    let tb = tb.unwrap();
    let dur = track
        .codec_params
        .n_frames
        .map(|frames| codec_params.start_ts + frames);
    // println!("Duration: {} ({:?} timebase)", dur.unwrap_or(0), tb);
    // println!("fmt time {}", fmt_time(dur.unwrap_or(0), tb.unwrap()));
    // fmt_time(dur.unwrap_or(0), tb.unwrap())
    let ts = dur.unwrap_or(0);

    let time = tb.calc_time(ts);

    let hours = (time.seconds / (60 * 60)) as f64;
    let mins = ((time.seconds % (60 * 60)) / 60) as f64;
    let secs = f64::from((time.seconds % 60) as u32) + time.frac;

    let secs = format!("{:.3}", secs);
    let secs = secs.parse().unwrap_or(0.0);
    // println!("Duration: {}", format!("{}:{:0>2}:{:0>6.3}", hours, mins, secs));
    metadata.duration = hours * 3600.0 + mins * 60.0 + secs;
}

fn get_metadata(probed: &mut ProbeResult, is_proc_cover: bool) -> Option<PreMetadata> {
    // Prefer metadata that's provided in the container format, over other tags found during the
    // probe operation.
    let (tags, cover) = if let Some(metadata_rev) = probed.format.metadata().current() {
        // print_tags(metadata_rev.tags());
        // print_visuals(metadata_rev.visuals());
        // Warn that certain tags are preferred.
        if probed.metadata.get().as_ref().is_some() {
            println!("tags that are part of the container format are preferentially printed.");
            println!("not printing additional tags that were found while probing.");
        }

        (
            proc_tags(metadata_rev.tags()),
            proc_cover(metadata_rev.visuals(), is_proc_cover),
        )
    } else if let Some(metadata_rev) = probed.metadata.get().as_ref().and_then(|m| m.current()) {
        // print_tags(metadata_rev.tags());
        // print_visuals(metadata_rev.visuals());
        (
            proc_tags(metadata_rev.tags()),
            proc_cover(metadata_rev.visuals(), is_proc_cover),
        )
    } else {
        println!("No metadata found.");
        return None;
    };

    let mut metadata = PreMetadata::default();
    for pair in tags.iter() {
        let key = pair.key.to_lowercase();
        let value = pair.value.clone();
        match key.as_str() {
            "album" => metadata.album = value,
            "albumartist" => metadata.album_artist = value,
            "artist" => metadata.artist = value,
            "tracktitle" => metadata.title = value,
            "date" | "year" => metadata.year = value,
            "genre" => metadata.genre = value,
            "tracknumber" => metadata.track = value,
            "discnumber" => metadata.disc = value,
            "language" => metadata.language = value,
            "comment" => metadata.comment = value,
            "lyrics" => metadata.lyrics = proc_lyrics(value),
            _ => {
                // if value.len() > 30 {
                //     let value = value.chars().take(30).collect::<String>();
                //     println!("not matching tag key:{}:{}", pair.key, value);
                // } else {
                //     println!("not matching tag key:{}:{}", pair.key, value);
                // }
            }
        }
    }

    if is_proc_cover {
        if let Some(cover) = cover {
            metadata.covers = vec![];
            // metadata.covers = vec![cover.clone()];
            let resized_cover = resize_cover(cover.clone(), 140, 80);
            if let Some(resized_cover) = resized_cover {
                metadata.covers.push(resized_cover);
            }
            let resized_cover = resize_cover(cover, 600, 80);
            if let Some(resized_cover) = resized_cover {
                metadata.covers.push(resized_cover);
            }
        }
    }

    pack_meta_from_track_flow(probed, &mut metadata);

    Some(metadata)
}

fn proc_tags(tags: &[Tag]) -> Vec<Pair> {
    let mut pairs = Vec::new();
    for tag in tags.iter() {
        if let Some(std_key) = tag.std_key {
            let pair = get_key_tag_value(&format!("{:?}", std_key), &tag.value);
            if pair.key.is_empty() {
                continue;
            }
            pairs.push(pair);
        }
    }
    pairs
}

fn get_key_tag_value(key: &str, value: &Value) -> Pair {
    match value {
        Value::String(s) => Pair {
            key: key.to_string(),
            value: s.to_string(),
        },
        _ => Pair {
            key: key.to_string(),
            value: "unknown".to_string(),
        },
    }
}

fn proc_cover(visuals: &[Visual], is_proc_cover: bool) -> Option<Cover> {
    if !is_proc_cover {
        return None;
    }

    if visuals.is_empty() {
        return None;
    }

    let visual = visuals.get(0);
    if visual.is_none() {
        return None;
    }

    // save cover image to file
    // let visual = visual.unwrap();
    // let media_type = visual.media_type.to_lowercase().replace("image/", "");

    // let mut file = File::create(&format!("cover.{}", media_type)).unwrap();
    // file.write_all(&visual.data).unwrap();

    let mut cover = Cover::default();
    for visual in visuals.iter() {
        // if let Some(usage) = visual.usage {
        // println!("usage:{:?}", usage);
        // println!("media_type: {:?}", visual.media_type);
        // } else {
        // println!("media_type: {:?}", visual.media_type);
        // }
        cover.format = visual.media_type.to_lowercase().replace("image/", "");
        if let Some(dimensions) = visual.dimensions {
            // println!("Dimensions: {} x {} ", dimensions.width, dimensions.height);
            cover.width = dimensions.width;
            cover.height = dimensions.height;
        } else {
            // let result = image::load_from_memory(&visual.data);
            // if result.is_ok() {
            //     let (w, h) = result.unwrap().dimensions();
            //     cover.width = w;
            //     cover.height = h;
            // }
            // println!("No dimensions found for cover image.");
        }
        // if let Some(bpp) = visual.bits_per_pixel {
        // println!("Bits/Pixel: {}", bpp);
        // }
        // if let Some(ColorMode::Indexed(colors)) = visual.color_mode {
        // println!("Palette: {} colors", colors);
        // }
        // println!("Size:{} bytes", visual.data.len());
        cover.base64 = visual.data.to_vec();
    }
    cover.length = cover.base64.len();
    cover.size = String::from("original");
    Some(cover)
}

fn resize_cover(cover: Cover, size: u32, qulity: i8) -> Option<Cover> {
    let img = image::load_from_memory(&cover.base64);
    if img.is_err() {
        println!("Failed to load cover image.");
        return None;
    }
    let img = img.unwrap();
    let resized_img = resize_image(Box::new(img), size);

    let compressed_img = compress_img(&resized_img, qulity);
    if compressed_img.is_err() {
        println!("Failed to compress cover image.");
        return None;
    }

    let mut resized_cover = Cover::default();
    resized_cover.format = "webp".to_string();
    resized_cover.width = resized_img.dimensions().0;
    resized_cover.height = resized_img.dimensions().1;
    resized_cover.base64 = compressed_img.unwrap();
    resized_cover.length = resized_cover.base64.len();
    resized_cover.size = if size == 140 {
        "small".to_string()
    } else {
        "medium".to_string()
    };
    Some(resized_cover)
}

fn proc_lyrics(lyrics: String) -> Vec<Lyric> {
    let mut lyrics_vec = Vec::new();

    // lyrics:
    // [ar:周杰伦]
    // [al:天台 电影原声带]
    // [00:00.00]天台 - 周杰伦 (Jay Chou)/Alan柯有伦 (Alan Kuo)/徐帆/华语群星
    // [00:02.50]词：黄俊郎

    lyrics.lines().for_each(|line| {
        if line.trim().is_empty() {
            return;
        }
        if let Some(lyric) = parse_line(line) {
            lyrics_vec.push(lyric);
        }
    });
    lyrics_vec
}

fn parse_line(line: &str) -> Option<Lyric> {
    // 定义正则表达式来匹配时间部分和文本部分
    let re = Regex::new(r"^\[(\d{2}):(\d{2})\.(\d{2})\]\s*(.*)$").unwrap();

    if let Some(caps) = re.captures(line) {
        // 提取分钟、秒和毫秒
        let minutes = caps.get(1)?.as_str().parse::<f64>().ok()?;
        let seconds = caps.get(2)?.as_str().parse::<f64>().ok()?;
        let milliseconds = caps.get(3)?.as_str().parse::<f64>().ok()?;

        // 将时间转换为秒数
        let total_seconds = minutes * 60.0 + seconds + milliseconds / 100.0;

        // 提取文本部分
        let text = caps.get(4)?.as_str().to_string();

        // 返回时间部分（秒数）和文本部分
        Some(Lyric {
            time: total_seconds,
            text,
        })
    } else {
        // 无法匹配到时间部分，返回默认值
        Some(Lyric {
            time: 0.0,
            text: line.to_string(),
        })
    }
}

const LOG_PATH: &str = "./initdb.log";

/*
* 需要处理的数据
* 1. meta
* 2. album
* 3. album_song
* 4. artist
* 5. artist_song
* 6. lyrics
* 7. cover
*/
pub fn read_metadata_into_db(file_path: &str, music_dir: &str) -> Result<(), Error> {
    // 处理meta数据
    let (premetadata, metadata) = proc_metadata(&file_path, &music_dir, false)?;
    // 开始写入数据
    let song_id = insert_meta(&metadata)?;
    let (album_name, album_id, album_song_size) = insert_album(&premetadata, &song_id)?;
    let (artist_len, artist_song_size) = insert_artist(&premetadata, &song_id)?;
    let cover_size = insert_cover(&file_path, &music_dir, album_id)?;
    let lyric_size = insert_lyrics(&premetadata, &song_id)?;

    let _ = log_file(
        LOG_PATH,
        "Info",
        &format!(
            "title: {}, album: {}-{}({}), artists: {}({}), covers: {}, lyrics: {}",
            premetadata.title,
            album_name,
            album_id,
            album_song_size,
            artist_len,
            artist_song_size,
            cover_size,
            lyric_size
        ),
    );
    Ok(())
}

fn proc_metadata(
    file_path: &str,
    music_dir: &str,
    is_proc_cover: bool,
) -> Result<(PreMetadata, Metadata), Error> {
    if !is_music_file(file_path) {
        // let _ = log_file(LOG_PATH, "info", &format!("ignore file: {}", file_path));
        return Err(Error::msg("ignore file"));
    }

    let file_path = &file_path;
    let music_dir = &music_dir;
    let path = Path::new(&file_path);
    let file_name = path.file_name();
    if file_name.is_none() {
        let _ = log_file(
            LOG_PATH,
            "error",
            &format!("file_name is none: {}", file_path),
        );
        return Err(Error::msg("file_name is none"));
    }
    let file_name = file_name.unwrap().to_str().unwrap().to_string();

    // print_metadata(f);
    let metadata = read_metadata(file_path, is_proc_cover);
    if metadata.is_err() {
        let _ = log_file(
            LOG_PATH,
            "error",
            &format!("No metadata found: {}", file_path),
        );
        return Err(Error::msg("No metadata found"));
    }

    let mut premetadata = metadata.unwrap();
    if premetadata.title.is_empty() {
        let _ = log_file(LOG_PATH, "error", &format!("title is empty: {}", file_path));
        return Err(Error::msg("title is empty"));
    }

    premetadata.build_genre(file_path, &music_dir);
    let mut metadata = premetadata.build_metadata();
    metadata.file_name = file_name.clone().replace("\\", "/");
    metadata.file_path = file_path.replace("\\", "/");
    metadata.file_url = file_path.replace(music_dir, "").replace("\\", "/");
    Ok((premetadata, metadata))
}

fn insert_meta(metadata: &Metadata) -> Result<String, Error> {
    let exist = get_metadata_by_title_artist(&metadata.title, &metadata.artist)?;
    let song_id = if exist.is_none() {
        let _ = add_metadata(&metadata)?;
        metadata.id.clone()
    } else {
        let exist = exist.unwrap();
        // metadata.id = exist.id.clone();
        if exist.file_path != metadata.file_path {
            let size = set_metadata_by_id(&metadata)?;
            let _ = log_file(
                LOG_PATH,
                "info",
                &format!(
                    "Already exist, but file path is different, {} -> {}, update rows: {}",
                    exist.file_path, metadata.file_path, size
                ),
            );
        }
        exist.id
    };
    Ok(song_id)
}

// 写入 artist 和 artist_song 数据
fn insert_album(premetadata: &PreMetadata, song_id: &str) -> Result<(String, i64, usize), Error> {
    let album = premetadata.build_album();
    let album_id = if let Some(exist) = get_album_by_name(&album.name)? {
        exist.id
    } else {
        add_album(&album)?
    };

    let album_song = premetadata.build_album_song(&song_id, album_id);
    let album_song_size = if let Some(_) = album_song_by_id(&song_id, album_id)? {
        0
    } else {
        add_album_song(&album_song)?
    };
    Ok((album.name.to_string(), album_id, album_song_size))
}

// 写入 artist 和 artist_song 数据
fn insert_artist(premetadata: &PreMetadata, song_id: &str) -> Result<(usize, usize), Error> {
    let artists = premetadata.build_artist();
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

    let mut artist_songs = premetadata.build_artist_songs(&song_id, &artist_ids);
    if let Some(exist) = artist_song_by_song_id(&song_id)? {
        artist_songs.retain(|a| exist.artist_id != a.artist_id && exist.song_id != a.song_id);
    };
    let artist_song_size = add_artist_songs(&artist_songs)?;
    Ok((artist_ids.len(), artist_song_size))
}

// 写入专辑封面数据
fn insert_cover(file_path: &str, music_dir: &str, album_id: i64) -> Result<usize, Error> {
    // 先确认一下对应专辑是否已存在封面，存在则直接返回
    let small_size = get_cover(album_id, "album", "small")?;
    let medium_size = get_cover(album_id, "album", "medium")?;
    if small_size.is_some() && medium_size.is_some() {
        // print!("small_size={:?}", small_size.unwrap());
        return Ok(0);
    }

    let (premetadata, _) = proc_metadata(&file_path, &music_dir, true)?;
    let mut covers = premetadata.build_covers(album_id, "album");
    let mut exist_cover = vec![];
    for cover in &covers {
        if let Some(exist) = get_cover(album_id, "album", &cover.size)? {
            exist_cover.push(exist.size);
        }
    }
    covers.retain(|c| !exist_cover.contains(&c.size));
    let cover_size = add_covers(covers)?;
    Ok(cover_size)
}

// 写入歌词数据
fn insert_lyrics(premetadata: &PreMetadata, song_id: &str) -> Result<usize, Error> {
    let exist = get_lyric(&song_id)?;
    let lyric_size = if exist.len() > 0 {
        println!("exist lyric, song_id={song_id}");
        exist.len()
    } else {
        let lyrics = premetadata.build_lyrics(&song_id);
        add_lyrics(lyrics)?
    };
    Ok(lyric_size)
}

// 检查专辑封面是否丢失
pub fn check_lost_album(metadata: &Metadata, music_dir: &str) -> Result<(), Error> {
    // metadata.file_path
    let (premetadata, _) = proc_metadata(&metadata.file_path, music_dir, true)?;
    insert_album(&premetadata, &metadata.id)?;
    Ok(())
}

// 检查歌词是否丢失
pub fn check_lost_lyric(metadata: &Metadata, music_dir: &str) -> Result<(), Error> {
    let (premetadata, _) = proc_metadata(&metadata.file_path, music_dir, true)?;
    insert_lyrics(&premetadata, &metadata.id)?;
    Ok(())
}
