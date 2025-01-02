import fs from "fs";
import path from "path";
import { IMeta, readMetaByBuffer, readTitleAndArtist } from "./readmeta";
import {
  addArtist,
  addArtistSong,
  addLyric,
  addMetadata,
  addSongTag,
  addTag,
  Artist,
  existMetadataByPath,
  getMetadata,
  getMetadataById,
  getTag,
  Lyric,
  Metadata,
  SongTag,
} from "./sql";
import { generateUUID, readFilesRecursively } from "./utils";
import { concurrence } from "./task";

const DIR = "../build/music";

const convetIMetaToDbMeta = (iMeta: IMeta, file_name: string): Metadata => {
  // ad2548rv
  return {
    id: "",
    file_name: "",
    file_path: "",
    file_url: "",
    title: iMeta.title || file_name,
    artist: iMeta.artist || "未知歌手",
    artists: JSON.stringify(iMeta.artists) || '["未知歌手"]',
    album: iMeta.album || "未知专辑",
    year: iMeta.year || 0,
    duration: iMeta.duration || 0,
    bitrate: iMeta.bitrate || 0,
    samplerate: iMeta.sampleRate || 0,
  };
};

const singleTask = async (
  file_path: string,
): Promise<{ msg: string; file_path: string }> => {


  const exist_path = existMetadataByPath(file_path);
  if (exist_path) {
    success++;
    exists.push({ file_path, title: "", exist: exist_path });
    logProgress(music_count, success, faile);
    return {msg: "exist", file_path};
  }

  const file_name = path.basename(file_path);
  const start_read_file_time = new Date().getTime();
  const arrayBuffer = fs.readFileSync(file_path);

  const start_read_title_time = new Date().getTime();
  const {title="", artist=""} = (await readTitleAndArtist(arrayBuffer)) || {title: file_name, artist: "未知歌手"};
  const exist = getMetadata(title, artist);
  if (exist) {
    exists.push({ file_path, title, exist });
    success++;
    logProgress(music_count, success, faile);
    return { msg: "exist", file_path };
  }
  

  const start_read_meta_time = new Date().getTime();
  const metadata = await readMetaByBuffer(arrayBuffer);

  // 最多尝试生成10次9位的uuid，冲突则重新生成
  let uuid = "";
  for (let i = 0; i < 10; i++) {
    uuid = generateUUID();
    const exist = getMetadataById(uuid);
    if (!exist) break;
  }
  if (!uuid) {
    console.error(
      new Date().toLocaleString(),
      "generate uuid failed",
      metadata
    );
    faile.push({ file_path, title, metadata });
    return { msg: "generate uuid failed", file_path };
  }

  const dbMeta = convetIMetaToDbMeta(metadata, file_name);
  dbMeta.id = uuid;
  dbMeta.file_name = file_name;
  dbMeta.file_path = file_path;
  dbMeta.file_url = file_path.replace(DIR, "");

  // console.log(dbMeta);

  const start_add_db_time = new Date().getTime();
  const song_tags = buildSongTags(dbMeta.id, file_path);
  // console.log(song_tags);

  const lyrics = buildLyrics(metadata, dbMeta.id);
  // console.log(lyrics);

  const artists = buildArtists(metadata);
  // console.log(artists, artist_song);

  let result = addMetadata(dbMeta);
  if (!result) {
    faile.push({ file_path, title, metadata });
    return { msg: "failed to add metadata", file_path }
  };
  song_tags.forEach((song_tag) => {
    let result = addSongTag(song_tag);
    if (!result)
      console.error(
        new Date().toLocaleString(),
        "failed to add song tag",
        song_tag
      );
  });
  lyrics.forEach((lyric) => {
    let result = addLyric(lyric);
    if (!result)
      console.error(new Date().toLocaleString(), "failed to add lyric", lyric);
  });
  let artist_ids: number[] = [];
  artists.forEach((artist) => {
    let result = addArtist(artist);
    // console.log('artist', artist, result);
    if (!result)
      console.error(
        new Date().toLocaleString(),
        "failed to add artist",
        artist
      );
    if (result) artist_ids.push(result.id);
  });
  artist_ids.forEach((artist_id) => {
    const artist_song = { song_id: dbMeta.id, artist_id };
    // console.log(artist_song);
    let result = addArtistSong(artist_song);
    if (!result)
      console.error(
        new Date().toLocaleString(),
        "failed to add artist_song",
        artist_song
      );
  });

  const task_end_time = new Date().getTime();
  const read_file_time = start_read_title_time - start_read_file_time;
  const read_title_time = start_read_meta_time - start_read_title_time;
  const read_meta_time = start_add_db_time - start_read_meta_time;
  const add_db_time = task_end_time - start_add_db_time;
  console.log(
    "title:", title,
    "read_file:", read_file_time,
    "read_title:", read_title_time,
    "read_meta:", read_meta_time,
    "add_db:", add_db_time,
  );

  success++;
  logProgress(music_count, success, faile);
  return { msg: "success", file_path };
};

const buildLyrics = (metadata: IMeta, metadataId: string): Lyric[] => {
  const lyrics: Lyric[] = [];
  metadata.lyrics.forEach((lyric) => {
    lyrics.push({
      id: 0,
      song_id: metadataId,
      time: lyric.time,
      text: lyric.text,
    });
  });
  return lyrics;
};

const buildArtists = (metadata: IMeta): Artist[] => {
  const artists: Artist[] = [];
  metadata.artists?.forEach((artist) => {
    artists.push({ id: 0, name: artist, cover: "", description: "" });
  });
  return artists;
};

const buildSongTags = (metadataId: string, file_path: string) => {
  let dir_paths: string[] = [];
  const dir_path = path.dirname(file_path);
  const relative_dir_path = dir_path.replace(DIR, "");
  relative_dir_path.split(path.sep).forEach((dir_name) => {
    dir_paths.push(dir_name);
  });

  let song_tag_list: SongTag[] = [];
  dir_paths.forEach((tag_name) => {
    if (tag_name === "") return;
    if (tag_name === "music") return;
    if (tag_name === "mp3") return;
    if (tag_name === "flac") return;
    if (tag_name === ".") return;
    if (tag_name === "..") return;
    if (tag_name === "node_modules") return;
    let tag = getTag(tag_name);
    if (!tag)
      tag = addTag({
        id: 0,
        name: tag_name,
        color: "#000000",
        text_color: "#FFFFFF",
      });
    if (!tag) return;
    song_tag_list.push({ song_id: metadataId, tag_id: tag.id });
  });
  return song_tag_list;
};


const logProgress = (count: number, success: number, failed: any[]) => {
  console.log(
    "count",
    count,
    "success:",
    success,
    "failed:",
    failed.length,
    "progress:",
    ((success / count) * 100).toFixed(2) + "%"
  );
};

let exists: any[] = [];
let faile: any[] = [];
let success = 0;
let  music_count = 0;

const job = async () => {
  const job_start_time = new Date().getTime();
  console.log(new Date().toLocaleString(), "job start...");
  // 读取文件夹包括子文件夹下所有文件
  const files = readFilesRecursively(DIR);
  const all_files_count = files.length;

  // 过滤出以 mp3、flac 结尾的文件
  const music_files = files.filter((file_path) => {
    const ext = path.extname(file_path).toLowerCase();
    const hit =
      ext === ".mp3" ||
      ext === ".flac" ||
      ext === ".m4a" ||
      ext === ".ape" ||
      ext === ".wav" ||
      ext === ".ogg";
    if (!hit) {
      console.log("ignore file:", file_path);
    }
    return hit;
  });
  music_count = music_files.length;
  console.log(
    "all files count:",
    all_files_count,
    "music files count:",
    music_count,
    "ignore files count:",
    all_files_count - music_count
  );

  // 把总列表拆分成每个 n 个并发执行
  concurrence(50, music_files, singleTask);

  const internal_id = setInterval(() => {
    if (success + faile.length === music_count) {
      clearInterval(internal_id);

      exists.forEach((data) => {
        if (data.exist.file_path === data.file_path) return;
        console.log(
          "exist:",
          data.file_path,
          data.title,
          data.exist.file_name,
          data.exist.file_path
        );
      });

      console.log(
        new Date().toLocaleString(),
        "success:",
        success,
        "failed:",
        faile.length,
        "exists:",
        exists.length
      );
      console.log(new Date().toLocaleString(), "job end...");
      const job_end_time = new Date().getTime();
      console.log(
        new Date().toLocaleString(),
        "cost time:",
        (job_end_time - job_start_time) / 1000,
        "s"
      );
      // console.log(new Date().toLocaleString(), "failed list:", faile);
    }
  }, 1000);
};

job();
