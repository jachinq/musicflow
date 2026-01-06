import { Album, Artist, GetAlbumList, GetArtistList, GetList, JsonResult, Music, MusicFilter, ScanProgress, SongList } from "./defined";

const defaultSettingStr = localStorage.getItem("musicflow_setting") || "{}"
const defaultSetting = JSON.parse(defaultSettingStr);

export const API_URL = defaultSetting.server_url || "";
export const LOG_API = `${API_URL}/api/log`;

export const getCoverSmallUrl = (coverArt: string) => {
  const url = `${API_URL}/api/cover/small/${coverArt || '-'}`;
  // 确保返回绝对 URL（Media Session API 需要）
  if (url.startsWith('http')) {
    return url;
  }
  // 如果是相对 URL，转换为绝对 URL
  return new URL(url, window.location.origin).href;
};
export const getCoverMediumUrl = (coverArt: string) => {
  if (coverArt.startsWith("http")) return coverArt;
  return `${API_URL}/api/cover/medium/${coverArt || '-'}`;
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

// ----- 播放队列相关接口 -----//
export const getPlayQueue = (
  page: number,
  size: number,
  onSuccess: (data: any) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/getPlayQue`;
  fetchUtils(url, onSuccess, onError, {
    method: "POST",
    body: JSON.stringify({ page, size }),
  });
};

export const savePlayQueue = (
  song_ids: String[],
  current_id: String,
  position: number,
  onSuccess: (data: any) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/savePlayQueue`;
  fetchUtils(url, onSuccess, onError, {
    method: "POST",
    body: JSON.stringify({ song_ids, current_id, position }),
  });
};


// ----- songList 相关接口 -----//

// 获取歌单列表
export const getSongList = (
  onSuccess: (data: JsonResult<SongList[]>) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/songlists`;
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

// 获取歌单详情
export const getSongListDetail = (
  songlist_id: number,
  onSuccess: (data: JsonResult<SongList>) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/songlist/${songlist_id}`;
  fetchUtils(url, onSuccess, onError);
};

// ----- 专辑相关接口 -----//

// 获取专辑列表
export const getAlbumList = (
  currentPage: number,
  pageSize: number,
  filterText: String,
  listType: string | undefined,
  onSuccess: (data: JsonResult<GetAlbumList>) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/album`;
  const params: any = {
    page: currentPage,
    page_size: pageSize,
    filter_text: filterText,
  };

  if (listType) {
    params.list_type = listType;
  }

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
  onSuccess: (data: JsonResult<ScanProgress>) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/scan_status`;
  fetchUtils(url, onSuccess, onError, {
    method: "GET",
  });
};

// --- 随机歌曲相关接口 ---//
/**
 * 获取随机歌曲列表
 * @param size 返回的最大歌曲数量,默认 150,最大 500
 * @param genre 按流派筛选
 * @param fromYear 只返回此年份之后(含)发布的歌曲
 * @param toYear 只返回此年份之前(含)发布的歌曲
 * @param onSuccess 成功回调
 * @param onError 失败回调
 */
export const getRandomSongs = (
  size: number,
  genre?: string,
  fromYear?: string,
  toYear?: string,
  onSuccess?: (data: JsonResult<GetList>) => void,
  onError?: (error: any) => void
) => {
  let url = `${API_URL}/api/random_songs?size=${size}`;
  if (genre) url += `&genre=${encodeURIComponent(genre)}`;
  if (fromYear) url += `&fromYear=${fromYear}`;
  if (toYear) url += `&toYear=${toYear}`;

  fetchUtils(url, onSuccess || (() => {}), onError || (() => {}));
};

// --- 搜索相关接口 ---

export interface SearchResult {
  songs: Music[];
  albums: Album[];
  artists: Artist[];
  total_songs: number;
  total_albums: number;
  total_artists: number;
}

/**
 * 统一搜索:音乐、专辑、艺术家
 * @param keyword 搜索关键字
 * @param page 当前页码
 * @param pageSize 每页数量
 * @param onSuccess 成功回调
 * @param onError 失败回调
 */
export const searchAll = (
  keyword: string,
  page: number,
  pageSize: number,
  onSuccess: (data: JsonResult<SearchResult>) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/search?q=${encodeURIComponent(keyword)}&page=${page}&page_size=${pageSize}`;
  fetchUtils(url, onSuccess, onError, { method: "GET" });
};

/**
 * 记录播放历史
 * @param song_id 歌曲 ID
 * @param submission true=已播放，false=正在播放（默认 true）
 * @param timestamp Unix 时间戳（毫秒），可选
 * @param onSuccess 成功回调
 * @param onError 失败回调
 */
export const scrobble = (
  song_id: string,
  submission?: boolean,
  timestamp?: number,
  onSuccess?: (data: JsonResult<any>) => void,
  onError?: (error: any) => void
) => {
  const url = `${API_URL}/api/scrobble`;
  const body: any = { song_id };
  if (submission !== undefined) {
    body.submission = submission;
  }
  if (timestamp !== undefined) {
    body.timestamp = timestamp;
  }

  fetchUtils(url, onSuccess || (() => {}), onError || (() => {}), {
    method: "POST",
    body: JSON.stringify(body),
  });
};

// ==================== 收藏相关 API ====================

/**
 * 收藏歌曲
 */
export const starSong = (
  songId: string,
  onSuccess: (data: JsonResult<null>) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/star`;
  fetchUtils(url, onSuccess, onError, {
    method: "POST",
    body: JSON.stringify({ id: songId, item_type: "song" }),
  });
};

/**
 * 取消收藏歌曲
 */
export const unstarSong = (
  songId: string,
  onSuccess: (data: JsonResult<null>) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/unstar`;
  fetchUtils(url, onSuccess, onError, {
    method: "POST",
    body: JSON.stringify({ id: songId, item_type: "song" }),
  });
};

/**
 * 获取收藏列表
 */
export const getStarredList = (
  onSuccess: (data: JsonResult<{
    songs: Music[];
    albums: Album[];
    artists: Artist[];
  }>) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/starred`;
  fetchUtils(url, onSuccess, onError);
};

/**
 * 检查是否已收藏（可选，可以从 /api/single/{id} 的 starred 字段获取）
 */
export const checkIsStarred = (
  songId: string,
  onSuccess: (data: JsonResult<{ starred: boolean }>) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/is_starred?id=${songId}&item_type=song`;
  fetchUtils(url, onSuccess, onError);
};
