# Lingshan AI Guide

Web visitor client and management console for the A5 scenic-area AI digital-human guide project.

## Current Scope

This project follows `../任务清单.md`.

- `P0-01`: frontend route isolation for `/visitor` and `/admin`
- `P0-02`: backend API foundation with unified responses and request logs
- `P0-03`: database schema draft
- `P0-04`: seed and migration command placeholders
- `P0-05`: API contract draft
- `P0-06`: basic admin login and anonymous visitor session
- `P0-07`: upload API foundation

## Run

```powershell
cd prj
npm.cmd run dev
```

Open:

- Visitor client: `http://127.0.0.1:5178/visitor`
- Admin console: `http://127.0.0.1:5178/admin`
- API health: `http://127.0.0.1:5178/api/health`

## Notes

The first baseline intentionally uses no external runtime dependency so it can start before network-dependent package installation. Later tasks can replace the static web shell with React/Vite and the in-memory services with a real database.
