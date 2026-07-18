# 部署与使用手册

灵山胜境 AI 数字人导览系统 —— 第十五届“中国软件杯” A5 赛题作品。

## 一、运行环境

| 组件 | 要求 |
|---|---|
| Node.js | ≥ 20（开发验证于 Node 25） |
| 包管理器 | 后端 npm；前端 pnpm（≥ 9） |
| 操作系统 | Windows / macOS / Linux 均可 |
| 数据库 | 内置 SQLite（better-sqlite3），无需额外安装 |
| 网络 | 使用讯飞数字人 / 云端大模型时需外网；离线演示可用内置 Mock |

## 二、目录结构

```
scenic-ai-guide/
  web/        前端（Vue3 + Element Plus，游客端 + 管理端）
  server/     后端（Node.js API + SQLite + RAG 知识库）
  docs/       文档与景区素材
```

## 三、后端启动

```bash
cd server
npm install
npm run db:init      # 建表 + 预置管理员/景点/数字人配置 + 导入行为分析 Excel
npm start            # 监听 http://127.0.0.1:5178
```

默认管理员账号：`admin` / `admin123`（首次登录后请在“系统管理-用户管理”中修改）。

### 后端环境变量（`server/.env`，可从 `.env.example` 复制）

- `PORT`：服务端口，默认 5178。
- `LLM_PROVIDER`：`mock`（离线）或 `openai`（兼容 OpenAI 接口的云端大模型，如 DeepSeek/Qwen/Moonshot）。
- `LLM_API_KEY` / `LLM_BASE_URL` / `LLM_MODEL`：使用云端大模型时填写。
- `ASR_PROVIDER` / `TTS_PROVIDER`：语音识别 / 合成提供方，默认 `mock`。
- `DEMO_MODE=true`：演示模式，云服务不可用时回退到本地确定性答案，保证演示不中断。
- `SQLITE_PATH`：数据库文件路径，默认 `./data/scenic.sqlite`。

### 配置 OpenAI 或 OpenAI 兼容大模型

API Key 只填写在 `server/.env`，不要填写到前端环境文件，也不要提交到 Git：

```dotenv
LLM_PROVIDER=openai
LLM_API_KEY=sk-替换为真实密钥
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
DEMO_MODE=true
```

`LLM_MODEL` 必须填写 API 提供方和当前账号实际可用的模型 ID。项目通过
`POST /v1/chat/completions` 调用模型；使用第三方 OpenAI 兼容服务时，同时替换
`LLM_BASE_URL`、`LLM_API_KEY` 和 `LLM_MODEL`。修改后必须重启后端，可访问
`http://127.0.0.1:5178/api/health` 检查当前 provider 是否已经从 `mock` 变为 `openai`。

## Windows 11 一键安装

在项目根目录打开 PowerShell。首次运行脚本时如被执行策略阻止，只对当前进程临时放行：

```powershell
Set-ExecutionPolicy -Scope Process Bypass
```

离线 Mock 模式安装、初始化数据库并构建生产版本：

```powershell
.\scripts\setup-windows.ps1
```

只检查新电脑环境，不安装软件、不修改配置和数据：

```powershell
.\scripts\setup-windows.ps1 -CheckOnly
```

交互式输入 API Key，配置 OpenAI 兼容模型，并在安装后启动生产服务：

```powershell
.\scripts\setup-windows.ps1 `
  -ConfigureCloudLlm `
  -LlmBaseUrl "https://api.openai.com/v1" `
  -LlmModel "填写账号实际可用的模型ID" `
  -StartAfterInstall
```

脚本会自动检查或通过 `winget` 安装 Node.js LTS，安装 pnpm，执行后端 `npm ci`、
数据库初始化、工程检查、前端依赖安装与生产构建。`npm ci` 会重新安装
`better-sqlite3`，避免复制旧电脑的 `node_modules` 后出现 Node ABI 不匹配。建议只复制源码和锁文件，
不要把两端的 `node_modules` 一起拷到新电脑。

常用边界参数：

- `-Mode Development`：额外检查前端开发端口 3006，并在完成后提示双终端开发命令。
- `-NpmRegistry "https://registry.npmmirror.com/"`：官方 npm 网络不可达时显式指定可用镜像。
- `-InstallBuildTools`：若 `better-sqlite3` 没有匹配当前 Node 的预编译包，自动安装 Visual C++ Build Tools 后重试。
- `-SkipNetworkCheck`：仅跳过前置联网探测，依赖尚未缓存时安装仍然需要网络。
- `-SkipTests`：跳过数据库、检索、路线、数字人和降级测试；正式部署和比赛电脑不建议使用。
- `-StartAfterInstall`：生产健康检查通过后保留服务运行，否则脚本会关闭临时测试服务。

默认边界检查包括 Windows 版本与 64 位架构、PowerShell 版本、项目锁文件、剩余磁盘、
npm 网络、5178/3006 端口、Node 与 pnpm 版本、LLM 配置完整性、SQLite 备份、原生依赖安装、
数据库往返、检索、路线、数字人配置、离线降级、前端类型检查、生产构建和 `/api/health` 冒烟测试。

## 四、前端启动

```bash
cd web
pnpm install
pnpm dev             # 打开 http://localhost:3006
```

开发环境下 `/api` 通过 Vite 代理转发到后端（`VITE_API_PROXY_URL`，默认 `http://127.0.0.1:5178`）。

### 数字人凭证（`web/.env`）

讯飞交互式虚拟人凭证（浏览器端 SDK 直接使用）：

- `VITE_XF_AVATAR_APPID` / `VITE_XF_AVATAR_APIKEY` / `VITE_XF_AVATAR_APISECRET`
- `VITE_XF_AVATAR_SERVERURL`（默认 `wss://avatar.cn-huadong-1.xf-yun.com/v1/interact`）
- `VITE_XF_AVATAR_ID` / `VITE_XF_AVATAR_VCN`：默认形象与音色（可被后台数字人配置覆盖）

> 形象与音色以“管理后台-数字人配置”中启用的配置为准；未配置或额度/网络异常时，游客端自动降级为纯文本讲解。

## 五、生产部署（单机同源）

```bash
cd web && pnpm build          # 产物输出到 web/dist
cd ../server && npm start     # 后端同时提供 /api 与 web/dist 静态资源与 SPA 回退
```

浏览器访问后端地址即可（默认 `http://127.0.0.1:5178`）。

## 六、常用运维脚本（server/）

- `npm run db:init`：初始化 / 重建数据库并导入行为分析数据。
- `npm run check`：工程完整性检查。
- `npm run eval:chat`：问答准确率自测（标准测试集 50 题）。
- `npm run eval:retrieval` / `test:retrieval`：检索命中评测。
- `npm run env:check`：环境与密钥检查。
- `npm run backup` / `restore`：数据备份 / 恢复。

## 七、演示动线建议

1. 游客端“AI 数字人导览”：数字人问候 → 语音/文字提问“灵山大佛多高” → 数字人播报并展示来源与响应耗时。
2. 点击景点卡片 / 生成推荐路线 → 数字人分段讲解。
3. 提交满意度反馈。
4. 管理后台：知识库文档与景点管理 → 数字人形象/音色配置 → 运营数据大屏 → 会话与反馈分析 → 用户管理。

## 八、故障与降级

- 数字人无法连接：游客端自动切换为“文本模式”，问答与讲解仍可用。
- 云端大模型 / 语音不可用：设 `DEMO_MODE=true`，系统回退到本地答案与提示。
- 数据库损坏：`npm run db:init` 重新初始化（会重置演示数据）。
