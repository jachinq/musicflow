# MusicFlow

This is a project to create a web application that allows users to create playlists based on their music taste.

All the music data is from server side APIs.

# Tech Stack

- Backend: Rust
- Frontend: React.js
- Database: SqLite

# Features

- User can create a playlist based on their music taste.
- User can add songs to their playlist.
- User can remove songs from their playlist.
- User can search for songs and add them to their playlist.
- User can view their playlists.
- User can edit their playlists.
- User can delete their playlists.

# Installation

Database: more detail see [initdb](initdb/README.md)

```shell
cargo run -p initdb
```

Frontend:

```shell
cd web
pnpm build
```

Backend:

```shell
cargo run -p server
```

The application will run on `http://127.0.0.1:9090`.

# Build

## Build all and run

```shell
cargo build --release -p initdb
cp target/release/initdb ./run_initdb
./run_initdb
cargo build --release -p server
cp target/release/server ./build
cd web
pnpm build
cp -r dist/ ./build/web
cd ../build
./server
```

## Docker

You can also use Docker to build and run the application.

1. change the [config.json](conf/config.json )file.

```json
{
  "ip": "0.0.0.0",
  "port": 9090,
  "music_dir": "/home/myapp/music",
  "web_dir": "/home/myapp/web/dist",
  "db_path": "/home/myapp/data/musicflow.db"
}
```

2. Run the following command to build the Docker image:


```shell
cd docker
./build_docker.sh
cd ../build
docker-compose up -d
```

# Log

2024-12-24: Created the project structure, added the basic structure of the backend server.
2025-01-02: First version.
2025-01-07: Added the db initialization tool.

# License

[MIT](LICENSE)