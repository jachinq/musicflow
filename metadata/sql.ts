const Database = require('better-sqlite3');
const db_path = 'musicflow.db';

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
  song_id: string;
  format: string;
  width: number;
  height: number;
  base64: string;
  type: string;
  extra: string;
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

// 创建或打开一个名为 'example.db' 的数据库
const db = new Database(db_path);

// 创建表
db.exec(`
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
    song_id TEXT NOT NULL,
    format TEXT NOT NULL,
    width REAL,
    height REAL,
    base64 TEXT NOT NULL,
    type TEXT NOT NULL,
    extra TEXT
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
`);

export const addMetadata = (metadata: Metadata) => {
  const { id, file_name, file_path, file_url, title, artist, artists, album, year, duration, bitrate, samplerate } = metadata;
  const insert = db.prepare(`
    INSERT INTO metadata (id, file_name, file_path, file_url, title, artist, artists, album, year, duration, bitrate, samplerate)
    VALUES (@id, @file_name, @file_path, @file_url, @title, @artist, @artists, @album, @year, @duration, @bitrate, @samplerate)
  `);
  insert.run({ id, file_name, file_path, file_url, title, artist, artists, album, year, duration, bitrate, samplerate });
  return { id, file_name, file_path, file_url, title, artist, artists, album, year, duration, bitrate, samplerate };
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
  const { song_id, format, width, height, base64, type, extra } = cover;
  const insert = db.prepare(`
    INSERT INTO cover (song_id, format, width, height, base64, type, extra)
    VALUES (@song_id, @format, @width, @height, @base64, @type, @extra)
  `);
  insert.run({ song_id, format, width, height, base64, type, extra });
  return { song_id, format, width, height, base64, type, extra };
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

export const getMetadata = (title: string) => {
  const select = db.prepare(`
    SELECT * FROM metadata WHERE title = @title
  `);
  return select.get({ title });
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

export const closeDb = () => {
  db.close();
};


// // 插入数据
// const insert = db.prepare(`
//     INSERT INTO users (name, age) VALUES (@name, @age)
// `);

// // 使用参数化的插入语句
// insert.run({ name: 'Alice', age: 30 });
// insert.run({ name: 'Bob', age: 25 });

// // 查询数据
// const selectAll = db.prepare(`
//     SELECT * FROM users
// `);

// const users = selectAll.all();
// console.log('所有用户:', users);

// // 查询单个用户
// const selectOne = db.prepare(`
//     SELECT * FROM users WHERE name = @name
// `);

// const user = selectOne.get({ name: 'Alice' });
// console.log('用户 Alice:', user);

// // 关闭数据库连接
// db.close();

console.log('数据库连接成功！');

// const result = addArtist({ id: 0, name: "test", cover: "", description: "" });
// console.log(result);
// closeDb();