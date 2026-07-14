import assert from "node:assert";
import { getRouteGraph, recommendRoute, saveRouteSelection, listSavedRoutes } from "../src/services/routePlanner.mjs";

const graph = getRouteGraph();
assert.ok(graph.nodes.length >= 16, "route graph should contain scenic nodes");
assert.ok(graph.templates.length >= 6, "route templates should cover main scenarios");

const quick = recommendRoute({ durationMinutes: 25, interests: ["核心打卡"] });
assert.equal(quick.recommendation.id, "quick_30");
assert.ok(quick.recommendation.explanation.includes("核心打卡"));

const family = recommendRoute({ durationMinutes: 240, interests: ["亲子", "轻松"], withChildren: true });
assert.equal(family.recommendation.id, "family_light");
assert.ok(family.recommendation.nodes.some((node) => node.id === "baizi"));

const photo = recommendRoute({ durationMinutes: 180, interests: ["拍照打卡"], photoFocus: true });
assert.equal(photo.recommendation.id, "photo_checkin");
assert.ok(photo.recommendation.nodes.some((node) => node.tags.includes("photo")));

const culture = recommendRoute({ durationMinutes: 360, interests: ["历史文化", "佛教"] });
assert.ok(["culture_half_day", "buddhist_culture"].includes(culture.recommendation.id));

const saved = saveRouteSelection({
  sessionId: "route_test_session",
  route: family.recommendation,
  preferences: family.preferences
});
assert.equal(saved.sessionId, "route_test_session");
assert.equal(listSavedRoutes("route_test_session").length, 1);

console.log("Route planner tests passed.");
