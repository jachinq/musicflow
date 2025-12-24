# MusicFlow - Subsonic API 实现文档

## getRandomSongs 实现

本项目已完整实现 Subsonic API 的 getRandomSongs 接口,支持获取符合条件的随机歌曲。

### API 规范

根据 Subsonic API 文档,`getRandomSongs` 接口定义如下:

**URL**: `http://your-server/rest/getRandomSongs`

**参数**:
| Parameter | Required | Default | Comment |
|---|---|---|---|
| size | No | 10 | 返回的最大歌曲数量,最大 500 |
| genre | No | | 只返回该流派的歌曲 |
| fromYear | No | | 只返回此年份之后(含)发布的歌曲 |
| toYear | No | | 只返回此年份之前(含)发布的歌曲 |
| musicFolderId | No | | 只返回指定音乐文件夹的歌曲 |

---

## MusicFlow 实现

### API 接口

**路由**: `GET /api/random_songs`

**查询参数**:
- `size` (可选): 返回的最大歌曲数量,默认 150,最大 500
- `genre` (可选): 按流派筛选
- `fromYear` (可选): 只返回此年份之后(含)发布的歌曲
- `toYear` (可选): 只返回此年份之前(含)发布的歌曲
- `musicFolderId` (可选): 按音乐文件夹筛选 (暂不支持)

**响应格式**:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "list": [
      {
        "id": "111",
        "title": "Dancing Queen",
        "artist": "ABBA",
        "album": "Arrival",
        "year": "1978",
        "genre": "Pop",
        "duration": 146,
        "bitrate": "128",
        "samplerate": "44100",
        "file_url": "/music/ABBA/Arrival/Dancing Queen.mp3",
        "album_id": "11",
        "artist_id": "5",
        "cover_art": "24"
      }
    ],
    "total": 150
  }
}
```

---

### 数据源支持

该实现通过统一的数据源接口 (`MusicDataSource` trait) 支持双模式运行:

#### 1. 本地数据库模式

- 使用 SQLite `ORDER BY RANDOM()` 实现真随机
- 支持流派、年份范围筛选
- 默认返回 150 首,最大 500 首
- SQL 查询示例:
  ```sql
  SELECT * FROM metadata
  WHERE 1=1
    AND genre = ?
    AND CAST(year AS INTEGER) >= ?
    AND CAST(year AS INTEGER) <= ?
  ORDER BY RANDOM()
  LIMIT ?
  ```

#### 2. Subsonic 服务器模式

- 调用远程 Subsonic 服务器的 `getRandomSongs` API
- 完整支持 Subsonic API 的所有参数
- 自动为每首歌曲添加流式 URL
- 默认返回 10 首 (遵循 Subsonic 默认值)

---

### 使用示例

```bash
# 获取默认数量(150首)的随机歌曲
curl "http://localhost:9090/api/random_songs"

# 获取 10 首随机歌曲
curl "http://localhost:9090/api/random_songs?size=10"

# 获取流派为 "Pop" 的 20 首随机歌曲
curl "http://localhost:9090/api/random_songs?size=20&genre=Pop"

# 获取 2010-2020 年间的 30 首随机歌曲
curl "http://localhost:9090/api/random_songs?size=30&fromYear=2010&toYear=2020"

# 组合筛选: 2015年后的 Rock 流派随机歌曲
curl "http://localhost:9090/api/random_songs?size=50&genre=Rock&fromYear=2015"
```

---

### 实现架构

```
Controller Layer
    ↓
    handle_get_random_songs(query, app_state)
    ↓
DataSource Trait Layer
    ↓
    get_random_songs(size, genre, from_year, to_year)
    ↓
    ├─→ LocalDataSource (本地模式)
    │   └─→ Database Service
    │       └─→ SQLite: SELECT ... ORDER BY RANDOM() LIMIT ?
    │
    └─→ SubsonicDataSource (远程模式)
        └─→ Subsonic Client
            └─→ HTTP GET: /rest/getRandomSongs?size=...&genre=...
```

---

### 技术细节

#### 数据库层 (Database Service)

**文件**: `lib-utils/src/database/service.rs:198-261`

```rust
pub fn get_random_songs(
    size: Option<usize>,
    genre: Option<&str>,
    from_year: Option<&str>,
    to_year: Option<&str>,
) -> Result<Vec<Metadata>>
```

**特性**:
- 动态构建 SQL 查询
- 参数化查询防止 SQL 注入
- 使用 `ORDER BY RANDOM()` 确保随机性
- 自动限制 size 在 1-500 范围内

#### 数据源接口 (Trait)

**文件**: `lib-utils/src/datasource/trait_def.rs:131-147`

```rust
async fn get_random_songs(
    &self,
    size: Option<usize>,
    genre: Option<&str>,
    from_year: Option<&str>,
    to_year: Option<&str>,
) -> Result<Vec<UnifiedMetadata>>;
```

#### 本地实现

**文件**: `lib-utils/src/datasource/local.rs:337-352`

- 调用数据库服务层的 `get_random_songs`
- 将 `Metadata` 转换为 `UnifiedMetadata`

#### Subsonic 客户端

**文件**: `lib-utils/src/datasource/subsonic/client.rs:228-270`

```rust
pub async fn get_random_songs(
    &self,
    size: Option<usize>,
    genre: Option<&str>,
    from_year: Option<&str>,
    to_year: Option<&str>,
) -> Result<Vec<SubsonicSong>>
```

**特性**:
- 构建符合 Subsonic API 规范的请求参数
- 使用 `camelCase` 命名约定 (fromYear, toYear)
- 解析 `randomSongs` 响应结构

#### Subsonic 数据源

**文件**: `lib-utils/src/datasource/subsonic/datasource.rs:295-318`

- 调用 Subsonic 客户端
- 将 `SubsonicSong` 转换为 `UnifiedMetadata`
- 为每首歌曲添加流式 URL

#### Controller 层

**文件**: `server/src/controller_song.rs:342-381`

```rust
pub async fn handle_get_random_songs(
    query: web::Query<RandomSongsQuery>,
    app_state: web::Data<AppState>,
) -> impl Responder
```

**特性**:
- 使用 Actix-Web 的查询参数提取
- 支持 `camelCase` 和 `snake_case` 参数名
- 统一的 JSON 响应格式
- 错误处理和日志记录

#### 路由配置

**文件**: `server/src/main.rs:100`

```rust
.route("/api/random_songs", web::get().to(handle_get_random_songs))
```

---

### 相关文件清单

| 层级 | 文件路径 | 行号 | 说明 |
|------|---------|------|------|
| 数据库 | `lib-utils/src/database/service.rs` | 198-261 | SQL 查询实现 |
| Trait | `lib-utils/src/datasource/trait_def.rs` | 131-147 | 接口定义 |
| 本地 | `lib-utils/src/datasource/local.rs` | 337-352 | 本地数据源实现 |
| Subsonic Client | `lib-utils/src/datasource/subsonic/client.rs` | 228-270, 603-617 | HTTP 客户端和响应类型 |
| Subsonic DS | `lib-utils/src/datasource/subsonic/datasource.rs` | 295-318 | Subsonic 数据源实现 |
| Controller | `server/src/controller_song.rs` | 324-381 | HTTP 处理器 |
| Route | `server/src/main.rs` | 100 | 路由注册 |

---

### 测试建议

1. **本地模式测试**:
   ```bash
   # 确保配置文件使用本地数据源
   cargo run -p server
   curl "http://localhost:9090/api/random_songs?size=10"
   ```

2. **Subsonic 模式测试**:
   ```bash
   # 修改 conf/config.json 配置 Subsonic 服务器
   curl "http://localhost:9090/api/random_songs?size=10&genre=Rock"
   ```

3. **参数验证测试**:
   ```bash
   # 测试各种参数组合
   curl "http://localhost:9090/api/random_songs?size=1000"  # 应限制为 500
   curl "http://localhost:9090/api/random_songs?genre=Pop&fromYear=2020"
   curl "http://localhost:9090/api/random_songs?toYear=2010"
   ```

---

### 注意事项

1. **默认数量差异**: 本地模式默认 150 首,Subsonic 模式默认 10 首 (遵循各自规范)
2. **musicFolderId 参数**: 当前版本暂不支持,将在后续版本实现
3. **年份筛选**: 使用 `CAST(year AS INTEGER)` 确保正确的数值比较
4. **空流派处理**: 空字符串流派参数会被忽略
5. **错误处理**: 所有层级都有完善的错误处理和日志记录

---

### 未来改进

- [ ] 支持 `musicFolderId` 参数
- [ ] 添加更多筛选条件 (艺术家、专辑等)
- [ ] 缓存热门随机歌曲列表
- [ ] 支持加权随机 (根据播放次数、评分等)
- [ ] 添加性能监控和统计
