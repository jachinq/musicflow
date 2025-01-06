use base64::{engine::general_purpose, Engine};

use super::service::{Album, AlbumSong, Artist, ArtistSong, Cover, Lyric, Metadata};
use crate::{
    comm::{generate_random_string, get_parent_directory_names},
    readmeta::MyMetadata,
};

impl From<MyMetadata> for Metadata {
    fn from(value: MyMetadata) -> Self {
        let mut metadata = Metadata::default();
        metadata.id = generate_random_string(9);
        metadata.title = value.title;
        metadata.artist = value.artist;
        metadata.album = value.album;
        metadata.year = value.year;
        metadata.duration = value.duration;
        metadata.bitrate = String::new();
        metadata.samplerate = String::new();
        metadata.language = value.language;
        metadata.genre = value.genre;
        metadata.track = value.track;
        metadata.disc = value.disc;
        metadata.comment = value.comment;
        metadata
    }
}

impl MyMetadata {
    pub fn build_lyrics(&self, song_id: &str) -> Vec<Lyric> {
        let mut lyrics = Vec::new();
        for lyric in self.lyrics.clone() {
            let mut lyric_item = Lyric::default();
            lyric_item.id = 0;
            lyric_item.song_id = String::from(song_id);
            lyric_item.time = lyric.time;
            lyric_item.text = lyric.text;
            lyrics.push(lyric_item);
        }
        lyrics
    }

    pub fn build_metadata(&self) -> Metadata {
        Metadata::from(self.clone())
    }

    pub fn build_covers(&self, link_id: i64, r#type: &str) -> Vec<Cover> {
        let mut covers = Vec::new();
        for cover in self.covers.clone() {
            let mut cover_item = Cover::default();
            cover_item.r#type = String::from(r#type);
            cover_item.link_id = link_id;
            cover_item.format = cover.format;
            cover_item.size = cover.size;
            cover_item.length = cover.length;
            cover_item.width = cover.width;
            cover_item.height = cover.height;
            cover_item.base64 = general_purpose::STANDARD.encode(cover.base64.as_slice());
            // println!("id: {}, format: {}, size: {}, length: {}, width: {}, height: {}", cover_item.link_id, cover_item.format, cover_item.size, cover_item.length, cover_item.width, cover_item.height);
            covers.push(cover_item);
        }
        covers
    }

    pub fn build_artist(&self) -> Vec<Artist> {
        let mut artist_names = self.split_artist();
        let mut artists = Vec::new();
        if artist_names.is_empty() {
            artist_names = vec![self.artist.clone()];
        }
        for artist_name in artist_names {
            artists.push(Artist {
                id: 0,
                name: artist_name.clone(),
                cover: String::new(),
                description: String::new(),
            })
        }
        artists
    }

    pub fn build_artist_songs(&self, song_id: &str, artist_id: &Vec<i64>) -> Vec<ArtistSong> {
        let mut album_songs = Vec::new();
        for id in artist_id {
            let mut artist_song = ArtistSong::default();
            artist_song.artist_id = *id;
            artist_song.song_id = song_id.to_string();
            album_songs.push(artist_song);
        }
        album_songs
    }

    pub fn build_album(&self) -> Album {
        let mut album = Album::default();
        album.id = 0;
        album.name = self.album.clone();
        album.description = String::new();
        album.year = self.year.clone();
        album
    }

    pub fn build_album_song(&self, song_id: &str, album_id: i64) -> AlbumSong {
        let artists = self.split_artist();
        let album_artist = if !artists.is_empty() {
            artists[0].clone()
        } else {
            self.artist.clone()
        };

        AlbumSong {
            album_id,
            song_id: song_id.to_string(),
            album_name: self.album.clone(),
            song_title: self.title.clone(),
            album_artist,
        }
    }

    pub fn split_artist(&self) -> Vec<String> {
        split_artist(&self.artist)
    }

    pub fn build_genre(&mut self, file_path: &str, music_dir: &str) {
        let parent_folders = get_parent_directory_names(file_path)
            .iter()
            .filter(|name| !music_dir.contains(*name))
            .map(|name| name.to_string())
            .collect::<Vec<_>>();
        if self.genre.trim().is_empty() {
            self.genre = parent_folders.join(",");
        } else {
            self.genre = format!("{},{}", self.genre.trim(), parent_folders.join(","));
        }
    }
}

impl Metadata {
    pub fn split_artist(&self) -> Vec<String> {
        split_artist(&self.artist)
    }
    pub fn split_genre(&self) -> Vec<String> {
        split_original(&self.genre, ",")
    }
}

pub fn split_artist(artist: &str) -> Vec<String> {
    split_original(artist, "/")
}
    

pub fn split_original(original: &str, pat: &str) -> Vec<String> {
    let mut list = Vec::new();
    for split in original.split(pat) {
        let word = split.trim().to_string();
        if !word.is_empty() {
            list.push(word);
        }
    }
    list
}