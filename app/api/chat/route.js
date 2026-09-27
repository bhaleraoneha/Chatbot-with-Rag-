import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { embedText, generateAnswer } from "../../../lib/gemini";
import { topKChunks } from "../../../lib/similarity";

const SYSTEM_PROMPT = `You are a helpful assistant that answers questions strictly based on
the provided document context. You never make up information that isn't in the context,
and you say clearly when the answer isn't in the documents.`;

export async function POST(req) {
  try {
    const { question, uploadedChunks } = await req.json();
    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "A 'question' string is required." },
        { status: 400 }
      );
    }

    const storePath = path.join(process.cwd(), "data", "vectorstore.json");
    let baseStore = [];
    if (fs.existsSync(storePath)) {
      baseStore = JSON.parse(fs.readFileSync(storePath, "utf-8"));
    }

    // Merge the pre-built base document set with any chunks the user uploaded
    // in this session (sent from the browser, not stored server-side).
    const combinedStore = Array.isArray(uploadedChunks) && uploadedChunks.length > 0
      ? [...baseStore, ...uploadedChunks]
      : baseStore;

    if (combinedStore.length === 0) {
      return NextResponse.json(
        { error: "No documents are loaded. Run 'npm run ingest' or upload a document first." },
        { status: 500 }
      );
    }

    const queryEmbedding = await embedText(question);
    const topChunks = topKChunks(queryEmbedding, combinedStore, 4);
    const context = topChunks.map((c) => c.text).join("\n---\n");

    const answer = await generateAnswer(SYSTEM_PROMPT, context, question);

    return NextResponse.json({
      answer,
      sources: topChunks.map((c) => ({ source: c.source, score: c.score })),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Something went wrong." },
      { status: 500 }
    );
  }
}
