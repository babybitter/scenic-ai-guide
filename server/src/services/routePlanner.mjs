// R3: personalized route graph, recommendation rules and saved selections.
// The data is intentionally local and deterministic so the demo works offline.

import { randomBytes } from "node:crypto";
import { generateSpotNarration } from "./narration.mjs";
import { getDb } from "../db/database.mjs";

const routeNodes = [
  { id: "gate_south", name: "南门入园", spotId: null, order: 1, minutes: 5, tags: ["entry"] },
  { id: "zhaobi", name: "灵山大照壁", spotId: "LS-001", order: 2, minutes: 10, tags: ["history", "photo", "landmark"] },
  { id: "wuming_bridge", name: "五明桥", spotId: "LS-002", order: 3, minutes: 8, tags: ["culture", "walk"] },
  { id: "fozu_tan", name: "佛足坛", spotId: "LS-003", order: 4, minutes: 10, tags: ["blessing", "culture"] },
  { id: "wuzhi_gate", name: "五智门", spotId: "LS-004", order: 5, minutes: 8, tags: ["culture", "photo", "landmark"] },
  { id: "puti_road", name: "菩提大道", spotId: "LS-005", order: 6, minutes: 12, tags: ["nature", "walk", "easy"] },
  { id: "jiulong", name: "九龙灌浴", spotId: "LS-006", order: 7, minutes: 25, tags: ["show", "family", "blessing", "photo"] },
  { id: "jiangmo", name: "降魔浮雕", spotId: "LS-007", order: 8, minutes: 8, tags: ["culture", "art"] },
  { id: "ashoka", name: "阿育王柱", spotId: "LS-008", order: 9, minutes: 8, tags: ["history", "photo", "landmark"] },
  { id: "baizi", name: "百子戏弥勒", spotId: "LS-009", order: 10, minutes: 12, tags: ["family", "photo", "easy"] },
  { id: "xiangfu", name: "祥符禅寺", spotId: "LS-010", order: 11, minutes: 30, tags: ["history", "buddhist", "blessing"] },
  { id: "buddha", name: "灵山大佛", spotId: "LS-011", order: 12, minutes: 45, tags: ["landmark", "buddhist", "photo", "climb"] },
  { id: "museum", name: "佛教文化博览馆", spotId: "LS-012", order: 13, minutes: 25, tags: ["culture", "indoor", "history"] },
  { id: "fangong", name: "灵山梵宫", spotId: "LS-013", order: 14, minutes: 45, tags: ["art", "show", "indoor", "buddhist"] },
  { id: "wuyin", name: "五印坛城", spotId: "LS-014", order: 15, minutes: 25, tags: ["buddhist", "photo", "culture"] },
  { id: "manfeilong", name: "曼飞龙塔", spotId: "LS-015", order: 16, minutes: 15, tags: ["nature", "photo", "buddhist"] },
  { id: "wujinyi", name: "无尽意斋", spotId: "LS-016", order: 17, minutes: 20, tags: ["history", "quiet", "culture"] },
  { id: "exit", name: "出口", spotId: null, order: 99, minutes: 5, tags: ["exit"] }
];

const routeTemplates = [
  {
    id: "quick_30",
    name: "30分钟核心打卡路线",
    routeType: "quick",
    durationMinutes: 30,
    nodeIds: ["gate_south", "zhaobi", "jiulong", "exit"],
    tags: ["short", "photo", "landmark"],
    suitableFor: ["时间不足", "首次到访", "核心打卡"]
  },
  {
    id: "one_hour_core",
    name: "1小时速览路线",
    routeType: "one_hour",
    durationMinutes: 60,
    nodeIds: ["gate_south", "zhaobi", "wuzhi_gate", "jiulong", "buddha", "exit"],
    tags: ["short", "landmark", "classic"],
    suitableFor: ["时间较紧", "核心景点"]
  },
  {
    id: "classic_150",
    name: "2-3小时经典路线",
    routeType: "classic",
    durationMinutes: 150,
    nodeIds: ["gate_south", "zhaobi", "wuming_bridge", "puti_road", "jiulong", "xiangfu", "buddha", "fangong", "exit"],
    tags: ["classic", "show", "buddhist", "art"],
    suitableFor: ["首次到访", "标准游览"]
  },
  {
    id: "culture_half_day",
    name: "半日深度文化路线",
    routeType: "half_day_culture",
    durationMinutes: 360,
    nodeIds: ["gate_south", "zhaobi", "xiangfu", "museum", "buddha", "fangong", "wuyin", "wujinyi", "exit"],
    tags: ["history", "culture", "buddhist", "deep"],
    suitableFor: ["历史文化爱好者", "深度讲解"]
  },
  {
    id: "family_light",
    name: "亲子轻松路线",
    routeType: "family",
    durationMinutes: 240,
    nodeIds: ["gate_south", "jiulong", "baizi", "fangong", "wuyin", "exit"],
    tags: ["family", "easy", "show", "indoor"],
    suitableFor: ["亲子家庭", "体力一般", "轻松游"]
  },
  {
    id: "buddhist_culture",
    name: "佛教文化深度路线",
    routeType: "buddhist",
    durationMinutes: 300,
    nodeIds: ["gate_south", "fozu_tan", "wuzhi_gate", "xiangfu", "buddha", "museum", "wuyin", "manfeilong", "exit"],
    tags: ["buddhist", "culture", "history", "deep"],
    suitableFor: ["佛教文化", "历史讲解"]
  },
  {
    id: "photo_checkin",
    name: "拍照打卡路线",
    routeType: "photo",
    durationMinutes: 180,
    nodeIds: ["gate_south", "zhaobi", "wuzhi_gate", "jiulong", "ashoka", "buddha", "fangong", "wuyin", "manfeilong", "exit"],
    tags: ["photo", "landmark", "nature"],
    suitableFor: ["拍照打卡", "地标合影"]
  }
];

export function getRouteGraph() {
  return {
    nodes: routeNodes,
    edges: routeNodes.slice(0, -1).map((node, index) => ({
      from: node.id,
      to: routeNodes[index + 1].id,
      walkMinutes: Math.max(3, Math.round((routeNodes[index + 1].order - node.order) * 3))
    })),
    templates: routeTemplates.map((template) => decorateRoute(template, ""))
  };
}

export function recommendRoute(preferences = {}) {
  const normalized = normalizePreferences(preferences);
  const scored = routeTemplates
    .map((template) => {
      const score = scoreTemplate(template, normalized);
      return {
        template,
        score,
        reasons: explainScore(template, normalized, score)
      };
    })
    .sort((left, right) => right.score - left.score || left.template.durationMinutes - right.template.durationMinutes);

  const selected = scored[0]?.template || routeTemplates[2];
  const route = adaptRoute(selected, normalized);
  return {
    preferences: normalized,
    recommendation: route,
    alternatives: scored.slice(1, 4).map((item) => decorateRoute(item.template, item.reasons.join("；"))),
    message: route.explanation
  };
}

export function saveRouteSelection({ sessionId = "", routeId = "", route = null, preferences = {} } = {}) {
  const selected = route || decorateRoute(routeTemplates.find((item) => item.id === routeId) || routeTemplates[2], "");
  const record = {
    id: `route_sel_${Date.now()}_${randomBytes(4).toString("hex")}`,
    sessionId,
    routeId: selected.id,
    routeName: selected.name,
    routeType: selected.routeType,
    durationMinutes: selected.durationMinutes,
    nodeIds: selected.nodes.map((node) => node.id),
    preferences,
    createdAt: new Date().toISOString()
  };
  getDb()
    .prepare(
      `INSERT INTO route_selections
         (id, session_id, route_id, route_name, route_type, duration_minutes, node_ids, tags, preferences, created_at)
       VALUES (@id, @session_id, @route_id, @route_name, @route_type, @duration_minutes, @node_ids, @tags, @preferences, @created_at)`
    )
    .run({
      id: record.id,
      session_id: record.sessionId || "anonymous",
      route_id: record.routeId,
      route_name: record.routeName,
      route_type: record.routeType,
      duration_minutes: record.durationMinutes,
      node_ids: JSON.stringify(record.nodeIds || []),
      tags: JSON.stringify(selected.tags || []),
      preferences: JSON.stringify(preferences || {}),
      created_at: record.createdAt
    });
  return record;
}

export function listSavedRoutes(sessionId = "") {
  const db = getDb();
  const rows = sessionId
    ? db.prepare("SELECT * FROM route_selections WHERE session_id = ? ORDER BY created_at ASC, rowid ASC").all(sessionId)
    : db.prepare("SELECT * FROM route_selections ORDER BY created_at ASC, rowid ASC").all();
  return rows.map((row) => ({
    id: row.id,
    sessionId: row.session_id,
    routeId: row.route_id,
    routeName: row.route_name,
    routeType: row.route_type,
    durationMinutes: row.duration_minutes,
    nodeIds: safeParse(row.node_ids, []),
    tags: safeParse(row.tags, []),
    preferences: safeParse(row.preferences, {}),
    createdAt: row.created_at
  }));
}

function safeParse(value, fallback) {
  try {
    const parsed = JSON.parse(value || "null");
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export async function narrateRouteNode({ nodeId, spotId, spotName, signal } = {}) {
  const node = routeNodes.find((item) => item.id === nodeId || item.spotId === spotId || item.name === spotName);
  const targetName = spotName || node?.name;
  if (!targetName) {
    const error = new Error("nodeId, spotId or spotName is required.");
    error.statusCode = 400;
    error.code = "ROUTE_NODE_REQUIRED";
    throw error;
  }
  return generateSpotNarration({ spotId: node?.spotId || spotId, spotName: targetName, signal });
}

// Map front-end interest codes (and loose labels) to canonical Chinese terms so
// scoring works regardless of whether the client sends "history" or "历史文化".
const INTEREST_ALIAS = {
  history: "历史文化",
  culture: "历史文化",
  buddhist: "佛教朝圣",
  buddhism: "佛教朝圣",
  pray: "佛教祈福",
  parentchild: "亲子家庭",
  family: "亲子家庭",
  child: "亲子家庭",
  photo: "拍照打卡",
  nature: "自然风光",
  show: "演艺体验",
  performance: "演艺体验",
  easy: "轻松游览",
  deep: "深度讲解"
};

function normalizeInterest(item) {
  const raw = String(item).trim();
  return INTEREST_ALIAS[raw.toLowerCase()] || raw;
}

function normalizePreferences(input) {
  const rawInterests = Array.isArray(input.interests) ? input.interests : [];
  const interests = rawInterests.map(normalizeInterest).filter(Boolean);
  const interestText = interests.join(" ");
  const durationMinutes = Number(input.durationMinutes || input.minutes || 150);
  return {
    durationMinutes,
    interests,
    groupType: input.groupType || "",
    pace: input.pace || "normal",
    physicalLevel: input.physicalLevel || "normal",
    wantsShow: Boolean(input.wantsShow) || /演艺|演出|表演/.test(interestText),
    photoFocus: Boolean(input.photoFocus) || /拍照|打卡|合影/.test(interestText),
    withChildren: Boolean(input.withChildren) || /亲子|孩子|家庭/.test(interestText),
    avoidStairs: Boolean(input.avoidStairs) || input.physicalLevel === "low"
  };
}

function scoreTemplate(template, preferences) {
  let score = 0;
  const interestText = preferences.interests.join(" ");

  // Duration fit (proximity): the template whose length best matches the
  // requested time wins. Fitting within budget is preferred; overshooting the
  // budget is penalized in proportion to the overage.
  const over = template.durationMinutes - preferences.durationMinutes;
  if (over <= 0) {
    score += 70 + Math.max(0, 30 + over / 4); // within budget; closer to budget = better
  } else {
    score += Math.max(0, 50 - over / 3); // exceeds budget = steep penalty by overage
  }

  // General time-based routes form the backbone for pure-duration requests;
  // themed routes (photo / family / buddhist) win only when their interest is chosen.
  const GENERAL_ROUTES = new Set(["quick_30", "one_hour_core", "classic_150", "culture_half_day"]);
  if (GENERAL_ROUTES.has(template.id)) score += 25;

  if (/历史|文化|深度/.test(interestText) && template.tags.includes("history")) score += 45;
  if (/佛教|祈福|朝圣/.test(interestText) && template.tags.includes("buddhist")) score += 45;
  if (/自然|风光|太湖/.test(interestText) && template.tags.includes("nature")) score += 35;
  if (/拍照|打卡|合影/.test(interestText) && template.tags.includes("photo")) score += 45;
  if (preferences.photoFocus && template.tags.includes("photo")) score += 45;
  if ((preferences.photoFocus || /拍照|打卡|合影/.test(interestText)) && template.id === "photo_checkin") score += 30;
  if ((preferences.withChildren || /亲子|孩子|家庭/.test(interestText)) && template.tags.includes("family")) score += 60;
  if (preferences.wantsShow && template.tags.includes("show")) score += 40;
  if (preferences.avoidStairs && template.tags.includes("easy")) score += 30;
  if (preferences.avoidStairs && template.nodeIds.includes("buddha")) score -= 20;

  return score;
}

function adaptRoute(template, preferences) {
  let nodeIds = [...template.nodeIds];
  const notes = [];

  if (preferences.durationMinutes < 30) {
    nodeIds = ["gate_south", "zhaobi", "jiulong", "exit"];
    notes.push("时间不足30分钟，已压缩为核心打卡，不安排完整深度路线。");
  }

  if (preferences.avoidStairs) {
    nodeIds = nodeIds.filter((id) => id !== "buddha" || preferences.durationMinutes >= 120);
    notes.push("考虑体力或台阶压力，优先保留平缓节点，并减少登高停留。");
  }

  const interestText = preferences.interests.join(" ");
  if (/轻松/.test(interestText) && /深度|历史|文化/.test(interestText) && !nodeIds.includes("fangong")) {
    nodeIds.splice(Math.max(nodeIds.length - 1, 1), 0, "fangong");
    notes.push("兴趣存在轻松与深度并重，采用折中路线：减少长距离节点，保留梵宫等高价值室内讲解。");
  }

  const route = decorateRoute({ ...template, nodeIds }, notes.join(" "));
  route.explanation = buildRouteExplanation(route, preferences, notes);
  return route;
}

function decorateRoute(template, reason) {
  const nodes = template.nodeIds.map((id, index) => {
    const node = routeNodes.find((item) => item.id === id);
    return {
      ...node,
      step: index + 1,
      narrationEndpoint: node?.spotId ? "/api/routes/node/narrate" : null
    };
  }).filter((node) => node.id);

  return {
    id: template.id,
    name: template.name,
    routeType: template.routeType,
    durationMinutes: nodes.reduce((sum, node) => sum + node.minutes, 0),
    tags: template.tags,
    suitableFor: template.suitableFor,
    nodes,
    reason
  };
}

function explainScore(template, preferences, score) {
  const reasons = [`匹配分 ${score}`];
  if (template.durationMinutes <= preferences.durationMinutes) reasons.push("时长适配");
  if (preferences.withChildren && template.tags.includes("family")) reasons.push("适合亲子");
  if (preferences.photoFocus && template.tags.includes("photo")) reasons.push("突出拍照打卡");
  if (preferences.wantsShow && template.tags.includes("show")) reasons.push("包含演出体验");
  return reasons;
}

function buildRouteExplanation(route, preferences, notes) {
  const stepText = route.nodes
    .map((node) => `${node.step}. ${node.name}: ${node.tags.includes("show") ? "适合观看演艺或动态景观" : node.tags.includes("photo") ? "适合拍照打卡" : "顺路游览并可听讲解"}`)
    .join("\n");
  const noteText = notes.length ? `\n${notes.join("\n")}` : "";
  return `根据您的游览时长${preferences.durationMinutes}分钟和兴趣偏好，推荐“${route.name}”。\n${stepText}${noteText}\n点击任一路线节点后，可继续触发该节点的数字人讲解。`;
}
