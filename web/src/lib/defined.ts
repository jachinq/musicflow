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
    artists: string;
    album: string;
    year: number;
    duration: number;
    bitrate: number;
    samplerate: number;
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
    name: string;
    color: string;
    text_color: string;
}

export interface MusicFilter {
    any?: string;
    title?: string;
    artist?: number[];
    album?: string[];
    year?: number;
    tags?: number[];
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
    description: string;
    year: number;
}

export interface Artist {
    id: number;
    name: string;
    cover: string;
    description: string;
}