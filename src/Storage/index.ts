import DataStore from "nedb";

const db = new DataStore({ filename: 'src/Storage/data/projects.json' });

db.loadDatabase(function (err) {
  if (err) {
    throw new Error(`Database error: ${err}`)
  }
});

export default db;
