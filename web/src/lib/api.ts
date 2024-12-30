import { GetList, JsonResult, Music, MusicFilter, SongList } from "./defined";

const defaultSettingStr = localStorage.getItem("musicflow_setting") || "{}"
const defaultSetting = JSON.parse(defaultSettingStr);

export const API_URL = defaultSetting.server_url || "";
export const LOG_API = `${API_URL}/api/log`;

export const getCoverSmallUrl = (id: string) => {
  return `${API_URL}/api/cover/small/${id}`;
};
export const getCoverMediumUrl = (id: string) => {
  return `${API_URL}/api/cover/medium/${id}`;
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
  onSuccess: (data: JsonResult<GetList>) => void,
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

export const getMusicDetail = (
  id: string,
  onSuccess: (data: any) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/single/${id}`;
  fetchUtils(url, onSuccess, onError);
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
  tagname: string,
  onSuccess: (data: any) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/add_tag_to_song`;
  fetchUtils(url, onSuccess, onError, {
    method: "POST",
    body: JSON.stringify({ song_id, tagname }),
  });
};

export const removeTagFromSong = (
  song_id: string,
  tag_id: number,
  onSuccess: (data: any) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/delete_song_tag/${song_id}/${tag_id}`;
  fetchUtils(url, onSuccess, onError, {
    method: "DELETE",
  });
};

// ----- songList 相关接口 -----//

// 获取歌单列表
export const getSongList = (
  onSuccess: (data: JsonResult<SongList[]>) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/songlist`;
  fetchUtils(url, onSuccess, onError);
};

// 创建歌单
export const createSongList = (
  songList: SongList,
  onSuccess: (data: JsonResult<any>) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/create_songlist`;
  fetchUtils(url, onSuccess, onError, {
    method: "POST",
    body: JSON.stringify(songList),
  });
};
export const updateSongList = (
  songList: SongList,
  onSuccess: (data: JsonResult<any>) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/update_songlist`;
  fetchUtils(url, onSuccess, onError, {
    method: "PUT",
    body: JSON.stringify(songList),
  });
};

// 删除歌单
export const deleteSongList = (
  id: number,
  onSuccess: (data: JsonResult<any>) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/delete_songlist/${id}`;
  fetchUtils(url, onSuccess, onError, {
    method: "DELETE",
  });
};

// 添加歌曲到歌单
export const addSongToSongList = (
  song_list_id: number,
  song_id: string,
  onSuccess: (data: JsonResult<any>) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/add_song_to_songlist/${song_list_id}/${song_id}`;
  fetchUtils(url, onSuccess, onError, {
    method: "POST",
    // body: JSON.stringify({ song_list_id, song_id }),
  });
};

// 从歌单中移除歌曲
export const removeSongFromSongList = (
  songlist_id: number,
  song_id: string,
  onSuccess: (data: JsonResult<any>) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/remove_song_from_songlist/${songlist_id}/${song_id}`;
  fetchUtils(url, onSuccess, onError, {
    method: "DELETE",
  });
};

// 获取歌单歌曲列表
export const getSongListSongs = (
  songlist_id: number,
  onSuccess: (data: JsonResult<any>) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/songlist_songs/${songlist_id}`;
  fetchUtils(url, onSuccess, onError);
};

// 获取歌曲所在歌单
export const getSongSongList = (
  song_id: string,
  onSuccess: (data: JsonResult<any>) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/song_songlist/${song_id}`;
  fetchUtils(url, onSuccess, onError);
};