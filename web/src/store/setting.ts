import { create } from "zustand";

const defaultSettingStr = localStorage.getItem("musicflow_setting") || "{}"
const defaultSetting = JSON.parse(defaultSettingStr) as SettingState;

if (defaultSetting.play_mode === undefined) {
  defaultSetting.play_mode = 1;
}

if (defaultSetting.server_url === undefined) {
  defaultSetting.server_url = "";
}

type PlayMode = 1 | 2 | 3; // 1:顺序播放 2:单曲循环 3:随机播放
interface SettingState {
  play_mode: PlayMode; // 1:顺序播放 2:单曲循环 3:随机播放
  server_url: string;
  setPlayMode: (mode: PlayMode) => void;
  setServerUrl: (url: string) => void;
}

export const useSettingStore = create<SettingState>((set) => ({
  play_mode: defaultSetting.play_mode,
  server_url: defaultSetting.server_url,
  setPlayMode: (mode: PlayMode) => set(() => ({ play_mode: mode })),
  setServerUrl: (url: string) => set(() => ({ server_url: url })),
}));