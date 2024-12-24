import { IAudioMetadata, parseBuffer } from 'music-metadata';

export interface IMeta {
  title: string | undefined;
  artist: string | undefined;
  album: string | undefined;
  year: number | undefined;
  track: number | null;
  duration: number | undefined;
  bitrate: number | undefined;
  cover: string | undefined; // base64 encoded image data
  url: string; // original file url
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
    cover,
    url,
  }
  console.log(metadata, imeta);
  return imeta;
};


const getCover = async (metadata: IAudioMetadata): Promise<string | undefined> => {
  let cover: string | undefined;
  if (metadata && metadata.common && metadata.common.picture && metadata.common.picture.length > 0) {
    const picture = metadata.common.picture[0];
    const type = picture.format;
    const data: Uint8Array = picture.data;

    // 使用 Blob 和 FileReader 来更安全地处理二进制数据
    const blob = new Blob([data], { type: `image/${type}` });
    const reader = new FileReader();

    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        if (reader.result) {
          if (typeof reader.result!=='string') {
            reject(new Error('Failed to read blob as data URL'));
            return;
          }
          const base64 = reader.result.split(',')[1]; // 去掉 data URI 的前缀
          resolve(base64);
        } else {
          reject(new Error('Failed to read blob as data URL'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    cover = `data:image/${type};base64,${await base64Promise}`;
  }
  return cover;
}