import { IMeta } from "../lib/readmeta";

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
    id: string;
    song_id: string;
    time: number;
    text: string;
}