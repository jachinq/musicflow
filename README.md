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

Database: more detail see [metadata](metadata/README.md)

```shell
cd metadata
pnpm install
# build the metadata database
pnpm dev
# generate the album cover images
pnpm db_album
```

Backend:

```shell
cargo run
```

Frontend:

```shell
cd frontend
pnpm dev
```

# Build

## Frontend and Backend

Backend:

```shell
cd server
cargo build
```

Frontend:

```shell
cd frontend
pnpm build
```

## Build All

You can also combine the two.

1. Prepare the build directory:

```shell
mkdir build
mkdir build/conf
mkdir build/music
mkdir build/data
```

2. Build the metadata database:

Put your music files in the `build/music` directory.

ps: metadata will read from the file's metadata, so you need to put the music files in the right format.

```shell
cd metadata
pnpm install
pnpm dev
pnpm db_album
cp musicflow.db ../build/data/
cd ..
```

3. Build the backend server:

```shell
cd server
cargo build --release
cp target/release/musicflow ../build/
cp conf/config.json ../build/conf/
cd ..
```

4. Build the frontend:

```shell
cd web
pnpm build
cp -r dist ../build/
cd ..
```

5. Run the Application:

You can change the configuration file `build/conf/config.json` to change the port and database path and etc.

```shell
cd build
./musicflow
```

The application will run on `http://127.0.0.1:9090`.

# Log

2024-12-24: Created the project structure, added the basic structure of the backend server.
2025-01-02: First version.

# License

[MIT](LICENSE)