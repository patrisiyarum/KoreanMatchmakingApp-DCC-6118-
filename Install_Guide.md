# Install Guide — LangMatch (DCC 6118)

This guide walks a new operator through installing, building, and running LangMatch locally. The deployed instance is at https://languagematchmaker.modlangs.gatech.edu — these instructions are for self-hosting / development.

## 1. Prerequisites

### Hardware
* Any modern macOS, Linux, or Windows machine (~4 GB RAM minimum free).
* ~2 GB free disk space (for `node_modules` of both Backend and Frontend).

### Software
| Tool | Version | Link |
|---|---|---|
| Git | latest | https://git-scm.com/downloads |
| Node.js + npm | 18 LTS or newer (tested on 22) | https://nodejs.org/en |
| MySQL Server | 8.x (use the "full" installer for the easiest setup) | https://dev.mysql.com/downloads/installer/ |
| Python 3 | 3.9+ (only if you need on-device transcription via Whisper) | https://www.python.org/downloads/ |
| Modern browser | Chrome / Edge / Firefox | — |

### External accounts (optional, but several features require them)
| Service | Used for | How to get a key |
|---|---|---|
| Google Gemini | AI Chat Assistant + in-site translator | https://aistudio.google.com/apikey (free tier available) |
| Agora | In-app video calls (RTC SDK) | https://console.agora.io/ — create a project to get an App ID |

## 2. Download

```bash
git clone https://github.com/patrisiyarum/KoreanMatchmakingApp-DCC-6118-.git
cd KoreanMatchmakingApp-DCC-6118-/GG
```

All commands below assume you are inside `KoreanMatchmakingApp-DCC-6118-/GG`.

## 3. Install Dependencies

### Backend
```bash
cd Backend
npm install
# Optional — only if you want local Whisper transcription:
python install_whisper.py            # macOS / Linux
python install_whisper_windows.py    # Windows
```

### Frontend
```bash
cd ../Frontend
npm install --legacy-peer-deps
```

### Socket.io chat server
```bash
cd ../socket
npm install
```

## 4. Configure the Database

1. Start MySQL and connect as root.
2. Create an empty schema named exactly `languageexchangematchmaker`:
   ```sql
   CREATE SCHEMA languageexchangematchmaker;
   ```
3. Either set your MySQL root password to empty (`SET PASSWORD FOR 'root'@'localhost' = '';`) **or** edit `GG/Backend/src/config/sequelize.config.cjs` and put your password where the value is `null`.
4. Run the migrations:
   ```bash
   cd GG/Backend
   npx sequelize-cli db:migrate --config src/config/sequelize.config.cjs
   ```
5. *(Optional)* Seed sample data:
   ```bash
   cat ../../database-import-all-in-one.sql | mysql -u root languageexchangematchmaker
   ```

## 5. Configure Environment Variables

```bash
cd GG/Backend
cp .env.example .env
```

Open `.env` and set:
* `GEMINI_API_KEY` — your Google AI Studio key (required for AI Chat + translator).
* `AGORA_APP_ID` — your Agora project App ID (required for video calls).
* *(Optional)* `AGORA_APP_CERTIFICATE` — required only if your Agora project enforces token-based authentication.
* *(Optional)* `GEMINI_MODEL` — override the default `gemini-2.5-flash-lite`.
* *(Optional)* `PORT` — backend port (defaults to `8080`).

The Frontend reads its API base from `GG/Frontend/public/config.js`. Leaving `API_BASE_URL: ''` lets the dev server proxy `/api` to the backend automatically (no edit needed for local dev).

## 6. Build the Frontend

For local development, you do **not** need a production build — `npm run dev` runs Vite with hot reload.

For deployment / static hosting:
```bash
cd GG/Frontend
npm run build           # outputs to GG/Frontend/build/
# or
npm run build:zip       # also produces build.zip for upload
```
The Express backend serves the built `index.html` and `assets/` from `GG/Backend/src/public/` when present. To deploy locally, copy `build/` contents into `GG/Backend/src/public/`.

## 7. Run the Application

You will need **three terminals** running simultaneously.

**Terminal 1 — Backend (port 8080):**
```bash
cd GG/Backend
npm start
```

**Terminal 2 — Frontend (dev server, port 5173):**
```bash
cd GG/Frontend
npm run dev
```

**Terminal 3 — Socket.io chat (port 8800):**
```bash
cd GG/socket
node index.js
```

Open http://localhost:5173 in your browser.

## 8. Using AI / Video Features

### AI Chat Assistant (Gemini)
1. Confirm `GEMINI_API_KEY` is set in `GG/Backend/.env` (see step 5).
2. Restart the backend after changing the key.
Without a valid key the assistant returns "Sorry! There was a backend error."

### Video Calls (Agora)
1. Create a project at https://console.agora.io/ and copy the **App ID**. For token-secured channels also copy the **App Certificate**.
2. In `GG/Backend/.env` set:
   ```
   AGORA_APP_ID=your_app_id
   AGORA_APP_CERTIFICATE=your_app_certificate   # optional; required if your project enforces tokens
   ```
3. Restart the backend. Calls run inside the SPA via the Agora Web SDK (no external app or invite link required).

## 9. Troubleshooting

| Symptom | Cause / Fix |
|---|---|
| `db:migrate` fails with auth error | MySQL root has a password but `sequelize.config.cjs` has `null`. Either remove the password (`SET PASSWORD FOR 'root'@'localhost' = '';`) or edit the config file. |
| `db:migrate` fails with "Unknown database" | The `languageexchangematchmaker` schema does not exist. Create it (see step 4.2). |
| Backend won't start on port 8080 | Another process is using the port. Find and kill it: `lsof -t -i:8080 | xargs kill` (macOS/Linux). |
| Frontend shows blank page in production | The Express SPA static dir (`GG/Backend/src/public/`) doesn't have your latest `index.html`/`assets/`. Re-run `npm run build` and copy `build/` contents in. |
| AI Chat returns "Sorry! There was a backend error." | `GEMINI_API_KEY` missing/invalid in `.env`, or the free-tier daily quota was hit. Check Google AI Studio. |
| Chat messages not delivered | Socket.io server (`GG/socket`) is not running, or the client URL doesn't match. The client expects `ws://localhost:8800`. |
| `npm install` fails with peer-dep errors | Use `npm install --legacy-peer-deps` in `GG/Frontend`. |
| Login fails on a deployed site | Check `GG/Frontend/public/config.js` — `API_BASE_URL` should be `''` when the same Node app serves both SPA and API; otherwise set the absolute backend URL. |

## 10. Tutorial Resources

* Sequelize migrations — https://sequelize.org/docs/v6/other-topics/migrations/
* React tutorial — https://react.dev/learn
* React + Node + Express + MySQL walkthrough — https://www.bezkoder.com/react-node-express-mysql/
* Vite docs — https://vite.dev/guide/
