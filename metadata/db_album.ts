
import fs from "fs";
import { addAlbum, addAlbumSong, Album, AlbumSong, Cover, getAlbum, getAllAlbumSongs, getAllMetadata, getAllCover, db, addCover } from "./sql"

const build_album = () => {
  const metadatas = getAllMetadata();
  console.log("all metadatas", metadatas.length);
  const existMap: Record<string, boolean> = {}; // 定义为字符串到布尔值的映射
  // 把 album 和 artist 拿出来
  const albums: Album[] = [];
  const albums_songs: AlbumSong[] = [];
  metadatas.forEach(metadata => {
    if (metadata.album === "") {
      console.log("empty album", metadata.title);
      return
    };

    albums_songs.push({
      album_id: 0, // 这里先用 0 代替，后面再改
      song_id: metadata.id,
      album_name: metadata.album,
      song_title: metadata.title,
      song_artist: metadata.artist,
    });
    const exist = existMap[`${metadata.album}_${metadata.artist}`];
    if (exist) return;
    albums.push({
      id: 0,
      name: metadata.album,
      year: metadata.year,
      artist: metadata.artist,
      description: "",
    });
    existMap[`${metadata.album}_${metadata.artist}`] = true;
  });
  console.log("all albums", albums.length);
  console.log("all album songs", albums_songs.length);
  albums.forEach(album => {
    addAlbum(album);
  });
  const existAlbumSongMap: Record<string, boolean> = {}; // 定义为字符串到布尔值的映射
  const allAlbumSongs = getAllAlbumSongs();
  allAlbumSongs.map((album_song: any) => {
    existAlbumSongMap[`${album_song.album_name}_${album_song.song_artist}_${album_song.song_title}_${album_song.song_id}`] = true;
  });
  console.log("already exist album songs", allAlbumSongs.length);
  albums_songs.forEach(album_song => {
    if (existAlbumSongMap[`${album_song.album_name}_${album_song.song_artist}_${album_song.song_title}_${album_song.song_id}`]) return;
    album_song.album_id = getAlbum(album_song.album_name, album_song.song_artist).id;
    // console.log('album_id', album_song.album_id);
    addAlbumSong(album_song);
  });
}

const build_album_cover = () => {
  const album_covers: Cover[] = [];
  const album_songs: AlbumSong[] = getAllAlbumSongs();
  const existCoverMap: Record<number, boolean> = {}; // 定义为字符串到布尔值的映射
  let covers: any[] = getAllCover();
  if (covers.length > 0) {
    console.log("all covers", covers.length);
    fs.writeFileSync("cover.json", JSON.stringify(covers, null, 2));
    db.exec("DROP TABLE IF EXISTS cover");
    db.exec(`
CREATE TABLE
  IF NOT EXISTS cover
(
    type    TEXT    NOT NULL,
    link_id INTEGER NOT NULL DEFAULT 0,
    format  TEXT    NOT NULL,
    size    TEXT    NOT NULL,
    width   REAL,
    height  REAL,
    base64  TEXT    NOT NULL
);
      `);
  } else {
    fs.readFileSync("cover.json", "utf-8");
    covers = JSON.parse(fs.readFileSync("cover.json", "utf-8"));
    console.log("read from file, all covers", covers.length);
  }

  const cover_map: Record<string, Cover[]> = {};
  covers.forEach(cover => {
    const key = cover.song_id || "";
    if (key === "") {
      // console.log("song_id lost", cover.type);
      return;
    }
    const list = cover_map[key];
    if (list) {
      list.push(cover);
      cover_map[key] = list;
    } else {
      cover_map[key] = [cover];
    }
  });

  album_songs.forEach(album_song => {
    if (existCoverMap[album_song.album_id]) {
      return;
    }
    // if (album_song.song_id === "AnIBv2hHJ") {
    //   console.log(cover_map[album_song.song_id]);
    // }
    cover_map[album_song.song_id].forEach(cover => {
      album_covers.push({
        type: "album",
        link_id: album_song.album_id,
        format: cover.format,
        width: cover.width,
        height: cover.height,
        base64: cover.base64,
        size: cover.type,
      });
    });
    existCoverMap[album_song.album_id] = true;
  });
  console.log("album songs", album_songs.length);
  console.log("final album covers", album_covers.length);
  album_covers.forEach(album_cover => {
    addCover(album_cover);
  });
}


const start_time = new Date().getTime();
console.log(new Date().toLocaleString(), "start");
// build_album();
build_album_cover();
const end_time = new Date().getTime();
console.log(new Date().toLocaleString(), "done. cost time:", (end_time - start_time) / 1000, "s");