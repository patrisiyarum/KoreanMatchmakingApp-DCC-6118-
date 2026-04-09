# LangMatch frontend (Vite + React + TypeScript)

This app matches the **Language Exchange Matchmaker App** Figma UI (Tailwind v4, shadcn-style components).

## Scripts

- `npm run dev` — Vite dev server (default `http://localhost:5173`). API calls use `src/api/apiBase.ts` and target `http://localhost:8080` in development when `public/config.js` has `API_BASE_URL: ''`.
- `npm run build` — output in `build/` (used for static deploy / Plesk).
- `npm run build:zip` — `build/` + `build.zip`.

## Auth & routes

- `/welcome` — onboarding card (demo profile form).
- `/login`, `/register` — backend `POST /api/login` and `POST /Register`.
- After login: `/home` dashboard shortcuts; main shell uses bottom nav (Home, Discover, Partners, Schedule, Games).

Session user id is stored in `sessionStorage` (`lm_userId`).

## Runtime config

Edit `public/config.js` on the server for `API_BASE_URL` without rebuilding.
