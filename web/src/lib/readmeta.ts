import { IAudioMetadata, parseBuffer } from "music-metadata";

export interface IMeta {
  title: string | undefined;
  artist: string | undefined;
  album: string | undefined;
  year: number | undefined;
  track: number | null;
  duration: number | undefined;
  bitrate: number | undefined;
  lyrics: { time: number; text: string }[];
  cover: string | undefined; // base64 encoded image data
}

export const readMeta = async (url: string): Promise<IMeta> => {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const array = new Uint8Array(buffer);
  const metadata = await parseBuffer(array);

  let cover = await getCover(metadata);
  const imeta = {
    title: metadata.common.title,
    artist: metadata.common.artist,
    album: metadata.common.album,
    year: metadata.common.year,
    track: metadata.common.track.no,
    duration: metadata.format.duration,
    bitrate: metadata.format.bitrate,
    lyrics: getLyrics(metadata),
    cover,
    url,
  };
  // console.log(metadata, imeta);
  return imeta;
};


export const readMetaByBuffer = async (buffer: ArrayBuffer): Promise<IMeta> => {
  const array = new Uint8Array(buffer);
  const metadata = await parseBuffer(array);

  let cover = await getCover(metadata);
  const imeta = {
    title: metadata.common.title,
    artist: metadata.common.artist,
    album: metadata.common.album,
    year: metadata.common.year,
    track: metadata.common.track.no,
    duration: metadata.format.duration,
    bitrate: metadata.format.bitrate,
    lyrics: getLyrics(metadata),
    cover,
  };
  // console.log(metadata, imeta);
  return imeta;
};

const getCover = async (
  metadata: IAudioMetadata
): Promise<string | undefined> => {
  let cover: string | undefined;
  if (
    metadata &&
    metadata.common &&
    metadata.common.picture &&
    metadata.common.picture.length > 0
  ) {
    const picture = metadata.common.picture[0];
    const type = picture.format;
    const data: Uint8Array = picture.data;

    // 使用 Blob 和 FileReader 来更安全地处理二进制数据
    const blob = new Blob([data], { type: `image/${type}` });
    const reader = new FileReader();

    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        if (reader.result) {
          if (typeof reader.result !== "string") {
            reject(new Error("Failed to read blob as data URL"));
            return;
          }
          const base64 = reader.result.split(",")[1]; // 去掉 data URI 的前缀
          resolve(base64);
        } else {
          reject(new Error("Failed to read blob as data URL"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    cover = `data:image/${type};base64,${await base64Promise}`;
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
  const limit = 20;
  const empty = { time: 0, text: "", time_str: "" };
  let firstList = [];
  for (let i = 0; i < limit; i++) {
    firstList.push(empty);
  }
  const emptyLast = { time: 9999999999, text: "", time_str: "" };
  let lastList = [];
  for (let i = 0; i < limit; i++) {
    lastList.push(emptyLast);
  }
  return [...firstList,...lyrics, ...lastList];
};
