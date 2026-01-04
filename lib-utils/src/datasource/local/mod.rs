pub mod covert;
pub mod service;
pub mod table;
pub mod datasource;

use crate::config::get_config;
use rusqlite::Connection;

pub fn connect_db() -> rusqlite::Result<Connection> {
    let config = get_config();
    let db_path = config.db_path;
    let conn = Connection::open(&db_path)?;
    Ok(conn)
}
