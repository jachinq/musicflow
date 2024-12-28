import { IMeta } from "./readmeta";

export interface Music {
    id: string;
    file_name: string;
    file_path: string;
    file_url: string;
    title: string;
    artist: string;
    artists: string;
    album: string;
    year: number;
    duration: number;
    bitrate: number;
    samplerate: number;
    metadata?: IMeta;
    fileArrayBuffer?: ArrayBuffer; // array buffer of the file
    decodedAudioBuffer?: AudioBuffer; // decoded audio buffer of the file
}

export interface lyric {
    id: number;
    song_id: string;
    time: number;
    text: string;
}

export interface Tag {
    id: number;
    song_id: string;
    name: string;
    color: string;
    text_color: string;
}

export interface MusicFilter {
    title?: string;
    artist?: string;
    album?: string;
    year?: number;
    tags?: number[];
}