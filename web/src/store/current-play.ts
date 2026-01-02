import { create } from 'zustand';
import { lyric } from '../lib/defined';

const volumestr = localStorage.getItem("volume") || "0.5";
const volume = parseFloat(volumestr);

interface CurrentPlayState {
    currentTime: number;
    currentLyric: { time: number, text: string } | null;
    duration: number;
    isPlaying: boolean;
    volume: number;
    lyrics: lyric[];
    lastLyricIndex: number; // 缓存上次的歌词索引
    hasUserInteracted: boolean;
    setCurrentTime: (currentTime: number) => void;
    setCurrentLyric: (currentLyric: { time: number, text: string } | null) => void;
    setDuration: (duration: number) => void;
    setIsPlaying: (isPlaying: boolean) => void;
    setVolume: (volume: number) => void;
    setLyrics: (lyrics: lyric[]) => void;
    setHasUserInteracted: (hasUserInteracted: boolean) => void;
}

// 二分查找歌词索引 (O(log n))
const findLyricIndexBinarySearch = (lyrics: lyric[], currentTime: number): number => {
    if (lyrics.length === 0) return -1;

    let left = 0;
    let right = lyrics.length - 1;
    let result = 0;

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (lyrics[mid].time <= currentTime) {
            result = mid;
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    return result;
};

export const useCurrentPlay = create<CurrentPlayState>((set, get) => ({
    currentTime: 0,
    currentLyric: null,
    duration: 0,
    isPlaying: false,
    volume,
    lyrics: [],
    lastLyricIndex: 0,
    hasUserInteracted: false,
    setCurrentTime: (currentTime) => set(() => {
        const lyrics = get().lyrics;
        const lastIndex = get().lastLyricIndex;

        // 如果没有歌词，直接返回
        if (!lyrics || lyrics.length === 0) {
            return { currentTime };
        }

        // 使用二分查找定位当前歌词 (O(log n))
        const lyricIndex = findLyricIndexBinarySearch(lyrics, currentTime);

        if (lyricIndex === -1) {
            return { currentTime, currentLyric: null, lastLyricIndex: 0 };
        }

        // 只有当歌词索引变化时才更新 currentLyric，避免不必要的渲染
        if (lyricIndex !== lastIndex) {
            const currentLyric = lyrics[lyricIndex];
            return { currentTime, currentLyric, lastLyricIndex: lyricIndex };
        }

        return { currentTime };
    }),
    setCurrentLyric: (currentLyric) => set(() => ({ currentLyric })),
    setDuration: (duration) => set(() => ({ duration })),
    setIsPlaying: (isPlaying) => set(() => ({ isPlaying })),
    setVolume: (volume) => set(() => {
        localStorage.setItem("volume", volume.toString());
        return { volume }
    }),
    setLyrics: (lyrics) => set(() => ({ lyrics, lastLyricIndex: 0 })),
    setHasUserInteracted: (hasUserInteracted) => set({ hasUserInteracted }),
}));