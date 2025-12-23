# Subsonic 数据源集成进度报告

## 已完成的工作

### 阶段 0-3: 数据源抽象层建设 ✅

已完成所有基础设施建设:

1. **数据源抽象层** (`lib-utils/src/datasource/`)
   - ✅ trait 定义 (MusicDataSource)
   - ✅ 统一数据类型 (UnifiedMetadata, AudioStream, etc.)
   - ✅ LocalDataSource 实现
   - ✅ SubsonicDataSource 实现
     - SubsonicClient (HTTP 客户端)
     - SubsonicAuth (认证)
     - 数据映射 (mapper)
     - LRC 歌词解析
   - ✅ 工厂模式 (create_data_source)

2. **配置系统扩展** (`lib-utils/src/config.rs`)
   - ✅ DataSourceConfig 结构
   - ✅ LocalConfig / SubsonicConfig
   - ✅ 向后兼容性支持
   - ✅ 配置示例文件

3. **文档和测试**
   - ✅ 配置文档 (`docs/datasource-config.md`)
   - ✅ 测试程序 (`lib-utils/examples/test_datasource.rs`)
   - ✅ Subsonic 配置示例 (`conf/config.subsonic.example.json`)

### 阶段 4: 后端集成 ✅

已成功将数据源抽象层集成到 server 模块:

#### 4.1 修改 AppState ✅

**文件**: `server/src/main.rs`

```rust
// 修改前
#[derive(Clone, Debug, Deserialize, Serialize, Default)]
struct AppState {
    web_path: String,
    music_path: String,
}

// 修改后
#[derive(Clone)]
struct AppState {
    web_path: String,
    music_path: String,
    data_source: Arc<dyn MusicDataSource>,  // 新增
}
```

**变更**:
- 导入 `datasource` 模块和相关类型
- 在 `main()` 中创建数据源: `let data_source = create_data_source(&config);`
- 将 `data_source` 注入到 AppState 中

#### 4.2 创建数据适配器 ✅

**文件**: `server/src/adapters.rs` (新建)

提供两个核心转换函数:

1. **unified_to_vo**: 单个 UnifiedMetadata → MetadataVo
2. **unified_list_to_vo**: 批量转换,针对本地/Subsonic 模式优化
   - 本地模式: 批量查询 album_id 和 artist_id
   - Subsonic 模式: 直接转换

**特点**:
- 自动识别数据源类型
- 处理 file_url 和 stream_url 的差异
- 保持与现有 API 响应格式兼容

#### 4.3 重构 controller_song.rs ✅

**修改的函数**:

1. **handle_get_metadatas** (获取音乐列表)
   - 使用 `app_state.data_source.list_metadata()` 替代直接数据库调用
   - 通过 `MetadataFilter` 传递查询参数
   - 支持本地和 Subsonic 双模式

2. **handle_get_metadata** (获取单首歌曲)
   - 使用 `app_state.data_source.get_metadata()`
   - 自动适配本地/Subsonic 数据源

**代码变更示例**:

```rust
// 修改前
pub async fn handle_get_metadatas(query: web::Json<MusicListQuery>) -> impl Responder {
    let result = service::get_metadata_list();
    // 大量的过滤和分页逻辑
}

// 修改后
pub async fn handle_get_metadatas(
    query: web::Json<MusicListQuery>,
    app_state: web::Data<AppState>,  // 注入 AppState
) -> impl Responder {
    let filter = MetadataFilter { /* ... */ };
    let result = app_state.data_source.list_metadata(filter).await;
    // 简化的过滤逻辑
    let list = adapters::unified_list_to_vo(metadata_list);
}
```

## 编译状态

✅ 所有代码编译通过,无错误,无警告 (除了工作空间的版本警告)

```
cargo check
    Checking server v1.2.0
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.58s
```

## 架构优势

### 1. 解耦合
- Controller 不再直接依赖 `database::service`
- 通过 trait 抽象,支持多种数据源

### 2. 可扩展性
- 新增数据源只需实现 `MusicDataSource` trait
- 无需修改 controller 代码

### 3. 统一接口
- 本地和 Subsonic 模式使用相同的 API
- 前端无需感知数据源差异

### 4. 向后兼容
- 保持现有 API 响应格式
- 支持旧配置文件
- 默认使用本地模式

## 数据流对比

### 修改前 (仅本地模式)
```
HTTP Request
  → handle_get_metadatas()
  → service::get_metadata_list()  (直接调用)
  → SQLite 查询
  → Metadata 转 MetadataVo
  → JSON Response
```

### 修改后 (支持双模式)
```
HTTP Request
  → handle_get_metadatas(app_state)
  → app_state.data_source.list_metadata()  (trait 调用)
  → LocalDataSource 或 SubsonicDataSource
    ├─ Local: SQLite 查询
    └─ Subsonic: HTTP API 调用
  → UnifiedMetadata
  → adapters::unified_list_to_vo()
  → MetadataVo
  → JSON Response
```

## 待测试功能

虽然代码编译通过,但以下功能需要实际运行测试:

### 本地模式
- ✅ 配置加载 (已通过 test_datasource 测试)
- ✅ 数据源创建 (已通过 test_datasource 测试)
- ⏳ HTTP API 调用 `/api/list`, `/api/single/{id}`
- ⏳ 封面图片获取
- ⏳ 歌词获取

### Subsonic 模式
- ⏳ Subsonic 服务器连接
- ⏳ 认证 (Token 模式)
- ⏳ 音乐列表获取
- ⏳ 流式播放 URL 生成
- ⏳ 搜索功能

## 未完成的工作

### 1. controller_album.rs / controller_artist.rs
这些控制器尚未重构以使用 DataSource,仍然直接调用数据库服务。

**优先级**: 中
**原因**: 当前已完成的 controller_song.rs 覆盖了大部分核心功能,其他控制器可以后续迭代。

### 2. 封面和歌词 API
`get_cover_*` 和 `get_lyrics` 函数尚未重构。

**优先级**: 高
**建议**: 使用 `app_state.data_source.get_cover()` 和 `app_state.data_source.get_lyrics()`

### 3. 实际运行测试
需要启动 server 并测试 API 是否正常工作。

### 4. 前端适配
前端可能需要微调以支持 Subsonic 模式的特殊需求。

## 下一步行动建议

### 立即行动 (高优先级)
1. **启动 server 并测试基本功能**
   ```bash
   cargo run -p server
   # 测试 API: curl http://localhost:9090/api/list
   ```

2. **重构封面和歌词 API**
   - `get_cover_small/medium/large` → 使用 `data_source.get_cover()`
   - `get_lyrics` → 使用 `data_source.get_lyrics()`

3. **集成测试**
   - 测试本地模式所有 API
   - 测试 Subsonic 模式 (需要 Subsonic 服务器)

### 后续行动 (中优先级)
4. **重构其他控制器**
   - controller_album.rs
   - controller_artist.rs
   - controller_playlist.rs (部分)

5. **前端适配**
   - 检查前端是否需要调整
   - 确保 Subsonic 模式下流式播放正常

6. **文档更新**
   - 更新 CLAUDE.md
   - 添加 Subsonic 使用指南

## 总结

✅ **核心架构改造已完成**
- 数据源抽象层完全就绪
- 配置系统支持双模式
- 主要 API (音乐列表/单首歌曲) 已重构
- 编译通过,无错误

📊 **完成度估算**
- 基础设施: 100%
- 后端集成: 70% (核心功能完成)
- 测试验证: 20% (仅基础测试)
- 前端适配: 0%

🎯 **下一个里程碑**
运行 server 并验证 API 功能正常,然后逐步完成剩余控制器的重构。
