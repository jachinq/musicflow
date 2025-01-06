pub mod table;
pub mod service;
pub mod covert;

use rusqlite::{Connection, Result};

pub fn connect_db() -> Result<Connection> {
  let conn = Connection::open("musicflow.db")?;
  Ok(conn)
}
