import { Datastore } from "nedb-async-await";

const db = Datastore({ filename: 'src/Storage/data/projects.json', autoload: true });

export default db;
