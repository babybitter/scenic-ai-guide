import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "./config.mjs";
import { logError, logInfo } from "./logger.mjs";
import { fail, ok, created } from "./http/response.mjs";
import { getBearerToken, readJson } from "./http/request.mjs";
import { createVisitorSession, login, verifyToken } from "./services/auth.mjs";
import { createUpload, listUploads } from "./services/uploads.mjs";
import { buildKnowledge, loadKnowledge } from "./services/knowledgeBuild.mjs";
import { hybridSearch, keywordSearch } from "./services/retrieval.mjs";
import { answerQuestion, answerQuestionStream } from "./services/chat.mjs";
import { generateSpotNarration, generateAccompanyNarration } from "./services/narration.mjs";
import { getRouteGraph, recommendRoute, saveRouteSelection, listSavedRoutes, narrateRouteNode } from "./services/routePlanner.mjs";
import { transcribeAudio, synthesizeSpeech, voiceAsk, getAudioClip } from "./services/voice.mjs";
import {
  getActiveDigitalHumanConfig,
  listDigitalHumanConfigs,
  preloadDigitalHumanAssets,
  updateDigitalHumanConfig
} from "./services/digitalHuman.mjs";
import { faqCacheStats } from "./services/faqCache.mjs";
import { getMessages } from "./services/conversation.mjs";
import { createFeedback, listFeedback } from "./services/feedback.mjs";
import { createAdminFaq, findAdminFaqAnswer, listAdminFaqs, updateAdminFaq } from "./services/adminFaq.mjs";
import { createScenicSpot, disableScenicSpot, listAllManagedScenicSpots, listManagedScenicSpots, updateScenicSpot } from "./services/scenicAdmin.mjs";
import { getDashboardAnalytics, loadBehaviorDataset } from "./services/behaviorAnalytics.mjs";
import {
  annotateMessage,
  buildServiceQualityReport,
  createKnowledgeDraftFromMessage,
  getConversationDetail,
  listConversationSummaries,
  listFeedbackClusters
} from "./services/serviceQuality.mjs";
import { schema } from "./db/schema.mjs";
import { getDb } from "./db/database.mjs";

// The API server persists to a SQLite file. Test / eval scripts import the
// services directly (not this module) and leave SQLITE_PATH unset, so they run
// against a fresh in-memory database. Bootstrapping here migrates and seeds.
if (!process.env.SQLITE_PATH) {
  process.env.SQLITE_PATH = resolve(config.dataDir, "scenic.sqlite");
}
getDb();

const rootDir = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const publicDir = join(rootDir, "web", "dist");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

const server = createServer(async (req, res) => {
  const start = Date.now();
  const url = new URL(req.url || "/", `http://${req.headers.host}`);

  try {
    await route(req, res, url);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const code = error.code || "INTERNAL_ERROR";
    logError("request failed", {
      method: req.method,
      path: url.pathname,
      statusCode,
      code,
      error: error.message
    });
    fail(res, statusCode, code, error.message);
  } finally {
    logInfo("request completed", {
      method: req.method,
      path: url.pathname,
      statusCode: res.statusCode,
      durationMs: Date.now() - start
    });
  }
});

async function route(req, res, url) {
  if (url.pathname === "/api/health" && req.method === "GET") {
    ok(res, {
      appName: config.appName,
      environment: config.nodeEnv,
      providers: config.providers,
      time: new Date().toISOString()
    });
    return;
  }

  if (url.pathname === "/api/schema" && req.method === "GET") {
    ok(res, schema);
    return;
  }

  if (url.pathname === "/api/knowledge/summary" && req.method === "GET") {
    const knowledge = loadKnowledge();
    if (!knowledge) {
      ok(res, {
        status: "not_built",
        documents: 0,
        spots: 0,
        guideSections: 0,
        chunks: 0
      });
      return;
    }

    ok(res, {
      status: "ready",
      generatedAt: knowledge.generatedAt,
      scope: knowledge.scope,
      documents: knowledge.documents.length,
      spots: knowledge.spots.length,
      guideSections: knowledge.guideSections.length,
      chunks: knowledge.chunks.length
    });
    return;
  }

  if (url.pathname === "/api/knowledge/rebuild" && req.method === "POST") {
    const knowledge = buildKnowledge();
    created(res, {
      generatedAt: knowledge.generatedAt,
      documents: knowledge.documents.length,
      spots: knowledge.spots.length,
      guideSections: knowledge.guideSections.length,
      chunks: knowledge.chunks.length
    });
    return;
  }

  if (url.pathname === "/api/scenic-spots" && req.method === "GET") {
    ok(res, listManagedScenicSpots());
    return;
  }

  if (url.pathname === "/api/admin/scenic-spots" && req.method === "GET") {
    if (!requireAdmin(req, res)) return;
    ok(res, listAllManagedScenicSpots());
    return;
  }

  if (url.pathname === "/api/admin/scenic-spots" && req.method === "POST") {
    if (!requireAdmin(req, res)) return;
    const body = await readJson(req);
    created(res, createScenicSpot(body));
    return;
  }

  const scenicAdminMatch = url.pathname.match(/^\/api\/admin\/scenic-spots\/([^/]+)$/);
  if (scenicAdminMatch && req.method === "PUT") {
    if (!requireAdmin(req, res)) return;
    const body = await readJson(req);
    ok(res, updateScenicSpot(decodeURIComponent(scenicAdminMatch[1]), body));
    return;
  }

  if (scenicAdminMatch && req.method === "DELETE") {
    if (!requireAdmin(req, res)) return;
    ok(res, disableScenicSpot(decodeURIComponent(scenicAdminMatch[1])));
    return;
  }

  if (url.pathname === "/api/knowledge/chunks" && req.method === "GET") {
    const knowledge = loadKnowledge();
    const chunks = knowledge?.chunks || [];
    const limit = Math.min(Number(url.searchParams.get("limit") || 50), 200);
    ok(res, chunks.slice(0, limit), {
      total: chunks.length,
      limit
    });
    return;
  }

  if (url.pathname === "/api/knowledge/search" && req.method === "POST") {
    const body = await readJson(req);
    const mode = body.mode === "keyword" ? "keyword" : "hybrid";
    const result = mode === "keyword"
      ? keywordSearch(body.query, { limit: body.limit })
      : hybridSearch(body.query, { limit: body.limit });
    ok(res, result);
    return;
  }

  if (url.pathname === "/api/chat/ask" && req.method === "POST") {
    const body = await readJson(req);
    const fixedFaq = findAdminFaqAnswer(body.question);
    if (fixedFaq) {
      ok(res, {
        answer: fixedFaq.answer,
        label: "事实问答",
        emotion: "平静",
        scenario: "grounded",
        cached: true,
        sources: [{ documentName: "后台固定问答", sectionTitle: fixedFaq.question }],
        retrieval: { results: [], intents: [], spotMatches: [] },
        digitalHuman: { expression: "calm", action: "nod", state: "speaking" },
        latency: { totalMs: 0, retrievalMs: 0, llmMs: 0, cached: true }
      });
      return;
    }
    const result = await answerQuestion({
      question: body.question,
      sessionId: body.sessionId,
      mode: body.mode,
      history: body.history
    });
    ok(res, result);
    return;
  }

  if (url.pathname === "/api/chat/stream" && req.method === "POST") {
    const body = await readJson(req);
    await streamChat(res, body);
    return;
  }

  if (url.pathname === "/api/chat/narrate" && req.method === "POST") {
    const body = await readJson(req);
    const result = await generateSpotNarration({
      spotId: body.spotId,
      spotName: body.spotName
    });
    ok(res, result);
    return;
  }

  if (url.pathname === "/api/chat/accompany" && req.method === "POST") {
    const body = await readJson(req);
    const result = await generateAccompanyNarration({
      spotId: body.spotId,
      spotName: body.spotName,
      interests: Array.isArray(body.interests) ? body.interests : []
    });
    ok(res, result);
    return;
  }

  if (url.pathname === "/api/voice/asr" && req.method === "POST") {
    const body = await readJson(req);
    ok(res, await transcribeAudio({
      audioBase64: body.audioBase64,
      mimeType: body.mimeType,
      transcript: body.transcript
    }));
    return;
  }

  if (url.pathname === "/api/voice/tts" && req.method === "POST") {
    const body = await readJson(req);
    ok(res, await synthesizeSpeech({
      text: body.text,
      voice: body.voice,
      speed: body.speed
    }));
    return;
  }

  if (url.pathname === "/api/voice/ask" && req.method === "POST") {
    const body = await readJson(req);
    ok(res, await voiceAsk({
      audioBase64: body.audioBase64,
      mimeType: body.mimeType,
      transcript: body.transcript,
      question: body.question,
      sessionId: body.sessionId,
      mode: body.mode
    }));
    return;
  }

  if (url.pathname === "/api/digital-human/config" && req.method === "GET") {
    ok(res, getActiveDigitalHumanConfig());
    return;
  }

  if (url.pathname === "/api/digital-human/configs" && req.method === "GET") {
    ok(res, listDigitalHumanConfigs());
    return;
  }

  if (url.pathname === "/api/digital-human/config" && req.method === "POST") {
    const token = getBearerToken(req);
    if (!verifyToken(token)) {
      fail(res, 401, "UNAUTHORIZED", "Login is required.");
      return;
    }
    const body = await readJson(req);
    ok(res, updateDigitalHumanConfig(body));
    return;
  }

  if (url.pathname === "/api/digital-human/preload" && req.method === "POST") {
    ok(res, preloadDigitalHumanAssets());
    return;
  }

  if (url.pathname.startsWith("/api/voice/tts/audio/") && req.method === "GET") {
    const id = decodeURIComponent(url.pathname.slice("/api/voice/tts/audio/".length));
    const clip = getAudioClip(id);
    if (!clip) {
      fail(res, 404, "AUDIO_NOT_FOUND", "Audio clip not found or expired.");
      return;
    }
    res.writeHead(200, {
      "content-type": clip.mimeType,
      "content-length": clip.buffer.length,
      "cache-control": "no-store"
    });
    res.end(clip.buffer);
    return;
  }

  if (url.pathname === "/api/chat/faq-cache" && req.method === "GET") {
    const token = getBearerToken(req);
    if (!verifyToken(token)) {
      fail(res, 401, "UNAUTHORIZED", "Login is required.");
      return;
    }
    ok(res, faqCacheStats());
    return;
  }

  if (url.pathname === "/api/admin/faqs" && req.method === "GET") {
    if (!requireAdmin(req, res)) return;
    ok(res, listAdminFaqs());
    return;
  }

  if (url.pathname === "/api/admin/faqs" && req.method === "POST") {
    if (!requireAdmin(req, res)) return;
    const body = await readJson(req);
    created(res, createAdminFaq(body));
    return;
  }

  const faqAdminMatch = url.pathname.match(/^\/api\/admin\/faqs\/([^/]+)$/);
  if (faqAdminMatch && req.method === "PUT") {
    if (!requireAdmin(req, res)) return;
    const body = await readJson(req);
    ok(res, updateAdminFaq(decodeURIComponent(faqAdminMatch[1]), body));
    return;
  }

  if (url.pathname === "/api/routes/graph" && req.method === "GET") {
    ok(res, getRouteGraph());
    return;
  }

  if (url.pathname === "/api/routes/recommend" && req.method === "POST") {
    const body = await readJson(req);
    ok(res, recommendRoute(body));
    return;
  }

  if (url.pathname === "/api/routes/save" && req.method === "POST") {
    const body = await readJson(req);
    created(res, saveRouteSelection({
      sessionId: body.sessionId,
      routeId: body.routeId,
      route: body.route,
      preferences: body.preferences
    }));
    return;
  }

  if (url.pathname === "/api/routes/saved" && req.method === "GET") {
    ok(res, listSavedRoutes(url.searchParams.get("sessionId") || ""));
    return;
  }

  if (url.pathname === "/api/routes/node/narrate" && req.method === "POST") {
    const body = await readJson(req);
    ok(res, await narrateRouteNode({
      nodeId: body.nodeId,
      spotId: body.spotId,
      spotName: body.spotName
    }));
    return;
  }

  if (url.pathname === "/api/chat/history" && req.method === "GET") {
    const sessionId = url.searchParams.get("sessionId") || "";
    ok(res, getMessages(sessionId));
    return;
  }

  if (url.pathname === "/api/feedback" && req.method === "POST") {
    const body = await readJson(req);
    created(res, createFeedback(body));
    return;
  }

  if (url.pathname === "/api/feedback" && req.method === "GET") {
    ok(res, listFeedback({ sessionId: url.searchParams.get("sessionId") || "" }));
    return;
  }

  if (url.pathname === "/api/admin/conversations" && req.method === "GET") {
    if (!requireAdmin(req, res)) return;
    ok(res, listConversationSummaries({
      lowSatisfactionOnly: url.searchParams.get("lowSatisfaction") === "1"
    }));
    return;
  }

  const conversationAdminMatch = url.pathname.match(/^\/api\/admin\/conversations\/([^/]+)$/);
  if (conversationAdminMatch && req.method === "GET") {
    if (!requireAdmin(req, res)) return;
    ok(res, getConversationDetail(decodeURIComponent(conversationAdminMatch[1])));
    return;
  }

  const messageAnnotationMatch = url.pathname.match(/^\/api\/admin\/messages\/([^/]+)\/annotation$/);
  if (messageAnnotationMatch && req.method === "POST") {
    if (!requireAdmin(req, res)) return;
    const body = await readJson(req);
    created(res, annotateMessage(decodeURIComponent(messageAnnotationMatch[1]), body));
    return;
  }

  const messageDraftMatch = url.pathname.match(/^\/api\/admin\/messages\/([^/]+)\/knowledge-draft$/);
  if (messageDraftMatch && req.method === "POST") {
    if (!requireAdmin(req, res)) return;
    created(res, createKnowledgeDraftFromMessage(decodeURIComponent(messageDraftMatch[1])));
    return;
  }

  if (url.pathname === "/api/admin/feedback/clusters" && req.method === "GET") {
    if (!requireAdmin(req, res)) return;
    ok(res, listFeedbackClusters());
    return;
  }

  if (url.pathname === "/api/admin/service-quality/report" && req.method === "GET") {
    if (!requireAdmin(req, res)) return;
    ok(res, buildServiceQualityReport());
    return;
  }

  if (url.pathname === "/api/admin/analytics/import" && req.method === "POST") {
    if (!requireAdmin(req, res)) return;
    const dataset = loadBehaviorDataset({ force: true });
    created(res, {
      source: dataset.source,
      rows: dataset.rows.length
    });
    return;
  }

  if (url.pathname === "/api/admin/analytics/dashboard" && req.method === "GET") {
    if (!requireAdmin(req, res)) return;
    ok(res, getDashboardAnalytics({
      gender: url.searchParams.get("gender") || "",
      ageBand: url.searchParams.get("ageBand") || "",
      satisfactionMin: url.searchParams.get("satisfactionMin") || ""
    }));
    return;
  }

  if (url.pathname === "/api/auth/login" && req.method === "POST") {
    const body = await readJson(req);
    const result = login(body.username, body.password);
    if (!result) {
      fail(res, 401, "INVALID_CREDENTIALS", "Invalid username or password.");
      return;
    }

    ok(res, result);
    return;
  }

  if (url.pathname === "/api/auth/me" && req.method === "GET") {
    const token = getBearerToken(req);
    const payload = verifyToken(token);
    if (!payload) {
      fail(res, 401, "UNAUTHORIZED", "Login is required.");
      return;
    }

    ok(res, {
      username: payload.sub,
      role: payload.role
    });
    return;
  }

  if (url.pathname === "/api/visitor/session" && req.method === "POST") {
    created(res, createVisitorSession());
    return;
  }

  if (url.pathname === "/api/uploads" && req.method === "GET") {
    ok(res, listUploads());
    return;
  }

  if (url.pathname === "/api/uploads" && req.method === "POST") {
    const body = await readJson(req);
    created(res, createUpload(body));
    return;
  }

  serveStatic(res, url.pathname);
}

async function streamChat(res, body) {
  res.writeHead(200, {
    "content-type": "text/event-stream; charset=utf-8",
    "cache-control": "no-cache, no-transform",
    connection: "keep-alive"
  });

  const send = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    for await (const delta of answerQuestionStream({
      question: body.question,
      sessionId: body.sessionId,
      mode: body.mode
    })) {
      send("delta", { text: delta });
    }
    send("done", { ok: true });
  } catch (error) {
    logError("chat stream failed", { error: error.message, code: error.code });
    send("error", { code: error.code || "LLM_ERROR", message: error.message });
  } finally {
    res.end();
  }
}

function requireAdmin(req, res) {
  const token = getBearerToken(req);
  if (!verifyToken(token)) {
    fail(res, 401, "UNAUTHORIZED", "Login is required.");
    return false;
  }
  return true;
}

function serveStatic(res, pathname) {
  const safePath = normalize(pathname === "/" ? "/index.html" : pathname).replace(/^(\.\.[/\\])+/, "");
  let filePath = join(publicDir, safePath);

  // SPA fallback: unknown routes without a file extension serve index.html so
  // the Vue router can handle client-side navigation.
  if (!filePath.startsWith(publicDir) || !existsSync(filePath)) {
    if (!extname(safePath)) {
      filePath = join(publicDir, "index.html");
    }
    if (!existsSync(filePath)) {
      fail(res, 404, "NOT_FOUND", "Resource not found.");
      return;
    }
  }

  const extension = extname(filePath);
  const contentType = mimeTypes[extension] || "application/octet-stream";
  const body = readFileSync(filePath);
  res.writeHead(200, {
    "content-type": contentType,
    "content-length": body.length
  });
  res.end(body);
}

server.listen(config.port, config.host, () => {
  logInfo("server started", {
    url: `http://${config.host}:${config.port}`,
    visitor: `http://${config.host}:${config.port}/visitor`,
    admin: `http://${config.host}:${config.port}/admin`
  });
});
