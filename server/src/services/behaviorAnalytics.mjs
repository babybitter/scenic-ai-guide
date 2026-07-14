import { existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { randomBytes } from "node:crypto";
import XLSX from "xlsx";
import { listAllMessages } from "./conversation.mjs";
import { listFeedback } from "./feedback.mjs";
import { listSavedRoutes } from "./routePlanner.mjs";
import { loadKnowledge } from "./knowledgeBuild.mjs";
import { getDb } from "../db/database.mjs";

const EXCEL_FILE = "景点景区旅游数据行为分析数据.xlsx";
let cache = null;

// B8-01..03: the behaviour dataset is served from the tourist_behavior table.
// On first use (or after a forced reload) the official Excel is parsed, filtered
// to Lingshan-related records, and persisted so later reads stay fast.
export function loadBehaviorDataset({ force = false } = {}) {
  if (cache && !force) {
    return cache;
  }

  if (!force) {
    const persisted = readBehaviorFromDb();
    if (persisted.length) {
      cache = { source: "sqlite", rows: persisted };
      return cache;
    }
  }

  const parsed = parseBehaviorExcel();
  if (parsed.rows.length) {
    persistBehaviorRows(parsed.rows);
    cache = parsed;
  } else {
    cache = parsed.error ? parsed : buildSeedDataset(parsed.reason || "no_lingshan_rows");
  }
  return cache;
}

function readBehaviorFromDb() {
  try {
    return getDb()
      .prepare("SELECT * FROM tourist_behavior")
      .all()
      .map((row) => ({
        touristId: row.tourist_id,
        age: row.age,
        gender: row.gender,
        attractionName: row.attraction_name,
        visitDate: row.visit_date,
        stayDuration: row.stay_duration,
        ticketCost: row.ticket_cost,
        foodCost: row.food_cost,
        shoppingCost: row.shopping_cost,
        transportCost: row.transport_cost,
        entertainmentCost: row.entertainment_cost,
        totalCost: row.total_cost,
        groupSize: row.group_size,
        satisfaction: row.satisfaction
      }));
  } catch {
    return [];
  }
}

function persistBehaviorRows(rows) {
  try {
    const db = getDb();
    const insert = db.prepare(
      `INSERT INTO tourist_behavior
         (id, tourist_id, age, gender, attraction_name, visit_date, stay_duration,
          ticket_cost, food_cost, shopping_cost, transport_cost, entertainment_cost,
          total_cost, group_size, satisfaction)
       VALUES
         (@id, @tourist_id, @age, @gender, @attraction_name, @visit_date, @stay_duration,
          @ticket_cost, @food_cost, @shopping_cost, @transport_cost, @entertainment_cost,
          @total_cost, @group_size, @satisfaction)`
    );
    const tx = db.transaction((items) => {
      for (const row of items) {
        insert.run({
          id: `tb_${Date.now()}_${randomBytes(4).toString("hex")}`,
          tourist_id: row.touristId || "",
          age: numOrNull(row.age),
          gender: row.gender || "",
          attraction_name: row.attractionName || "",
          visit_date: row.visitDate || "",
          stay_duration: numOrNull(row.stayDuration),
          ticket_cost: numOrNull(row.ticketCost),
          food_cost: numOrNull(row.foodCost),
          shopping_cost: numOrNull(row.shoppingCost),
          transport_cost: numOrNull(row.transportCost),
          entertainment_cost: numOrNull(row.entertainmentCost),
          total_cost: numOrNull(row.totalCost),
          group_size: numOrNull(row.groupSize),
          satisfaction: numOrNull(row.satisfaction)
        });
      }
    });
    tx(rows);
  } catch {
    // Persistence is best-effort; the dashboard still works from the parsed rows.
  }
}

function numOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// Re-parse the Excel and replace the persisted rows (used by scripts/db-init).
export function importBehaviorFromExcel() {
  const parsed = parseBehaviorExcel();
  if (parsed.rows.length) {
    try {
      getDb().prepare("DELETE FROM tourist_behavior").run();
    } catch {
      // ignore
    }
    persistBehaviorRows(parsed.rows);
  }
  cache = parsed.rows.length ? { source: "excel", rows: parsed.rows } : buildSeedDataset(parsed.reason || "no_lingshan_rows");
  return { imported: parsed.rows.length, source: parsed.source, filePath: parsed.filePath };
}

function parseBehaviorExcel() {
  const filePath = findBehaviorExcelFile();
  if (!existsSync(filePath)) {
    return { source: "seed", reason: "excel_missing", rows: [], filePath };
  }
  try {
    const workbook = XLSX.readFile(filePath, { cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    const normalized = rows.map(normalizeRow).filter((row) => isLingshanRelated(row));
    return { source: "excel", filePath, rows: normalized, reason: normalized.length ? "" : "no_lingshan_rows" };
  } catch (error) {
    return { source: "seed", reason: "excel_parse_failed", rows: [], filePath, error: error.message };
  }
}

function findBehaviorExcelFile() {
  const fromEnv = process.env.BEHAVIOR_XLSX ? resolve(process.cwd(), process.env.BEHAVIOR_XLSX) : "";
  const candidatesFixed = [
    fromEnv,
    resolve(process.cwd(), "..", "docs", "scenic-materials", EXCEL_FILE),
    resolve(process.cwd(), "docs", "scenic-materials", EXCEL_FILE),
    resolve(process.cwd(), "..", "测试数据-示范景区公开资料包", EXCEL_FILE)
  ].filter(Boolean);
  for (const candidate of candidatesFixed) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  const root = resolve(process.cwd(), "..");
  const candidates = [];
  collectFiles(root, candidates);
  return (
    candidates.find((file) => file.endsWith(EXCEL_FILE)) ||
    candidates.find((file) => file.toLowerCase().endsWith(".xlsx")) ||
    candidatesFixed[candidatesFixed.length - 1]
  );
}

function collectFiles(dir, out) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      if (name === "node_modules" || name === ".git") continue;
      collectFiles(path, out);
    } else {
      out.push(path);
    }
  }
}

export function getDashboardAnalytics(filters = {}) {
  const dataset = loadBehaviorDataset();
  const rows = applyFilters(dataset.rows, filters);
  const messages = listAllMessages();
  const feedback = listFeedback();
  const routes = listSavedRoutes("");
  const knowledge = loadKnowledge();

  const metrics = {
    todayServiceCount: Math.max(estimateToday(rows), uniqueCount(messages.map((item) => item.sessionId))),
    weekServiceCount: rows.length,
    totalQuestions: messages.filter((item) => item.role === "user").length,
    averageSatisfaction: average([...rows.map((item) => item.satisfaction), ...feedback.map((item) => item.rating)].filter(Number.isFinite)),
    averageLatencyMs: Math.round(average(messages.map((item) => item.latencyMs).filter(Number.isFinite))) || 0,
    behaviorRows: rows.length
  };

  const hotQuestions = topN(messages.filter((item) => item.role === "user").map((item) => clusterQuestion(item.content)), 8);
  const spotFocus = buildSpotFocus({ messages, rows, spots: knowledge?.spots || [] });
  const emotionTrend = buildEmotionTrend({ messages, feedback, rows });
  const routePreference = topN(routes.map((item) => item.routeType || "unknown"), 8);
  const consumption = sumFields(rows, ["ticketCost", "foodCost", "shoppingCost", "transportCost", "entertainmentCost"]);
  const persona = buildPersona(rows);
  const stayRelation = buildStayRelation(rows);
  const suggestions = buildSuggestions({ spotFocus, consumption, feedback, rows, messages });

  return {
    source: dataset.source,
    generatedAt: new Date().toISOString(),
    filters,
    metrics,
    hotQuestions,
    spotFocus,
    emotionTrend,
    routePreference,
    consumption,
    persona,
    stayRelation,
    suggestions
  };
}

function normalizeRow(row) {
  const get = (...keys) => {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== "") return row[key];
    }
    const found = Object.keys(row).find((name) => keys.some((key) => String(name).toLowerCase().includes(String(key).toLowerCase())));
    return found ? row[found] : "";
  };

  const attractionName = String(get("attraction_name", "景点", "景区", "attraction", "name") || "");
  return {
    touristId: String(get("tourist_id", "用户", "游客", "id") || ""),
    age: numberOrNull(get("age", "年龄")),
    gender: normalizeGender(get("gender", "性别")),
    attractionName,
    visitDate: normalizeDate(get("visit_date", "日期", "游玩日期", "date")),
    stayDuration: numberOrNull(get("stay_duration", "停留", "游玩时长", "duration")),
    ticketCost: numberOrZero(get("ticket", "门票")),
    foodCost: numberOrZero(get("food", "餐饮")),
    shoppingCost: numberOrZero(get("shopping", "购物")),
    transportCost: numberOrZero(get("transport", "交通")),
    entertainmentCost: numberOrZero(get("entertainment", "娱乐")),
    totalCost: numberOrZero(get("total", "总消费", "消费")),
    groupSize: numberOrNull(get("group", "同行", "人数")),
    satisfaction: normalizeSatisfaction(get("satisfaction", "满意"))
  };
}

function isLingshanRelated(row) {
  return /灵山胜境|灵山大佛|灵山|九龙灌浴|梵宫/.test(row.attractionName);
}

function applyFilters(rows, filters) {
  return rows.filter((row) => {
    if (filters.gender && row.gender && filters.gender !== row.gender) return false;
    if (filters.ageBand && ageBand(row.age) !== filters.ageBand) return false;
    if (filters.satisfactionMin && Number(row.satisfaction) < Number(filters.satisfactionMin)) return false;
    return true;
  });
}

function buildSeedDataset(reason) {
  const names = ["灵山胜境", "灵山大佛", "九龙灌浴", "灵山梵宫", "五印坛城", "祥符禅寺"];
  const rows = Array.from({ length: 180 }, (_, index) => {
    const age = [22, 28, 35, 43, 51, 62][index % 6];
    const stayDuration = [55, 90, 130, 180, 240][index % 5];
    const satisfaction = [5, 4, 4, 3, 5, 4, 2][index % 7];
    return {
      touristId: `seed_${index + 1}`,
      age,
      gender: index % 2 === 0 ? "female" : "male",
      attractionName: names[index % names.length],
      visitDate: new Date(Date.now() - (index % 14) * 86400000).toISOString().slice(0, 10),
      stayDuration,
      ticketCost: 180,
      foodCost: 35 + (index % 5) * 8,
      shoppingCost: 20 + (index % 4) * 15,
      transportCost: 15 + (index % 3) * 10,
      entertainmentCost: index % 3 === 0 ? 60 : 25,
      totalCost: 0,
      groupSize: 1 + (index % 5),
      satisfaction
    };
  }).map((row) => ({ ...row, totalCost: row.ticketCost + row.foodCost + row.shoppingCost + row.transportCost + row.entertainmentCost }));
  return { source: `seed:${reason}`, filePath: "", rows };
}

function buildSpotFocus({ messages, rows, spots }) {
  const names = spots.map((spot) => spot.name).filter(Boolean);
  const fromMessages = [];
  for (const message of messages) {
    for (const name of names) {
      if (message.content?.includes(name)) fromMessages.push(name);
    }
  }
  return topN([...rows.map((item) => item.attractionName), ...fromMessages], 10);
}

function buildEmotionTrend({ messages, feedback, rows }) {
  const labels = [
    ...messages.map((item) => item.emotionLabel).filter(Boolean),
    ...feedback.map((item) => item.emotion).filter(Boolean),
    ...rows.map((item) => item.satisfaction >= 4 ? "满意" : item.satisfaction <= 2 ? "失望" : "疑惑")
  ];
  return topN(labels, 8);
}

function buildPersona(rows) {
  return {
    ageBands: topN(rows.map((row) => ageBand(row.age)), 8),
    genders: topN(rows.map((row) => row.gender || "unknown"), 4),
    groupSizes: topN(rows.map((row) => groupBand(row.groupSize)), 6),
    satisfaction: topN(rows.map((row) => `${row.satisfaction || 0}分`), 6)
  };
}

function buildStayRelation(rows) {
  const bands = ["0-1小时", "1-2小时", "2-4小时", "4小时以上"];
  return bands.map((band) => {
    const items = rows.filter((row) => stayBand(row.stayDuration) === band);
    return {
      label: band,
      count: items.length,
      averageCost: Math.round(average(items.map((item) => item.totalCost || sumCost(item)))),
      averageSatisfaction: Number(average(items.map((item) => item.satisfaction)).toFixed(1)) || 0
    };
  });
}

function buildSuggestions({ spotFocus, consumption, feedback, rows, messages }) {
  const suggestions = [];
  if (spotFocus[0]) suggestions.push(`游客最关注「${spotFocus[0].label}」，建议在入口与数字人欢迎语中突出该点位讲解入口。`);
  const lowFeedback = feedback.filter((item) => Number(item.rating) <= 2 || item.vote === "down");
  if (lowFeedback.length > 0) suggestions.push(`存在 ${lowFeedback.length} 条低满意反馈，建议后台优先复盘对应会话并补充 FAQ。`);
  const topCost = Object.entries(consumption).sort((a, b) => b[1] - a[1])[0];
  if (topCost) suggestions.push(`${costLabel(topCost[0])}占消费结构最高，可结合路线推荐加强相关服务提示。`);
  if (messages.filter((item) => item.role === "user").length === 0) suggestions.push("当前实时问答数据较少，已使用种子/Excel 行为数据保证大屏完整展示。");
  if (rows.length > 0 && average(rows.map((item) => item.satisfaction)) < 4) suggestions.push("行为数据平均满意度低于 4 分，建议聚焦排队、演出时间和路线长度问题。");
  return suggestions.slice(0, 5);
}

function topN(values, n) {
  const counts = new Map();
  for (const value of values) {
    const label = String(value || "unknown").trim();
    if (!label) continue;
    counts.set(label, (counts.get(label) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, "zh-CN"))
    .slice(0, n);
}

function sumFields(rows, fields) {
  return Object.fromEntries(fields.map((field) => [field, rows.reduce((sum, row) => sum + Number(row[field] || 0), 0)]));
}

function estimateToday(rows) {
  const today = new Date().toISOString().slice(0, 10);
  return rows.filter((row) => row.visitDate === today).length || Math.ceil(rows.length / 14);
}

function uniqueCount(values) {
  return new Set(values.filter(Boolean)).size;
}

function average(values) {
  const nums = values.map(Number).filter(Number.isFinite);
  return nums.length ? nums.reduce((sum, value) => sum + value, 0) / nums.length : 0;
}

function numberOrNull(value) {
  const number = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(number) ? number : null;
}

function numberOrZero(value) {
  return numberOrNull(value) || 0;
}

function normalizeSatisfaction(value) {
  const number = numberOrNull(value);
  if (!number) return null;
  return Math.max(1, Math.min(5, number > 5 ? Math.round(number / 20) : Math.round(number)));
}

function normalizeGender(value) {
  const text = String(value || "").trim().toLowerCase();
  if (/女|female|f/.test(text)) return "female";
  if (/男|male|m/.test(text)) return "male";
  return text || "";
}

function normalizeDate(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = String(value || "").trim();
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function ageBand(age) {
  if (!Number.isFinite(Number(age))) return "unknown";
  if (age < 25) return "18-24";
  if (age < 35) return "25-34";
  if (age < 45) return "35-44";
  if (age < 60) return "45-59";
  return "60+";
}

function groupBand(size) {
  if (!Number.isFinite(Number(size))) return "unknown";
  if (size <= 1) return "独行";
  if (size <= 2) return "双人";
  if (size <= 4) return "家庭/小组";
  return "团队";
}

function stayBand(duration) {
  const value = Number(duration) || 0;
  if (value <= 60) return "0-1小时";
  if (value <= 120) return "1-2小时";
  if (value <= 240) return "2-4小时";
  return "4小时以上";
}

function sumCost(row) {
  return row.ticketCost + row.foodCost + row.shoppingCost + row.transportCost + row.entertainmentCost;
}

function costLabel(field) {
  return {
    ticketCost: "门票",
    foodCost: "餐饮",
    shoppingCost: "购物",
    transportCost: "交通",
    entertainmentCost: "娱乐"
  }[field] || field;
}

function clusterQuestion(text) {
  const value = String(text || "");
  if (/路线|怎么逛|游览|几小时/.test(value)) return "路线推荐";
  if (/大佛|多高|高度/.test(value)) return "灵山大佛";
  if (/九龙|灌浴|演出/.test(value)) return "九龙灌浴";
  if (/梵宫/.test(value)) return "灵山梵宫";
  if (/门票|开放|时间|几点/.test(value)) return "开放与票务";
  return value.slice(0, 18) || "其他问题";
}
