// Deterministic offline answer composer for the mock LLM provider.
// It turns structured retrieval grounding (meta) into a concise, guide-style
// answer. This keeps the full RAG loop demonstrable without any cloud key.
// AI2-03/04/05/08/09 behaviors are realized here for the mock path; the real
// provider realizes the same behaviors through the system prompt.

const INTENT_PATTERNS = {
  height: /(通高\s*)?\d+(\.\d+)?\s*(米|m)|总高|通高|高度/i,
  ticket: /\d+\s*元|成人票|半价|免票|门票|票价/,
  open_time: /\d{1,2}:\d{2}|全天|开放时间|闭馆/,
  performance_time: /\d{1,2}:\d{2}|每场|时长|演出|表演|吉祥颂/,
  highlight: /亮点|特色|看点|体验|不可错过|值得/,
  history: /玄奘|小灵山|灵鹫山|唐贞观|渊源|历史|始建|年/,
  route: /路线|入园|出口|建议|小时|先|再|最后/
};

// Structured field labels from the source data that should not surface in a
// natural guide answer.
const FIELD_LABEL = /(建筑\/景观参数|演艺\/开放信息|核心功能|文化内涵|详细介绍|游玩亮点|备注)[：:]/g;

function clean(text) {
  return String(text || "")
    .replace(FIELD_LABEL, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitSentences(text) {
  return clean(text)
    .split(/(?<=[。！？；])/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function pickSentences(text, pattern, max = 2) {
  const sentences = splitSentences(text);
  const hits = sentences.filter((sentence) => pattern.test(sentence));
  const chosen = (hits.length > 0 ? hits : sentences).slice(0, max);
  return chosen.join("");
}

function primaryIntent(intents = []) {
  const order = ["ticket", "open_time", "performance_time", "height", "route", "highlight", "history"];
  for (const key of order) {
    if (intents.some((intent) => intent.intent === key)) {
      return key;
    }
  }
  return null;
}

function patternFromQuestion(question) {
  const text = String(question || "");
  if (/吉祥颂.*(几点|时间|开始|场次)|几点.*吉祥颂/.test(text)) {
    return /10:35|11:30|14:00|16:00|20分钟|吉祥颂/;
  }
  if (/九龙喷水|九龙灌浴.*看点|花开见佛/.test(text)) {
    return /花开见佛|释迦牟尼|动态景观|太子佛|佛陀诞生|九龙/;
  }
  if (/梵宫.*(好看|看点|特色|亮点)|吉祥颂/.test(text)) {
    return /东阳木雕|琉璃|油画|景泰蓝|玉雕|漆画|佛教艺术|吉祥颂|旋转舞台/;
  }
  if (/钟|钟声|禅钟/.test(text)) {
    return /祥符禅钟|江南第一钟|12\.8吨|钟楼|撞钟/;
  }
  if (/五明/.test(text)) {
    return /声明|因明|内明|医方明|工巧明|五种核心智慧/;
  }
  if (/落成开光/.test(text)) {
    return /1997年11月15日|落成开光/;
  }
  if (/五方五佛|赵朴初/.test(text)) {
    return /赵朴初|五方五佛|东方空缺/;
  }
  return null;
}

function subjectName(meta) {
  return meta.spotMatches?.[0]?.name || meta.results?.[0]?.scenicSpotName || meta.results?.[0]?.title || "";
}

function trimTo(text, max) {
  const value = clean(text);
  if (value.length <= max) {
    return value;
  }
  const cut = value.slice(0, max);
  const lastStop = Math.max(cut.lastIndexOf("。"), cut.lastIndexOf("！"), cut.lastIndexOf("？"));
  return lastStop > max * 0.6 ? cut.slice(0, lastStop + 1) : `${cut}…`;
}

function composeGrounded(meta) {
  const results = meta.results || [];
  if (results.length === 0) {
    return composeNoData(meta);
  }

  const intent = primaryIntent(meta.intents);
  const subject = subjectName(meta);
  const top = results[0];
  const pattern = patternFromQuestion(meta.question) || (intent ? INTENT_PATTERNS[intent] : null);

  let core = "";
  if (pattern) {
    for (const item of results.slice(0, 3)) {
      const picked = pickSentences(item.content, pattern, 2);
      if (picked && pattern.test(picked)) {
        core = picked;
        break;
      }
    }
  }
  if (!core) {
    core = pickSentences(top.content, /./, 2);
  }

  const mode = meta.mode || "qa";
  const lead = subject ? `${subject}` : "为您介绍";
  let body;

  if (mode === "explain") {
    // 200-400 字讲解模式:多取几句,给出更完整的讲解。
    const extra = pickSentences(top.content, INTENT_PATTERNS.highlight, 2);
    body = trimTo(`${core}${extra && !core.includes(extra) ? extra : ""}`, 400);
    if (body.length < 200 && results[1]) {
      body = trimTo(`${body}${pickSentences(results[1].content, /./, 2)}`, 400);
    }
  } else {
    // 普通问答 80-180 字。
    body = trimTo(core, 180);
  }

  const opener = subject ? `关于${lead},` : "";
  const answer = `${opener}${body}`;
  return trimTo(answer, mode === "explain" ? 400 : 190);
}

function composeRoute(meta) {
  const results = meta.results || [];
  const routeChunk = results.find((item) => /路线|贴士|时间|推荐/.test(item.title)) || results[0];
  const source = routeChunk ? routeChunk.content : "";
  const sentences = splitSentences(source).slice(0, 6);

  const steps = sentences.length > 0
    ? sentences.map((sentence, index) => `${index + 1}. ${trimTo(sentence, 60)}`)
    : [
        "1. 从景区入口出发,沿五明桥、菩提大道步行前行。",
        "2. 观看九龙灌浴表演,再前往灵山大佛登云道朝拜。",
        "3. 最后参观灵山梵宫,欣赏建筑与演艺。"
      ];

  const intro = "为您推荐一条游览路线,按顺序游玩更顺畅:";
  const tail = "沿途我可以在每个节点为您做讲解。";
  return `${intro}\n${steps.join("\n")}\n${tail}`;
}

function composeNoData(meta) {
  // Reference the visitor's own question, not a loosely-retrieved spot, so the
  // honest "not covered" reply never appears to be about the wrong thing.
  const topic = meta.question ? `“${trimTo(meta.question, 20)}”相关` : "这方面";
  return `抱歉,当前灵山胜境的资料还没有覆盖${topic}的内容,我不能凭空作答。您可以换个问法,或者问我灵山大佛、九龙灌浴、灵山梵宫的介绍、开放时间和游览路线,我都能详细为您解答。`;
}

function composeOutOfScope(meta) {
  const other = meta.otherPlace ? `“${meta.otherPlace}”` : "其他景区";
  return `我是灵山胜境的专属导游,${other}不在我的服务范围内,恐怕帮不上忙。不过灵山胜境同样精彩:您可以了解灵山大佛、九龙灌浴的花开见佛、灵山梵宫的吉祥颂演出,或者让我为您规划一条游览路线。`;
}

function composeSensitive(meta) {
  const category = meta.sensitiveCategory;
  const map = {
    abuse: "咱们好好聊,我更希望把灵山胜境的美好介绍给您。",
    politics: "这类话题我不太方便讨论。",
    medical: "医疗健康问题请咨询专业医生,我不能提供相关建议。",
    investment: "投资理财这类建议我无法提供,请咨询专业人士。",
    danger: "涉及危险行为的内容我不能提供帮助,请注意安全。"
  };
  const lead = map[category] || "这个话题不在我的服务范围内。";
  return `${lead}我是灵山胜境 AI 导游,很乐意为您介绍景点、演出和游览路线,有需要随时问我。`;
}

function composeNarration(meta) {
  const spot = meta.spot || {};
  const name = spot.name || subjectName(meta) || "这处景点";
  const parts = [
    spot.detail || spot.culture || "",
    spot.highlights ? `游玩亮点:${spot.highlights}` : "",
    spot.openInfo ? `${spot.openInfo}` : ""
  ].filter(Boolean).join("");

  const source = parts || (meta.results?.[0]?.content || "");
  const core = trimTo(clean(source), 360);
  const opener = `各位游客,我们现在来到的是${name}。`;
  const closer = "更多细节,欢迎随时向我提问。";
  return trimTo(`${opener}${core}${closer}`, 400);
}

function composeAccompany(meta) {
  const name = meta.spot?.name || subjectName(meta) || "当前位置";
  const interest = meta.interests?.length ? meta.interests.join("、") : "";
  const base = meta.spot?.highlights || meta.spot?.detail || meta.results?.[0]?.content || "";
  const focus = interest ? `考虑到您对${interest}的兴趣,` : "";
  return trimTo(`您已到达${name}。${focus}${clean(base)}建议放慢脚步细细感受,需要讲解随时叫我。`, 300);
}

function composeChitchat(meta) {
  const question = clean(meta.question);
  if (/你好|您好|hi|hello|在吗|在么/i.test(question)) {
    return "您好,我是灵山胜境 AI 导游。您可以问我灵山大佛有多高、九龙灌浴几点表演、灵山梵宫有什么看点,或者让我为您推荐一条游览路线。";
  }
  if (/谢谢|感谢|多谢/.test(question)) {
    return "不客气,能帮到您我很开心。祝您在灵山胜境游览愉快,有任何问题随时问我。";
  }
  return "我是灵山胜境的导游,擅长景点介绍、演出时间和路线推荐。您想先了解灵山大佛、九龙灌浴,还是让我帮您规划一条游览路线?";
}

export function composeMockAnswer(meta) {
  switch (meta.scenario) {
    case "sensitive":
      return composeSensitive(meta);
    case "out_of_scope":
      return composeOutOfScope(meta);
    case "no_data":
      return composeNoData(meta);
    case "narration":
      return composeNarration(meta);
    case "accompany":
      return composeAccompany(meta);
    case "chitchat":
      return composeChitchat(meta);
    case "grounded":
    default:
      if (meta.mode === "route") {
        return composeRoute(meta);
      }
      return composeGrounded(meta);
  }
}
