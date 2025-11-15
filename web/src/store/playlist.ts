import { create } from "zustand";
import { Music } from "../lib/defined";
import { addPlayList, setPlaylist } from "../lib/api";

interface PlaylistState {
  openPlaylist: boolean;
  allSongs: Music[];
  pageSongs: Music[];
  searchQuery: string;
  selectedSongs: Music[];
  currentSong: Music | null;
  currentPage: number;
  showPlaylist: boolean;
  setOpenPlaylist: (show: boolean) => void;
  setShowPlaylist: (show: boolean) => void;
  togglePlaylist: (open?: boolean) => void;

  setAllSongs: (songs: Music[], initial?: boolean) => void;
  setCurrentPage: (page: number) => void;

  setSearchQuery: (query: string) => void;
  setSelectedSongs: (songs: Music[]) => void;
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
  searchQuery: "",
  selectedSongs: [],
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
        addDbPlaylist(songs)
      }

      if (songs.length === 0) {
        return {
          allSongs: [],
          pageSongs: [],
          selectedSongs: [],
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
  setSearchQuery: (query) =>
    set(() => {
      if (!query || query === "" || query.trim() === "") {
        return { searchQuery: query, pageSongs: get().allSongs };
      }
      query = query.trim().toLocaleLowerCase();
      const songs = get().allSongs.filter((song) =>
        song.title.toLowerCase().includes(query)
      );
      return { searchQuery: query, pageSongs: songs };
    }),
  setSelectedSongs: (songs) => set(() => ({ selectedSongs: songs })),
  setCurrentSong: (song) => set(() => {
    setDbPlaylist(song)
    return { currentSong: song }
  }),
  addSong: (song) =>
    set((state) => {
      const allSongs = [...state.allSongs, song];
      addDbPlaylist(allSongs)
      return {
        allSongs,
        pageSongs: [...state.pageSongs, song],
      }
    }),
  removeSong: (song) =>
    set((state) => {
      const allSongs = state.allSongs.filter((s) => s.id !== song.id);
      addDbPlaylist(allSongs)
      return {
        allSongs,
        pageSongs: state.pageSongs.filter((s) => s.id !== song.id),
        selectedSongs: state.selectedSongs.filter((s) => s.id !== song.id),
        currentSong: null,
      }
    }),
  clearPlaylist: () =>
    set(() => {
      addDbPlaylist([])
      return {
        allSongs: [],
        pageSongs: [],
        selectedSongs: [],
        currentSong: null,
      }
    }),
  getTotal: () => get().allSongs.length,
  playSingleSong: (song) => set(() => {
    const allSongs = get().allSongs;
    const index = allSongs.findIndex((song) => song.id === song.id);
    if (index === -1) {
      get().setAllSongs([...allSongs, song]);
    }
    setDbPlaylist(song)
    return { currentSong: song };
  }),
}));


const addDbPlaylist = (songs: Music[]) => {
  const playlist: String[] = songs.map((song) => song.id);
  addPlayList(playlist, (_data) => { }, (error) => {
    console.error(error);
  })
}

const setDbPlaylist = (song: Music) => {
  setPlaylist(song.id, (_data) => { }, (error) => {
    console.error(error);
  })
}