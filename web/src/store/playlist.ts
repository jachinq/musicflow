import { create } from "zustand";
import { Music } from "../def/CommDef";

interface PlaylistState {
  allSongs: Music[];
  pageSongs: Music[];
  searchQuery: string;
  selectedSongs: Music[];
  currentSong: Music | null;
  currentPage: number;
  setAllSongs: (songs: Music[]) => void;
  setPageSongs: (songs: Music[]) => void;
  setCurrentPage: (page: number) => void;
  setSearchQuery: (query: string) => void;
  setSelectedSongs: (songs: Music[]) => void;
  setCurrentSong: (song: Music) => void;
  addSong: (song: Music) => void;
  removeSong: (song: Music) => void;
  clearPlaylist: () => void;
}

export const usePlaylist = create<PlaylistState>((set, get) => ({
  allSongs: [],
  pageSongs: [],
  searchQuery: "",
  selectedSongs: [],
  currentSong: null,
  currentPage: 1,
  setAllSongs: (songs) => set(() => {
    if (songs.length === 0) {
      return { allSongs: [], pageSongs: [], selectedSongs: [], currentSong: null };
    }
    const pageSongs = songs.slice(0, 10);
    return { allSongs: songs, pageSongs, currentSong: pageSongs[0] };
  }),
  setPageSongs: (songs) => set(() => ({ pageSongs: songs })),
  setCurrentPage: (page) => set(() => ({ currentPage: page })),
  setSearchQuery: (query) => set(() => {
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
  setCurrentSong: (song) => set(() => ({ currentSong: song })),
  addSong: (song) =>
    set((state) => ({
      allSongs: [...state.allSongs, song],
      pageSongs: [...state.pageSongs, song],
    })),
  removeSong: (song) =>
    set((state) => ({
      allSongs: state.allSongs.filter((s) => s.id !== song.id),
      pageSongs: state.pageSongs.filter((s) => s.id !== song.id),
      selectedSongs: state.selectedSongs.filter((s) => s.id !== song.id),
      currentSong: null,
    })),
  clearPlaylist: () =>
    set(() => ({
      allSongs: [],
      pageSongs: [],
      selectedSongs: [],
      currentSong: null,
    })),
}));