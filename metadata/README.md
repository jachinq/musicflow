# Metadata

This directory contains the util to fetch and store the metadata to the database. It is used to fetch the metadata of the songs in the musicflow project.

## Dependencies

The metadata util uses the following dependencies:

- Node.js (^18.17.0)
- Typescript

## Usage

To use the metadata util, follow the steps below:

0. Change the directory to the metadata directory:

See [index.ts](index.ts) file for the directory path.

And replate the `Dir` to the actual directory path.

1. Install the required packages using the following command:

```
npm install -g ts-node
pnmp install
```

2. Run the following command to start the metadata util:

```
pnpm dev
```

3. Run the following command to generate the album cover images:

```
pnpm db_album
```

Then wait for the metadata util to fetch the metadata of the songs and store it in the database.