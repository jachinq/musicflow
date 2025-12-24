import { Album, Artist, GetAlbumList, GetArtistList, GetList, JsonResult, Music, MusicFilter, SongList } from "./defined";

const defaultSettingStr = localStorage.getItem("musicflow_setting") || "{}"
const defaultSetting = JSON.parse(defaultSettingStr);

export const API_URL = defaultSetting.server_url || "";
export const LOG_API = `${API_URL}/api/log`;

export const getCoverSmallUrl = (coverArt: string) => {
  return `${API_URL}/api/cover/small/${coverArt || ''}`;
};
export const getCoverMediumUrl = (coverArt: string) => {
  return `${API_URL}/api/cover/medium/${coverArt || ''}`;
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

  const params = {
    page: currentPage,
    page_size: pageSize,
    ...filter,
  };
  let url = API_URL + "/api/list";
  // console.log("api/list", params);
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

export const delLyric = (
  song_id: string,
  onSuccess: (data: any) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/lyrics/delete/${song_id}`;
  fetchUtils(url, onSuccess, onError, {
    method: "DELETE",
  });
};



// 自定义日志记录器
export const sendLogToServer = (
  level: string,
  timestamp: string,
  message: string
) => {
  // 本地调试时，不发送日志到服务器
  if (process.env.NODE_ENV === "development") {
    return;
  }

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
 * 获取所有风格列表
 * @param onSuccess 成功回调
 * @param onError 失败回调
 */
export const getGenreList = (
  _currentPage: number,
  _pageSize: number,
  _filterText: String,
  onSuccess: (data: any) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/genres`;
  fetchUtils(url, onSuccess, onError);
};

/**
 * 获取歌曲风格列表
 * @param song_id 歌曲id
 * @param onSuccess 成功回调
 * @param onError 失败回调
 */
export const getSongGenres = (
  song_id: string,
  onSuccess: (data: any) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/song_genres/${song_id}`;
  fetchUtils(url, onSuccess, onError);
};

export const addGenreToSong = (
  song_id: string,
  genre: string,
  onSuccess: (data: any) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/add_genre_to_song`;
  fetchUtils(url, onSuccess, onError, {
    method: "POST",
    body: JSON.stringify({ song_id, genre }),
  });
};

export const removeGenreFromSong = (
  song_id: string,
  genre: string,
  onSuccess: (data: any) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/delete_song_genre/${song_id}/${genre}`;
  fetchUtils(url, onSuccess, onError, {
    method: "DELETE",
  });
};

/**
 * 根据风格获取歌曲列表
 * @param genre 风格名称
 * @param onSuccess 成功回调
 * @param onError 失败回调
 */
export const getSongsByGenre = (
  genre: string,
  onSuccess: (data: JsonResult<Music[]>) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/songs_by_genre/${encodeURIComponent(genre)}`;
  fetchUtils(url, onSuccess, onError);
};

// ----- 播放列表相关接口 -----//
export const getPlayList = (
  page: number,
  size: number,
  onSuccess: (data: any) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/playlist`;
  fetchUtils(url, onSuccess, onError, {
    method: "POST",
    body: JSON.stringify({ page, size }),
  });
};

export const addPlayList = (
  song_ids: String[],
  onSuccess: (data: any) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/add_playlist`;
  fetchUtils(url, onSuccess, onError, {
    method: "POST",
    body: JSON.stringify({ song_ids }),
  });
};
export const setPlaylist = (
  song_id: String,
  onSuccess: (data: any) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/set_playlist/${song_id}`;
  fetchUtils(url, onSuccess, onError, { method: "PUT" });
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
  song_ids: string[],
  onSuccess: (data: JsonResult<any>) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/add_song_to_songlist`;
  fetchUtils(url, onSuccess, onError, {
    method: "PUT",
    body: JSON.stringify({ song_list_id, song_ids }),
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

// ----- 专辑相关接口 -----//

// 获取专辑列表
export const getAlbumList = (
  currentPage: number,
  pageSize: number,
  filterText: String,
  onSuccess: (data: JsonResult<GetAlbumList>) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/album`;
  const params = { page: currentPage, page_size: pageSize, filter_text: filterText };
  // console.log("api/album", params);
  fetchUtils(url, onSuccess, onError, {
    method: "POST",
    body: JSON.stringify(params),
  });
};
export const getAlbumById = (
  id: string,
  onSuccess: (data: JsonResult<Album>) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/album_by_id/${id}`;
  fetchUtils(url, onSuccess, onError, {
    method: "GET",
  });
};
export const getAlbumSongs = (
  id: string,
  onSuccess: (data: JsonResult<Music[]>) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/album_songs/${id}`;
  fetchUtils(url, onSuccess, onError, {
    method: "GET",
  });
};

// --- 艺术家相关接口 ---//
export const getArtistList = (
  currentPage: number,
  pageSize: number,
  filterText: String,
  onSuccess: (data: JsonResult<GetArtistList>) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/artist`;
  const params = { page: currentPage, page_size: pageSize, filter_text: filterText };
  // console.log("api/artist", params);
  fetchUtils(url, onSuccess, onError, {
    method: "POST",
    body: JSON.stringify(params),
  });
};
export const getArtistById = (
  id: string,
  onSuccess: (data: JsonResult<Artist>) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/artist_by_id/${id}`;
  fetchUtils(url, onSuccess, onError, {
    method: "GET",
  });
};
export const getArtistSongs = (
  id: string,
  onSuccess: (data: JsonResult<Music[]>) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/artist_songs/${id}`;
  fetchUtils(url, onSuccess, onError, {
    method: "GET",
  });
};
export const setArtistCover = (
  id: number,
  cover: string,
  onSuccess: (data: JsonResult<any>) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/set_artist_cover/${id}`;
  fetchUtils(url, onSuccess, onError, {
    method: "PUT",
    body: JSON.stringify({ cover }),
  });
};

// --- 一些工具相关的接口 ---//
export const scanMusic = (
  onSuccess: (data: JsonResult<any>) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/scan_music`;
  fetchUtils(url, onSuccess, onError, {
    method: "POST",
  });
};
export const scanMusicProgress = (
  onSuccess: (data: JsonResult<any>) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/scan_music_progress`;
  fetchUtils(url, onSuccess, onError, {
    method: "GET",
  });
};
