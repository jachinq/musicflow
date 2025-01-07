import { Location } from "react-router-dom";

export enum MyRoutes {
    Home = "/",
    Playlist = "/playlist",
    Genres = "/genres",
    Albums = "/albums",
    Artists = "/artists",
    AlbumDetail = "/albums/:id",
    ArtistDetail = "/artists/:id",
    Player = "/detail/:id",
    Settings = "/settings",
}
export const checkRoute = (location: Location<any>, route: MyRoutes): boolean => {
    const pathname = location.pathname;
    if (pathname === route) {
        return true;
    }
    const routeArr = pathname.split("/");
    if (routeArr.length > 1) {
        const first = routeArr[1];
        if (route.startsWith("/" + first)) {
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
    artists: string[];
    album: string;
    album_id: number;
    artist_id: number;
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
    fileArrayBuffer?: ArrayBuffer; // array buffer of the file
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
    cover: string;
    description: string;
    year: number;
    artist: string;
    songs: Music[]; // songs in the album
}

export interface Artist {
    id: number;
    name: string;
    cover: string;
    description: string;
    year?: number;
}