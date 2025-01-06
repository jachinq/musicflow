
use crate::{comm::generate_random_string, readmeta::MyMetadata};
use super::service::Metadata;


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
      metadata
  }
}
