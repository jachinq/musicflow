import { create } from "zustand";
import { Music } from "../def/CommDef";

interface MusicListState {
  musicList: Music[];
  setMusicList: (musicList: Music[]) => void;
  totalCount: number;
  setTotalCount: (totalCount: number) => void;
}

export const useMusicList = create<MusicListState>((set) => ({
  musicList: [],
  setMusicList: (musicList) => set(() => ({ musicList })),
  totalCount: 0,
  setTotalCount: (totalCount) => set(() => ({ totalCount }))
}));