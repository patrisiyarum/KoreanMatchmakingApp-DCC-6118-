import express from "express";
import configViewEngine from "./config/viewEngine.js";
import initWebRoute from './route/web.js';
import initAPIRoute from './route/api.js';
import cors from 'cors';
import dotenv from 'dotenv';
import { startMCPServer } from './mcp/server.js';
import { syncBadgeDefinitions } from './Service/milestoneService.js';
import mysql from "mysql2/promise";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import { sequelize } from "./models/index.js";

dotenv.config();
const app = express();

const defaultOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://languagematchmaker.modlangs.gatech.edu",
    "http://languagematchmaker.modlangs.gatech.edu",
];
const extraOrigins = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
const allowedOrigins = [...new Set([...defaultOrigins, ...extraOrigins])];

function isLocalhostDevOrigin(origin) {
    try {
        const u = new URL(origin);
        return (
            (u.hostname === "localhost" || u.hostname === "127.0.0.1") &&
            (u.protocol === "http:" || u.protocol === "https:")
        );
    } catch {
        return false;
    }
}

app.use(
    cors({
        credentials: true,
        origin(origin, cb) {
            if (!origin) return cb(null, true);
            if (allowedOrigins.includes(origin)) return cb(null, true);
            if (process.env.NODE_ENV !== "production" && isLocalhostDevOrigin(origin)) {
                return cb(null, true);
            }
            return cb(null, false);
        },
    })
);
app.set("trust proxy", 1);

const port = process.env.PORT || 8080;
const __filename_srv = fileURLToPath(import.meta.url);
const __dirname_srv  = path.dirname(__filename_srv);

//Take data from users
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname_srv, 'uploads')));

app.get("/api/health", (req, res) => {
    res.json({ ok: true, time: new Date().toISOString() });
});

/** MySQL check without loading Sequelize models (avoids Passenger crashes on model load) */
app.get("/api/db-health", async (req, res) => {
    try {
        const cfg = {
            user: process.env.DB_USER || "root",
            database: process.env.DB_NAME || "languageexchangematchmaker",
        };
        if (process.env.DB_PASSWORD !== undefined) {
            cfg.password = process.env.DB_PASSWORD;
        } else {
            cfg.password = "";
        }
        if (process.env.DB_SOCKET) {
            cfg.socketPath = process.env.DB_SOCKET;
        } else {
            cfg.host = process.env.DB_HOST || "127.0.0.1";
        }
        const conn = await mysql.createConnection(cfg);
        await conn.ping();
        await conn.end();
        res.json({ ok: true, database: "connected" });
    } catch (err) {
        console.error("db-health:", err);
        res.status(500).json({
            ok: false,
            message: err.message,
            code: err.code,
        });
    }
});

configViewEngine(app);
//init web route


initWebRoute(app);
//init API route
initAPIRoute(app);

const spaIndexCandidates = [
    path.join(__dirname_srv, "public", "index.html"),
    path.join(__dirname_srv, "..", "public", "index.html"),
];
app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    if (req.path.startsWith("/uploads")) return next();
    const accept = req.headers.accept || "";
    if (!accept.includes("text/html")) return next();
    for (const p of spaIndexCandidates) {
        if (fs.existsSync(p)) {
            return res.sendFile(path.resolve(p));
        }
    }
    next();
});

// MCP binds to port 4000 — often crashes shared hosting. Off in production unless ENABLE_MCP=1.
if (process.env.NODE_ENV !== "production" || process.env.ENABLE_MCP === "1") {
    startMCPServer().catch((err) => {
        console.error("Failed to start MCP server:", err);
    });
}

const runAfterListen = async () => {
    try {
        await sequelize.sync({ alter: true });
        console.log("Database tables synced.");
    } catch (err) {
        console.error("Database sync error:", err.message);
    }
    try {
        await syncBadgeDefinitions();
        console.log("Badge definitions synced.");
    } catch (err) {
        console.error("Badge sync skipped (tables may not exist yet):", err.message);
    }
};

// Node on Passenger/Plesk must call listen(process.env.PORT). Do not skip listen.
app.listen(port, async () => {
    console.log(`Example app listening on port ${port}`);
    await runAfterListen();
});

export default app;
