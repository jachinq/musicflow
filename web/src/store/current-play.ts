import { create } from 'zustand';
import { lyric } from '../lib/defined';

const volumestr = localStorage.getItem("volume") || "0.5";
const volume = parseFloat(volumestr);

interface CurrentPlayState {
    audioContext: AudioContext;
    currentTime: number;
    currentLyric: { time: number, text: string } | null;
    duration: number;
    isPlaying: boolean;
    volume: number;
    mutedVolume: number;
    lyrics: lyric[];
    setAudioContext: (audioContent: AudioContext) => void;
    setCurrentTime: (currentTime: number) => void;
    setCurrentLyric: (currentLyric: { time: number, text: string } | null) => void;
    setDuration: (duration: number) => void;
    setIsPlaying: (isPlaying: boolean) => void;
    setVolume: (volume: number) => void;
    setMutedVolume: (mutedVolume: number) => void;
    setLyrics: (lyrics: lyric[]) => void;
}

export const useCurrentPlay = create<CurrentPlayState>((set, get) => ({
    audioContext: new AudioContext(),
    currentTime: 0,
    currentLyric: null,
    duration: 0,
    isPlaying: false,
    volume,
    mutedVolume: 0,
    lyrics: [],
    setAudioContext: (audioContext) => set(() => ({ audioContext })),
    setCurrentTime: (currentTime) => set(() => {
        const lyrics = get().lyrics;
        if (lyrics) {
            // 定位下一行歌词，如果没有下一行歌词，则返回当前歌词
            // 这里的算法是 遍历歌词数组，找到第一个 time 小于等于当前时间的歌词 并且 下一个 time 大于当前时间的歌词
            let currentLyric = null;
            const nextLyricIndex = lyrics.findIndex(lyric => lyric.time > currentTime);
            if (nextLyricIndex === -1) {
                // 返回最后一行歌词
                currentLyric = lyrics[lyrics.length - 1];
            } else {
                if (nextLyricIndex === 0) {
                    // 如果当前时间在第一行歌词之前，则返回第一行歌词
                    currentLyric = lyrics[0];
                } else {
                    // 否则返回当前行歌词
                    currentLyric = lyrics[nextLyricIndex - 1];
                }
            }

            return { currentTime, currentLyric }
        }
        return { currentTime }
    }),
    setCurrentLyric: (currentLyric) => set(() => ({ currentLyric })),
    setDuration: (duration) => set(() => ({ duration })),
    setIsPlaying: (isPlaying) => set(() => ({ isPlaying })),
    setVolume: (volume) => set(() => {
        localStorage.setItem("volume", volume.toString());
        return { volume }
    }),
    setMutedVolume: (mutedVolume) => set(() => ({ mutedVolume })),
    setLyrics: (lyrics) => set(() => ({ lyrics })),
}));