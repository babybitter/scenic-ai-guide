// Round-trip test for the SQLite persistence layer (in-memory database).
import assert from "node:assert/strict";
import { getDb } from "../src/db/database.mjs";
import { appendMessage, getHistory, getMessages, listAllMessages } from "../src/services/conversation.mjs";
import { createFeedback, listFeedback } from "../src/services/feedback.mjs";
import { createAdminFaq, findAdminFaqAnswer, listAdminFaqs, updateAdminFaq } from "../src/services/adminFaq.mjs";
import {
  createScenicSpot,
  disableScenicSpot,
  listManagedScenicSpots,
  updateScenicSpot
} from "../src/services/scenicAdmin.mjs";
import {
  getActiveDigitalHumanConfig,
  listDigitalHumanConfigs,
  updateDigitalHumanConfig
} from "../src/services/digitalHuman.mjs";
import { login, createVisitorSession, getVisitorSession } from "../src/services/auth.mjs";

let passed = 0;
function check(name, fn) {
  fn();
  passed += 1;
  console.log(`PASS  ${name}`);
}

check("reference data seeded", () => {
  const db = getDb();
  assert.ok(db.prepare("SELECT COUNT(*) AS n FROM scenic_spots").get().n >= 16, "spots seeded");
  assert.ok(db.prepare("SELECT COUNT(*) AS n FROM admin_users").get().n >= 1, "admin seeded");
});

check("admin login works with seeded account", () => {
  const result = login("admin", "admin123");
  assert.ok(result && result.token, "login returns token");
  assert.equal(login("admin", "wrong"), null, "bad password rejected");
});

check("visitor session persists", () => {
  const session = createVisitorSession();
  assert.ok(getVisitorSession(session.id), "session retrievable");
});

check("messages round-trip and history order", () => {
  const sid = `t_${Date.now()}`;
  appendMessage(sid, { role: "user", content: "灵山大佛多高" });
  appendMessage(sid, { role: "assistant", content: "灵山大佛高88米。", intentLabel: "事实问答" });
  const history = getHistory(sid);
  assert.equal(history.length, 2);
  assert.equal(history[0].role, "user");
  assert.equal(getMessages(sid).length, 2);
  assert.ok(listAllMessages().length >= 2);
});

check("feedback round-trip", () => {
  const sid = `t_${Date.now()}`;
  createFeedback({ sessionId: sid, rating: 5, vote: "up", comment: "很好" });
  const list = listFeedback({ sessionId: sid });
  assert.equal(list.length, 1);
  assert.equal(list[0].rating, 5);
});

check("admin FAQ CRUD + match", () => {
  const faq = createAdminFaq({ question: "开放时间", answer: "07:30-17:30", keywords: ["几点开门"], priority: 90 });
  assert.ok(listAdminFaqs().some((item) => item.id === faq.id));
  updateAdminFaq(faq.id, { answer: "08:00-17:00" });
  assert.ok(findAdminFaqAnswer("请问几点开门"), "keyword match works");
});

check("scenic spot CRUD", () => {
  const created = createScenicSpot({ name: "测试景点", aliases: ["测试"], detail: "d" });
  assert.ok(listManagedScenicSpots().some((item) => item.id === created.id));
  const updated = updateScenicSpot(created.id, { detail: "updated" });
  assert.equal(updated.detail, "updated");
  disableScenicSpot(created.id);
  assert.ok(!listManagedScenicSpots().some((item) => item.id === created.id), "disabled spot hidden");
});

check("digital human config switch", () => {
  const active = getActiveDigitalHumanConfig();
  assert.ok(active && active.avatarId, "default active config has avatarId");
  const next = updateDigitalHumanConfig({
    id: "dh_test_2",
    name: "讲解员小灵",
    avatarId: "test_avatar",
    vcn: "x5_test",
    enabled: true
  });
  assert.equal(getActiveDigitalHumanConfig().id, next.id, "new config becomes active");
  assert.ok(listDigitalHumanConfigs().length >= 2, "second config created");
});

console.log(`\n${passed}/${passed} passed`);
