// P0-03/P0-04: SQLite persistence layer.
//
// The database is opened lazily and memoized. The path is taken from
// SQLITE_PATH; when it is unset the store falls back to an in-memory database.
// The API server (app.mjs / dev.mjs) sets SQLITE_PATH to a real file so data
// survives restarts, while test and eval scripts leave it unset and therefore
// run against a fresh in-memory database each process -> deterministic tests.

import Database from "better-sqlite3";
import { resolve } from "node:path";
import { config } from "../config.mjs";
import { loadKnowledge } from "../services/knowledgeBuild.mjs";
import { hashPassword } from "./password.mjs";

let db = null;

const DDL = `
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS visitor_sessions (
  id TEXT PRIMARY KEY,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  channel TEXT,
  satisfaction_score INTEGER,
  message_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  intent_label TEXT,
  emotion_label TEXT,
  latency_ms INTEGER,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages (session_id);

CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  message_id TEXT,
  rating INTEGER,
  vote TEXT,
  emotion TEXT,
  comment TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_feedback_session ON feedback (session_id);

CREATE TABLE IF NOT EXISTS scenic_spots (
  id TEXT PRIMARY KEY,
  scenic_area TEXT,
  name TEXT NOT NULL,
  aliases TEXT,
  location_text TEXT,
  parameters TEXT,
  core_function TEXT,
  culture TEXT,
  detail TEXT,
  highlights TEXT,
  open_info TEXT,
  notes TEXT,
  source TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS digital_human_configs (
  id TEXT PRIMARY KEY,
  name TEXT,
  avatar_id TEXT,
  vcn TEXT,
  character_asset TEXT,
  appearance TEXT,
  outfit TEXT,
  theme TEXT,
  voice_id TEXT,
  speech_rate REAL,
  welcome_text TEXT,
  emotion_style TEXT,
  service_status TEXT,
  enabled INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS admin_faqs (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT,
  priority INTEGER NOT NULL DEFAULT 50,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS knowledge_documents (
  id TEXT PRIMARY KEY,
  file_name TEXT NOT NULL,
  stored_name TEXT,
  mime_type TEXT,
  size INTEGER,
  file_type TEXT,
  status TEXT,
  chunk_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tourist_behavior (
  id TEXT PRIMARY KEY,
  tourist_id TEXT,
  age INTEGER,
  gender TEXT,
  attraction_name TEXT,
  visit_date TEXT,
  stay_duration REAL,
  ticket_cost REAL,
  food_cost REAL,
  shopping_cost REAL,
  transport_cost REAL,
  entertainment_cost REAL,
  total_cost REAL,
  group_size INTEGER,
  satisfaction INTEGER
);

CREATE TABLE IF NOT EXISTS route_selections (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  route_id TEXT,
  route_name TEXT,
  route_type TEXT,
  duration_minutes INTEGER,
  node_ids TEXT,
  tags TEXT,
  preferences TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS message_annotations (
  message_id TEXT PRIMARY KEY,
  label TEXT,
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

function resolveSqlitePath() {
  const configured = process.env.SQLITE_PATH;
  if (!configured || configured === ":memory:") {
    return ":memory:";
  }
  return resolve(process.cwd(), configured);
}

export function getDb() {
  if (db) {
    return db;
  }
  const path = resolveSqlitePath();
  db = new Database(path);
  if (path !== ":memory:") {
    db.pragma("journal_mode = WAL");
  }
  db.pragma("foreign_keys = ON");
  migrate(db);
  seedReferenceData(db);
  return db;
}

export function migrate(instance = getDb()) {
  instance.exec(DDL);
  return instance;
}

// Seed only the small reference rows the product needs to boot (default digital
// human, admin account, scenic-spot catalogue). Heavy behaviour analytics rows
// are imported separately (scripts/db-init.mjs or lazily in behaviorAnalytics).
export function seedReferenceData(instance = getDb()) {
  seedAdminUser(instance);
  seedDigitalHuman(instance);
  seedScenicSpots(instance);
  return instance;
}

function seedAdminUser(instance) {
  const count = instance.prepare("SELECT COUNT(*) AS n FROM admin_users").get().n;
  if (count > 0) {
    return;
  }
  instance
    .prepare(
      `INSERT INTO admin_users (id, username, password_hash, display_name, role, status, created_at)
       VALUES (@id, @username, @password_hash, @display_name, @role, @status, @created_at)`
    )
    .run({
      id: "user_admin",
      username: config.adminUsername,
      password_hash: hashPassword(config.adminPassword),
      display_name: "系统管理员",
      role: "admin",
      status: "active",
      created_at: new Date().toISOString()
    });
}

function seedDigitalHuman(instance) {
  const count = instance.prepare("SELECT COUNT(*) AS n FROM digital_human_configs").get().n;
  if (count > 0) {
    return;
  }
  instance
    .prepare(
      `INSERT INTO digital_human_configs
        (id, name, avatar_id, vcn, character_asset, appearance, outfit, theme, voice_id,
         speech_rate, welcome_text, emotion_style, service_status, enabled, updated_at)
       VALUES
        (@id, @name, @avatar_id, @vcn, @character_asset, @appearance, @outfit, @theme, @voice_id,
         @speech_rate, @welcome_text, @emotion_style, @service_status, @enabled, @updated_at)`
    )
    .run({
      id: "dh_default_lingshan",
      name: "灵灵",
      avatar_id: process.env.DEFAULT_AVATAR_ID || "cnr5dg8n2000000003",
      vcn: process.env.DEFAULT_AVATAR_VCN || "x5_lingxiaoyue_flow",
      character_asset: "",
      appearance: "xfyun-interactive-avatar",
      outfit: "guide-uniform",
      theme: "lingshan-teal-gold",
      voice_id: process.env.DEFAULT_AVATAR_VCN || "x5_lingxiaoyue_flow",
      speech_rate: 1,
      welcome_text:
        "您好，我是灵山胜境 AI 导游，可以为您讲解景点、规划路线并回答游览问题。",
      emotion_style: "warm",
      service_status: "online",
      enabled: 1,
      updated_at: new Date().toISOString()
    });
}

function seedScenicSpots(instance) {
  const count = instance.prepare("SELECT COUNT(*) AS n FROM scenic_spots").get().n;
  if (count > 0) {
    return;
  }
  const knowledge = loadKnowledge();
  const spots = knowledge?.spots || [];
  if (!spots.length) {
    return;
  }
  const insert = instance.prepare(
    `INSERT OR IGNORE INTO scenic_spots
      (id, scenic_area, name, aliases, location_text, parameters, core_function,
       culture, detail, highlights, open_info, notes, source, enabled, updated_at)
     VALUES
      (@id, @scenic_area, @name, @aliases, @location_text, @parameters, @core_function,
       @culture, @detail, @highlights, @open_info, @notes, @source, 1, @updated_at)`
  );
  const now = new Date().toISOString();
  const tx = instance.transaction((rows) => {
    for (const spot of rows) {
      insert.run({
        id: spot.id,
        scenic_area: spot.scenicArea || "灵山胜境",
        name: spot.name || "",
        aliases: JSON.stringify(spot.aliases || []),
        location_text: spot.locationText || "",
        parameters: spot.parameters || "",
        core_function: spot.coreFunction || "",
        culture: spot.culture || "",
        detail: spot.detail || "",
        highlights: spot.highlights || "",
        open_info: spot.openInfo || "",
        notes: spot.notes || "",
        source: "generated",
        updated_at: now
      });
    }
  });
  tx(spots);
}

// Test/maintenance helper: drop the memoized handle so the next getDb() reopens.
export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
