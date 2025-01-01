import { IAudioMetadata, loadMusicMetadata } from "music-metadata";
import { getPictureInfo, processImage } from "./picture_proc";

export interface IMeta {
  title: string | undefined;
  artist: string | undefined;
  artists: string[] | undefined;
  album: string | undefined;
  year: number | undefined;
  track: number | null;
  duration: number | undefined;
  bitrate: number | undefined;
  sampleRate: number | undefined;
  lyrics: { time: number; text: string }[];
  cover: Cover | undefined;
}

// base64 encoded image data
interface Cover {
  format: string;
  width: number;
  height: number;
  original: string;
  small: string;
  large: string;
}

export const readTitle = async (buffer: ArrayBuffer): Promise<string | undefined> => {
  const util = await loadMusicMetadata();
  const array = new Uint8Array(buffer);
  const metadata: IAudioMetadata = await util.parseBuffer(array);
  return metadata.common.title;
}

export const readMetaByBuffer = async (buffer: ArrayBuffer): Promise<IMeta> => {
  const util = await loadMusicMetadata();
  const array = new Uint8Array(buffer);
  const metadata: IAudioMetadata = await util.parseBuffer(array);


  const artists = metadata.common.artists || [];
  if (artists.length === 0) {
    artists.push(metadata.common.artist || "未知歌手");
  }

  let cover = await getCover(metadata);
  const imeta = {
    title: metadata.common.title,
    artist: metadata.common.artist,
    artists,
    album: metadata.common.album,
    year: metadata.common.year,
    track: metadata.common.track.no,
    duration: metadata.format.duration,
    bitrate: metadata.format.bitrate,
    sampleRate: metadata.format.sampleRate,
    lyrics: getLyrics(metadata),
    cover,
  };
  // console.log(metadata, imeta);
  return imeta;
};

const getCover = async (
  metadata: IAudioMetadata
): Promise<Cover | undefined> => {
  const cover: Cover = {
    format: "",
    width: 0,
    height: 0,
    original: "",
    small: "",
    large: ""
  };
  if (
    metadata &&
    metadata.common &&
    metadata.common.picture &&
    metadata.common.picture.length > 0
  ) {
    const picture = metadata.common.picture[0];
    const type = picture.format;
    const data: Buffer = Buffer.from(picture.data); // 使用 Buffer 而不是 Uint8Array
    
    // 将 Buffer 转换为 Base64 字符串
    const base64_origin = data.toString("base64");
    const cover_metadata = await getPictureInfo(data);
    cover.format = cover_metadata.format || type.replace("image/", "");
    cover.width = cover_metadata.width || 0;
    cover.height = cover_metadata.height || 0;

    // const original = `data:${type};base64,${base64_origin}`;

    const small_size = 140;
    const base64_webp_small = await processImage(base64_origin, {
      width: 140,
      height: 140,
      quality: 50,
      format: "webp",
    });
    const base64_webp_large = await processImage(base64_origin, {
      quality: 10,
      format: "webp",
    });
    // const cover_small = `data:image/webp;base64,${base64_webp_small}`;
    // const cover_large = `data:image/webp;base64,${base64_webp_large}`;
    cover.original = base64_origin;
    cover.small = base64_webp_small;
    cover.large = base64_webp_large;

    // const fs = require("fs");
    // // fs.writeFileSync(`cover.${type.replace("image/", "")}"`, data);
    // fs.writeFileSync(`cover.jpg`, data);
    // fs.writeFileSync("cover_small.webp", cover_small);
    // fs.writeFileSync("cover_large.webp", cover_large);

    // console.log("cover_small:@@@@", cover_small);
  }
  return cover;
};

const getLyrics = (
  metadata: IAudioMetadata
): { time: number; text: string }[] => {
  // console.log(metadata);
  const lyrics: { time: number; time_str: string; text: string }[] = [];
  if (metadata.common.lyrics && metadata.common.lyrics.length > 0) {
    const lyrics_data = metadata.common.lyrics[0];
    if (!lyrics_data) {
      return [];
    }
    if (lyrics_data.syncText) {
      for (const lyric of lyrics_data.syncText) {
        const timeSec = (lyric.timestamp || 0) / 1000;
        if (!lyric.text || lyric.text.trim() === "") {
          continue;
        }
        lyrics.push({
          time: timeSec,
          text: lyric.text,
          time_str: lyric.timestamp?.toString() || "",
        });
      }
    } else if (lyrics_data.text) {
      lyrics_data.text.split("\n").forEach((line) => {
        const time_str = line.match(/^\[(\d+):(\d+).(\d+)\]/)?.[0];
        if (time_str) {
          // time_str = [03:17.17]
          const minute = parseInt(time_str.slice(1, 3));
          const second = parseInt(time_str.slice(4, 6));
          const millisecond = parseInt(time_str.slice(7, 10));
          // console.log(minute, second, millisecond);
          const timeSec = minute * 60 + second + millisecond / 1000;
          const text = line.replace(time_str, "").trim();
          if (text === "") {
            return;
          }
          lyrics.push({
            time: timeSec,
            text,
            time_str: time_str,
          });
        }
      });
    }
  }
  const limit = 10;
  const empty = { time: 0, text: "", time_str: "" };
  let firstList = [];
  for (let i = 0; i < limit; i++) {
    firstList.push(empty);
  }
  return lyrics;
};


import fs from "fs";
const job = async () => {
  const arrayBuffer = fs.readFileSync(file_path);
  const metadata = await readMetaByBuffer(arrayBuffer);
  const json = JSON.stringify(metadata, null, 2);
  fs.writeFileSync("meta.json", json);
}
const file_path = "Bandari - Luna.mp3"
job();