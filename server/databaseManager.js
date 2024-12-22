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
    name TEXT NOT NULL    
); `,
//  `CREATE TABLE IF NOT EXISTS choice_games (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     choice_id INTEGER REFERENCES choice_bundle(id),
//     game_id INTEGER REFERENCES game(id)    
// ); `
];
console.log("")
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
  "checkChoiceExists": `SELECT exists(SELECT 1 FROM bundle WHERE name = ?) AS row_exists; `,
  "insertChoiceGame": `INSERT into game (steamAppId,name,bundle_id) VALUES (?, ?, ?);`,
  "insertChoiceBundle": `INSERT into bundle (name,choice_url) VALUES (?,?)`

}
module.exports = {
  db,
  queries,
};
