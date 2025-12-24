use lib_utils::database::service::get_random_songs;

fn main() {
    println!("=== 测试 get_random_songs 方法 ===\n");

    // 测试 1: 获取默认数量的随机歌曲(150首)
    println!("1. 获取默认 150 首随机歌曲:");
    match get_random_songs(None, None, None, None) {
        Ok(songs) => {
            println!("   成功获取 {} 首歌曲", songs.len());
            if let Some(song) = songs.first() {
                println!("   示例歌曲: {} - {}", song.title, song.artist);
            }
        }
        Err(e) => println!("   错误: {}", e),
    }
    println!();

    // 测试 2: 获取 10 首随机歌曲
    println!("2. 获取 10 首随机歌曲:");
    match get_random_songs(Some(10), None, None, None) {
        Ok(songs) => {
            println!("   成功获取 {} 首歌曲", songs.len());
            for (i, song) in songs.iter().enumerate() {
                println!("   {}. {} - {}", i + 1, song.title, song.artist);
            }
        }
        Err(e) => println!("   错误: {}", e),
    }
    println!();

    // 测试 3: 按流派筛选(例如: Pop)
    println!("3. 获取流派为 'Pop' 的 5 首随机歌曲:");
    match get_random_songs(Some(5), Some("Pop"), None, None) {
        Ok(songs) => {
            println!("   成功获取 {} 首歌曲", songs.len());
            for song in songs.iter() {
                println!("   - {} - {} ({})", song.title, song.artist, song.genre);
            }
        }
        Err(e) => println!("   错误: {}", e),
    }
    println!();

    // 测试 4: 按年份范围筛选
    println!("4. 获取 2000-2010 年间的 5 首随机歌曲:");
    match get_random_songs(Some(5), None, Some("2000"), Some("2010")) {
        Ok(songs) => {
            println!("   成功获取 {} 首歌曲", songs.len());
            for song in songs.iter() {
                println!("   - {} - {} ({})", song.title, song.artist, song.year);
            }
        }
        Err(e) => println!("   错误: {}", e),
    }
    println!();

    // 测试 5: 组合条件(流派 + 年份)
    println!("5. 获取 2010 年后的 'Rock' 流派随机歌曲 (最多 5 首):");
    match get_random_songs(Some(5), Some("Rock"), Some("2010"), None) {
        Ok(songs) => {
            println!("   成功获取 {} 首歌曲", songs.len());
            for song in songs.iter() {
                println!(
                    "   - {} - {} ({}, {})",
                    song.title, song.artist, song.genre, song.year
                );
            }
        }
        Err(e) => println!("   错误: {}", e),
    }
    println!();

    // 测试 6: 测试最大限制 (500)
    println!("6. 测试获取超过 500 首(会自动限制为 500):");
    match get_random_songs(Some(1000), None, None, None) {
        Ok(songs) => {
            println!("   请求 1000 首,实际获取 {} 首(应该 <= 500)", songs.len());
        }
        Err(e) => println!("   错误: {}", e),
    }
}
