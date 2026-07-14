import { hybridSearch, keywordSearch } from "../src/services/retrieval.mjs";

const questions = [
  "灵山大佛多高",
  "九龙灌浴几点演出",
  "梵宫有什么看点",
  "祥符禅寺有什么历史",
  "推荐一条经典路线",
  "哪里适合拍照打卡",
  "灵山胜境门票多少钱",
  "推荐亲子路线"
];

for (const question of questions) {
  const keyword = keywordSearch(question, { limit: 3 });
  const hybrid = hybridSearch(question, { limit: 3 });
  console.log(`\n问题：${question}`);
  console.log(`关键词检索：${keyword.results.map((item) => `${item.title}(${item.score})`).join(" | ")}`);
  console.log(`混合检索：${hybrid.results.map((item) => `${item.title}(${item.score})`).join(" | ")}`);
}
