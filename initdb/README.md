# initdb

This directory contains the tools to initialize the musicflow database.

## Usage

To initialize the database, follow these steps:

1. Check configuration in `../conf/config.json`

db_path: the path to the database file.

music_dir: the path to the directory containing the music files.

2. Run the following command:

```
cargo run
```

This will create the database file and insert the music metadata into the database.

If you have a lot of music files, you may need long time to build the metadata database.

You can use the following command to speed up the process:

```shell
cargo build --release
cd ..
cp target/release/initdb .
./initdb
```