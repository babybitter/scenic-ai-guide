import { randomBytes } from "node:crypto";
import { loadKnowledge } from "./knowledgeBuild.mjs";

const overrides = new Map();
const createdSpots = [];

export function listManagedScenicSpots() {
  const knowledge = loadKnowledge();
  const base = (knowledge?.spots || []).map((spot) => ({
    ...spot,
    enabled: true,
    source: "generated",
    ...(overrides.get(spot.id) || {})
  }));
  return [...base, ...createdSpots].filter((spot) => spot.enabled !== false);
}

export function listAllManagedScenicSpots() {
  const knowledge = loadKnowledge();
  const base = (knowledge?.spots || []).map((spot) => ({
    ...spot,
    enabled: true,
    source: "generated",
    ...(overrides.get(spot.id) || {})
  }));
  return [...base, ...createdSpots];
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
  createdSpots.push(record);
  return record;
}

export function updateScenicSpot(id, input = {}) {
  const current = listAllManagedScenicSpots().find((spot) => spot.id === id);
  if (!current) {
    const error = new Error("Scenic spot not found.");
    error.statusCode = 404;
    error.code = "SCENIC_NOT_FOUND";
    throw error;
  }

  const next = normalizeSpot({ ...current, ...input, id });
  const createdIndex = createdSpots.findIndex((spot) => spot.id === id);
  if (createdIndex >= 0) {
    createdSpots[createdIndex] = next;
  } else {
    overrides.set(id, next);
  }
  return next;
}

export function disableScenicSpot(id) {
  return updateScenicSpot(id, { enabled: false });
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
