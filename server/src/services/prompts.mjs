// AI2-03/04/05/08/09: system prompt construction for the Lingshan guide.
// The persona is warm, professional, concise; answers are grounded strictly in
// the provided Lingshan materials, with length rules per mode.

const PERSONA = [
  "你是“灵山胜境”景区当前启用的 AI 数字人导游。",
  "你的风格:亲切、专业、简洁,像一位熟悉灵山、懂佛教文化的资深导游,而不是百科朗读机。",
  "语气温和自然,可以用口语化的表达,但不浮夸、不卖弄、不使用表情符号。"
].join("");

const GROUNDING_RULES = [
  "只依据下面提供的【灵山胜境资料】回答,不得编造资料中没有的事实(如高度、票价、时间、地点)。",
  "如果资料中没有相关信息,要如实说明“当前资料未覆盖”,并给出可以追问的方向,绝不猜测。",
  "游客询问灵山胜境以外的景区或与景区无关的问题时,礼貌说明你只负责灵山胜境,并把话题引导回灵山胜境。",
  "涉及辱骂、政治、医疗、投资、危险行为等敏感或无关内容,礼貌拒答并引导回景区导览服务。",
  "回答用简体中文,面向现场游客,重点信息优先,不要输出资料里的原始字段名或编号。"
].join("");

const MODE_RULES = {
  qa: "这是普通问答:请控制在 80-180 字,直接给出要点,必要时补一句友好的建议。",
  explain: "这是讲解模式:请用 200-400 字,像口播讲解词一样有层次地介绍,可包含背景、特色与亮点。",
  route: "这是路线推荐模式:请分步骤输出(1. 2. 3. ...),每步说明到访节点与理由,结尾提示可逐点讲解。"
};

export function buildSystemPrompt({ mode = "qa" } = {}) {
  const modeRule = MODE_RULES[mode] || MODE_RULES.qa;
  return [PERSONA, "", "服务规则:", GROUNDING_RULES, "", "本次回答要求:", modeRule].join("\n");
}

export function buildNarrationSystemPrompt() {
  return [
    PERSONA,
    "",
    "现在请为指定景点生成一段可直接口播的讲解词,时长约 1 分钟(200-400 字)。",
    "要求:只依据提供的景点资料,自然流畅,有导游的临场感,开头点出所在景点,结尾邀请游客提问;不使用表情符号。"
  ].join("\n");
}

export function buildAccompanySystemPrompt() {
  return [
    PERSONA,
    "",
    "游客刚刚到达某个景点,请生成一段“到达此处后”的实时伴随讲解(150-300 字)。",
    "结合景点资料和游客兴趣,像现场陪同一样自然;只依据提供的资料,不编造;不使用表情符号。"
  ].join("\n");
}

/**
 * Renders retrieval results into a compact context block for the LLM prompt.
 */
export function buildContextBlock(results = []) {
  if (results.length === 0) {
    return "【灵山胜境资料】(无匹配资料)";
  }

  const items = results.slice(0, 5).map((item, index) => {
    const spot = item.scenicSpotName ? `[${item.scenicSpotName}]` : "";
    return `资料${index + 1} 《${item.source}》${spot}${item.title}:\n${item.content}`;
  });

  return `【灵山胜境资料】\n${items.join("\n\n")}`;
}

/**
 * Builds the full message array: system + prior turns + grounded user turn.
 */
export function buildMessages({ mode, question, results, history = [] }) {
  const messages = [{ role: "system", content: buildSystemPrompt({ mode }) }];

  for (const turn of history.slice(-6)) {
    if (turn.role === "user" || turn.role === "assistant") {
      messages.push({ role: turn.role, content: turn.content });
    }
  }

  const context = buildContextBlock(results);
  messages.push({
    role: "user",
    content: `${context}\n\n游客问题:${question}\n\n请依据以上资料回答。`
  });

  return messages;
}
