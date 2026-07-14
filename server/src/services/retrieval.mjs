import { loadKnowledge } from "./knowledgeBuild.mjs";

const querySynonyms = {
  多高: ["高", "高度", "通高", "总高", "建筑/景观参数"],
  高度: ["高", "通高", "总高", "建筑/景观参数"],
  几点: ["时间", "开放", "演出", "时段"],
  什么时候: ["时间", "开放", "演出", "时段"],
  看点: ["亮点", "特色", "游玩亮点", "最佳体验"],
  介绍: ["详细介绍", "文化内涵", "核心功能"],
  路线: ["游览路线", "推荐路线", "经典路线", "时长"],
  门票: ["票价", "费用", "成人票", "半价"],
  吃饭: ["餐饮", "素斋", "美食"],
  拍照: ["打卡", "合影", "拍摄", "取景"]
};

const intentRules = [
  {
    intent: "height",
    triggers: ["多高", "高度", "通高", "总高", "几米"],
    preferredTerms: ["高", "高度", "通高", "总高", "建筑/景观参数", "米", "m"],
    preferredDocuments: ["doc_structured_lingshan_spots"]
  },
  {
    intent: "open_time",
    triggers: ["开放", "开放时间", "几点开", "几点关", "闭馆", "营业"],
    preferredTerms: ["开放", "开放时间", "闭馆", "运营", "演艺/开放信息", "9:00", "17:00"],
    preferredDocuments: ["doc_structured_lingshan_spots", "doc_lingshan_guide"]
  },
  {
    intent: "performance_time",
    triggers: ["演出", "几点", "表演", "吉祥颂", "场次", "时长"],
    preferredTerms: ["演出", "表演", "时间", "时长", "10:00", "10:35", "11:30", "14:00", "16:00", "吉祥颂"],
    preferredDocuments: ["doc_structured_lingshan_spots", "doc_lingshan_guide"]
  },
  {
    intent: "ticket",
    triggers: ["门票", "票价", "多少钱", "费用", "成人票", "半价", "免票"],
    preferredTerms: ["门票", "票价", "费用", "成人票", "半价", "免票", "210", "105"],
    preferredDocuments: ["doc_lingshan_guide"]
  },
  {
    intent: "route",
    triggers: ["路线", "游览", "推荐", "几小时", "半日"],
    preferredTerms: ["路线", "路线规划", "推荐", "历史文化爱好者路线", "自然风光爱好者路线", "亲子家庭路线", "小时"],
    preferredDocuments: ["doc_lingshan_guide"]
  },
  {
    intent: "highlight",
    triggers: ["看点", "亮点", "特色", "怎么玩", "拍照", "打卡"],
    preferredTerms: ["看点", "亮点", "特色", "游玩亮点", "最佳体验", "拍照", "打卡"],
    preferredDocuments: ["doc_structured_lingshan_spots", "doc_lingshan_guide"]
  },
  {
    intent: "history",
    triggers: ["历史", "玄奘", "小灵山", "灵鹫山", "起源", "渊源", "关系"],
    preferredTerms: ["历史", "玄奘", "小灵山", "灵鹫山", "佛教缘起", "渊源", "唐贞观"],
    preferredDocuments: ["doc_lingshan_guide", "doc_structured_lingshan_spots"]
  }
];

const directQuerySynonyms = {
  "无锡": ["坐落", "位于", "马山镇", "太湖西北部"],
  "占地": ["占地面积", "平方米", "30万平方米"],
  "几a": ["5a", "国家5a", "旅游景区"],
  "A级": ["5A", "国家5A", "旅游景区"],
  "合适": ["最佳游览时间", "季节选择", "春秋季节"],
  "什么时候去": ["最佳游览时间", "季节选择", "春秋季节"],
  "入园": ["建议上午9点前入园", "人流高峰", "时间安排"],
  "素斋": ["梵宫素斋", "餐饮", "50元"],
  "自助": ["自助", "餐饮", "50元"],
  "孩子": ["亲子家庭路线", "轻松游", "百子戏弥勒"],
  "轻松": ["亲子家庭路线", "轻松游"],
  "钟": ["祥符禅钟", "江南第一钟", "12.8吨"],
  "五明": ["声明", "因明", "内明", "医方明", "工巧明"],
  "落成开光": ["1997年11月15日", "落成开光"],
  "五方五佛": ["赵朴初", "五方五佛", "东方空缺"]
};

const directIntentRules = [
  {
    intent: "overview",
    triggers: ["无锡", "占地", "几a", "A级", "5A"],
    preferredTerms: ["坐落", "马山镇", "太湖西北部", "占地面积", "30万平方米", "国家5A"],
    preferredDocuments: ["doc_lingshan_guide"]
  },
  {
    intent: "best_time",
    triggers: ["什么时候去", "合适", "最佳游览时间", "季节"],
    preferredTerms: ["最佳游览时间", "季节选择", "春秋季节", "3-5月", "9-11月"],
    preferredDocuments: ["doc_lingshan_guide"]
  },
  {
    intent: "entry_time",
    triggers: ["入园", "几点入园"],
    preferredTerms: ["建议上午9点前入园", "人流高峰", "时间安排"],
    preferredDocuments: ["doc_lingshan_guide"]
  },
  {
    intent: "dining",
    triggers: ["素斋", "自助", "餐饮", "吃饭"],
    preferredTerms: ["梵宫素斋", "自助", "50元", "餐饮"],
    preferredDocuments: ["doc_lingshan_guide"]
  },
  {
    intent: "family_route",
    triggers: ["孩子", "亲子", "轻松"],
    preferredTerms: ["亲子家庭路线", "轻松游", "百子戏弥勒", "孩子"],
    preferredDocuments: ["doc_lingshan_guide"]
  },
  {
    intent: "specific_fact",
    triggers: ["钟", "五明", "落成开光", "五方五佛"],
    preferredTerms: ["祥符禅钟", "12.8吨", "声明", "因明", "内明", "1997年11月15日", "赵朴初", "五方五佛"],
    preferredDocuments: ["doc_structured_lingshan_spots", "doc_lingshan_guide"]
  }
];

const topicKeywords = [
  "历史",
  "文化",
  "佛教",
  "祈福",
  "演出",
  "开放",
  "路线",
  "门票",
  "交通",
  "餐饮",
  "住宿",
  "亲子",
  "自然",
  "拍照",
  "打卡",
  "消费",
  "满意度",
  "讲解",
  "玄奘",
  "小灵山",
  "灵鹫山",
  "渊源"
];

export function keywordSearch(query, options = {}) {
  return searchKnowledge(query, {
    ...options,
    mode: "keyword"
  });
}

export function hybridSearch(query, options = {}) {
  return searchKnowledge(query, {
    ...options,
    mode: "hybrid"
  });
}

function searchKnowledge(query, options) {
  const knowledge = loadKnowledge();
  if (!knowledge) {
    const error = new Error("Knowledge base has not been built.");
    error.statusCode = 409;
    error.code = "KNOWLEDGE_NOT_BUILT";
    throw error;
  }

  const normalizedQuery = normalize(query);
  if (!normalizedQuery) {
    const error = new Error("Query is required.");
    error.statusCode = 400;
    error.code = "QUERY_REQUIRED";
    throw error;
  }

  const limit = clamp(Number(options.limit || 5), 1, 20);
  const tokens = tokenize(normalizedQuery);
  const expandedTerms = expandTerms(tokens);
  const intents = detectIntents(normalizedQuery, tokens);
  const spotMatches = matchSpots(normalizedQuery, tokens, knowledge.spots);
  const scored = knowledge.chunks
    .map((chunk) => scoreChunk(chunk, {
      query: normalizedQuery,
      tokens,
      expandedTerms,
      intents,
      spotMatches,
      mode: options.mode
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.chunk.id.localeCompare(right.chunk.id);
    })
    .slice(0, limit)
    .map((item) => formatResult(item, knowledge.spots));

  return {
    query,
    mode: options.mode,
    tokens,
    expandedTerms,
    intents,
    spotMatches,
    total: scored.length,
    results: scored
  };
}

function scoreChunk(chunk, context) {
  const title = normalize(chunk.title);
  const content = normalize(chunk.content);
  const keywordText = normalize((chunk.keywords || []).join(" "));
  const reasons = [];
  let score = 0;

  for (const spot of context.spotMatches) {
    if (chunk.scenicSpotId === spot.id) {
      score += context.mode === "hybrid" ? 42 : 34;
      reasons.push(`景点实体命中：${spot.name}`);
    } else if (title.includes(spot.name) || content.includes(spot.name)) {
      score += 20;
      reasons.push(`景点名称命中：${spot.name}`);
    }
  }

  for (const token of context.tokens) {
    if (!token) {
      continue;
    }

    if (title.includes(token)) {
      score += 14;
      reasons.push(`标题命中：${token}`);
    }

    if (keywordText.includes(token)) {
      score += 9;
      reasons.push(`关键词命中：${token}`);
    }

    const count = countOccurrences(content, token);
    if (count > 0) {
      score += Math.min(count * 3, 18);
      reasons.push(`正文命中：${token}`);
    }
  }

  for (const term of context.expandedTerms) {
    if (content.includes(term) || title.includes(term) || keywordText.includes(term)) {
      score += 4;
      reasons.push(`扩展词命中：${term}`);
    }
  }

  for (const intent of context.intents) {
    const intentScore = scoreIntent(chunk, { title, content, keywordText, intent });
    if (intentScore.score > 0) {
      score += intentScore.score;
      reasons.push(...intentScore.reasons);
    }
    const directScore = scoreDirectIntent(chunk, intent);
    if (directScore.score > 0) {
      score += directScore.score;
      reasons.push(...directScore.reasons);
    }
  }

  if (context.mode === "hybrid") {
    const coverage = queryCoverage(context.tokens, `${title} ${keywordText} ${content}`);
    score += Math.round(coverage * 18);
    if (coverage > 0) {
      reasons.push(`查询覆盖度：${coverage.toFixed(2)}`);
    }

    if (score > 0 && chunk.documentId === "doc_structured_lingshan_spots") {
      score += 6;
      reasons.push("结构化景点资料加权");
    }
  }

  return {
    chunk,
    score,
    reasons: [...new Set(reasons)]
  };
}

function scoreDirectIntent(chunk, intent) {
  const raw = `${chunk.title} ${chunk.content}`;
  const reasons = [];
  let score = 0;

  if (intent.intent === "overview" && /(景区概况|马山镇|太湖西北部|占地面积|国家5A|30万平方米)/.test(raw)) {
    score += 70;
    reasons.push("景区概况事实信息加权");
  }

  if (intent.intent === "best_time" && /(最佳游览时间|春秋季节|3-5月|9-11月|季节选择)/.test(raw)) {
    score += 80;
    reasons.push("最佳游览时间信息加权");
  }

  if (intent.intent === "entry_time" && /(建议上午9点前入园|人流高峰|时间安排)/.test(raw)) {
    score += 90;
    reasons.push("入园时间建议信息加权");
  }

  if (intent.intent === "dining" && /(梵宫素斋|自助|50元|餐饮)/.test(raw)) {
    score += 100;
    reasons.push("餐饮信息加权");
  }

  if (intent.intent === "family_route" && /(亲子家庭路线|轻松游|百子戏弥勒|孩子)/.test(raw)) {
    score += 90;
    reasons.push("亲子轻松路线加权");
  }

  if (intent.intent === "specific_fact" && /(祥符禅钟|12\.8吨|声明|因明|内明|医方明|工巧明|1997年11月15日|赵朴初|五方五佛)/.test(raw)) {
    score += 75;
    reasons.push("具体事实信息加权");
  }

  return { score, reasons };
}

function formatResult(item, spots) {
  const spot = spots.find((candidate) => candidate.id === item.chunk.scenicSpotId);
  const citation = createCitation(item.chunk, spot);
  return {
    id: item.chunk.id,
    score: item.score,
    title: item.chunk.title,
    content: item.chunk.content,
    source: item.chunk.source,
    documentId: item.chunk.documentId,
    scenicSpotId: item.chunk.scenicSpotId,
    scenicSpotName: spot?.name || null,
    keywords: item.chunk.keywords || [],
    citation,
    reasons: item.reasons
  };
}

function createCitation(chunk, spot) {
  return {
    chunkId: chunk.id,
    documentId: chunk.documentId,
    documentName: chunk.source,
    sectionTitle: chunk.title,
    scenicSpotId: chunk.scenicSpotId,
    scenicSpotName: spot?.name || null,
    quote: summarizeCitation(chunk.content)
  };
}

function summarizeCitation(content) {
  const normalized = String(content || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= 120) {
    return normalized;
  }

  return `${normalized.slice(0, 118)}...`;
}

function matchSpots(query, tokens, spots) {
  const matches = [];

  for (const spot of spots) {
    const aliases = spot.aliases || [spot.name];
    const matchedAlias = aliases.find((alias) => query.includes(normalize(alias)));
    if (matchedAlias) {
      matches.push({
        id: spot.id,
        name: spot.name,
        alias: matchedAlias,
        confidence: matchedAlias === spot.name ? 1 : 0.86
      });
      continue;
    }

    const partial = aliases.find((alias) => {
      const normalizedAlias = normalize(alias);
      return tokens.some((token) => normalizedAlias.includes(token) || token.includes(normalizedAlias));
    });

    if (partial) {
      matches.push({
        id: spot.id,
        name: spot.name,
        alias: partial,
        confidence: 0.58
      });
    }
  }

  return matches;
}

function expandTerms(tokens) {
  const terms = new Set();
  for (const token of tokens) {
    terms.add(token);
    for (const [key, values] of Object.entries(querySynonyms)) {
      if (token.includes(key) || key.includes(token)) {
        for (const value of values) {
          terms.add(value);
        }
      }
    }
  }

  for (const topic of topicKeywords) {
    if (tokens.some((token) => topic.includes(token) || token.includes(topic))) {
      terms.add(topic);
    }
  }

  const queryText = tokens.join("");
  for (const [key, values] of Object.entries(directQuerySynonyms)) {
    const normalizedKey = normalize(key);
    if (queryText.includes(normalizedKey)) {
      for (const value of values) {
        terms.add(normalize(value));
      }
    }
  }

  return [...terms].filter(Boolean);
}

function detectIntents(query, tokens) {
  const intents = [];

  for (const rule of intentRules) {
    if (rule.triggers.some((trigger) => query.includes(trigger) || tokens.includes(trigger))) {
      intents.push({
        intent: rule.intent,
        preferredTerms: rule.preferredTerms,
        preferredDocuments: rule.preferredDocuments
      });
    }
  }

  for (const rule of directIntentRules) {
    if (rule.triggers.some((trigger) => query.includes(normalize(trigger)) || tokens.includes(normalize(trigger)))) {
      intents.push({
        intent: rule.intent,
        preferredTerms: rule.preferredTerms,
        preferredDocuments: rule.preferredDocuments
      });
    }
  }

  return intents;
}

function scoreIntent(chunk, context) {
  const reasons = [];
  let score = 0;
  const haystack = `${context.title} ${context.keywordText} ${context.content}`;

  if (context.intent.preferredDocuments.includes(chunk.documentId)) {
    score += 8;
    reasons.push(`意图文档加权：${context.intent.intent}`);
  }

  let termHits = 0;
  for (const term of context.intent.preferredTerms) {
    if (haystack.includes(normalize(term))) {
      termHits += 1;
    }
  }

  if (termHits > 0) {
    score += Math.min(termHits * 7, 28);
    reasons.push(`意图字段命中：${context.intent.intent}`);
  }

  if (context.intent.intent === "ticket" && /(\d+元|成人票|半价|免票|门票|票价)/.test(context.content)) {
    score += 24;
    reasons.push("票价事实信息加权");
  }

  if (context.intent.intent === "performance_time" && /(\d{1,2}:\d{2}|演出|表演|时长|场)/.test(context.content)) {
    score += 18;
    reasons.push("演出时间事实信息加权");
  }

  if (context.intent.intent === "open_time" && /(\d{1,2}:\d{2}|开放|闭馆|全天)/.test(context.content)) {
    score += 18;
    reasons.push("开放时间事实信息加权");
  }

  if (context.intent.intent === "height" && /(\d+(\.\d+)?m|\d+(\.\d+)?米|通高|总高|高度)/i.test(context.content)) {
    score += 18;
    reasons.push("高度参数事实信息加权");
  }

  if (context.intent.intent === "route" && /(路线规划|小时|入园|出口|推荐|亲子|自然|历史)/.test(context.content)) {
    score += 18;
    reasons.push("路线规划信息加权");
  }

  if (context.intent.intent === "history" && /(玄奘|小灵山|灵鹫山|唐贞观|渊源|历史)/.test(context.content)) {
    score += 18;
    reasons.push("历史文化信息加权");
  }

  return {
    score,
    reasons
  };
}

function tokenize(query) {
  const clean = normalize(query);
  const terms = new Set();
  const parts = clean
    .split(/[，。！？、,.!?;；:\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  for (const part of parts) {
    terms.add(part);
  }

  for (const topic of topicKeywords) {
    if (clean.includes(topic)) {
      terms.add(topic);
    }
  }

  for (const key of Object.keys(querySynonyms)) {
    if (clean.includes(key)) {
      terms.add(key);
    }
  }

  const scenicNouns = ["灵山胜境", "灵山大佛", "九龙灌浴", "灵山梵宫", "五印坛城", "祥符禅寺", "大佛", "梵宫"];
  for (const noun of scenicNouns) {
    if (clean.includes(noun)) {
      terms.add(noun);
    }
  }

  return [...terms].filter((term) => term.length >= 2);
}

function queryCoverage(tokens, text) {
  if (tokens.length === 0) {
    return 0;
  }

  const hitCount = tokens.filter((token) => text.includes(token)).length;
  return hitCount / tokens.length;
}

function countOccurrences(text, term) {
  if (!term) {
    return 0;
  }

  let count = 0;
  let index = text.indexOf(term);
  while (index !== -1) {
    count += 1;
    index = text.indexOf(term, index + term.length);
  }
  return count;
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();
}

function clamp(value, min, max) {
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.max(min, Math.min(max, value));
}
