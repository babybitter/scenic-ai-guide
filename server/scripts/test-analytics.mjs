import assert from "node:assert/strict";
import { getDashboardAnalytics, loadBehaviorDataset } from "../src/services/behaviorAnalytics.mjs";

const dataset = loadBehaviorDataset({ force: true });
assert.ok(dataset.rows.length > 0, "behavior dataset should contain rows");
assert.equal(dataset.source, "excel", "official Excel behavior dataset should be parsed before seed fallback");
assert.ok(dataset.rows.every((row) => /灵山/.test(row.attractionName)), "behavior rows should be filtered to Lingshan related attractions");

const dashboard = getDashboardAnalytics();
assert.ok(dashboard.metrics.behaviorRows > 0, "dashboard should expose behavior row count");
assert.ok(dashboard.metrics.weekServiceCount > 0, "dashboard should expose service count");
assert.ok(Object.keys(dashboard.consumption).length >= 5, "consumption structure should include categories");
assert.ok(Array.isArray(dashboard.spotFocus), "spot focus should be a ranking");
assert.ok(Array.isArray(dashboard.persona.ageBands), "persona age bands should be present");
assert.ok(Array.isArray(dashboard.stayRelation), "stay relation should be present");
assert.ok(dashboard.suggestions.length > 0, "dashboard should generate operation suggestions");

const filtered = getDashboardAnalytics({ gender: "female", satisfactionMin: "4" });
assert.ok(filtered.metrics.behaviorRows <= dashboard.metrics.behaviorRows, "filters should not increase row count");

console.log("Analytics tests passed.");
