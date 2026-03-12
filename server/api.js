// ─────────────────────────────────────────────────────────────────────────────
// Lightweight Express API proxy for OpenAI ChatGPT completions.
// Keeps the API key server-side only — never exposed to the browser.
// ─────────────────────────────────────────────────────────────────────────────

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config(); // reads .env from project root

const app = express();
const PORT = process.env.API_PORT || 3001;

app.use(cors({ origin: true }));
app.use(express.json());

// ─── Health check ────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
});

// ─── Chat completions proxy ─────────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "messages array is required" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error("❌ OPENAI_API_KEY is not set in .env");
        return res.status(500).json({ error: "Server misconfiguration: missing API key" });
    }

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages,
                max_tokens: 1000,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`OpenAI API error (${response.status}):`, errorText);
            return res.status(response.status).json({
                error: `OpenAI API error: ${response.statusText}`,
                details: errorText,
            });
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content ?? "I'm sorry, I couldn't process that.";

        res.json({ reply });
    } catch (err) {
        console.error("Proxy error:", err);
        res.status(500).json({ error: "Failed to reach OpenAI API" });
    }
});

app.listen(PORT, () => {
    console.log(`✅ API proxy running on http://localhost:${PORT}`);
});
