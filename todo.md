# 任务：接入 Subsonic PlayQueue API

## ✅ 任务完成状态

**所有实施阶段已完成！**

## 实施总结

### 修改的文件

1. **lib-utils/src/datasource/subsonic/client.rs**
   - 添加 `SubsonicPlayQueue` 和 `PlayQueueWrapper` 类型定义
   - 实现 `get_play_queue()` 方法（调用 `/rest/getPlayQueue`）
   - 实现 `save_play_queue()` 方法（调用 `/rest/savePlayQueue`）

2. **lib-utils/src/datasource/types.rs**
   - 添加 `PlayQueueInfo` 结构体（统一的播放队列信息）
   - 字段：`song_ids`, `current_song_id`, `position`, `changed`, `changed_by`

3. **lib-utils/src/datasource/trait_def.rs**
   - 为 `MusicDataSource` trait 添加两个方法：
     - `async fn get_play_queue(&self) -> Result<Option<PlayQueueInfo>>`
     - `async fn save_play_queue(&self, queue: &PlayQueueInfo) -> Result<()>`

4. **lib-utils/src/datasource/subsonic/datasource.rs**
   - 实现 `SubsonicDataSource::get_play_queue()`（调用 Subsonic API）
   - 实现 `SubsonicDataSource::save_play_queue()`（调用 Subsonic API）

5. **lib-utils/src/datasource/local.rs**
   - 实现 `LocalDataSource::get_play_queue()`（从数据库读取）
   - 实现 `LocalDataSource::save_play_queue()`（写入数据库）
   - 复用现有的 `service::get_play_list()` 和 `service::add_play_list()`

6. **server/src/controller_playlist.rs**
   - 添加 `SavePlayQueueRequest` 结构体
   - 实现 `handle_get_play_queue()` 接口
   - 实现 `handle_save_play_queue()` 接口

7. **server/src/main.rs**
   - 注册路由 `GET /api/playqueue`
   - 注册路由 `POST /api/playqueue`

8. **lib-utils/examples/test_subsonic_client.rs**
   - 添加播放队列测试（第 10 项测试）
   - 测试 getPlayQueue 和 savePlayQueue 功能

### 核心功能

#### 数据流向

```
前端请求
   ↓
controller_playlist.rs (handle_get_play_queue / handle_save_play_queue)
   ↓
MusicDataSource trait (get_play_queue / save_play_queue)
   ↓
   ├─→ LocalDataSource → 数据库 (playlist 表)
   └─→ SubsonicDataSource → SubsonicClient → Subsonic 服务器
```

#### API 接口

**1. 获取播放队列**
- 路由：`GET /api/playqueue`
- 响应：返回 `PlayQueueInfo` 对象
  - `song_ids`: 歌曲 ID 列表
  - `current_song_id`: 当前播放歌曲 ID
  - `position`: 播放位置（毫秒）

**2. 保存播放队列**
- 路由：`POST /api/playqueue`
- 请求体：
  ```json
  {
    "song_ids": ["id1", "id2", "id3"],
    "current_song_id": "id1",
    "position": 5000
  }
  ```
- 响应：保存成功返回 "ok"

### 编译验证

```bash
✓ cargo check -p lib-utils  # 编译通过
✓ cargo check -p server      # 编译通过
```

### 测试方法

**1. 测试 Subsonic 客户端**
```bash
cargo run --example test_subsonic_client
```

**2. 测试本地模式**
- 启动 server：`cargo run -p server`
- 获取播放队列：`GET http://localhost:9090/api/playqueue`
- 保存播放队列：`POST http://localhost:9090/api/playqueue`

**3. 测试 Subsonic 模式**
- 确保 `conf/config.json` 配置了 Subsonic 数据源
- 启动 server 并使用相同的 API 接口测试

## 技术要点

1. **极简原则**：只添加必要功能，未做额外重构
2. **兼容性**：对现有 API 无影响
3. **统一抽象**：通过 `MusicDataSource` trait 实现统一接口
4. **跨客户端同步**：Subsonic 模式下，播放队列由服务器管理
5. **本地持久化**：本地模式下，播放队列存储在 SQLite 数据库

## 后续建议

1. 前端集成：在前端实现播放队列的获取和保存逻辑
2. 性能优化：考虑添加缓存机制减少 API 调用
3. 错误处理：增强错误提示和容错处理
4. 用户隔离：当前默认使用 user_id=1，后续可扩展为多用户支持

---

**实施日期**：2026-01-03
**状态**：✅ 已完成所有开发任务，代码编译通过

