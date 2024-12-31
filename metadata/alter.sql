
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


-- cover 表将字段 type-> size
ALTER TABLE cover RENAME COLUMN type TO size;
-- cover 表删除 extra 字段
ALTER TABLE cover DROP COLUMN extra;
-- cover 表在 song_id 字段前加上 link_id 字段
ALTER TABLE cover ADD COLUMN link_id INTEGER NOT NULL DEFAULT 0 BEFORE song_id;
-- cover 表在 link_id 字段前加上 type 字段
ALTER TABLE cover ADD COLUMN song_id TEXT NOT NULL DEFAULT '' BEFORE link_id;
UPDATE cover SET type = 'song';