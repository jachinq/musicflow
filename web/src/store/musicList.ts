import { create } from "zustand";
import { Music, MusicFilter } from "../lib/defined";
import { getMusicList } from "../lib/api";

interface MusicListState {
  filter: MusicFilter;
  setFilter: (filter: MusicFilter) => void;
  needFilter: boolean;
  setNeedFilter: (filterTag: boolean) => void;
  musicList: Music[];
  setMusicList: (musicList: Music[]) => void;
  totalCount: number;
  setTotalCount: (totalCount: number) => void;
  fetchMusicList: (
    currentPage: number,
    pageSize: number,
    setTotalCount: (totalCount: number) => void,
    setLoading: (loading: boolean) => void,
    setError: (error: any) => void,
  ) => void;
}

export const useMusicList = create<MusicListState>((set, get) => ({
  filter: {},
  setFilter: (filter) => set(() => ({ filter })),
  needFilter: false,
  setNeedFilter: (needFilter) => set(() => ({ needFilter })),
  musicList: [],
  setMusicList: (musicList) => set(() => ({ musicList })),
  totalCount: 0,
  setTotalCount: (totalCount) => set(() => ({ totalCount })),
  fetchMusicList: (
    currentPage: number,
    pageSize: number,
    setTotalCount: (totalCount: number) => void,
    setLoading: (loading: boolean) => void,
    setError: (error: any) => void,
  ) => {
    const filter = get().filter;
    setLoading(true);
    get().setMusicList([]);
    // console.log(needFilter, filter, filterTags)
    getMusicList(
      (result) => {
        if (!result || !result.success) {
          return;
        }
        // 更新音乐列表和分页信息
        get().setMusicList(result.data.list);
        setTotalCount(result.data.total);
        setLoading(false);
      },
      (error) => {
        console.error("获取音乐列表失败", error);
        setError(error);
        setLoading(false);
      },
      currentPage,
      pageSize,
      filter
    );
  },
}));