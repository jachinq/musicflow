const Database = require('better-sqlite3');
const db_path = '../build/data/musicflow.db';

// 定义数据模型
export interface Metadata {
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
}

export interface Lyric {
  id: number;
  song_id: string;
  time: number;
  text: string;
}

export interface Cover {
  type: string;
  link_id: number;
  format: string;
  width: number;
  height: number;
  base64: string;
  size: string;
  song_id?: string;
}

export interface User {
  id: number;
  name: string;
  password: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
  text_color: string;
}

export interface SongTag {
  song_id: string;
  tag_id: number;
}

export interface Artist {
  id: number;
  name: string;
  cover: string;
  description: string;
}

export interface ArtistSong {
  artist_id: number;
  song_id: string;
}

export interface Album {
  id: number;
  name: string;
  artist: string;
  year: number;
  description: string;
}

export interface AlbumSong {
  album_id: number;
  song_id: string;
  album_name: string;
  song_title: string;
  song_artist: string;
}


// 创建或打开一个名为 'example.db' 的数据库
export const db = new Database(db_path);

// 创建表
db.exec(`
BEGIN TRANSACTION;

CREATE TABLE
  IF NOT EXISTS metadata (
    id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '未知歌曲',
    artist TEXT NOT NULL DEFAULT '未知艺术家',
    artists TEXT NOT NULL DEFAULT '["未知艺术家"]',
    album TEXT NOT NULL DEFAULT '未知专辑',
    year INTEGER,
    duration REAL,
    bitrate REAL,
    samplerate REAL
  );

CREATE TABLE
  IF NOT EXISTS lyric (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    song_id TEXT NOT NULL,
    time REAL NOT NULL,
    text TEXT NOT NULL
  );

CREATE TABLE
  IF NOT EXISTS cover (
    type TEXT NOT NULL,
    link_id INTEGER NOT NULL DEFAULT 0,
    format TEXT NOT NULL,
    size TEXT NOT NULL,
    width REAL,
    height REAL,
    base64 TEXT NOT NULL
  );

CREATE TABLE
  IF NOT EXISTS song_list (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    cover TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );

CREATE TABLE
  IF NOT EXISTS song_list_song (
    user_id INTEGER NOT NULL,
    song_list_id INTEGER NOT NULL,
    song_id TEXT NOT NULL,
    order_num INTEGER NOT NULL
  );

CREATE TABLE
  IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

CREATE TABLE
  IF NOT EXISTS user_token (
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL,
    expire_at INTEGER NOT NULL
  );

CREATE TABLE
  IF NOT EXISTS user_favorite (
    user_id INTEGER NOT NULL,
    song_id TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

CREATE TABLE
  IF NOT EXISTS tag (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    text_color TEXT NOT NULL
  );

CREATE TABLE
  IF NOT EXISTS song_tag (song_id TEXT NOT NULL, tag_id INTEGER NOT NULL);

CREATE TABLE
  IF NOT EXISTS artist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cover TEXT NOT NULL,
    description TEXT NOT NULL
  );

CREATE TABLE
  IF NOT EXISTS artist_song (artist_id INTEGER NOT NULL, song_id TEXT NOT NULL);

CREATE TABLE
  IF NOT EXISTS album (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    year INTEGER,
    artist TEXT NOT NULL
  );

CREATE TABLE
  IF NOT EXISTS album_song (
    album_id INTEGER NOT NULL, 
    song_id TEXT NOT NULL,
    album_name TEXT NOT NULL,
    song_title TEXT NOT NULL,
    song_artist TEXT NOT NULL
  );

COMMIT;
`);

console.log(new Date().toLocaleString(), 'database created.');

// title and artist 作为联合主键判断是否已存在metadata
export const getMetadata = (title: string, artist: string) => {
  const select = db.prepare(`
    SELECT * FROM metadata WHERE title = @title AND artist = @artist
  `);
  return select.get({ title, artist });
};
export const getMetadataById = (id: string) => {
  const select = db.prepare(`
    SELECT * FROM metadata WHERE id = @id
  `);
  return select.get({ id });
};
export const existMetadataByPath = (file_path: string) => {
  const select = db.prepare(`
    SELECT * FROM metadata WHERE file_path = @file_path
  `);
  return select.get({ file_path });
};
export const getAllMetadata = (): Metadata[] => {
  const select = db.prepare(`SELECT * FROM metadata`);
  return select.all();
};
export const addMetadata = (metadata: Metadata) => {
  const { id, file_name, file_path, file_url, title, artist, artists, album, year, duration, bitrate, samplerate } = metadata;
  const insert = db.prepare(`
    INSERT INTO metadata (id, file_name, file_path, file_url, title, artist, artists, album, year, duration, bitrate, samplerate)
    VALUES (@id, @file_name, @file_path, @file_url, @title, @artist, @artists, @album, @year, @duration, @bitrate, @samplerate)
  `);
  insert.run({ id, file_name, file_path, file_url, title, artist, artists, album, year, duration, bitrate, samplerate });
  return { id, file_name, file_path, file_url, title, artist, artists, album, year, duration, bitrate, samplerate };
};
export const updateMetadataPath = (metadata: { id: string; file_path: string; file_url: string }) => {
  const { id, file_path, file_url } = metadata;
  const update = db.prepare(`
    UPDATE metadata SET file_path = @file_path, file_url = @file_url WHERE id = @id
  `);
  update.run({ id, file_path, file_url });
  return { id, file_path, file_url };
};

export const addLyric = (data: Lyric) => {
  const { song_id, time, text } = data;
  const insert = db.prepare(`
    INSERT INTO lyric (song_id, time, text)
    VALUES (@song_id, @time, @text)
  `);
  insert.run({ song_id, time, text });
  return { id: insert.lastInsertRowid, song_id, time, text };
};

export const addCover = (cover: Cover) => {
  const { type, link_id, format, size, width, height, base64 } = cover;
  const exist = getCoverByIdAndSize(link_id, size);
  if (exist) return exist;

  const insert = db.prepare(`
    INSERT INTO cover (type, link_id, format, size, width, height, base64)
    VALUES (@type, @link_id, @format, @size, @width, @height, @base64)
  `);
  insert.run({ type, link_id, format, size, width, height, base64 });
  return { id: insert.lastInsertRowid, type, link_id, format, size, width, height, base64 };
};
export const getAllCover = () => {
  const select = db.prepare(`SELECT * FROM cover`);
  return select.all();
};
export const getCoverByIdAndSize = (link_id: number, size: string) => {
  const select = db.prepare(`
    SELECT * FROM cover WHERE link_id = @link_id AND size = @size
  `);
  return select.get({ link_id, size });
};

export const addUser = (user: User) => {
  const { name, password, email, role, created_at, updated_at } = user;
  const insert = db.prepare(`
    INSERT INTO user (name, password, email, role, created_at, updated_at)
    VALUES (@id, @name, @password, @email, @role, @created_at, @updated_at)
  `);
  insert.run({ name, password, email, role, created_at, updated_at });
  return { id: insert.lastInsertRowid, name, password, email, role, created_at, updated_at };
};

export const addTag = (tag: Tag) => {
  const { name, color, text_color } = tag;
  const exist = getTag(name);
  if (exist) return exist;

  const insert = db.prepare(`
    INSERT INTO tag (name, color, text_color)
    VALUES (@name, @color, @text_color)
  `);
  insert.run({ name, color, text_color });
  const { id } = getTag(name);
  return { id, name, color, text_color };
};

export const addSongTag = (songTag: SongTag) => {
  const { song_id, tag_id } = songTag;
  const insert = db.prepare(`
    INSERT INTO song_tag (song_id, tag_id)
    VALUES (@song_id, @tag_id)
  `);
  insert.run({ song_id, tag_id });
  return { song_id, tag_id };
};

export const addArtist = (artist: Artist) => {
  const { name, cover, description } = artist;
  const exist = getArtist(name);
  if (exist) return exist;

  const insert = db.prepare(`
    INSERT INTO artist (name, cover, description)
    VALUES (@name, @cover, @description)
  `);
  insert.run({ name, cover, description });
  const { id } = getArtist(name);
  return { id, name, cover, description };
};

export const addArtistSong = (artistSong: ArtistSong) => {
  const { artist_id, song_id } = artistSong;
  const insert = db.prepare(`
    INSERT INTO artist_song (artist_id, song_id)
    VALUES (@artist_id, @song_id)
  `);
  insert.run({ artist_id, song_id });
  return { artist_id, song_id };
};

export const getTag = (name: string) => {
  const select = db.prepare(`
    SELECT * FROM tag WHERE name = @name
  `);
  return select.get({ name });
};

export const getArtist = (name: string) => {
  const select = db.prepare(`
    SELECT * FROM artist WHERE name = @name
  `);
  return select.get({ name });
};

export const getAlbum = (name: string, artist: string) => {
  const select = db.prepare(`
    SELECT * FROM album WHERE name = @name AND artist = @artist
  `);
  return select.get({ name, artist });
};
export const addAlbum = (album: Album) => {
  const { name, artist, year, description } = album;
  const exist = getAlbum(name, artist);
  if (exist) return exist;

  const insert = db.prepare(`
    INSERT INTO album (name, artist, year, description)
    VALUES (@name, @artist, @year, @description)
  `);
  insert.run({ name, artist, year, description });
  const { id } = getAlbum(name, artist);
  return { id, name, artist, year, description };
};
export const addAlbumSong = (albumSong: AlbumSong) => {
  const { album_id, song_id, album_name, song_title, song_artist } = albumSong;
  const insert = db.prepare(`
    INSERT INTO album_song (album_id, song_id, album_name, song_title, song_artist)
    VALUES (@album_id, @song_id, @album_name, @song_title, @song_artist)
  `);
  insert.run({ album_id, song_id, album_name, song_title, song_artist });
  return { album_id, song_id, album_name, song_title, song_artist };
};
export const getAllAlbumSongs = () => {
  const select = db.prepare(` SELECT * FROM album_song `);
  return select.all();
};

export const closeDb = () => {
  db.close();
};