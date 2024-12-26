import { IMeta } from "../lib/readmeta";

export interface Music {
    id: string;
    url: string;
    title: string;
    artist: string;
    name: string;
    path: string;
    metadata?: IMeta;
    fileArrayBuffer?: ArrayBuffer; // array buffer of the file
    decodedAudioBuffer?: AudioBuffer; // decoded audio buffer of the file
}