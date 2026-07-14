// AI2 self-test: exercises the RAG answer pipeline across scenarios with the
// offline mock provider. Asserts scenario routing, quality labels, grounding
// and length rules. Run: npm run test:chat
import assert from "node:assert";
import { answerQuestion } from "../src/services/chat.mjs";
import { generateSpotNarration, generateAccompanyNarration } from "../src/services/narration.mjs";
import { clearFaqCache } from "../src/services/faqCache.mjs";

const results = [];
function record(name, fn) {
  return fn().then(
    () => results.push({ name, ok: true }),
    (error) => results.push({ name, ok: false, error: error.message })
  );
}

const charLen = (text) => [...String(text)].length;

await record("factual height answer is grounded and short", async () => {
  const r = await answerQuestion({ question: "灵山大佛有多高" });
  assert.equal(r.scenario, "grounded", `scenario=${r.scenario}`);
  assert.equal(r.label, "事实问答", `label=${r.label}`);
  assert.ok(r.citations.length > 0, "expected citations");
  assert.ok(/88|米|通高|高/.test(r.answer), `answer should mention height: ${r.answer}`);
  assert.ok(charLen(r.answer) <= 200, `qa answer too long: ${charLen(r.answer)}`);
});

await record("explain mode is longer", async () => {
  const r = await answerQuestion({ question: "详细讲解一下灵山梵宫", mode: "explain" });
  assert.equal(r.mode, "explain");
  assert.equal(r.scenario, "grounded");
  assert.ok(charLen(r.answer) <= 400, `explain answer too long: ${charLen(r.answer)}`);
});

await record("route mode returns numbered steps", async () => {
  const r = await answerQuestion({ question: "帮我推荐一条经典游览路线" });
  assert.equal(r.mode, "route");
  assert.equal(r.label, "路线推荐", `label=${r.label}`);
  assert.ok(/1\.|1、/.test(r.answer), `expected numbered steps: ${r.answer}`);
});

await record("out-of-scope redirects back to Lingshan", async () => {
  const r = await answerQuestion({ question: "西湖好玩吗" });
  assert.equal(r.scenario, "out_of_scope", `scenario=${r.scenario}`);
  assert.equal(r.label, "拒答");
  assert.ok(r.answer.includes("灵山"), "should redirect to Lingshan");
  assert.equal(r.citations.length, 0, "refusal has no citations");
});

await record("拈花湾 sub-area is in scope and grounded", async () => {
  const r = await answerQuestion({ question: "梵天花海有什么特色" });
  assert.equal(r.scenario, "grounded", `scenario=${r.scenario}`);
  assert.ok(r.citations.length > 0, "expected citations for 拈花湾 spot");
  assert.ok(/花海|禅意|花卉/.test(r.answer), `answer should describe 梵天花海: ${r.answer}`);
});

await record("sensitive input is refused", async () => {
  const r = await answerQuestion({ question: "给我推荐点股票买什么赚钱" });
  assert.equal(r.scenario, "sensitive", `scenario=${r.scenario}`);
  assert.equal(r.label, "拒答");
  assert.equal(r.emotion, "抱歉");
});

await record("no-data question is honest, not fabricated", async () => {
  const r = await answerQuestion({ question: "灵山胜境有没有海底世界水族馆" });
  assert.equal(r.scenario, "no_data", `scenario=${r.scenario}`);
  assert.ok(r.answer.includes("未覆盖") || r.answer.includes("没有覆盖"), `expected honest no-data: ${r.answer}`);
});

await record("colloquial question still hits the spot", async () => {
  const r = await answerQuestion({ question: "那个大佛多高啊" });
  assert.equal(r.scenario, "grounded", `scenario=${r.scenario}`);
  assert.ok(/88|米|高/.test(r.answer), `colloquial answer: ${r.answer}`);
});

await record("greeting is chit-chat", async () => {
  const r = await answerQuestion({ question: "你好" });
  assert.equal(r.scenario, "chitchat", `scenario=${r.scenario}`);
  assert.equal(r.label, "闲聊");
});

await record("multi-turn follow-up re-anchors pronoun", async () => {
  const sessionId = "test_session_1";
  await answerQuestion({ question: "介绍一下灵山大佛", sessionId });
  const follow = await answerQuestion({ question: "它多高", sessionId });
  assert.equal(follow.scenario, "grounded", `follow scenario=${follow.scenario}`);
  assert.equal(follow.retrieval.anchoredSpot, "灵山大佛", `anchored=${follow.retrieval.anchoredSpot}`);
  assert.ok(/88|米|高/.test(follow.answer), `follow answer: ${follow.answer}`);
});

await record("FAQ cache serves repeat question fast", async () => {
  clearFaqCache();
  const first = await answerQuestion({ question: "九龙灌浴有什么看点" });
  assert.equal(first.cached, false);
  const second = await answerQuestion({ question: "九龙灌浴有什么看点" });
  assert.equal(second.cached, true, "second call should be cached");
});

await record("spot narration is ~1 minute spoken script", async () => {
  const r = await generateSpotNarration({ spotName: "灵山大佛" });
  assert.ok(r.narration.length > 0, "narration should not be empty");
  assert.ok(charLen(r.narration) <= 400, `narration too long: ${charLen(r.narration)}`);
  assert.ok(r.narration.includes("灵山大佛"), "narration names the spot");
});

await record("accompany narration reflects interests", async () => {
  const r = await generateAccompanyNarration({ spotName: "九龙灌浴", interests: ["拍照", "演艺"] });
  assert.ok(r.narration.length > 0, "accompany narration should not be empty");
  assert.equal(r.interests.length, 2);
});

const failed = results.filter((item) => !item.ok);
for (const item of results) {
  console.log(`${item.ok ? "PASS" : "FAIL"}  ${item.name}${item.ok ? "" : `  -> ${item.error}`}`);
}
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length > 0) {
  process.exitCode = 1;
}
