// 测试配置加载和数据源创建
// 运行: cargo run --example test_datasource

use lib_utils::config::get_config;
use lib_utils::datasource::factory::create_data_source;

#[tokio::main]
async fn main() {
    println!("=== 测试配置加载和数据源创建 ===\n");

    // 1. 加载配置
    println!("1. 加载配置文件...");
    let config = get_config();
    println!("   ✓ 配置加载成功");
    println!("   - IP: {}", config.ip);
    println!("   - Port: {}", config.port);
    println!("   - DB Path: {}", config.db_path);
    println!("   - Data Source Mode: {}\n", config.data_source.mode);

    // 2. 创建数据源
    println!("2. 创建数据源...");
    let data_source = create_data_source(&config);
    println!("   ✓ 数据源创建成功");
    println!("   - 类型: {:?}\n", data_source.source_type());

    // 3. 健康检查
    println!("3. 执行健康检查...");
    match data_source.health_check().await {
        Ok(_) => println!("   ✓ 健康检查通过"),
        Err(e) => println!("   ✗ 健康检查失败: {}", e),
    }

    println!("\n=== 测试完成 ===");
}
