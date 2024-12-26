import { Music } from "../def/CommDef";

export const API_URL = "http://127.0.0.1:9090";
export const LOG_API = `${API_URL}/api/log`;

export const getMusicUrl = (music: Music) => {
  return `${API_URL}/music/${music.path}`;
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
  pageSize?: number
) => {
  let url = API_URL + "/api/list";
  currentPage && (url += `?page=${currentPage}`);
  pageSize && (url += `&page_size=${pageSize}`);
  console.log("fetching music list from", url);
  fetchUtils(url, onSuccess, onError);
};

export const getMusicDetail = (
  id: string,
  onSuccess: (data: any) => void,
  onError: (error: any) => void
) => {
  const url = `${API_URL}/api/detail/${id}`;
  fetchUtils(url, onSuccess, onError);
};


// 自定义日志记录器
export const sendLogToServer = (level: string, timestamp: string, message: string) => {
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
}