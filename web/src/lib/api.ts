import { Music } from "../def/CommDef";

// export const API_URL = "http://192.168.2.128:9090";
export const API_URL = "http://192.168.2.122:9090";

export const getMusicUrl = (music: Music) => {
    return `${API_URL}/music/${music.path}`;
}