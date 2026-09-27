import { NextResponse } from "next/server";
import { embedText } from "../../../lib/gemini";

// Lets a user upload their own .txt document at runtime. It gets chunked and
// embedded here, and the resulting chunks are sent back to the browser, which
// holds onto them and includes them in each /api/chat request. This avoids
// needing a database or writable disk in the deployed (serverless) environment.

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

export async function POST(req) {
  try {
    const { filename, text } = await req.json();
    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Document text is required." }, { status: 400 });
    }

    const chunks = chunkText(text);
    const embedded = [];
    for (const chunk of chunks) {
      const embedding = await embedText(chunk);
      embedded.push({ source: filename || "uploaded.txt", text: chunk, embedding });
    }

    return NextResponse.json({ chunks: embedded });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Embedding failed." }, { status: 500 });
  }
}
