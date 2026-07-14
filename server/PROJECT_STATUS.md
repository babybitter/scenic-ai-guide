# Project Status

## Active Execution Baseline

Source task list: `../任务清单.md`

UI requirement: do not use emoji in any user-facing interface.

Project root: `prj/`

## Completed

- `P0-01`: frontend shell with route isolation for `/visitor` and `/admin`
- `P0-02`: backend API foundation with config loading, request logging and unified JSON responses
- `P0-03`: database schema draft for sessions, messages, knowledge, scenic spots, routes, digital human configs, feedback and behavior analysis
- `P0-04`: seed and migration implementation pending, but data directory foundation exists
- `P0-05`: initial OpenAPI contract draft
- `P0-06`: basic admin login and anonymous visitor session API
- `P0-07`: upload API foundation for docx, xlsx, txt, md and pdf files

## Completed In AI2 (大模型问答与导游对话)

- `AI2-01`: cloud LLM provider abstraction (`server/src/services/llm.mjs`). OpenAI `/chat/completions` compatible provider with model name, API key, timeout, retry and streaming, plus an offline deterministic mock provider so the demo runs with no API key. Configured via `LLM_PROVIDER`/`LLM_BASE_URL`/`LLM_MODEL`/`LLM_API_KEY`.
- `AI2-02`: RAG answer API `POST /api/chat/ask` returning grounded answer, retrieval context, citations and latency breakdown (`server/src/services/chat.mjs`).
- `AI2-03`: grounded, Lingshan-only system prompt that forbids fabricated facts (`server/src/services/prompts.mjs`).
- `AI2-04`: out-of-scope handling — other scenic areas are redirected back to Lingshan (`guardrails.mjs`).
- `AI2-05`: no-data handling — honest "materials not covered" reply with follow-up directions, gated by a relevance check so a generic scenic-area name match does not force a grounded answer.
- `AI2-06`: colloquial questions resolved through synonym expansion in retrieval ("那个大佛多高").
- `AI2-07`: multi-turn follow-ups — pronoun questions ("它多高") re-anchored to the last discussed spot via the in-memory conversation store.
- `AI2-08`: guide persona prompt (warm, professional, concise; no emoji).
- `AI2-09`: answer length control — qa 80-180, explain 200-400, route step-by-step.
- `AI2-10`: scenic-spot narration `POST /api/chat/narrate` (~1 minute spoken script).
- `AI2-11`: real-time accompanying narration `POST /api/chat/accompany`, tailored to visitor interests.
- `AI2-12`: FAQ cache (`faqCache.mjs`) with TTL; repeat questions skip retrieval + LLM.
- `AI2-13`: sensitive/irrelevant input filtering (abuse, politics, medical, investment, danger).
- `AI2-14`: answer quality labels (事实问答 / 路线推荐 / 情感安抚 / 闲聊 / 拒答) plus an emotion tag for later digital-human expression.

Also: streaming endpoint `POST /api/chat/stream` (SSE) and `GET /api/chat/history`. Visitor client now calls `/api/chat/ask`, rendering answer, quality label, sources and latency with loading and error states.

Verification: `npm run test:chat` passes 12/12 scenario tests; `npm run eval:chat` passes 50/50 standard QA cases; `npm run eval:retrieval` passes with Top3 title/spot/term recall at 100%.

## Next

Start `U6` visitor client enrichment and `V4` voice, or continue with `A7/B8` admin surfaces. The AI2 answer API, narration API, quality/emotion labels and latency metrics are ready for `U6`, `V4-10`, `DH5-07` and `B8` to build on.

## Completed In K1

- `K1-01`: parsed official structured scenic spot DOCX.
- `K1-02`: parsed official history and guide DOCX.
- `K1-03`: filtered out Nianhua Bay content for the current scope.
- `K1-04`: generated 16 structured Lingshan scenic spot entities.
- `K1-05`: generated local RAG chunk JSON files.
- `K1-07`: implemented keyword retrieval over scenic spot names, aliases, topic words, open information and route words.
- `K1-08`: implemented local hybrid retrieval with keyword scoring, content coverage and scenic spot entity weighting. Embedding/vector recall will be added in the later model integration step.
- `K1-09`: implemented reranking rules for height, open time, performance time, ticket, route and highlight intents.
- `K1-10`: standardized citation output with document name, section title, scenic spot identity and short quote.
- `K1-11`: created standard test sets: 20 retrieval cases and 50 RAG answer-accuracy cases based mainly on the official Lingshan test data, with a small number of boundary scenarios.
- `K1-12`: implemented batch retrieval evaluation and batch chat-answer evaluation. Current local retrieval evaluation passes Top3 checks; current chat accuracy evaluation passes 50/50 cases.

Generated files:

- `data/generated/knowledge.json`
- `data/generated/scenic-spots.json`
- `data/generated/knowledge-chunks.json`
- `data/tests/retrieval-cases.json`
- `data/tests/chat-accuracy-cases.json`

Verification commands:

- `npm.cmd run build:knowledge`
- `npm.cmd run test:retrieval`
- `npm.cmd run eval:retrieval`
- `npm.cmd run eval:chat`
- `npm.cmd run check`

## Completed In R3

- `R3-01`: built a local Lingshan route graph with entrance, main scenic nodes and exit (`server/src/services/routePlanner.mjs`).
- `R3-02`: tagged scenic nodes for history, Buddhist culture, parent-child, photo, show, indoor, easy-walk and landmark preferences.
- `R3-03`: implemented visitor preference normalization for duration, interests, group type, physical level, shows, photo focus and child-friendly travel.
- `R3-04`: implemented a 1-hour core route.
- `R3-05`: implemented a 2-3 hour classic route.
- `R3-06`: implemented a half-day deep culture route.
- `R3-07`: implemented a parent-child light route.
- `R3-08`: implemented a Buddhist culture deep route.
- `R3-09`: implemented a photo check-in route.
- `R3-10`: generated route explanations with ordered nodes, reasons and notes.
- `R3-11`: added route-node narration handoff via `POST /api/routes/node/narrate`.
- `R3-12`: handled under-30-minute visits by compressing to core check-in nodes.
- `R3-13`: handled conflicting interests with balanced route adaptation notes.
- `R3-14`: saved visitor route selections in the in-memory selection store for later analytics.

Route APIs:

- `GET /api/routes/graph`
- `POST /api/routes/recommend`
- `POST /api/routes/save`
- `GET /api/routes/saved`
- `POST /api/routes/node/narrate`

Verification:

- `npm.cmd run test:routes`

## Completed In V4

- `V4-01`: added mock ASR service and `POST /api/voice/asr`; it accepts browser-provided transcript or audio payload and keeps a cloud-provider error surface for later integration.
- `V4-02`: added visitor voice input controls; supported browsers use Web Speech API, unsupported browsers fall back to a mock voice demo.
- `V4-03`: browser speech-recognition errors show a text/mock fallback message.
- `V4-04`: reserved the ASR provider abstraction for cloud providers through `ASR_PROVIDER`/`ASR_API_KEY`.
- `V4-05`: added mock TTS service and `POST /api/voice/tts`, returning segmented audio URLs.
- `V4-06`: visitor answers can be played and replayed from generated TTS segments.
- `V4-07`: added `POST /api/voice/ask` for voice input -> ASR -> RAG answer -> TTS playback.
- `V4-08`: retained text fallback through the existing chat input when voice is unavailable.
- `V4-09`: implemented long-answer segmentation before TTS synthesis.
- `V4-10`: voice pipeline returns ASR, RAG, LLM, TTS and total latency metrics.
- `V4-11`: voice answers use the existing FAQ cache plus segmented audio for faster repeated questions and first playable segment.

Voice APIs:

- `POST /api/voice/asr`
- `POST /api/voice/tts`
- `POST /api/voice/ask`
- `GET /api/voice/tts/audio/:id`

Verification:

- `npm.cmd run test:voice`

## Completed In DH5

- `DH5-01`: documented/abstracted the digital-human integration boundary through a local `digitalHuman` service; the current renderer now loads local Live2D assets from `awesome-digital-human-live2d`.
- `DH5-02`: selected the local Live2D branch for the current deliverable, using the copied `Kei` Cubism model and browser runtime under `web/public`.
- `DH5-03`: implemented the visitor digital-human display area with a high-resolution Live2D canvas instead of the previous CSS avatar.
- `DH5-04`: connected TTS playback flow to digital-human speaking state and Live2D mouth animation.
- `DH5-05`: implemented idle, listening, thinking, speaking, guiding and finished states.
- `DH5-06`: implemented expression classes for smile, apology, thanks, think and calm.
- `DH5-07`: mapped AI answer label/emotion/scenario to expression and action through `mapAnswerToDigitalHumanState`.
- `DH5-08`: implemented basic wave, nod and point actions for greeting, refusal and route guidance.
- `DH5-09`: removed the old CSS avatar placeholder and now defaults fully to the local Live2D model.
- `DH5-10`: added admin-side digital-human configuration controls and protected config update API.
- `DH5-11`: visitor client reads the active digital-human config from `GET /api/digital-human/config`.
- `DH5-12`: added preload/warm endpoint for the active Live2D digital-human asset.

Live2D assets copied from `../awesome-digital-human-live2d-main`:

- `web/public/sentio/core/live2dcubismcore.min.js`
- `web/public/sentio/characters/free/Kei/`
- `web/public/vendor/pixi.min.js`
- `web/public/vendor/pixi-live2d-cubism4.min.js`

Digital-human APIs:

- `GET /api/digital-human/config`
- `GET /api/digital-human/configs`
- `POST /api/digital-human/config`
- `POST /api/digital-human/preload`

Verification:

- `npm.cmd run test:digital-human`

## Completed In U6

- `U6-01`: expanded the visitor page with digital-human, chat, quick questions, scenic-spot cards, route recommendation and feedback areas.
- `U6-02`: text Q&A remains wired to `POST /api/chat/ask` with answer labels, sources and latency.
- `U6-03`: voice Q&A remains wired to `POST /api/voice/ask` with transcript answer and playback.
- `U6-04`: quick question buttons are available on the visitor page.
- `U6-05`: added scenic-spot card list from `GET /api/scenic-spots`.
- `U6-06`: scenic-spot cards trigger `POST /api/chat/narrate`, render narration in chat and play TTS through the Live2D mouth driver.
- `U6-07`: added route preference controls for duration, interests, parent-child and photo focus.
- `U6-08`: route recommendation results render ordered nodes, duration and explanation from `POST /api/routes/recommend`; selected routes are saved through `POST /api/routes/save`.
- `U6-09`: route nodes trigger `POST /api/routes/node/narrate`, render narration and play TTS.
- `U6-10`: added visitor feedback submission with vote, 1-5 rating and comment through `POST /api/feedback`.
- `U6-11`: feedback vote triggers a lightweight emotional response from the digital human.
- `U6-12`: visitor page restores recent chat history from `GET /api/chat/history` when an existing visitor session is present.
- `U6-13`: visitor tool areas use responsive single-column layout on mobile widths.
- `U6-14`: scenic-spot and route panels show loading states.
- `U6-15`: scenic-spot, route and feedback flows show recoverable error messages.

Visitor APIs used:

- `GET /api/scenic-spots`
- `POST /api/chat/narrate`
- `POST /api/routes/recommend`
- `POST /api/routes/save`
- `POST /api/routes/node/narrate`
- `POST /api/feedback`

Verification:

- `npm.cmd run check`
- `npm.cmd run test:routes`
- `npm.cmd run test:voice`

## Completed In A7

- `A7-01`: expanded the admin page into a knowledge-management workbench after login.
- `A7-02`: added uploaded-document listing with file name, size, status and created time.
- `A7-03`: added real file selection and base64 upload for docx/xlsx/txt/md/pdf through `POST /api/uploads`.
- `A7-04`: added knowledge summary/status metrics and a rebuild button wired to `POST /api/knowledge/rebuild`.
- `A7-05`: added knowledge chunk search preview using `POST /api/knowledge/search`, with hybrid/keyword mode selection.
- `A7-06`: added admin scenic-spot table with create, edit and disable operations backed by in-memory overrides.
- `A7-07`: added editable alias management for scenic spots.
- `A7-08`: added fixed FAQ management and made `POST /api/chat/ask` prefer enabled admin FAQ answers before RAG.
- `A7-09`: exposed knowledge rebuild from the admin workbench.
- `A7-10`: upload and search flows surface recoverable error messages.
- `A7-11`: admin knowledge search preview shows matching chunks, scores and source text.

Admin knowledge APIs:

- `GET /api/knowledge/summary`
- `POST /api/knowledge/rebuild`
- `GET /api/uploads`
- `POST /api/uploads`
- `POST /api/knowledge/search`
- `GET /api/admin/scenic-spots`
- `POST /api/admin/scenic-spots`
- `PUT /api/admin/scenic-spots/:id`
- `DELETE /api/admin/scenic-spots/:id`
- `GET /api/admin/faqs`
- `POST /api/admin/faqs`
- `PUT /api/admin/faqs/:id`

Verification:

- `npm.cmd run check`
- `npm.cmd run test:chat`
- `npm.cmd run test:routes`
- `npm.cmd run test:voice`

## Completed In B8

- `B8-01` to `B8-03`: parse the official Excel behavior file, filter 522 Lingshan-related records, normalize age, gender, visit date, stay duration, spending fields, group size and satisfaction.
- `B8-04` to `B8-12`: admin dashboard now exposes service counts, total questions, satisfaction, latency, hot questions, scenic focus, emotion trend, route preference, consumption structure, persona, stay/spend/satisfaction relation and operation suggestions.
- `B8-13`: dashboard filters support gender, age band and minimum satisfaction.
- `B8-14`: admin operation dashboard UI shows KPI cards, rankings, consumption/persona/stay panels and suggestions for competition demo.
- `B8-15`: seed fallback remains available when Excel is missing, but tests now require the official Excel path to parse successfully.
- Explicitly covered: `B8-02`, `B8-05`, `B8-06`, `B8-07`, `B8-08`, `B8-09`, `B8-10`, `B8-11`.

B8 APIs:

- `POST /api/admin/analytics/import`
- `GET /api/admin/analytics/dashboard`

Verification:

- `npm.cmd run test:analytics`

## Completed In C9

- `C9-01`: admin digital-human config list shows name, asset/outfit, voice, status and enabled marker.
- `C9-02`: admin can create/update configs with name, welcome text, Live2D asset path, outfit, voice, speech rate and service status.
- `C9-03`: enabling a config disables the previous default; visitor reads the active config from `GET /api/digital-human/config`.
- `C9-04`: admin voice preview calls TTS and plays the generated sample.
- `C9-05`: visitor page displays and attempts to speak the active welcome text on entry.
- `C9-06`: service status supports online, maintenance and text-only modes.
- `C9-07`: missing local character assets are detected and marked for static/text/audio fallback.

Verification:

- `npm.cmd run test:digital-human`

## Completed In F10

- `F10-01`: admin conversation list summarizes session ID, start/update time, message count, satisfaction and main focus.
- `F10-02`: conversation detail shows complete messages with labels, latency and feedback.
- `F10-03`: low-satisfaction session filter is available.
- `F10-04`: admin can annotate messages as correct/wrong/needs knowledge through API; UI exposes a needs-knowledge action.
- `F10-05`: annotated/error messages can generate knowledge supplement drafts.
- `F10-06`: feedback records are listed through the session detail and clustered in the admin review panel.
- `F10-07`: feedback clustering groups common issues such as performance time, route length, ticket/spending and answer accuracy.
- `F10-08`: service quality report summarizes satisfaction, low-satisfaction sessions, common issues, wrong-answer count and optimization suggestions.

F10 APIs:

- `GET /api/admin/conversations`
- `GET /api/admin/conversations/:sessionId`
- `POST /api/admin/messages/:messageId/annotation`
- `POST /api/admin/messages/:messageId/knowledge-draft`
- `GET /api/admin/feedback/clusters`
- `GET /api/admin/service-quality/report`

Verification:

- `npm.cmd run test:service-quality`

## Completed In S11 / Demo Hardening

- `P0-05`: updated `server/src/contracts/openapi.json` with the newer admin scenic spot, FAQ, analytics, conversation, feedback-cluster and service-quality endpoints.
- `S11-01`: backend request logging was already present in `server/src/app.mjs`; all requests log method, path, status and duration.
- `S11-02`: LLM provider already has timeout/retry controls; ASR/TTS now support demo fallback when cloud keys are absent.
- `S11-03`: environment check reports missing `LLM_API_KEY`, `ASR_API_KEY` or `TTS_API_KEY` when real providers are selected.
- `S11-04`: added `DEMO_MODE` config. With `DEMO_MODE=true`, missing cloud keys fall back to deterministic local mock LLM/ASR/TTS for stable rehearsals.
- `S11-06`: added frontend global error boundary/toast to avoid silent page failures.
- `S11-07`: visitor question and voice flows already guard against duplicate submissions with pending flags.
- `S11-08`: added concurrent Q&A smoke test for multiple visitor sessions.
- `S11-10`: `npm.cmd run dev` / `npm.cmd start` remain the one-command local startup path.
- `S11-11`: added `npm.cmd run env:check` for Node version, data files, directories, port and provider key checks.
- `S11-12`: added `npm.cmd run backup` and `npm.cmd run restore` for data backup/restore. Backups default to `prj/backups/`.

New scripts:

- `npm.cmd run env:check`
- `npm.cmd run backup`
- `npm.cmd run restore`
- `npm.cmd run test:concurrency`
- `npm.cmd run test:demo-mode`

Verification:

- `npm.cmd run env:check`
- `npm.cmd run test:demo-mode`
- `npm.cmd run test:concurrency`
- `npm.cmd run backup`

## Completed In T12

- `T12-02`: RAG retrieval tests verify core Lingshan questions hit the expected chunks.
- `T12-03`: 50-case answer accuracy evaluation is available through `npm.cmd run eval:chat`.
- `T12-04`: route recommendation tests cover different visitor preferences.
- `T12-06`: digital-human tests cover active config, state mapping and fallback config behavior.
- `T12-08`: analytics tests verify official Excel filtering and dashboard structures.
- `T12-11`: demo-mode test verifies cloud-provider/key failure fallback.

Remaining T12 items are mostly manual/end-to-end checklist work: T12-01, T12-05, T12-07, T12-09, T12-10.
