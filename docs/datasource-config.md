# 数据源配置说明

MusicFlow 现在支持两种数据源模式:

1. **本地文件模式 (local)** - 从本地文件系统读取音乐文件
2. **Subsonic 模式 (subsonic)** - 从 Subsonic 兼容服务器获取音乐

## 配置文件位置

配置文件位于: `conf/config.json`

## 本地文件模式配置

本地模式使用本地音乐文件和 SQLite 数据库:

```json
{
  "ip": "0.0.0.0",
  "port": 9090,
  "music_dir": "../music",
  "web_dir": "../web/dist",
  "db_path": "../data/musicflow1.db",
  "debug": true,
  "data_source": {
    "mode": "local",
    "local": {
      "music_dir": "../music"
    },
    "subsonic": null
  }
}
```

### 本地模式配置项说明

- `mode`: 设置为 `"local"`
- `local.music_dir`: 音乐文件目录路径

注意: 为了向后兼容,顶层的 `music_dir` 字段仍然保留,但优先使用 `data_source.local.music_dir`。

## Subsonic 模式配置

Subsonic 模式从远程 Subsonic 服务器流式播放音乐:

```json
{
  "ip": "0.0.0.0",
  "port": 9090,
  "music_dir": "../music",
  "web_dir": "../web/dist",
  "db_path": "../data/musicflow1.db",
  "debug": true,
  "data_source": {
    "mode": "subsonic",
    "local": null,
    "subsonic": {
      "server_url": "http://music.example.com",
      "username": "your_username",
      "password": "your_password_or_token",
      "use_token_auth": true,
      "api_version": "1.16.1",
      "client_name": "MusicFlow",
      "max_bitrate": 320,
      "prefer_format": "mp3",
      "cache_ttl_seconds": 3600
    }
  }
}
```

### Subsonic 模式配置项说明

- `mode`: 设置为 `"subsonic"`
- `subsonic.server_url`: Subsonic 服务器地址 (如 `http://music.example.com` 或 `https://music.example.com`)
- `subsonic.username`: Subsonic 用户名
- `subsonic.password`: 密码或 Token (取决于 `use_token_auth`)
- `subsonic.use_token_auth`: 是否使用 Token 认证 (推荐设为 `true`,更安全)
  - `true`: `password` 字段为 Token (通过 MD5(password) 生成)
  - `false`: `password` 字段为明文密码
- `subsonic.api_version`: Subsonic API 版本 (默认 `"1.16.1"`)
- `subsonic.client_name`: 客户端名称 (默认 `"MusicFlow"`)
- `subsonic.max_bitrate`: 最大比特率,单位 kbps (默认 `320`)
- `subsonic.prefer_format`: 首选音频格式 (默认 `"mp3"`,可选 `"opus"`, `"flac"` 等)
- `subsonic.cache_ttl_seconds`: 缓存过期时间,单位秒 (默认 `3600` = 1小时)

## 配置验证

运行测试程序验证配置:

```bash
cargo run --example test_datasource
```

正常输出应包含:
- ✓ 配置加载成功
- ✓ 数据源创建成功
- 数据源类型 (Local 或 Subsonic)

## 配置示例

项目提供了以下配置示例:

- `conf/config.json` - 当前配置 (默认为本地模式)
- `conf/config.subsonic.example.json` - Subsonic 模式配置示例

## 切换数据源

要切换数据源,只需修改 `data_source.mode` 字段:

- 切换到本地模式: 设置 `"mode": "local"`
- 切换到 Subsonic 模式: 设置 `"mode": "subsonic"` 并配置 `subsonic` 选项

修改后重启服务即可生效。

## 故障排查

### 本地模式

- 确保 `music_dir` 路径正确且可访问
- 确保 `db_path` 指向有效的数据库文件
- 运行 `initdb` 工具扫描音乐文件并初始化数据库

### Subsonic 模式

- 确保 `server_url` 正确 (包括 http:// 或 https://)
- 确保用户名和密码正确
- 检查网络连接是否正常
- 验证 Subsonic 服务器版本与 `api_version` 兼容
- 如果使用 Token 认证,确保 `password` 字段为正确的 Token

## 技术细节

### 数据源抽象层

MusicFlow 使用 `MusicDataSource` trait 抽象了数据源访问接口,支持:

- 获取音乐元数据
- 获取封面图片
- 获取歌词
- 搜索音乐/专辑/艺术家
- 获取音频流

### 数据源实现

- **LocalDataSource**: 封装了现有的本地文件系统和数据库访问
- **SubsonicDataSource**: 实现了 Subsonic REST API 客户端
  - 支持 Token 和密码两种认证方式
  - 内置内存缓存机制减少 API 调用
  - 支持流式音频传输

### 配置兼容性

配置系统使用 `#[serde(default)]` 确保向后兼容:
- 旧配置文件不包含 `data_source` 字段时,自动使用本地模式
- 所有 Subsonic 配置项都有合理的默认值
