import { readFileSync } from "node:fs";
import { join } from "node:path";
import { hybridSearch } from "../src/services/retrieval.mjs";

const testFile = process.argv[2] || join("data", "tests", "retrieval-cases.json");
const cases = JSON.parse(readFileSync(testFile, "utf8"));
const failures = [];
const summary = {
  total: cases.length,
  top1TitleHits: 0,
  top3TitleHits: 0,
  top3SpotHits: 0,
  top3TermHits: 0
};

for (const item of cases) {
  const result = hybridSearch(item.question, { limit: 5 });
  const topResults = result.results.slice(0, 3);
  const top1 = topResults[0];
  const topTitles = topResults.map((entry) => entry.title);
  const topSpotIds = topResults.map((entry) => entry.scenicSpotId).filter(Boolean);
  const topContent = topResults.map((entry) => `${entry.title}\n${entry.content}`).join("\n");

  const titleTop1Hit = matchesAny(top1?.title, item.expectedTopTitles);
  const titleTop3Hit = topTitles.some((title) => matchesAny(title, item.expectedTopTitles));
  const spotHit = item.expectedSpotIds.length === 0
    || topSpotIds.some((spotId) => item.expectedSpotIds.includes(spotId));
  const termHit = item.expectedTerms.length === 0
    || item.expectedTerms.some((term) => topContent.includes(term));

  if (titleTop1Hit) {
    summary.top1TitleHits += 1;
  }
  if (titleTop3Hit) {
    summary.top3TitleHits += 1;
  }
  if (spotHit) {
    summary.top3SpotHits += 1;
  }
  if (termHit) {
    summary.top3TermHits += 1;
  }

  if (!titleTop3Hit || !spotHit || !termHit) {
    failures.push({
      id: item.id,
      question: item.question,
      expectedTopTitles: item.expectedTopTitles,
      expectedSpotIds: item.expectedSpotIds,
      expectedTerms: item.expectedTerms,
      actualTop3: topResults.map((entry) => ({
        title: entry.title,
        score: entry.score,
        scenicSpotId: entry.scenicSpotId,
        reasons: entry.reasons
      })),
      checks: {
        titleTop1Hit,
        titleTop3Hit,
        spotHit,
        termHit
      }
    });
  }
}

const metrics = {
  ...summary,
  top1TitleAccuracy: toRate(summary.top1TitleHits, summary.total),
  top3TitleAccuracy: toRate(summary.top3TitleHits, summary.total),
  top3SpotAccuracy: toRate(summary.top3SpotHits, summary.total),
  top3TermRecall: toRate(summary.top3TermHits, summary.total),
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

function matchesAny(value, expectedValues) {
  if (!value) {
    return false;
  }
  return expectedValues.some((expected) => value === expected || value.includes(expected) || expected.includes(value));
}

function toRate(value, total) {
  if (total === 0) {
    return 0;
  }
  return Number((value / total).toFixed(4));
}
