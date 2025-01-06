use lib_utils::{
    comm::generate_random_string,
    config::get_config,
    database::{service::Metadata, table},
    readmeta::{print_metadata, read_metadata, MyMetadata},
};
use std::path::Path;

fn main() {
    // print_metadata("multiartist.flac");
    let _ = table::init();

    read_file();
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
    files
}

fn read_file() {
    let config = get_config();
    let music_dir = config.music_dir.clone();
    let files = read_file_recursive(&music_dir);
    let limit = 2;
    let mut count = 0;
    files.iter().for_each(|f| {
        // println!("file: {}", f);
        count += 1;
        if count >= limit {
            return;
        }
        // print_metadata(f);
        let metadata = read_metadata(f);
        if let Ok(metadata) = metadata {
            let metadata = Metadata::from(metadata);
            println!("{:?}", metadata);
        }
        println!("--------------------------");
    });
    println!("music_dir: {} files: {}", music_dir, files.len());
}
