import assert from "node:assert";
import {
  getActiveDigitalHumanConfig,
  listDigitalHumanConfigs,
  mapAnswerToDigitalHumanState,
  preloadDigitalHumanAssets,
  updateDigitalHumanConfig
} from "../src/services/digitalHuman.mjs";

const active = getActiveDigitalHumanConfig();
assert.equal(active.enabled, true);
assert.ok(active.avatarId, "active config exposes an iFlytek avatarId");
assert.ok(active.assetAvailable, "avatar is streamable when avatarId is set");

const routeState = mapAnswerToDigitalHumanState({ label: "路线推荐", emotion: "微笑" });
assert.equal(routeState.expression, "smile");
assert.equal(routeState.action, "point");

const refusalState = mapAnswerToDigitalHumanState({ scenario: "no_data" });
assert.equal(refusalState.expression, "apology");

const updated = updateDigitalHumanConfig({ name: "灵山导游", outfit: "festival-guide", voiceId: "guide_soft" });
assert.equal(updated.name, "灵山导游");
assert.equal(updated.voiceId, "guide_soft");

const added = updateDigitalHumanConfig({
  id: "dh_test_text_only",
  name: "测试数字人",
  characterAsset: "/missing/model.json",
  voiceId: "guide_test",
  welcomeText: "欢迎来到灵山胜境。",
  serviceStatus: "text_only",
  enabled: true
});
assert.equal(added.enabled, true);
assert.equal(added.serviceStatus, "text_only");
assert.equal(added.assetAvailable, false);
assert.equal(getActiveDigitalHumanConfig().id, "dh_test_text_only");
assert.ok(listDigitalHumanConfigs().some((item) => item.id === "dh_test_text_only"));

const preload = preloadDigitalHumanAssets();
assert.equal(preload.ok, true);

console.log("Digital human tests passed.");
