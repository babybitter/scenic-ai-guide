// AI2-10: scenic-spot narration (about a 1-minute spoken script).
// AI2-11: real-time accompanying narration ("now that you have arrived here").

import { loadKnowledge } from "./knowledgeBuild.mjs";
import { hybridSearch } from "./retrieval.mjs";
import { llmComplete } from "./llm.mjs";
import { buildNarrationSystemPrompt, buildAccompanySystemPrompt, buildContextBlock } from "./prompts.mjs";

function findSpot({ spotId, spotName }) {
  const knowledge = loadKnowledge();
  const spots = knowledge?.spots || [];
  if (spotId) {
    return spots.find((spot) => spot.id === spotId) || null;
  }
  if (spotName) {
    return (
      spots.find((spot) => spot.name === spotName) ||
      spots.find((spot) => (spot.aliases || []).some((alias) => spotName.includes(alias) || alias.includes(spotName))) ||
      null
    );
  }
  return null;
}

function spotContextResults(spot, fallbackQuery) {
  try {
    const query = spot ? spot.name : fallbackQuery;
    return hybridSearch(query, { limit: 4 }).results;
  } catch {
    return [];
  }
}

/**
 * AI2-10: generate a ~1-minute spoken narration for a scenic spot.
 */
export async function generateSpotNarration({ spotId, spotName, signal } = {}) {
  const spot = findSpot({ spotId, spotName });
  if (!spot && !spotName) {
    const error = new Error("spotId or spotName is required.");
    error.statusCode = 400;
    error.code = "SPOT_REQUIRED";
    throw error;
  }

  const results = spotContextResults(spot, spotName);
  const context = buildContextBlock(results);
  const targetName = spot?.name || spotName;

  const messages = [
    { role: "system", content: buildNarrationSystemPrompt() },
    {
      role: "user",
      content: `${context}\n\n请为景点“${targetName}”生成约 1 分钟(200-400 字)的口播讲解词。`
    }
  ];

  const meta = {
    scenario: "narration",
    mode: "explain",
    question: `讲解 ${targetName}`,
    spot: spot || { name: targetName },
    results
  };

  const completion = await llmComplete({ messages, meta, maxTokens: 700, signal });

  return {
    spotId: spot?.id || null,
    spotName: targetName,
    narration: completion.text,
    citations: results.slice(0, 3).map((item) => item.citation),
    provider: completion.provider,
    model: completion.model
  };
}

/**
 * AI2-11: accompanying narration triggered on arrival at a spot, tailored to
 * the visitor's stated interests.
 */
export async function generateAccompanyNarration({ spotId, spotName, interests = [], signal } = {}) {
  const spot = findSpot({ spotId, spotName });
  const targetName = spot?.name || spotName;
  if (!targetName) {
    const error = new Error("spotId or spotName is required.");
    error.statusCode = 400;
    error.code = "SPOT_REQUIRED";
    throw error;
  }

  const results = spotContextResults(spot, targetName);
  const context = buildContextBlock(results);
  const interestText = interests.length ? `游客兴趣:${interests.join("、")}。` : "";

  const messages = [
    { role: "system", content: buildAccompanySystemPrompt() },
    {
      role: "user",
      content: `${context}\n\n游客刚到达“${targetName}”。${interestText}请生成到达此处后的实时伴随讲解(150-300 字)。`
    }
  ];

  const meta = {
    scenario: "accompany",
    mode: "explain",
    question: `到达 ${targetName}`,
    spot: spot || { name: targetName },
    interests,
    results
  };

  const completion = await llmComplete({ messages, meta, maxTokens: 500, signal });

  return {
    spotId: spot?.id || null,
    spotName: targetName,
    interests,
    narration: completion.text,
    citations: results.slice(0, 2).map((item) => item.citation),
    provider: completion.provider,
    model: completion.model
  };
}
