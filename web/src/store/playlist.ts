import { create } from "zustand";
import { Music } from "../lib/defined";
import { addPlayList, setPlaylist } from "../lib/api";

// 数据库操作防抖管理器
class DbSyncManager {
  private playlistSyncTimer: NodeJS.Timeout | null = null;
  private currentSongSyncTimer: NodeJS.Timeout | null = null;
  private pendingPlaylist: Music[] | null = null;
  private pendingCurrentSong: Music | null = null;
  private readonly DEBOUNCE_DELAY = 500; // 500ms 防抖
  private readonly MAX_RETRIES = 3;

  /**
   * 防抖同步播放列表
   */
  syncPlaylist(songs: Music[]) {
    this.pendingPlaylist = songs;

    if (this.playlistSyncTimer) {
      clearTimeout(this.playlistSyncTimer);
    }

    this.playlistSyncTimer = setTimeout(() => {
      this.executePlaylistSync(0);
    }, this.DEBOUNCE_DELAY);
  }

  /**
   * 防抖同步当前歌曲
   */
  syncCurrentSong(song: Music) {
    this.pendingCurrentSong = song;

    if (this.currentSongSyncTimer) {
      clearTimeout(this.currentSongSyncTimer);
    }

    this.currentSongSyncTimer = setTimeout(() => {
      this.executeCurrentSongSync(0);
    }, this.DEBOUNCE_DELAY);
  }

  /**
   * 执行播放列表同步（带重试）
   */
  private executePlaylistSync(retryCount: number) {
    if (!this.pendingPlaylist) return;

    const playlist = this.pendingPlaylist.map((song) => song.id);

    addPlayList(
      playlist,
      () => {
        console.log(`[DbSync] 播放列表同步成功 (${playlist.length} 首歌曲)`);
        this.pendingPlaylist = null;
      },
      (error) => {
        console.error(`[DbSync] 播放列表同步失败 (尝试 ${retryCount + 1}/${this.MAX_RETRIES})`, error);

        if (retryCount < this.MAX_RETRIES - 1) {
          // 指数退避重试
          const delay = Math.pow(2, retryCount) * 1000;
          setTimeout(() => this.executePlaylistSync(retryCount + 1), delay);
        } else {
          console.error("[DbSync] 播放列表同步失败，已达最大重试次数");
          this.pendingPlaylist = null;
        }
      }
    );
  }

  /**
   * 执行当前歌曲同步（带重试）
   */
  private executeCurrentSongSync(retryCount: number) {
    if (!this.pendingCurrentSong) return;

    const songId = this.pendingCurrentSong.id;

    setPlaylist(
      songId,
      () => {
        console.log(`[DbSync] 当前歌曲同步成功: ${this.pendingCurrentSong?.title}`);
        this.pendingCurrentSong = null;
      },
      (error) => {
        console.error(`[DbSync] 当前歌曲同步失败 (尝试 ${retryCount + 1}/${this.MAX_RETRIES})`, error);

        if (retryCount < this.MAX_RETRIES - 1) {
          const delay = Math.pow(2, retryCount) * 1000;
          setTimeout(() => this.executeCurrentSongSync(retryCount + 1), delay);
        } else {
          console.error("[DbSync] 当前歌曲同步失败，已达最大重试次数");
          this.pendingCurrentSong = null;
        }
      }
    );
  }
}

const dbSyncManager = new DbSyncManager();

interface PlaylistState {
  openPlaylist: boolean;
  allSongs: Music[];
  pageSongs: Music[];
  currentSong: Music | null;
  currentPage: number;
  showPlaylist: boolean;
  setOpenPlaylist: (show: boolean) => void;
  setShowPlaylist: (show: boolean) => void;
  togglePlaylist: (open?: boolean) => void;

  setAllSongs: (songs: Music[], initial?: boolean) => void;
  setCurrentPage: (page: number) => void;

  setCurrentSong: (song: Music) => void;
  addSong: (song: Music) => void;
  removeSong: (song: Music) => void;
  clearPlaylist: () => void;
  getTotal: () => number;
  playSingleSong: (song: Music) => void;
}

export const usePlaylist = create<PlaylistState>((set, get) => ({
  openPlaylist: false,
  showPlaylist: false,
  allSongs: [],
  pageSongs: [],
  currentSong: null,
  currentPage: 1,
  setOpenPlaylist: (show) => set(() => ({ openPlaylist: show })),
  setShowPlaylist: (show) => set(() => ({ showPlaylist: show })),
  togglePlaylist: (open?: boolean) =>
    set(() => {
      let targertValue = false;
      if (get().showPlaylist === true) {
        targertValue = false;
      } else {
        targertValue = true;
      }
      if (open !== undefined) {
        targertValue = open;
      }
      if (!targertValue) {
        // 点击关闭的时候，延迟300ms，让动画结束后再真正调用onClose卸载组件
        get().setShowPlaylist(targertValue);
        setTimeout(() => get().setOpenPlaylist(targertValue), 300);
        return {};
      } else {
        setTimeout(() => get().setShowPlaylist(targertValue), 0);
        return { openPlaylist: true };
      }
    }),
  setAllSongs: (songs, initial = false) =>
    set(() => {
      if (!initial) {
        dbSyncManager.syncPlaylist(songs);
      }

      if (songs.length === 0) {
        return {
          allSongs: [],
          pageSongs: [],
          currentSong: null,
        };
      }

      const pageSongs = songs.slice(0, 10);
      return { allSongs: songs, pageSongs, currentSong: pageSongs[0] };
    }),
  setCurrentPage: (page) =>
    set(() => {
      const pageSize = 10;
      const total = get().getTotal();
      const start = (page - 1) * pageSize;
      let end = start + pageSize;
      if (end > total) {
        end = total;
      }
      const pageSongs = get().allSongs.slice(start, end);
      return { pageSongs, currentPage: page };
    }),
  setCurrentSong: (song) => set(() => {
    dbSyncManager.syncCurrentSong(song);
    return { currentSong: song }
  }),
  addSong: (song) =>
    set((state) => {
      const allSongs = [...state.allSongs, song];
      dbSyncManager.syncPlaylist(allSongs);
      return {
        allSongs,
        pageSongs: [...state.pageSongs, song],
      }
    }),
  removeSong: (song) =>
    set((state) => {
      const allSongs = state.allSongs.filter((s) => s.id !== song.id);
      dbSyncManager.syncPlaylist(allSongs);
      return {
        allSongs,
        pageSongs: state.pageSongs.filter((s) => s.id !== song.id),
        currentSong: null,
      }
    }),
  clearPlaylist: () =>
    set(() => {
      dbSyncManager.syncPlaylist([]);
      return {
        allSongs: [],
        pageSongs: [],
        currentSong: null,
      }
    }),
  getTotal: () => get().allSongs.length,
  playSingleSong: (song) => set(() => {
    const allSongs = get().allSongs;
    const index = allSongs.findIndex((s) => s.id === song.id);
    if (index === -1) {
      const newSongs = [...allSongs, song];
      get().setAllSongs(newSongs);
      dbSyncManager.syncPlaylist(newSongs);
    }
    dbSyncManager.syncCurrentSong(song);
    return { currentSong: song };
  }),
}));