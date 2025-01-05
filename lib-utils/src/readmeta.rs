use std::fs::File;
use std::io::Write;
use symphonia::core::codecs::{DecoderOptions, FinalizeResult, CODEC_TYPE_NULL};
use symphonia::core::errors::{Error, Result};
use symphonia::core::formats::{Cue, FormatOptions, FormatReader, SeekMode, SeekTo, Track};
use symphonia::core::io::{MediaSource, MediaSourceStream, ReadOnlySource};
use symphonia::core::meta::{ColorMode, MetadataOptions, MetadataRevision, Tag, Value, Visual};
use symphonia::core::probe::{Hint, ProbeResult};
use symphonia::core::units::{Time, TimeBase};

pub struct MyMetadata {
    pub title: String,
    pub artist: String,
    pub album: String,
    pub year: String,
    pub genre: String,
    pub cover: Vec<u8>,
}


pub fn test() {
    // 打开 MP3 文件
    let file = File::open("multiartist.flac").expect("Failed to open file");
    let source = MediaSourceStream::new(Box::new(file), Default::default());
    let format_options = FormatOptions::default();
    let metadata_options = MetadataOptions::default();

    // 使用 MP3 作为提示来探测文件格式
    let hint = Hint::new();
    // hint.with_extension("mp3");

    let mut probed = symphonia::default::get_probe()
        .format(&hint, source, &format_options, &metadata_options)
        .expect("Failed to probe format");

    print_format(&mut probed);
    println!("Duration: {} (seconds)", get_duration(&mut probed));
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
    let dur = track
        .codec_params
        .n_frames
        .map(|frames| track.codec_params.start_ts + frames);
    // println!("Duration: {} ({:?} timebase)", dur.unwrap_or(0), tb);
    // println!("fmt time {}", fmt_time(dur.unwrap_or(0), tb.unwrap()));
    fmt_time(dur.unwrap_or(0), tb.unwrap())
}

fn print_format(probed: &mut ProbeResult) {
    // print_tracks(probed.format.tracks());

    // Prefer metadata that's provided in the container format, over other tags found during the
    // probe operation.
    if let Some(metadata_rev) = probed.format.metadata().current() {
        proc_tags(metadata_rev.tags());

        // print_tags(metadata_rev.tags());
        // print_visuals(metadata_rev.visuals());
        proc_cover(metadata_rev.visuals());

        // Warn that certain tags are preferred.
        if probed.metadata.get().as_ref().is_some() {
            println!("tags that are part of the container format are preferentially printed.");
            println!("not printing additional tags that were found while probing.");
        }
    } else if let Some(metadata_rev) = probed.metadata.get().as_ref().and_then(|m| m.current()) {
        // print_tags(metadata_rev.tags());
        // print_visuals(metadata_rev.visuals());
        proc_tags(metadata_rev.tags());
        proc_cover(metadata_rev.visuals());

    }

    // print_cues(probed.format.cues());
    // println!(":");
    // println!();
}

fn fmt_time(ts: u64, tb: TimeBase) -> f64 {
    let time = tb.calc_time(ts);

    // let hours = time.seconds / (60 * 60);
    // let mins = (time.seconds % (60 * 60)) / 60;
    let secs = f64::from((time.seconds % 60) as u32) + time.frac;

    let secs = format!("{:.3}", secs);
    let secs = secs.parse().unwrap_or(0.0);
    // format!("{}:{:0>2}:{:0>6.3}", hours, mins, secs)
    time.seconds as f64 + secs
}

fn proc_tags(tags: &[Tag]) {
    for tag in tags.iter() {
        if let Some(std_key) = tag.std_key {
            let (key, value) = get_key_tag_value(&format!("{:?}", std_key), &tag.value);
            println!("{}: {}", key, value);
        }
    }
}
fn get_key_tag_value(key: &str, value: &Value) -> (String, String) {
    match value {
        Value::String(s) => (key.to_string(), s.to_string()),
        _ => (key.to_string(), "".to_string()),
    }
}

fn proc_cover(visuals: &[Visual]) {
    if visuals.is_empty() {
        return;
    }

    let visual = visuals.get(0);
    if visual.is_none() {
        return;
    }

    // let visual = visual.unwrap();
    // let media_type = visual.media_type.to_lowercase().replace("image/", "");

    // let mut file = File::create(&format!("cover.{}", media_type)).unwrap();
    // file.write_all(&visual.data).unwrap();


    for visual in visuals.iter() {
        if let Some(usage) = visual.usage {
            println!("usage:{:?}", usage);
            println!("media_type: {:?}", visual.media_type);
        } else {
            println!("media_type: {:?}", visual.media_type);
        }
        if let Some(dimensions) = visual.dimensions {
            println!("Dimensions: {} x {} ", dimensions.width, dimensions.height);
        }
        if let Some(bpp) = visual.bits_per_pixel {
            println!("Bits/Pixel: {}", bpp);
        }
        if let Some(ColorMode::Indexed(colors)) = visual.color_mode {
            println!("Palette: {} colors", colors);
        }
        println!("Size:{} bytes", visual.data.len());     
    }
}
