pub mod table;
pub mod service;
pub mod covert;

use rusqlite::{Connection, Result};

use crate::config::get_config;

pub fn connect_db() -> Result<Connection> {
  let config = get_config();
  let db_path = config.db_path;
  let conn = Connection::open(&db_path)?;
  Ok(conn)
}
