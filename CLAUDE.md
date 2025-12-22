# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

MusicFlow 是一个基于 Rust 后端和 React 前端的音乐管理 Web 应用。用户可以扫描本地音乐文件,创建和管理播放列表,查看音乐元数据、歌词和封面。

**技术栈**:
- 后端: Rust (Actix-Web 框架)
- 前端: React + TypeScript (使用 Rsbuild 构建)
- 数据库: SQLite (使用 rusqlite)
- 音乐元数据: Symphonia 库

## 项目结构

这是一个 Cargo workspace,包含以下核心模块:

- **server/**: Actix-Web HTTP 服务器,提供 RESTful API
  - `controller_*.rs`: 按功能划分的路由处理器 (song, album, artist, genre, playlist, songlist)
  - `main.rs`: 服务器启动、路由配置、CORS 设置

- **lib-utils/**: 共享工具库,被 server 和 initdb 依赖
  - `database/`: SQLite 数据库操作
    - `table.rs`: 数据库表结构定义和初始化
    - `service.rs`: 数据库 CRUD 操作
    - `covert.rs`: 数据库记录与 Rust 结构体的转换
  - `readmeta.rs`: 使用 Symphonia 读取音乐文件元数据 (标题、艺术家、专辑、时长等)
  - `config.rs`: 从 `conf/config.json` 读取配置
  - `image.rs`: 图片处理 (封面图片的压缩和转换)
  - `log.rs`: 日志工具

- **initdb/**: 数据库初始化工具
  - 扫描 `music_dir` 中的音乐文件
  - 提取元数据并插入到 SQLite 数据库
  - 生成不同尺寸的封面图片并存储为 base64

- **web/**: React 前端应用
  - `src/pages/`: 页面组件 (HomePage, MusicPlayPage, MoreInfoPage, SongListPage, SettingsPage)
  - `src/components/`: 可复用 UI 组件 (AudioPlayer, MusicCard, Lyrics, Playlist 等)
  - `src/store/`: Zustand 状态管理 (当前播放、音乐列表、播放列表、设置)

- **metadata/**: Node.js TypeScript 工具集 (用于元数据实验和数据库操作)

## 常用开发命令

### 数据库初始化

首次运行前需要扫描音乐文件并构建数据库:

```bash
# 开发模式 (较慢)
cargo run -p initdb

# 发布模式 (推荐,处理大量音乐文件时更快)
cargo build --release -p initdb
cp target/release/initdb .
./initdb
```

**配置**: 编辑 `conf/config.json` 设置 `music_dir` (音乐文件目录) 和 `db_path` (数据库文件路径)

### 后端开发

```bash
# 开发模式运行服务器 (debug 构建,带日志输出)
cargo run -p server

# 发布模式构建
cargo build --release -p server
```

服务器默认运行在 `http://127.0.0.1:9090` (可在 `conf/config.json` 中配置 `ip` 和 `port`)

### 前端开发

```bash
cd web

# 安装依赖
pnpm install

# 开发服务器 (热重载)
pnpm dev

# 生产构建
pnpm build

# 预览构建结果
pnpm preview
```

### 完整构建流程

```bash
# 1. 构建数据库初始化工具
cargo build --release -p initdb
cp target/release/initdb ./run_initdb
./run_initdb

# 2. 构建后端服务器
cargo build --release -p server
mkdir -p build
cp target/release/server ./build

# 3. 构建前端
cd web
pnpm build
cp -r dist/ ../build/web

# 4. 运行
cd ../build
./server
```

### Docker 部署

```bash
# 1. 修改 conf/config.json 中的路径为容器内路径
# 2. 构建 Docker 镜像
cd docker
./build_docker.sh

# 3. 启动容器
cd ../build
docker-compose up -d
```

## 配置文件说明

`conf/config.json` 是全局配置文件:

```json
{
  "ip": "0.0.0.0",           // 服务器监听地址
  "port": 9090,              // 服务器端口
  "music_dir": "../music",   // 音乐文件目录 (initdb 扫描源,server 提供静态文件)
  "web_dir": "../web/dist",  // 前端构建产物目录
  "db_path": "../data/musicflow.db",  // SQLite 数据库文件路径
  "debug": true              // 调试模式开关
}
```

## 核心架构要点

### 数据库表结构

主要表 (见 `lib-utils/src/database/table.rs`):
- `metadata`: 音乐文件元数据 (id, 文件路径, 标题, 艺术家, 专辑, 时长等)
- `cover`: 封面图片 (type, link_id, base64 编码的图片数据)
- `lyric`: 歌词 (song_id, time, text)
- `playlist`: 播放列表状态 (记忆播放位置和状态)
- `song_list` / `song_list_song`: 用户歌单
- `album` / `album_song`: 专辑
- `artist` / `artist_song`: 艺术家
- 其他: user, user_token, user_favorite

### API 路由模式

所有 API 路由定义在 `server/src/main.rs` 中,前缀为 `/api/`:

- **音乐相关**: `/api/list`, `/api/single/{song_id}`, `/api/cover/small/{song_id}`, `/api/lyrics/{song_id}`
- **分类相关**: `/api/genres`, `/api/song_genres/{song_id}`
- **专辑/艺术家**: `/api/albums`, `/api/artists`
- **播放列表**: `/api/playlist`, `/api/playlist/del`, `/api/playlist/update`
- **歌单**: `/api/songlist`, `/api/songlist/songs`

静态文件:
- 音乐文件: `/music/*` (映射到 `config.music_dir`)
- 前端静态资源: `/` (映射到 `config.web_dir`)

### 音乐元数据处理流程

1. `initdb` 使用 `walkdir` 遍历 `music_dir`
2. 调用 `lib_utils::readmeta::read_metadata()` 使用 Symphonia 读取音频文件
3. 提取封面图片,使用 `lib_utils::image` 压缩为多种尺寸
4. 将元数据、歌词、封面存入 SQLite 数据库

### 前端状态管理

使用 Zustand 管理以下状态 (在 `web/src/store/` 中):
- `current-play.ts`: 当前播放的歌曲、播放/暂停状态
- `musicList.ts`: 音乐列表和分页
- `playlist.ts`: 播放列表 (播放队列、历史记录、播放模式)
- `setting.ts`: 应用设置

### 关键依赖说明

**Rust**:
- `actix-web`: HTTP 服务器框架
- `rusqlite`: SQLite 绑定 (使用 `bundled` feature 静态链接 SQLite)
- `symphonia`: 音频解码和元数据读取 (支持 FLAC, MP3)
- `walkdir`: 递归遍历目录

**前端**:
- `react-router-dom`: 路由
- `zustand`: 状态管理
- `lucide-react`: 图标库
- `sonner`: Toast 通知
- `@rsbuild/core`: 构建工具 (替代 Webpack/Vite)

## 注意事项

- 修改配置文件后需要重启 `server` 和 `initdb`
- 添加新音乐文件后需重新运行 `initdb` 来更新数据库
- 数据库文件位置由 `conf/config.json` 中的 `db_path` 控制
- 封面图片以 base64 格式存储在数据库中,分为 small/medium/large 三种尺寸
- 前端开发时使用 `pnpm dev`,生产部署需先 `pnpm build` 然后将 `dist/` 复制到 `web_dir`
