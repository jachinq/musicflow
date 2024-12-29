import { create } from "zustand";
import { Music, Tag } from "../lib/defined";

interface MusicListState {
  needFilter: boolean;
  setNeedFilter: (filterTag: boolean) => void;
  filterTags: Tag[];
  setFilterTags: (tagId: Tag[]) => void;
  musicList: Music[];
  setMusicList: (musicList: Music[]) => void;
  totalCount: number;
  setTotalCount: (totalCount: number) => void;
}

export const useMusicList = create<MusicListState>((set) => ({
  needFilter: false,
  setNeedFilter: (needFilter) => set(() => ({ needFilter })),
  filterTags: [],
  setFilterTags: (filterTags) => set(() => ({ filterTags })),
  musicList: [],
  setMusicList: (musicList) => set(() => ({ musicList })),
  totalCount: 0,
  setTotalCount: (totalCount) => set(() => ({ totalCount }))
}));