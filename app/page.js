"use client";
import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [baseDocuments, setBaseDocuments] = useState([]);
  const [uploadedDocs, setUploadedDocs] = useState([]); // [{ name, chunks }]
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetch("/api/documents")
      .then((r) => r.json())
      .then((d) => setBaseDocuments(d.documents || []))
      .catch(() => {});
  }, []);

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const text = await file.text();
      const res = await fetch("/api/embed-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setUploadedDocs((d) => [...d, { name: file.name, chunks: data.chunks }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const question = input;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setLoading(true);
    setError("");

    const allUploadedChunks = uploadedDocs.flatMap((d) => d.chunks);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, uploadedChunks: allUploadedChunks }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setMessages((m) => [...m, { role: "assistant", text: data.answer }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 700, margin: "40px auto", fontFamily: "sans-serif", padding: 16 }}>
      <h1>Document Q&amp;A Assistant</h1>

      <div style={{ background: "#f7f7f7", border: "1px solid #ddd", borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 14 }}>
        <strong>Documents currently grounding this assistant:</strong>
        <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
          {baseDocuments.map((doc) => (
            <li key={doc}>{doc} <span style={{ color: "#888" }}>(built-in)</span></li>
          ))}
          {uploadedDocs.map((d) => (
            <li key={d.name}>{d.name} <span style={{ color: "#888" }}>(uploaded by you)</span></li>
          ))}
          {baseDocuments.length === 0 && uploadedDocs.length === 0 && (
            <li>No documents loaded yet.</li>
          )}
        </ul>
        <div style={{ marginTop: 10 }}>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: 4 }}>
            Upload your own .txt document to ask questions about it:
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          {uploading && <span style={{ marginLeft: 8, color: "#888" }}>Embedding your document...</span>}
        </div>
      </div>

      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, minHeight: 300, marginBottom: 16 }}>
        {messages.length === 0 && (
          <p style={{ color: "#888" }}>Ask a question about the documents above.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ margin: "8px 0", textAlign: m.role === "user" ? "right" : "left" }}>
            <span
              style={{
                display: "inline-block",
                padding: "8px 12px",
                borderRadius: 8,
                background: m.role === "user" ? "#DCF8C6" : "#F1F0F0",
                maxWidth: "80%",
                whiteSpace: "pre-wrap",
              }}
            >
              {m.text}
            </span>
          </div>
        ))}
        {loading && <p style={{ color: "#888" }}>Thinking...</p>}
        {error && <p style={{ color: "crimson" }}>Error: {error}</p>}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask something..."
          style={{ flex: 1, padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          style={{ padding: "10px 20px", borderRadius: 6, cursor: "pointer" }}
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </main>
  );
}
