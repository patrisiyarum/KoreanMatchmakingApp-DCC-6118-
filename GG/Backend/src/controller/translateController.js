import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
const genAI = new GoogleGenerativeAI(GEMINI_KEY || "placeholder");
const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

const LANG_LABEL = {
  en: "English",
  ko: "Korean",
};

function labelFor(code) {
  if (!code) return null;
  const key = String(code).trim().toLowerCase();
  return LANG_LABEL[key] || String(code);
}

export async function translate(req, res) {
  try {
    const text = String(req.body?.text ?? "").trim();
    const from = labelFor(req.body?.from);
    const to = labelFor(req.body?.to);

    if (!text) return res.status(400).json({ error: "text is required" });
    if (!to) return res.status(400).json({ error: "to language is required" });

    if (!GEMINI_KEY) {
      return res.status(503).json({ error: "Translation is not configured (GEMINI_API_KEY missing)." });
    }

    const prompt = [
      `Translate the text below ${from ? `from ${from} ` : ""}into ${to}.`,
      "Output ONLY the translation — no quotes, no explanations, no romanization, no notes.",
      "If the text is already in the target language, return it unchanged.",
      "",
      "Text:",
      text,
    ].join("\n");

    const result = await model.generateContent(prompt);
    const translated = (result?.response?.text?.() ?? "").trim();

    if (!translated) {
      return res.status(502).json({ error: "Translation returned empty result." });
    }

    return res.status(200).json({ translatedText: translated });
  } catch (err) {
    const msg = String(err?.message || err || "");
    console.error("translate error:", msg);
    if (/429|quota|exceeded/i.test(msg)) {
      return res.status(429).json({ error: "Translation quota exceeded, please try again later." });
    }
    if (/403|API key/i.test(msg)) {
      return res.status(503).json({ error: "Translation is not configured (invalid API key)." });
    }
    return res.status(500).json({ error: "Translation failed." });
  }
}
