"use client";
import { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const question = input;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
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
      <p style={{ color: "#666", fontSize: 14 }}>
        Answers are grounded in the documents in <code>/docs</code>.
      </p>
      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, minHeight: 300, marginBottom: 16 }}>
        {messages.length === 0 && (
          <p style={{ color: "#888" }}>Ask a question about your documents.</p>
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
