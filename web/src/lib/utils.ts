import { OnlineEngine } from "../store/setting";

export const formatTime = (time: number, format?: string) => {
  format = format || ":";
  const hours = Math.floor(time / 3600);
  time %= 3600;
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${hours.toString().padStart(2, "0")}${format}${minutes.toString().padStart(2, "0")}${format}${seconds
    .toString()
    .padStart(2, "0")}`;
};

export const getOnlineEngineUrl = (engine: OnlineEngine, keyword: string) => {
  switch (engine) {
    case OnlineEngine.Baidu:
      return `https://music.baidu.com/search/search?key=${keyword}`;
    case OnlineEngine.Bing:
      return `https://www.bing.com/search?q=${keyword}`;
    case OnlineEngine.Google:
      return `https://www.google.com/search?q=${keyword}`;
    default:
      return engine;
  }
};