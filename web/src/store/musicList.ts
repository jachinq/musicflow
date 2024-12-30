import { create } from "zustand";
import { Music, MusicFilter, Tag } from "../lib/defined";

interface MusicListState {
  filter: MusicFilter;
  setFilter: (filter: MusicFilter) => void;
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
  filter: {},
  setFilter: (filter) => set(() => ({ filter })),
  needFilter: false,
  setNeedFilter: (needFilter) => set(() => ({ needFilter })),
  filterTags: [],
  setFilterTags: (filterTags) => set(() => ({ filterTags })),
  musicList: [],
  setMusicList: (musicList) => set(() => ({ musicList })),
  totalCount: 0,
  setTotalCount: (totalCount) => set(() => ({ totalCount }))
}));