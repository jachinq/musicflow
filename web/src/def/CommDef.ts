import { IMeta } from "../lib/readmeta";

export interface Music {
    id: string;
    url: string;
    title: string;
    artist: string;
    name: string;
    path: string;
    metadata?: IMeta;
}