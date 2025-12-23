//AI assisted
import sqlite3 from 'sqlite3';
sqlite3.verbose();

const db = new sqlite3.Database('./game.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      highest_level INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      level INTEGER,
      score INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(username) REFERENCES users(username)
    )
  `);
});

export default db;
