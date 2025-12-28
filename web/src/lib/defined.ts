import { Location } from "react-router-dom";

export enum MyRoutes {
    Home = "/",
    Playlist = "/playlist",
    Genres = "/genres",
    Albums = "/albums",
    Artists = "/artists",
    AlbumDetail = "/albums/:id",
    ArtistDetail = "/artists/:id",
    Player = "/player/:id",
    Settings = "/settings",
    Search = "/search",
}
export const checkRoute = (location: Location<any>, route: MyRoutes): boolean => {
    const pathname = location.pathname;
    // console.log(pathname, route);
    if (pathname === route) {
        return true;
    }
    const routeArr = pathname.split("/");
    // console.log(routeArr);
    if (routeArr.length > 1) {
        const first = routeArr[1];
        if (first !== "" && route.startsWith("/" + first)) {
            return true;
        }
    }
    return false;
}

export interface JsonResult<T> {
    code: number;
    success: boolean;
    message: string;
    data: T;
}

export interface GetList {
    list: any[];
    total: number;
}
export interface GetMusicList extends GetList {
    list: Music[];
}
export interface GetAlbumList extends GetList {
    list: Album[];
}
export interface GetArtistList extends GetList {
    list: Artist[];
}

export interface Music {
    id: string;
    file_name: string;
    file_path: string;
    file_url: string;
    title: string;
    artist: string;
    artists?: string[];
    album: string;
    album_id: number;
    artist_id: number;
    cover_art: string;
    year: number;
    duration: number;
    bitrate: number;
    samplerate: number;
    genre: string;
    genres: string[];
    languange: string;
    track: string;
    disc: string;
    comment: string;
    decodedAudioBuffer?: AudioBuffer; // decoded audio buffer of the file
}

export interface lyric {
    id: number;
    song_id: string;
    time: number;
    text: string;
}

export interface MusicFilter {
    any?: string;
    title?: string;
    artist?: number[];
    album?: number[];
    year?: number;
    genres?: string[];
}

export interface Playlist {
    user_id: number;
    song_id: string;
    status: number;
    offset: number;
}

export interface SongList {
    id: number;
    user_id: number;
    name: string;
    description: string;
    cover: string;
    created_at: string;
}

export interface Album {
    id: number;
    name: string;
    cover_art: string;
    description: string;
    year: number;
    artist: string;
    songs: Music[]; // songs in the album
}

export interface Artist {
    id: number;
    name: string;
    cover_art: string;
    description: string;
    year?: number;
}
export interface Genre {
    id: number;
    name: string;
    cover_art: string;
    year?: number;
}
// 扫描状态枚举
export enum ScanStatusEnum {
    Idle = "Idle",
    Scanning = "Scanning",
    Completed = "Completed",
    Failed = "Failed",
}

// 扫描进度信息
export interface ScanProgress {
    status: ScanStatusEnum;
    processed: number;
    total: number;
    current_file?: string;
    error?: string;
}
