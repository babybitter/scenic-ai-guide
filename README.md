# Scenic AI Guide

The system has two sides:

- **Visitor client** — a multimodal digital-human guide: voice / text Q&A grounded in
  a local scenic knowledge base, personalized route recommendations, spot narration,
  and emotional interaction.
- **Admin console** — knowledge-base management, digital-human configuration,
  operations dashboards, and visitor feedback / service-quality analysis.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Vue 3 + TypeScript + Vite + Element Plus (based on art-design-pro) |
| Digital human | iFlytek interactive streaming avatar (WebRTC, cloud lip-sync + TTS + expression) |
| Backend | Node.js (HTTP API) with a local RAG pipeline over the official Lingshan corpus |
| Persistence | SQLite |
| AI capabilities | Cloud LLM (OpenAI-compatible) / ASR / TTS, with an offline demo fallback |

## Repository layout

```
scenic-ai-guide/
  web/                 Vue 3 frontend (visitor client + admin console)
  server/              Node.js backend (RAG, LLM, voice, routes, analytics)
    src/               API services and app entry
    scripts/           build / test / eval / ops scripts
    data/generated/    prebuilt knowledge base (spots, chunks, corpus)
  docs/                design doc, deployment manual, source materials
```

## Quick start

```bash
# 1. Backend
cd server
npm install
npm start                 # serves the API on http://127.0.0.1:5178

# 2. Frontend
cd ../web
pnpm install
pnpm dev                  # opens the app; /api is proxied to the backend
```

See `docs/deployment.md` for the full setup, environment variables, and demo-mode notes.

## Provenance

- Backend logic and knowledge base migrated from the team's first-version project.
- Digital-human integration migrated from the iFlytek avatar SDK used in the MOSS project.
- Frontend rebuilt on the art-design-pro admin framework.
