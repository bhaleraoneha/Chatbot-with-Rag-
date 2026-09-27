# Document Q&A Assistant (RAG) — Starter Project

A small, deployable RAG app: chat with an AI assistant that answers **only from
your own documents**, using Google's free Gemini API for both embeddings and
chat generation. No paid API key needed.

---

## 0. What's inside

- `docs/` — put your source documents here (`.txt` files)
- `scripts/ingest.mjs` — chunks + embeds your docs into `data/vectorstore.json`
- `lib/gemini.js` — calls to Gemini's embedding + chat API
- `lib/similarity.js` — cosine-similarity search over your embedded chunks
- `app/api/chat/route.js` — the backend endpoint the UI calls
- `app/page.js` — the chat UI (loading state + error handling included)

---

## 1. Get a free API key (2 minutes, no credit card)

1. Go to https://aistudio.google.com/app/apikey
2. Sign in with a Google account
3. Click **Create API key**
4. Copy the key

---

## 2. Set up the project locally

```bash
# unzip the project, then inside the folder:
npm install
cp .env.example .env.local
```

Open `.env.local` and paste your key:

```
GEMINI_API_KEY=your_actual_key_here
```

---

## 3. Add your document set

Delete the placeholder `docs/sample.txt` and add your own `.txt` file(s) —
product docs, a book, your notes, anything. This is the "specific document
set" the task requires the assistant to be grounded in.

(If your source is a PDF or Word doc, convert it to `.txt` first — plain
text is all this starter needs to keep things simple and dependency-free.)

---

## 4. Build the vector index

```bash
npm run ingest
```

This reads everything in `docs/`, splits it into chunks, embeds each chunk
with Gemini, and writes `data/vectorstore.json`. Re-run this any time you
change your documents.

---

## 5. Test it locally

```bash
npm run dev
```

Open http://localhost:3000 and ask a question. Then — important — ask a
question that **only your documents** could answer (something a generic
model wouldn't know). If the answer is correct, retrieval is genuinely
working, not just a ChatGPT-style wrapper.

---

## 6. Push to GitHub

```bash
git init
git add .
git commit -m "RAG assistant starter"
```
Create a new empty repo on GitHub, then:
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

`.env.local` is already git-ignored, so your key never gets committed.

---

## 7. Deploy on Vercel (free)

1. Go to https://vercel.com and sign in with GitHub
2. Click **Add New → Project**, select your repo
3. Before deploying, open **Environment Variables** and add:
   - Key: `GEMINI_API_KEY`
   - Value: your key
4. Click **Deploy**

Your `data/vectorstore.json` file is committed to the repo (from step 4), so
it deploys along with the code — no extra database needed for a small
document set.

If you update your docs later: re-run `npm run ingest` locally, commit the
updated `data/vectorstore.json`, and push — Vercel redeploys automatically.

---

## 8. Verify before submitting

- [ ] Open the live URL — the chat UI loads
- [ ] Ask a normal question about your docs — get a grounded answer
- [ ] Ask something only your docs could know — confirm it answers correctly
      (this is what the reviewer will test)
- [ ] Ask something **not** in your docs — confirm it says it doesn't know,
      rather than guessing
- [ ] Temporarily rename `.env.local` and reload — confirm you see a clean
      error message, not a crash (then rename it back)

---

## Notes on the requirements checklist

- **Retrieval demonstrably working** → the "only docs could answer" test above
- **Engineered prompts** → `SYSTEM_PROMPT` in `app/api/chat/route.js` instructs
  the model to answer only from context and say "I don't know" otherwise
- **Loading/error handling** → built into `app/page.js`
- **Secrets not committed** → `.env.local` is git-ignored; only `.env.example`
  (no real key) is committed
