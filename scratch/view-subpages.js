const Database = require('better-sqlite3');
const db = new Database('dev.db');
const rows = db.prepare("SELECT id, slug, title, locale, isVisible FROM Subpage").all();
console.log(JSON.stringify(rows, null, 2));
