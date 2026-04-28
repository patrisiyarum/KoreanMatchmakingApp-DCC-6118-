# Install Guide
## PREREQUISITES 
* A computer terminal to download and run the application.
* Google Chrome to host the application.

Requirements:
* Git (https://git-scm.com/install/)
* Node.js / Node Package Manager (npm) (https://nodejs.org/en)
* MySQL (easiest to just install the "full" version) (https://dev.mysql.com/downloads/installer/)
*** Visit "Tutorial Resources" section for additional resources on setting up required software.


## DEPENDENCIES 
Open the project directory in your terminal under the GG folder.

For Backend dependencies (terminal commands): 

    cd Backend
    npm install
    python install_whisper.py (for MacOS/Linux)
    python install_whisper_windows.py (for Windows)

For Frontend dependecies (terminal commands): 

    cd Frontend 
    npm install --legacy-peer-deps
    npm install translate --legacy-peer-deps

To migrate the database:

    cd Backend
    npx sequelize-cli db:migrate
*Note that you will need to remove your database's password and create a schema named languageexchangematchmaker in order to get the database working (or update 'null' values with your DB password under relevant files in Backend/src/config/ folder)* 

## DOWNLOAD
Clone this repository locally.

## BUILD 
No builds are necessary for this app.

## INSTALLATION 
No additional files need to be added.

## RUNNING APPLICATION
Backend

    cd Backend 
    npm start

Frontend

    cd Frontend
    - `npm run dev` — Vite dev server (default `http://localhost:5173`). API calls use `src/api/apiBase.ts` and target `http://localhost:8080` in development when `public/config.js` has `API_BASE_URL: ''`.
    - `npm run build` — output in `build/` (used for static deploy / Plesk).
    - `npm run build:zip` — `build/` + `build.zip`.

# Troubleshooting: 
If the database does not properly migrate into MySQL, this is most commonly because your MySQL root/local instance still has a password or there is no languageexchangematchmaker schema.

To remove your root/local instance password:
* Right click on the local instance.
* Select "Start Command Line Client."
* Enter your password.
* Enter the command: set password for root@localhost='';

To create the correct schema, simply select "Create a new schema in the selected server" within your root/local instance and name it "languageexchangematchmaker"

# Chat Assistant (AI)
The Chat Assistant uses Google's Gemini API. To enable it:

1. Get a free API key at https://aistudio.google.com/apikey
2. Copy `GG/Backend/.env.example` to `GG/Backend/.env`
3. Set `GEMINI_API_KEY=your_key_here` in `.env`
4. Restart the backend server

Without a valid `GEMINI_API_KEY`, the Chat Assistant will return "Sorry! There was a backend error."

# Video calls (Zoom)
1. Open [Zoom](https://zoom.us/start) (or the desktop app) and **create a meeting**.
2. Copy the **invite link** (e.g. `https://zoom.us/j/…`).
3. In the app, go to **Calls** (`/Videocall`), paste the link, and continue. The app opens Zoom in a new tab; video runs there, not inside the SPA.
4. Optional **Record mic** in the app records only your microphone in the browser for transcripts (not the full Zoom mix).

# Chat (messaging)
The `/Chat` route provides a messaging UI. It expects a **Socket.io** server on port **8800** (`GG/socket/index.js`). Run it separately, e.g. `cd GG/socket && npm install && node index.js`, and ensure the client URL matches your environment (the client currently uses `ws://localhost:8800` in `Chat.js`).

# Tutorial Resources: 
* https://sequelize.org/docs/v6/other-topics/migrations/ 
* https://reactjs.org/tutorial/tutorial.html 
* https://www.bezkoder.com/react-node-express-mysql/. 
