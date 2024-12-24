use music_metadata::{FlacParser, ID3Parser, OggParser};
use serde::{Deserialize, Serialize};
use std::fs::File;
use std::path::Path;

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct MusicMetadata {
    pub title: Option<String>,
    pub artist: Option<String>,
    pub lyrics: Option<String>,
    pub cover: Option<String>, // Base64 encoded cover image
}

pub fn read_metadata(file_path: &str) -> Result<MusicMetadata, Box<dyn std::error::Error>> {
    let path = Path::new(file_path);
    let extension = path.extension().and_then(|s| s.to_str());

    match extension {
        Some("mp3") => read_mp3_metadata(file_path),
        Some("flac") => read_flac_metadata(file_path),
        Some("ogg") => read_ogg_metadata(file_path),
        _ => Err("Unsupported file format".into()),
    }
}

fn read_mp3_metadata(mp3_path: &str) -> Result<MusicMetadata, Box<dyn std::error::Error>> {
    let path = Path::new(mp3_path);
    let file = File::open(&path)?;

    // https://drive.google.com/file/d/1fp_TYclIKZAWMwFTnxEEe4PqJCuBqHl4/view?usp=sharing
    let mut id3_parser = ID3Parser::new(mp3_path).unwrap();

    id3_parser.parse_id3v1()?;
    // The ID3v1 protocol does not specify the content encoding,
    // which may be UTF-8, GBK or some other encoding,
    // so it is not possible to decode it, so the bytecode is output directly
    println!("{}", id3_parser.id3v1);
    // let id3v1 = id3_parser.id3v1;
    

    let result = id3_parser.parse_id3v2();
    if let Err(e) = result {
        println!("Error: {}", e);
    }

    // It is not recommended to print the APIC byte sequence because it is really long
    // println!("APIC_raw = {:?}", parser.get_raw("apic").unwrap());

    // Write filename.jpg to the current directory.
    // No need to worry about multiple APIC frames in a file being overwritten by the same name.
    // Naming rules: <filename>_mp3_<picture_type>[_index].jpg
    id3_parser.write_image()?;

    let metadata = MusicMetadata::default();

    Ok(metadata)
}

fn read_flac_metadata(flac_path: &str) -> Result<MusicMetadata, Box<dyn std::error::Error>> {
    let path: &Path = Path::new(flac_path);
    let file = File::open(&path)?;

    let mut flac_parser = FlacParser::new(&flac_path).unwrap();
    flac_parser.parse()?;

    // https://www.xiph.org/vorbis/doc/v-comment.html
    // The `get` method is case insensitive
    println!("artist = {:?}", flac_parser.get("artist").unwrap());

    println!("album = {:?}", flac_parser.get("album").unwrap());

    // Get all vorbis comments in the file
    let (k, v) = flac_parser.get_all().unwrap();
    let mut index = 0;
    while index < k.len() {
        println!(
            "vorbis key = {:?}, vorbis comment = {:?}",
            k[index], v[index]
        );
        index += 1;
    }

    // It is not recommended to print the APIC byte sequence because it is really long
    // println!("picture_raw_data = {:?}", flac_parser.picture[0].data);

    println!("md5 = {}", flac_parser.stream_info.md5);

    println!(
        "picture width = {}, picture width = {}, picture type = {:?}",
        flac_parser.picture[0].width,
        flac_parser.picture[0].height,
        flac_parser.picture[0].pic_type
    );

    // This will write image[s] to disk
    // Naming rules: <filename>_flac_<picture_type>[_index].jpg
    flac_parser.write_image()?;

    Ok(MusicMetadata::default())
}

fn read_ogg_metadata(ogg_path: &str) -> Result<MusicMetadata, Box<dyn std::error::Error>> {
    let path = Path::new(ogg_path);
    let file = File::open(&path)?;

    let mut ogg_parser = OggParser::new("xhh.ogg");
    ogg_parser.parse()?;
    println!("ogg_vorbis_comment = {:?}", ogg_parser.get_all());

    Ok(MusicMetadata::default())
}
