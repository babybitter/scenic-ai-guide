// Initialize the SQLite database for the API server: create tables, seed
// reference data (admin user, digital-human config, scenic spots) and import the
// official behaviour analytics Excel into the tourist_behavior table.
import { resolve } from "node:path";
import { config } from "../src/config.mjs";
import { getDb } from "../src/db/database.mjs";
import { importBehaviorFromExcel } from "../src/services/behaviorAnalytics.mjs";

if (!process.env.SQLITE_PATH) {
  process.env.SQLITE_PATH = resolve(config.dataDir, "scenic.sqlite");
}

const db = getDb();
const behavior = importBehaviorFromExcel();

const counts = {
  adminUsers: db.prepare("SELECT COUNT(*) AS n FROM admin_users").get().n,
  scenicSpots: db.prepare("SELECT COUNT(*) AS n FROM scenic_spots").get().n,
  digitalHumanConfigs: db.prepare("SELECT COUNT(*) AS n FROM digital_human_configs").get().n,
  touristBehavior: db.prepare("SELECT COUNT(*) AS n FROM tourist_behavior").get().n
};

console.log("Database initialized at:", process.env.SQLITE_PATH);
console.log("Behaviour import:", behavior);
console.log("Row counts:", counts);
