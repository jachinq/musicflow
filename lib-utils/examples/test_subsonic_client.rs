// 测试 Subsonic 客户端功能
// 运行: cargo run --example test_subsonic_client
//
// 使用前请确保:
// 1. 在 conf/config.json 中配置了 Subsonic 服务器信息
// 2. Subsonic 服务器可访问

use lib_utils::{config::get_config, datasource::subsonic::client::SubsonicClient};

#[tokio::main]
async fn main() {
    println!("=== Subsonic 客户端测试 ===\n");

    let config = get_config();
    let subsonic = &config.data_source.subsonic;
    if subsonic.is_none() {
        println!("未配置 Subsonic 数据源");
        return;
    }
    let subsonic = subsonic.clone().unwrap();
    println!("配置:");
    println!("  - 服务器: {}", subsonic.server_url);
    println!("  - 用户名: {}", subsonic.username);
    println!("  - 密码: {}", subsonic.password);
    println!("  - API 版本: {}", subsonic.api_version);
    println!("  - 客户端名称: {}\n", subsonic.client_name);

    // 从环境变量或硬编码配置创建客户端
    // 生产环境应该从配置文件读取
    let base_url = std::env::var("SUBSONIC_URL")
        .unwrap_or_else(|_| subsonic.server_url.to_string());
    let username = std::env::var("SUBSONIC_USER")
        .unwrap_or_else(|_| subsonic.username.to_string());
    let password = std::env::var("SUBSONIC_PASS")
        .unwrap_or_else(|_| subsonic.password.to_string());

    println!("连接配置:");
    println!("  - 服务器: {}", base_url);
    println!("  - 用户名: {}", username);
    println!("  - API 版本: 1.16.1");
    println!("  - 客户端: MusicFlow\n");

    let client = SubsonicClient::new(
        base_url.clone(),
        username,
        password,
        true, // 使用 token 认证
        "1.16.1".to_string(),
        "MusicFlow".to_string(),
    );

    // 1. Ping 测试
    println!("1. 测试服务器连接 (ping)...");
    match client.ping().await {
        Ok(_) => println!("   ✓ Ping 成功"),
        Err(e) => {
            println!("   ✗ Ping 失败: {}", e);
            println!("\n请检查:");
            println!("  - Subsonic 服务器是否运行");
            println!("  - 配置的 URL、用户名、密码是否正确");
            println!("  - 可以通过环境变量设置: SUBSONIC_URL, SUBSONIC_USER, SUBSONIC_PASS");
            return;
        }
    }

    // 2. 获取艺术家列表
    println!("\n2. 获取艺术家列表...");
    match client.get_artists().await {
        Ok(artists) => {
            println!("   ✓ 成功获取 {} 位艺术家", artists.len());
            if !artists.is_empty() {
                println!("\n   前 5 位艺术家:");
                for (i, artist) in artists.iter().take(5).enumerate() {
                    println!("     {}. {} (ID: {}, 专辑数: {})",
                        i + 1,
                        artist.name.clone().unwrap_or_default(),
                        artist.id.clone().unwrap_or_default(),
                        artist.album_count.unwrap_or(0)
                    );
                }
            }
        }
        Err(e) => println!("   ✗ 获取失败: {}", e),
    }

    // 3. 获取专辑列表
    println!("\n3. 获取最近添加的专辑...");
    match client.get_album_list2("newest", 5, 0).await {
        Ok(albums) => {
            println!("   ✓ 成功获取 {} 张专辑", albums.len());
            if !albums.is_empty() {
                println!("\n   专辑列表:");
                for (i, album) in albums.iter().enumerate() {
                    println!("     {}. {} - {} (ID: {}, 歌曲数: {})",
                        i + 1,
                        album.name,
                        album.artist.as_deref().unwrap_or("Unknown"),
                        album.id,
                        album.song_count.unwrap_or(0)
                    );
                }

                // 4. 获取第一张专辑的详细信息
                if let Some(first_album) = albums.first() {
                    println!("\n4. 获取专辑详情 ({})", first_album.name);
                    match client.get_album(&first_album.id).await {
                        Ok(album) => {
                            println!("   ✓ 专辑: {}", album.name);
                            println!("     - 艺术家: {}", album.artist.as_deref().unwrap_or("Unknown"));
                            println!("     - 年份: {}", album.year.map_or("N/A".to_string(), |y| y.to_string()));
                            println!("     - 流派: {}", album.genre.as_deref().unwrap_or("Unknown"));
                            println!("     - 歌曲数: {}", album.song_count.unwrap_or(0));

                            if let Some(songs) = &album.song {
                                println!("\n     歌曲列表:");
                                for (i, song) in songs.iter().take(5).enumerate() {
                                    let duration = song.duration
                                        .map(|d| format!("{}:{:02}", d / 60, d % 60))
                                        .unwrap_or_else(|| "N/A".to_string());
                                    println!("       {}. {} ({})",
                                        i + 1,
                                        song.title,
                                        duration
                                    );
                                }
                            }

                            // 5. 获取封面 URL
                            if let Some(cover_id) = &album.cover_art {
                                println!("\n5. 封面 URL:");
                                let cover_url = client.get_cover_art_url(cover_id, "800");
                                println!("   cover_id={}", cover_id);
                                println!("   {}", cover_url);
                            }

                            // 6. 测试歌曲流式 URL
                            if let Some(songs) = &album.song {
                                if let Some(first_song) = songs.first() {
                                    println!("\n6. 获取歌曲流式 URL ({})", first_song.title);
                                    let stream_url = client.get_stream_url(&first_song.id, 320, "mp3");
                                    println!("   {}", stream_url);

                                    // 7. 获取单个歌曲信息
                                    println!("\n7. 获取歌曲详情... id={}", &first_song.id);
                                    match client.get_song(&first_song.id).await {
                                        Ok(song) => {
                                            println!("   ✓ 歌曲: {}", song.title);
                                            println!("     - 专辑: {}", song.album.as_deref().unwrap_or("Unknown"));
                                            println!("     - 艺术家: {}", song.artist.as_deref().unwrap_or("Unknown"));
                                            println!("     - 时长: {} 秒", song.duration.unwrap_or(0));
                                            println!("     - 比特率: {} kbps", song.bit_rate.unwrap_or(0));
                                            println!("     - 格式: {}", song.suffix.as_deref().unwrap_or("Unknown"));
                                        }
                                        Err(e) => println!("   ✗ 获取失败: {}", e),
                                    }

                                    // 8. 获取歌词
                                    println!("\n8. 获取歌词...");
                                    let artist = first_song.artist.as_deref().unwrap_or("");
                                    let title = &first_song.title;
                                    match client.get_lyrics(artist, title).await {
                                        Ok(Some(lyrics)) => {
                                            println!("   ✓ 歌词:");
                                            if let Some(text) = &lyrics.text {
                                                let lines: Vec<&str> = text.lines().take(5).collect();
                                                for line in lines {
                                                    println!("     {}", line);
                                                }
                                                if text.lines().count() > 5 {
                                                    println!("     ...");
                                                }
                                            }
                                        }
                                        Ok(None) => println!("   - 未找到歌词"),
                                        Err(e) => println!("   ✗ 获取失败: {}", e),
                                    }
                                }
                            }
                        }
                        Err(e) => println!("   ✗ 获取失败: 专辑id={}， e={}", first_album.id, e),
                    }
                }
            }
        }
        Err(e) => println!("   ✗ 获取失败: {}", e),
    }

    // 9. 搜索测试
    println!("\n9. 搜索测试 (关键词: '偏爱')...");
    match client.search3("偏爱", 0, 10).await {
        Ok(result) => {
            if let Some(songs) = result.song {
                println!("   ✓ 找到 {} 首歌曲", songs.len());
                for (i, song) in songs.iter().take(3).enumerate() {
                    println!("     {}. {} - {}",
                        i + 1,
                        song.title,
                        song.artist.as_deref().unwrap_or("Unknown")
                    );
                }
            }
            if let Some(albums) = result.album {
                println!("   ✓ 找到 {} 张专辑", albums.len());
                for (i, album) in albums.iter().take(3).enumerate() {
                    println!("     {}. {} - {}",
                        i + 1,
                        album.name,
                        album.artist.as_deref().unwrap_or("Unknown")
                    );
                }
            }
            if let Some(artists) = result.artist {
                println!("   ✓ 找到 {} 位艺术家", artists.len());
                for (i, artist) in artists.iter().take(3).enumerate() {
                    println!("     {}. {}", i + 1, artist.name.clone().unwrap_or_default());
                }
            }
        }
        Err(e) => println!("   ✗ 搜索失败: {}", e),
    }

    // 10. 测试播放队列
    println!("\n10. 测试播放队列功能...");

    // 先尝试获取现有播放队列
    println!("\n   a) 获取播放队列 (getPlayQueue)...");
    match client.get_play_queue().await {
        Ok(Some(queue)) => {
            println!("   ✓ 播放队列已存在");
            println!("     - 歌曲数量: {}", queue.entry.as_ref().map(|e| e.len()).unwrap_or(0));
            if let Some(current) = &queue.current {
                println!("     - 当前播放: {}", current);
            }
            if let Some(pos) = queue.position {
                println!("     - 播放位置: {} 毫秒", pos);
            }
        }
        Ok(None) => println!("   - 播放队列为空"),
        Err(e) => println!("   ✗ 获取失败: {}", e),
    }

    // 如果有专辑数据，尝试保存播放队列
    match client.get_album_list2("newest", 1, 0).await {
        Ok(albums) if !albums.is_empty() => {
            if let Some(first_album) = albums.first() {
                match client.get_album(&first_album.id).await {
                    Ok(album) => {
                        if let Some(songs) = &album.song {
                            if songs.len() >= 3 {
                                println!("\n   b) 保存播放队列 (savePlayQueue)...");

                                // 取前 3 首歌曲
                                let song_ids: Vec<String> = songs
                                    .iter()
                                    .take(3)
                                    .map(|s| s.id.clone())
                                    .collect();

                                let current = Some(song_ids[0].as_str());
                                let position = Some(5000u64); // 5 秒位置

                                match client.save_play_queue(&song_ids, current, position).await {
                                    Ok(()) => {
                                        println!("   ✓ 播放队列保存成功");
                                        println!("     - 保存了 {} 首歌曲", song_ids.len());
                                        println!("     - 当前播放: {}", song_ids[0]);
                                        println!("     - 播放位置: 5000 毫秒");

                                        // 再次获取验证
                                        println!("\n   c) 验证保存结果...");
                                        match client.get_play_queue().await {
                                            Ok(Some(queue)) => {
                                                println!("   ✓ 验证成功");
                                                let saved_count = queue.entry.as_ref().map(|e| e.len()).unwrap_or(0);
                                                println!("     - 队列中歌曲数: {}", saved_count);
                                                if let Some(curr) = &queue.current {
                                                    println!("     - 当前播放: {}", curr);
                                                }
                                                if let Some(pos) = queue.position {
                                                    println!("     - 播放位置: {} 毫秒", pos);
                                                }
                                            }
                                            Ok(None) => println!("   ✗ 验证失败: 播放队列为空"),
                                            Err(e) => println!("   ✗ 验证失败: {}", e),
                                        }
                                    }
                                    Err(e) => println!("   ✗ 保存失败: {}", e),
                                }
                            } else {
                                println!("   - 跳过保存测试: 专辑歌曲数不足 3 首");
                            }
                        }
                    }
                    Err(e) => println!("   ✗ 获取专辑失败: {}", e),
                }
            }
        }
        _ => println!("   - 跳过保存测试: 没有可用的专辑数据"),
    }

    // 11. 测试播放历史记录 (scrobble)
    println!("\n11. 测试播放历史记录 (scrobble)...");
    match client.get_album_list2("newest", 1, 0).await {
        Ok(albums) if !albums.is_empty() => {
            if let Some(first_album) = albums.first() {
                match client.get_album(&first_album.id).await {
                    Ok(album) => {
                        if let Some(songs) = &album.song {
                            if let Some(first_song) = songs.first() {
                                println!("\n   a) 测试记录\"正在播放\"状态 (submission=false)...");
                                match client.scrobble(&first_song.id, Some(false), None).await {
                                    Ok(()) => {
                                        println!("   ✓ 成功记录正在播放");
                                        println!("     - 歌曲: {}", first_song.title);
                                        println!("     - ID: {}", first_song.id);
                                    }
                                    Err(e) => println!("   ✗ 记录失败: {}", e),
                                }

                                // 等待 1 秒
                                tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;

                                println!("\n   b) 测试提交播放记录 (submission=true)...");
                                match client.scrobble(&first_song.id, Some(true), None).await {
                                    Ok(()) => {
                                        println!("   ✓ 成功提交播放记录");
                                        println!("     - 歌曲: {}", first_song.title);
                                        println!("     - ID: {}", first_song.id);
                                    }
                                    Err(e) => println!("   ✗ 记录失败: {}", e),
                                }

                                println!("\n   c) 测试带时间戳的播放记录...");
                                let timestamp = std::time::SystemTime::now()
                                    .duration_since(std::time::UNIX_EPOCH)
                                    .unwrap()
                                    .as_millis() as u64;
                                match client.scrobble(&first_song.id, Some(true), Some(timestamp)).await {
                                    Ok(()) => {
                                        println!("   ✓ 成功记录播放（带时间戳）");
                                        println!("     - 歌曲: {}", first_song.title);
                                        println!("     - 时间戳: {}", timestamp);
                                    }
                                    Err(e) => println!("   ✗ 记录失败: {}", e),
                                }
                            } else {
                                println!("   - 跳过测试: 专辑没有歌曲");
                            }
                        } else {
                            println!("   - 跳过测试: 专辑没有歌曲");
                        }
                    }
                    Err(e) => println!("   ✗ 获取专辑失败: {}", e),
                }
            }
        }
        _ => println!("   - 跳过测试: 没有可用的专辑数据"),
    }

    println!("\n=== 测试完成 ===");
    // println!("\n提示:");
    // println!("  可通过环境变量配置:");
    // println!("    SUBSONIC_URL=http://your-server:port");
    // println!("    SUBSONIC_USER=your-username");
    // println!("    SUBSONIC_PASS=your-password");
    // println!("\n  例如:");
    // println!("    SUBSONIC_URL=http://demo.subsonic.org SUBSONIC_USER=guest SUBSONIC_PASS=guest \\");
    // println!("    cargo run --example test_subsonic_client");
}
