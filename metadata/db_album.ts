import fs from "fs";
import {
  addAlbum,
  addAlbumSong,
  Album,
  AlbumSong,
  getAlbum,
  getAllAlbumSongs,
  getAllMetadata,
  addCover,
  getMetadataById,
} from "./sql";
import { getCovers } from "./readmeta";
import { concurrence } from "./task";

const logProgress = (count: number, success: number) => {
  console.log(
    "count",
    count,
    "success:",
    success,
    "progress:",
    ((success / count) * 100).toFixed(2) + "%"
  );
};

const build_album = () => {
  const metadatas = getAllMetadata();
  console.log("all metadatas", metadatas.length);
  const existMap: Record<string, boolean> = {}; // 定义为字符串到布尔值的映射
  // 把 album 和 artist 拿出来
  const albums: Album[] = [];
  const albums_songs: AlbumSong[] = [];
  metadatas.forEach((metadata) => {
    if (metadata.album === "") {
      console.log("empty album", metadata.title);
      return;
    }

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
  albums.forEach((album) => {
    addAlbum(album);
  });
  const existAlbumSongMap: Record<string, boolean> = {}; // 定义为字符串到布尔值的映射
  const allAlbumSongs = getAllAlbumSongs();
  allAlbumSongs.map((album_song: any) => {
    existAlbumSongMap[
      `${album_song.album_name}_${album_song.song_artist}_${album_song.song_title}_${album_song.song_id}`
    ] = true;
  });
  console.log("already exist album songs", allAlbumSongs.length);
  albums_songs.forEach((album_song) => {
    if (
      existAlbumSongMap[
        `${album_song.album_name}_${album_song.song_artist}_${album_song.song_title}_${album_song.song_id}`
      ]
    )
      return;
    album_song.album_id = getAlbum(
      album_song.album_name,
      album_song.song_artist
    ).id;
    // console.log('album_id', album_song.album_id);
    addAlbumSong(album_song);
  });
};

const build_album_cover = () => {
  const album_songs: AlbumSong[] = getAllAlbumSongs();
  const existCoverMap: Record<number, boolean> = {}; // 定义为字符串到布尔值的映射

  let album_covers_cnt = 0;
  let success = 0;
  let exist_cnt = 0;

  const singleTask = async (album_song: AlbumSong) => {
    if (existCoverMap[album_song.album_id]) {
      success++;
      exist_cnt++;
      logProgress(album_songs.length, success);
      return;
    }

    const { file_path } = getMetadataById(album_song.song_id);
    const arrayBuffer = fs.readFileSync(file_path);
    const covers = await getCovers(arrayBuffer); // 从源文件流中提取封面，耗时操作
    covers.forEach((c) => {
      c.link_id = album_song.album_id;
      album_covers_cnt++;
      addCover(c);
    });
    success++;
    logProgress(album_songs.length, success);
    existCoverMap[album_song.album_id] = true;
  }

  concurrence(50, album_songs, singleTask);

  console.log("album songs", album_songs.length);
  console.log("final album covers", album_covers_cnt, "exist", exist_cnt);
};

const start_time = new Date().getTime();
console.log(new Date().toLocaleString(), "start");
build_album();
build_album_cover();
const end_time = new Date().getTime();
console.log(
  new Date().toLocaleString(),
  "done. cost time:",
  (end_time - start_time) / 1000,
  "s"
);
