// server.js
import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = 3000;

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const API_KEY = process.env.GOOGLE_API_KEY;
const CX = process.env.GOOGLE_CX;

// Minimal /chat endpoint
app.post("/chat", async (req, res) => {
  const userMessage = req.body?.message;
  console.log("User asked:", userMessage);

  if (!userMessage) return res.status(400).json({ reply: "❌ No message provided." });

  try {
    const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(userMessage)}&key=${API_KEY}&cx=${CX}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const results = data.items.slice(0, 3).map(item => ({
        title: item.title,
        snippet: item.snippet,
        link: item.link
      }));
      return res.json({ reply: results });
    }

    res.json({ reply: "❌ Sorry, I couldn't find anything." });
  } catch (error) {
    console.error("Error fetching from Google API:", error);
    res.status(500).json({ reply: "⚠️ Something went wrong on the server." });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running at http://127.0.0.1:${PORT}`);
});
