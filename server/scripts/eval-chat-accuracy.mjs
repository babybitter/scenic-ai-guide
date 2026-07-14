import { readFileSync } from "node:fs";
import { join } from "node:path";
import { answerQuestion } from "../src/services/chat.mjs";
import { clearFaqCache } from "../src/services/faqCache.mjs";

const testFile = process.argv[2] || join("data", "tests", "chat-accuracy-cases.json");
const cases = JSON.parse(readFileSync(testFile, "utf8"));

const failures = [];
const summary = {
  total: cases.length,
  passed: 0,
  scenarioHits: 0,
  labelHits: 0,
  citationHits: 0,
  answerTermHits: 0,
  spotHits: 0,
  answerableTotal: 0,
  answerablePassed: 0,
  refusalTotal: 0,
  refusalPassed: 0
};

clearFaqCache();

for (const item of cases) {
  const result = await answerQuestion({
    question: item.question,
    mode: item.mode || "qa",
    sessionId: `eval_${item.id}`
  });

  const checks = {
    scenario: !item.expectedScenario || result.scenario === item.expectedScenario,
    label: !item.expectedLabel || result.label === item.expectedLabel,
    citation: !item.citationRequired || (Array.isArray(result.citations) && result.citations.length > 0),
    answerTerms: termsSatisfied(result.answer, item.expectedAnswerTerms || []),
    spot: spotSatisfied(result.retrieval?.spotMatches || [], item.expectedSpotIds || [])
  };

  if (checks.scenario) summary.scenarioHits += 1;
  if (checks.label) summary.labelHits += 1;
  if (checks.citation) summary.citationHits += 1;
  if (checks.answerTerms) summary.answerTermHits += 1;
  if (checks.spot) summary.spotHits += 1;

  const passed = Object.values(checks).every(Boolean);
  if (passed) {
    summary.passed += 1;
  }

  if (item.shouldAnswer === false) {
    summary.refusalTotal += 1;
    if (passed) summary.refusalPassed += 1;
  } else {
    summary.answerableTotal += 1;
    if (passed) summary.answerablePassed += 1;
  }

  if (!passed) {
    failures.push({
      id: item.id,
      category: item.category,
      question: item.question,
      expected: {
        scenario: item.expectedScenario,
        label: item.expectedLabel,
        spotIds: item.expectedSpotIds,
        answerTerms: item.expectedAnswerTerms,
        citationRequired: item.citationRequired
      },
      actual: {
        scenario: result.scenario,
        label: result.label,
        answer: result.answer,
        citations: (result.citations || []).length,
        retrieval: result.retrieval
      },
      checks
    });
  }
}

const metrics = {
  ...summary,
  accuracy: rate(summary.passed, summary.total),
  answerableAccuracy: rate(summary.answerablePassed, summary.answerableTotal),
  refusalAccuracy: rate(summary.refusalPassed, summary.refusalTotal),
  scenarioAccuracy: rate(summary.scenarioHits, summary.total),
  labelAccuracy: rate(summary.labelHits, summary.total),
  citationAccuracy: rate(summary.citationHits, summary.total),
  answerTermAccuracy: rate(summary.answerTermHits, summary.total),
  spotAccuracy: rate(summary.spotHits, summary.total),
  failureCount: failures.length
};

console.log(JSON.stringify(metrics, null, 2));

if (failures.length > 0) {
  console.log("\nFailures:");
  for (const failure of failures) {
    console.log(JSON.stringify(failure, null, 2));
  }
  process.exitCode = 1;
}

function termsSatisfied(answer, groups) {
  if (!groups.length) {
    return true;
  }
  const text = String(answer || "");
  return groups.every((group) => {
    const terms = Array.isArray(group) ? group : [group];
    return terms.some((term) => text.includes(String(term)));
  });
}

function spotSatisfied(actualSpotNames, expectedSpotIds) {
  if (!expectedSpotIds.length) {
    return true;
  }
  const idToName = {
    "LS-001": "灵山大照壁",
    "LS-002": "五明桥",
    "LS-003": "佛足坛",
    "LS-004": "五智门",
    "LS-005": "菩提大道",
    "LS-006": "九龙灌浴",
    "LS-007": "降魔浮雕",
    "LS-008": "阿育王柱",
    "LS-009": "百子戏弥勒",
    "LS-010": "祥符禅寺",
    "LS-011": "灵山大佛",
    "LS-012": "佛教文化博览馆",
    "LS-013": "灵山梵宫",
    "LS-014": "五印坛城",
    "LS-015": "曼飞龙塔",
    "LS-016": "无尽意斋",
    "NH-001": "拈花广场",
    "NH-002": "梵天花海",
    "NH-003": "香月花街",
    "NH-004": "拈花堂",
    "NH-005": "五灯湖",
    "NH-006": "鹿鸣谷"
  };
  const expectedNames = expectedSpotIds.map((id) => idToName[id] || id);
  return expectedNames.some((name) => actualSpotNames.includes(name));
}

function rate(value, total) {
  if (!total) {
    return 0;
  }
  return Number((value / total).toFixed(4));
}
