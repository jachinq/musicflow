import { create } from "zustand";
export enum OnlineEngine {
  Bing = "必应",
  Baidu = "百度",
  Google = "谷歌",
};

const defaultSettingStr = localStorage.getItem("musicflow_setting") || "{}"
const defaultSetting = JSON.parse(defaultSettingStr) as SettingState;
const autoInit = defaultSettingStr === "{}";
if (defaultSetting.play_mode === undefined) defaultSetting.play_mode = 1;
if (defaultSetting.server_url === undefined) defaultSetting.server_url = "";
if (defaultSetting.online_engine === undefined) defaultSetting.online_engine = OnlineEngine.Bing;
if (defaultSetting.is_running_scan === undefined) defaultSetting.is_running_scan = false;
if (autoInit) localStorage.setItem("musicflow_setting", JSON.stringify(defaultSetting));



type PlayMode = 1 | 2 | 3; // 1:顺序播放 2:单曲循环 3:随机播放
interface SettingState {
  play_mode: PlayMode; // 1:顺序播放 2:单曲循环 3:随机播放
  server_url: string;
  online_engine: OnlineEngine;
  is_running_scan: boolean;
  setPlayMode: (mode: PlayMode) => void;
  setServerUrl: (url: string) => void;
  setOnlineEngine: (engine: OnlineEngine) => void;
  setIsRunningScan: (isRunningScan: boolean) => void;
}

const setLocalStorge = (key: string, value: any) => {
  localStorage.setItem(key, JSON.stringify(value));
}
export const useSettingStore = create<SettingState>((set) => ({
  play_mode: defaultSetting.play_mode,
  server_url: defaultSetting.server_url,
  online_engine: defaultSetting.online_engine,
  is_running_scan: defaultSetting.is_running_scan,
  setPlayMode: (mode: PlayMode) => set(() => {
    setLocalStorge("musicflow_setting", {...defaultSetting, play_mode: mode });
    return { play_mode: mode };
  }),
  setServerUrl: (url: string) => set(() => {
    setLocalStorge("musicflow_setting", {...defaultSetting, server_url: url });
    return { server_url: url };
  }),
  setOnlineEngine: (engine: OnlineEngine) => set(() => {
    setLocalStorge("musicflow_setting", {...defaultSetting, online_engine: engine });
    return { online_engine: engine };
  }),
  setIsRunningScan: (isRunningScan: boolean) => set(() => {
    setLocalStorge("musicflow_setting", {...defaultSetting, is_running_scan: isRunningScan });
    return { is_running_scan: isRunningScan };
  }),
}));