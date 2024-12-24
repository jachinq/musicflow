export interface Music {
    id: string;
    url: string;
    title: string;
    artist: string;
    name: string;
    path: string;
    lyrics: { time: number; text: string }[];
}