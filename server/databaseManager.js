/*
  This module exists to handle everything database related.
  It will:
   Create the database if it does not exist
   Instantiate a single databse connection
   Define most/all of the queries so they are mainted in one place.

*/
const path = require('path');
const os = require('os');
const fs = require('fs');
const Database = require('better-sqlite3');

// Get a safe path for the SQLite database file based on the OS
const getDatabasePath = () => {
  const baseDir = path.join(os.homedir(), '.humbleLibraryViewer');

  // Ensure the directory exists
  if (!fs.existsSync(baseDir)) {
    console.log("creating directory")
    fs.mkdirSync(baseDir, { recursive: true });
  }else{
    console.log("Existed")
  }

  return path.join(baseDir, 'humble_library.sqlite3');
};

const databasePath = getDatabasePath();
console.log(`DB Path: ${databasePath}`);
// Create the database

const db = new Database(databasePath);
db.pragma('journal_mode = WAL');
// Create the table to store game definitions
const scripts =[`CREATE TABLE IF NOT EXISTS game (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        steamAppId INTEGER NOT NULL,
        humble_id TEXT,
        name TEXT NOT NULL,
        bundle_id INTEGER REFERENCES bundle(id),
        claimed BOOLEAN DEFAULT 0,
        created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        tags TEXT
    ); `,
// Create a table represnet choice bundles
`CREATE TABLE IF NOT EXISTS bundle (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    humble_id INTEGER,
    choice_url text,
    uid text,
    name TEXT NOT NULL,
    UNIQUE(uid)
); `,
`CREATE TABLE IF NOT EXISTS steamApp (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  steam_app_id INTEGER,
  name text,
  tags text,
  posReviews integer,
  negReviews integer,
  updated text

)`,
`CREATE TABLE IF NOT EXISTS system (
  sys_key text
  sys_value text
)`
];
scripts.forEach(script => {
  try {
      db.exec(script);
      //console.log("Executed script:", script);
  } catch (error) {
      console.error("Error executing script:", error.message);
  }
});

// Verify tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table';").all();
console.log("Existing tables:", tables);

const queries ={
  
  "insertGame": `INSERT into game (steamAppId,name,bundle_id,claimed) VALUES (?, ?, ?,?);`,
  "insertBundle": `INSERT or IGNORE into bundle (name,uid) VALUES (?,?)`,
  "insertChoiceBundle": `INSERT into bundle (name,choice_url) VALUES (?,?)`,
  "getGamesByBundle": `SELECT * FROM game where bundle_id = ?`,
  "getBundleByChoiceUrl": `SELECT * from bundle where choice_url = ?`,
  "getBundleByUid":`SELECT * from bundle where uid = ?`,
  "setGameClaimed":`UPDATE game SET claimed=1 where bundle_id = ? and steamAppId = ?`,
  "insertSteamApp":`INSERT or IGNORE into steamApp (steam_app_id,name) values (?,?)`,
  "insertSteamSpyData":`INSERT or IGNORE into steamApp (steam_app_id,name,tags,posReviews,negReviews,updated) values (?,?,?,?,?,DATE('now'))`,
  "getSteamAppByName": `SELECT steam_app_id from steamApp where name = ? COLLATE NOCASE` // ensure case-insensitive

}
module.exports = {
  db,
  queries,
};
