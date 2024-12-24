import {create} from 'zustand';
import { IMeta } from '../lib/readmeta';

interface CurrentPlayState {
    audioContext: AudioContext | null;
    currentTime: number;
    currentLyric: {time: number, text: string} | null;
    duration: number;
    isPlaying: boolean;
    isLooping: boolean;
    isMuted: boolean; // 是否静音
    volume: number;
    metadata: IMeta | null;
    setAudioContext: (audioContent: AudioContext | null) => void;
    setCurrentTime: (currentTime: number) => void;
    setCurrentLyric: (currentLyric: {time: number, text: string} | null) => void;
    setDuration: (duration: number) => void;
    setIsPlaying: (isPlaying: boolean) => void;
    setIsLooping: (isLooping: boolean) => void;
    setIsMuted: (isMuted: boolean) => void;
    setVolume: (volume: number) => void;
    setMetadata: (metadata: IMeta) => void;
}

export const useCurrentPlay = create<CurrentPlayState>((set, get) => ({
    audioContext: null,
    currentTime: 0,
    currentLyric: null,
    duration: 0,
    isPlaying: false,
    isLooping: false,
    isMuted: false,
    volume: 1,
    metadata: null,
    setAudioContext: (audioContent) => set(() => ({audioContext: audioContent})),
    setCurrentTime: (currentTime) => set(() => {
        const metadata = get().metadata;
        if (metadata && metadata.lyrics) { 
            const lyrics = metadata.lyrics;
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
        
            return {currentTime, currentLyric}
        }
        return {currentTime}
    }),
    setCurrentLyric: (currentLyric) => set(() => ({currentLyric})),
    setDuration: (duration) => set(() => ({duration})),
    setIsPlaying: (isPlaying) => set(() => ({isPlaying})),
    setIsLooping: (isLooping) => set(() => ({isLooping})),
    setIsMuted: (isMuted) => set(() => ({isMuted})),
    setVolume: (volume) => set(() => ({volume})),
    setMetadata: (metadata) => set(() => ({metadata})),
}));