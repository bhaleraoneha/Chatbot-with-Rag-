// Run with: npm run ingest
// Reads every .txt file in docs/, chunks it, embeds each chunk with Gemini,
// and saves the result to data/vectorstore.json.

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const API_KEY = process.env.GEMINI_API_KEY;
const EMBED_MODEL = "gemini-embedding-001";
const DOCS_DIR = path.join(process.cwd(), "docs");
const OUT_FILE = path.join(process.cwd(), "data", "vectorstore.json");

function chunkText(text, chunkSize = 800, overlap = 100) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }
  return chunks;
}

async function embed(text) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: { parts: [{ text }] } }),
    }
  );
  if (!res.ok) {
    throw new Error(`Embed failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.embedding.values;
}

async function main() {
  if (!API_KEY) {
    console.error("Missing GEMINI_API_KEY. Copy .env.example to .env.local and add your key.");
    process.exit(1);
  }

  const files = fs.readdirSync(DOCS_DIR).filter((f) => f.endsWith(".txt"));
  if (files.length === 0) {
    console.error("No .txt files found in docs/. Add at least one document first.");
    process.exit(1);
  }

  const vectorStore = [];
  for (const file of files) {
    const raw = fs.readFileSync(path.join(DOCS_DIR, file), "utf-8");
    const chunks = chunkText(raw);
    console.log(`Embedding ${chunks.length} chunk(s) from ${file}...`);
    for (const chunk of chunks) {
      const embedding = await embed(chunk);
      vectorStore.push({ source: file, text: chunk, embedding });
      await new Promise((r) => setTimeout(r, 200)); // gentle rate limiting
    }
  }

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(vectorStore, null, 2));
  console.log(`Done. Saved ${vectorStore.length} chunks to ${OUT_FILE}`);
}

main();
