"use client";
import { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hey, I'm DevCraft AI ✨ Your super assistant. What should we build today?" }
  ]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", text: input };
    const aiMsg = { role: "ai", text: "DevCraft received: \"" + input + "\" — I'm ready! Connect your AI API next." };
    setMessages([...messages, userMsg, aiMsg]);
    setInput("");
  };

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      height: "100vh", 
      background: "#000000", 
      color: "white",
      fontFamily: "system-ui"
    }}>
      {/* Header */}
      <div style={{ padding: "20px", textAlign: "center", borderBottom: "1px solid #222" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "-0.5px" }}>DEVCRAFT AI</h1>
        <p style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>Your AI Companion</p>
      </div>

      {/* Chat */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
            background: m.role === "user" ? "#3b82f6" : "#1a1a1a",
            padding: "12px 16px",
            borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
            maxWidth: "85%",
            fontSize: "15px",
            lineHeight: "1.4"
          }}>
            {m.text}
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: "12px", display: "flex", gap: "10px", borderTop: "1px solid #222", background: "#000" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask DevCraft anything..."
          style={{
            flex: 1,
            background: "#111",
            border: "1px solid #333",
            borderRadius: "24px",
            padding: "14px 18px",
            color: "white",
            outline: "none",
            fontSize: "15px"
          }}
        />
        <button
          onClick={sendMessage}
          style={{
            background: "white",
            color: "black",
            border: "none",
            borderRadius: "24px",
            padding: "0 22px",
            fontWeight: "700",
            fontSize: "15px"
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
