import assert from "node:assert/strict";
import { answerQuestion } from "../src/services/chat.mjs";

const questions = [
  "灵山大佛有多高？",
  "九龙灌浴有什么看点？",
  "梵宫适合看什么？",
  "推荐一条经典路线",
  "灵山胜境开放时间是什么？"
];

const started = Date.now();
const results = await Promise.all(
  Array.from({ length: 12 }, (_, index) => answerQuestion({
    question: questions[index % questions.length],
    sessionId: `concurrency_${index}`
  }))
);

assert.equal(results.length, 12);
assert.ok(results.every((item) => item.answer && item.latency.totalMs >= 0));
assert.ok(Date.now() - started < 8000, "concurrent mock QA should complete within 8 seconds");

console.log("Concurrency tests passed.");
