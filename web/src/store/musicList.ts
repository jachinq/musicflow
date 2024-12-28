import { create } from "zustand";
import { Music, Tag } from "../lib/defined";

interface MusicListState {
  filterTags: Tag[];
  setFilterTags: (tagId: Tag[]) => void;
  musicList: Music[];
  setMusicList: (musicList: Music[]) => void;
  totalCount: number;
  setTotalCount: (totalCount: number) => void;
}

export const useMusicList = create<MusicListState>((set) => ({
  filterTags: [],
  setFilterTags: (filterTags) => set(() => ({ filterTags })),
  musicList: [],
  setMusicList: (musicList) => set(() => ({ musicList })),
  totalCount: 0,
  setTotalCount: (totalCount) => set(() => ({ totalCount }))
}));