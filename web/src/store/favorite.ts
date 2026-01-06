import { create } from "zustand";
import { Music } from "../lib/defined";

interface FavoriteState {
  // 已收藏歌曲 ID 集合（用于快速查询）
  starredSongIds: Set<string>;

  // 完整的收藏歌曲列表（用于收藏页面展示）
  starredSongs: Music[];

  // 加载状态
  isLoading: boolean;

  // 错误信息
  error: string | null;

  // 检查歌曲是否已收藏
  isStarred: (song: Music) => boolean;

  // 收藏歌曲（仅更新本地状态）
  addStarredSong: (song: Music) => void;

  // 取消收藏（仅更新本地状态）
  removeStarredSong: (songId: string) => void;

  // 设置完整的收藏列表（从 API 获取后使用）
  setStarredSongs: (songs: Music[]) => void;

  // 设置加载状态
  setLoading: (loading: boolean) => void;

  // 设置错误信息
  setError: (error: string | null) => void;

  // 清空所有收藏
  clearStarred: () => void;
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  starredSongIds: new Set<string>(),
  starredSongs: [],
  isLoading: false,
  error: null,

  isStarred: (song: Music) => {
    return get().starredSongIds.has(song.id);
  },

  addStarredSong: (song: Music) => {
    set((state) => {
      const newIds = new Set(state.starredSongIds);
      newIds.add(song.id);

      // 避免重复添加
      const exists = state.starredSongs.some(s => s.id === song.id);
      const newSongs = exists ? state.starredSongs : [...state.starredSongs, song];

      return {
        starredSongIds: newIds,
        starredSongs: newSongs,
      };
    });
  },

  removeStarredSong: (songId: string) => {
    set((state) => {
      const newIds = new Set(state.starredSongIds);
      newIds.delete(songId);

      return {
        starredSongIds: newIds,
        starredSongs: state.starredSongs.filter(s => s.id !== songId),
      };
    });
  },

  setStarredSongs: (songs: Music[]) => {
    const ids = new Set(songs.map(s => s.id));
    set({
      starredSongs: songs,
      starredSongIds: ids,
    });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearStarred: () => {
    set({
      starredSongIds: new Set(),
      starredSongs: [],
    });
  },
}));
