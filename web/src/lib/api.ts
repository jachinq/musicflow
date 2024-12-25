import { Music } from "../def/CommDef";

export const API_URL = "http://127.0.0.1:9090";
export const LOG_API = "http://127.0.0.1:9090/api/log";

export const getMusicUrl = (music: Music) => {
    return `${API_URL}/music/${music.path}`;
}