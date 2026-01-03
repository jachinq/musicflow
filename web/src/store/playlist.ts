import { create } from "zustand";
import { Music } from "../lib/defined";
import { savePlayQueue } from "../lib/api";

// 数据库操作防抖管理器
class DbSyncManager {
  private playlistSyncTimer: NodeJS.Timeout | null = null;
  private pendingPlaylist: Music[] | null = null;
  private readonly DEBOUNCE_DELAY = 500; // 500ms 防抖
  private readonly MAX_RETRIES = 3;
  private current_id: string | null = null;
  private position: number | null = null;

  /**
   * 防抖同步播放列表
   */
  syncPlaylist(songs: Music[], current_id: string, position: number) {
    this.pendingPlaylist = songs;
    this.current_id = current_id;
    this.position = position;

    if (this.playlistSyncTimer) {
      clearTimeout(this.playlistSyncTimer);
    }

    this.playlistSyncTimer = setTimeout(() => {
      this.executePlaylistSync(0);
    }, this.DEBOUNCE_DELAY);
  }

  /**
   * 执行播放列表同步（带重试）
   */
  private executePlaylistSync(retryCount: number) {
    if (!this.pendingPlaylist) return;

    const playlist = this.pendingPlaylist.map((song) => song.id);
    const current_id = this.current_id || "";
    const position = this.position || 0;

    savePlayQueue(
      playlist,
      current_id,
      position,
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

}

const dbSyncManager = new DbSyncManager();

interface PlaylistState {
  openPlaylist: boolean; // 是否显示播放列表
  showPlaylist: boolean; // 是否显示播放列表动画
  allSongs: Music[];
  displaySongs: Music[];
  currentSong: Music | null;
  loadedCount: number;
  isLoadMore: boolean
  loadMore: () => void;
  setOpenPlaylist: (show: boolean) => void;
  setShowPlaylist: (show: boolean) => void;
  togglePlaylist: (open?: boolean) => void;
  setAllSongs: (songs: Music[], initial?: boolean) => void;
  setCurrentSong: (song: Music, userInteract?: boolean) => void;
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
  displaySongs: [],
  currentSong: null,
  loadedCount: 0,
  setOpenPlaylist: (show) => set(() => ({ openPlaylist: show })),
  setShowPlaylist: (show) => set(() => ({ showPlaylist: show })),
  isLoadMore: false,
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
        dbSyncManager.syncPlaylist(songs, "", 0);
      }

      if (songs.length === 0) {
        return {
          allSongs: [],
          displaySongs: [],
          currentSong: null,
          loadedCount: 0,
        };
      }

      const displaySongs = songs.slice(0, 20);
      return {
        allSongs: songs,
        displaySongs,
        // currentSong: displaySongs[0],
        loadedCount: displaySongs.length,
      };
    }),
  loadMore: () => {
    set({isLoadMore: true});
    console.log("set isLoadMore true");

    setTimeout(() => {
      console.log("start load more");
      const { allSongs, loadedCount } = get();
      const pageSize = 20;
      const newLoadedCount = Math.min(loadedCount + pageSize, allSongs.length);
      const displaySongs = allSongs.slice(0, newLoadedCount);
      set({
        displaySongs,
        loadedCount: newLoadedCount,
        isLoadMore: false,
      });
    }, 300);
  },
  setCurrentSong: (song, userInteract = true) => set(() => {
    // 除非显式表明，否则都视为用户已交互
    localStorage.setItem("userInteract", userInteract.toString());
    let allSongs = get().allSongs;
    dbSyncManager.syncPlaylist(allSongs, song.id, 0);
    return { currentSong: song }
  }),
  addSong: (song) =>
    set((state) => {
      const allSongs = [...state.allSongs, song];
      dbSyncManager.syncPlaylist(allSongs, "", 0);
      const newLoadedCount = state.loadedCount + 1;
      const displaySongs = allSongs.slice(0, newLoadedCount);
      return {
        allSongs,
        displaySongs,
        loadedCount: newLoadedCount,
      };
    }),
  removeSong: (song) =>
    set((state) => {
      const allSongs = state.allSongs.filter((s) => s.id !== song.id);
      dbSyncManager.syncPlaylist(allSongs, "", 0);
      const displaySongs = state.displaySongs.filter((s) => s.id !== song.id);
      return {
        allSongs,
        displaySongs,
        currentSong: null,
        loadedCount: displaySongs.length,
      };
    }),
  clearPlaylist: () =>
    set(() => {
      dbSyncManager.syncPlaylist([], "", 0);
      return {
        allSongs: [],
        displaySongs: [],
        currentSong: null,
        loadedCount: 0,
      };
    }),
  getTotal: () => get().allSongs.length,
  playSingleSong: (song) => set(() => {
    localStorage.setItem("userInteract", "true");
    const allSongs = get().allSongs;
    const index = allSongs.findIndex((s) => s.id === song.id);
    if (index === -1) {
      const newSongs = [...allSongs, song];
      get().setAllSongs(newSongs);
      dbSyncManager.syncPlaylist(newSongs, song.id, 0);
    }
    return { currentSong: song };
  }),
}));