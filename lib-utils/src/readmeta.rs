use anyhow::{Error, Ok, Result};
use image::GenericImageView;
use regex::Regex;
use std::fs::File;
use symphonia::core::formats::FormatOptions;
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::{MetadataOptions, Tag, Value, Visual};
use symphonia::core::probe::{Hint, ProbeResult};

use crate::image::{compress_img, resize_image};

#[derive(Debug, Clone, Default)]
pub struct MyMetadata {
    pub title: String,
    pub artist: String,
    pub album: String,
    pub album_artist: String,
    pub year: String,
    pub genre: String,
    pub duration: f64,
    pub track: String,
    pub language: String,
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

pub fn read_metadata(file_path: &str) -> Result<MyMetadata, Error> {
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

    let metadata = get_metadata(&mut probed);
    let metadata = metadata.unwrap_or_default();

    Ok(metadata)
}

pub fn print_metadata(file_path: &str) {
    let metadata = read_metadata(file_path);
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

fn get_duration(probed: &mut ProbeResult) -> f64 {
    let tracks = probed.format.tracks();
    if tracks.is_empty() {
        println!("No tracks found.");
        return 0.0;
    }

    // Get the selected track using the track ID.
    let track = tracks.get(0).unwrap();

    // Get the selected track's timebase and duration.
    let tb = track.codec_params.time_base;
    if tb.is_none() {
        println!("No timebase found.");
        return 0.0;
    }
    let tb = tb.unwrap();
    let dur = track
        .codec_params
        .n_frames
        .map(|frames| track.codec_params.start_ts + frames);
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
    hours * 3600.0 + mins * 60.0 + secs
}

fn get_metadata(probed: &mut ProbeResult) -> Option<MyMetadata> {
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
            proc_cover(metadata_rev.visuals()),
        )
    } else if let Some(metadata_rev) = probed.metadata.get().as_ref().and_then(|m| m.current()) {
        // print_tags(metadata_rev.tags());
        // print_visuals(metadata_rev.visuals());
        (
            proc_tags(metadata_rev.tags()),
            proc_cover(metadata_rev.visuals()),
        )
    } else {
        println!("No metadata found.");
        return None;
    };

    let mut metadata = MyMetadata::default();
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
                if value.len() > 30 {
                    let value = value.chars().take(30).collect::<String>();
                    println!("not matching tag key:{}:{}", pair.key, value);
                } else {
                    println!("not matching tag key:{}:{}", pair.key, value);
                }
            }
        }
    }

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

    metadata.duration = get_duration(probed);

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

fn proc_cover(visuals: &[Visual]) -> Option<Cover> {
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
