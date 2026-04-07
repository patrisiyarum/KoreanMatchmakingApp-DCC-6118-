import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Plesk often uses /httpdocs/api/public; local dev uses src/public — serve both
const staticRoots = [
    path.join(__dirname, "../../public"),
    path.join(__dirname, "../public"),
];

const configViewEngine = (app) => {
    for (const root of staticRoots) {
        app.use(express.static(root));
    }
    app.set("view engine", "ejs");
    app.set("views", path.join(__dirname, "../views"));
};

export default configViewEngine;