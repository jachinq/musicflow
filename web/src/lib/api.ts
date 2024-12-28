import { Music, MusicFilter } from "./defined";

export const API_URL = "http://127.0.0.1:9090";
export const LOG_API = `${API_URL}/api/log`;

export const getCoverSmallUrl = (id: string) => {
  return `${API_URL}/api/cover/small/${id}`;
};

export const getMusicUrl = (music: Music) => {
  if (music.file_url.startsWith("http")) return music.file_url;
  return `${API_URL}${music.file_url}`;
};

/**
 * 封装fetch请求
 * @param url 请求地址
 * @param onSuccess 成功回调
 * @param onError 失败回调
 * @param options fetch配置
 */
const fetchUtils = (
  url: string,
  onSuccess: (data: any) => void,
  onError: (error: any) => void,
  options?: any
) => {
  options = options || {};
  options.method = options.method || "GET";
  options.headers = options.headers || {};
  options.headers["Content-Type"] = "application/json";
  options.headers["Accept"] = "application/json";
  fetch(url, options)
    .then((response) => response.json())
    .then(async (data) => {
      onSuccess(data);
    })
    .catch((error) => {
      onError(error);
    });
};

export const getMusicList = (
  onSuccess: (data: any) => void,
  onError: (error: any) => void,
  currentPage: number,
  pageSize?: number,
  filter?: MusicFilter
) => {
  const { tags } = filter || {};

  const params = {
    page: currentPage,
    page_size: pageSize,
    tag_ids: tags,
  };
  let url = API_URL + "/api/list";
  console.log("api/list", params);
  fetchUtils(url, onSuccess, onError, {
    method: "POST",
    body: JSON.stringify(params),
  });
};

export const getLyrics = (
  song_id: string,
  onSuccess: (data: any) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/lyrics/${song_id}`;
  fetchUtils(url, onSuccess, onError);
};

// 自定义日志记录器
export const sendLogToServer = (
  level: string,
  timestamp: string,
  message: string
) => {
  // 使用 fetch 发送日志信息
  fetch(LOG_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ level, timestamp, message }),
  }).catch((error) => {
    console.log(`Failed to send log to server: ${error}`);
  });
};

// ----- tag 相关接口 -----//

/**
 * 获取所有标签列表
 * @param onSuccess 成功回调
 * @param onError 失败回调
 */
export const getTagList = (
  onSuccess: (data: any) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/tags`;
  fetchUtils(url, onSuccess, onError);
};

/**
 * 获取歌曲标签列表
 * @param song_id 歌曲id
 * @param onSuccess 成功回调
 * @param onError 失败回调
 */
export const getSongTags = (
  song_id: string,
  onSuccess: (data: any) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/song_tags/${song_id}`;
  fetchUtils(url, onSuccess, onError);
};

/**
 * 获取标签歌曲列表
 * @param tag_id 标签id
 * @param onSuccess 成功回调
 * @param onError 失败回调
 */
export const getTagSongs = (
  tag_id: string,
  onSuccess: (data: any) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/tag_songs/${tag_id}`;
  fetchUtils(url, onSuccess, onError);
};

export const addTagToSong = (
  song_id: string,
  tag_ids: number[],
  onSuccess: (data: any) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/add_tag_to_song`;
  fetchUtils(url, onSuccess, onError, {
    method: "POST",
    body: JSON.stringify({ song_id, tag_ids }),
  });
};

export const removeTagFromSong = (
  song_id: string,
  tag_id: string,
  onSuccess: (data: any) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/remove_tag_from_song/${song_id}/${tag_id}`;
  fetchUtils(url, onSuccess, onError, {
    method: "DELETE",
  });
};
