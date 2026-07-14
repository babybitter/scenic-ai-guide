// A7-06 / A7-07: SQLite-backed scenic-spot catalogue with create / edit /
// disable and alias management. The catalogue is seeded from the generated
// knowledge base and can then be maintained independently by admins.

import { randomBytes } from "node:crypto";
import { getDb } from "../db/database.mjs";

function toSpot(row) {
  return {
    id: row.id,
    scenicArea: row.scenic_area || "灵山胜境",
    name: row.name || "",
    aliases: parseJson(row.aliases, []),
    locationText: row.location_text || "",
    parameters: row.parameters || "",
    coreFunction: row.core_function || "",
    culture: row.culture || "",
    detail: row.detail || "",
    highlights: row.highlights || "",
    openInfo: row.open_info || "",
    notes: row.notes || "",
    source: row.source || "admin",
    enabled: Boolean(row.enabled),
    updatedAt: row.updated_at
  };
}

function parseJson(value, fallback) {
  try {
    const parsed = JSON.parse(value || "null");
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function listManagedScenicSpots() {
  return getDb()
    .prepare("SELECT * FROM scenic_spots WHERE enabled = 1 ORDER BY id ASC")
    .all()
    .map(toSpot);
}

export function listAllManagedScenicSpots() {
  return getDb().prepare("SELECT * FROM scenic_spots ORDER BY id ASC").all().map(toSpot);
}

export function createScenicSpot(input = {}) {
  const name = String(input.name || "").trim();
  if (!name) {
    const error = new Error("Scenic spot name is required.");
    error.statusCode = 400;
    error.code = "SCENIC_NAME_REQUIRED";
    throw error;
  }

  const record = normalizeSpot({
    id: input.id || `LS-CUSTOM-${randomBytes(3).toString("hex").toUpperCase()}`,
    scenicArea: input.scenicArea || "灵山胜境",
    source: "admin",
    enabled: true,
    ...input,
    name
  });
  writeSpot(record);
  return record;
}

export function updateScenicSpot(id, input = {}) {
  const current = getDb().prepare("SELECT * FROM scenic_spots WHERE id = ?").get(id);
  if (!current) {
    const error = new Error("Scenic spot not found.");
    error.statusCode = 404;
    error.code = "SCENIC_NOT_FOUND";
    throw error;
  }

  const next = normalizeSpot({ ...toSpot(current), ...input, id });
  writeSpot(next);
  return next;
}

export function disableScenicSpot(id) {
  return updateScenicSpot(id, { enabled: false });
}

function writeSpot(spot) {
  getDb()
    .prepare(
      `INSERT INTO scenic_spots
         (id, scenic_area, name, aliases, location_text, parameters, core_function,
          culture, detail, highlights, open_info, notes, source, enabled, updated_at)
       VALUES
         (@id, @scenic_area, @name, @aliases, @location_text, @parameters, @core_function,
          @culture, @detail, @highlights, @open_info, @notes, @source, @enabled, @updated_at)
       ON CONFLICT(id) DO UPDATE SET
         scenic_area = @scenic_area, name = @name, aliases = @aliases,
         location_text = @location_text, parameters = @parameters, core_function = @core_function,
         culture = @culture, detail = @detail, highlights = @highlights, open_info = @open_info,
         notes = @notes, source = @source, enabled = @enabled, updated_at = @updated_at`
    )
    .run({
      id: spot.id,
      scenic_area: spot.scenicArea,
      name: spot.name,
      aliases: JSON.stringify(spot.aliases || []),
      location_text: spot.locationText,
      parameters: spot.parameters,
      core_function: spot.coreFunction,
      culture: spot.culture,
      detail: spot.detail,
      highlights: spot.highlights,
      open_info: spot.openInfo,
      notes: spot.notes,
      source: spot.source,
      enabled: spot.enabled ? 1 : 0,
      updated_at: spot.updatedAt
    });
}

function normalizeSpot(input) {
  return {
    id: String(input.id || "").trim(),
    scenicArea: String(input.scenicArea || "灵山胜境").trim(),
    name: String(input.name || "").trim(),
    aliases: Array.isArray(input.aliases) ? input.aliases.map((item) => String(item).trim()).filter(Boolean) : [],
    locationText: String(input.locationText || "").trim(),
    parameters: String(input.parameters || "").trim(),
    coreFunction: String(input.coreFunction || "").trim(),
    culture: String(input.culture || "").trim(),
    detail: String(input.detail || "").trim(),
    highlights: String(input.highlights || "").trim(),
    openInfo: String(input.openInfo || "").trim(),
    notes: String(input.notes || "").trim(),
    source: input.source || "admin",
    enabled: input.enabled !== false,
    updatedAt: new Date().toISOString()
  };
}
