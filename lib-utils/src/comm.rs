use rand::Rng;
use std::path::Path;

pub fn generate_random_string(length: usize) -> String {
    let characters: &str = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let mut result = String::with_capacity(length);
    let characters_length = characters.len();

    let mut rng = rand::thread_rng();
    for _ in 0..length {
        let idx = rng.gen_range(0..characters_length);
        result.push(characters.chars().nth(idx).unwrap());
    }

    result
}

//  cargo test -p lib-utils -- --nocapture
#[test]
fn test_generate_random_string() {
    use std::collections::HashSet;
    for _i in 0..20 {
        let mut set = HashSet::new();
        for _j in 0..10000 {
            let result = generate_random_string(9);
            // println!("{}: {}", i + 1, result);
            set.insert(result);
        }
        assert_eq!(set.len(), 10000);
    }
}

pub fn get_parent_directory_names(file_path: &str) -> Vec<String> {
    let path = Path::new(file_path);
    let mut parent_folders = Vec::new();

    // 获取上级路径，并逐个解析文件夹名称
    let mut current_path = path.parent();
    while let Some(parent_path) = current_path {
        if let Some(folder_name) = parent_path.file_name() {
            if let Some(folder_name_str) = folder_name.to_str() {
                parent_folders.push(folder_name_str.to_string());
            }
        }
        current_path = parent_path.parent();
    }

    // 由于我们是从下往上遍历的父路径，所以需要反转顺序
    parent_folders.reverse();

    parent_folders
}

pub fn is_music_file(file_path: &str) -> bool {
    let file_extensions = vec![
        "mp3", "flac",
        // "wav",
        // "ogg",
        // "m4a"
    ];
    let file_extension = Path::new(file_path)
        .extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| ext.to_lowercase());

    if file_extension.is_none() {
        return false;
    }
    let file_extension = file_extension.unwrap();
    file_extensions.contains(&file_extension.as_str())
}
