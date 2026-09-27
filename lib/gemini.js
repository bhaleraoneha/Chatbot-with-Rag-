// Thin wrapper around Google's free Gemini API for embeddings + chat completion.
// Get a free key (no credit card required) at https://aistudio.google.com/app/apikey

const API_KEY = process.env.GEMINI_API_KEY;
   const EMBED_MODEL = "gemini-embedding-001";
      const CHAT_MODEL = "gemini-3.5-flash";

export async function embedText(text) {
  if (!API_KEY) throw new Error("GEMINI_API_KEY is not set.");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { parts: [{ text }] },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Embedding API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.embedding.values;
}

export async function generateAnswer(systemPrompt, context, question) {
  if (!API_KEY) throw new Error("GEMINI_API_KEY is not set.");

  const prompt = `${systemPrompt}

Context from documents:
"""
${context}
"""

Question: ${question}

Answer using ONLY the context above. If the answer is not contained in the context,
say "I don't know based on the provided documents." Keep the answer concise.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${CHAT_MODEL}:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Generation API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return (
    data.candidates?.[0]?.content?.parts?.[0]?.text ??
    "No response generated."
  );
}
