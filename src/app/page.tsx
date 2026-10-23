"use client";
import { useState, useRef } from "react";

export default function Page() {
  const [messages, setMessages] = useState<any[]>([
    { role: "bot", text: "Hey, I'm DevCraft AI ✨ Your super assistant. What should we build today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  async function callGemini(text: string) {
    for (let attempt = 1; attempt <= 4; attempt++) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text }] }] }),
        }
      );
      const data = await res.json();
      if (res.ok) return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const msg = data.error?.message || "";
      if ((msg.includes("high demand") || msg.toLowerCase().includes("overload") || res.status === 503) && attempt < 4) {
        await new Promise(r => setTimeout(r, attempt * 3000));
        continue;
      }
      throw new Error(msg);
    }
    return "";
  }

  async function sendMessage(textOverride?: string) {
    const text = textOverride || input;
    if (!text.trim() || loading) return;
    setInput("");
    setMessages(p => [...p, { role: "user", text }]);
    setLoading(true);
    try {
      const botText = await callGemini(text);
      setMessages(p => [...p, { role: "bot", text: botText }]);
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes("high demand") || msg.toLowerCase().includes("overload")) {
        await new Promise(r => setTimeout(r, 5000));
        try {
          const botText = await callGemini(text);
          setMessages(p => [...p, { role: "bot", text: botText }]);
          setLoading(false);
          return;
        } catch {}
      }
      setMessages(p => [...p, { role: "bot", text: "Model busy — tap Send again in 10 sec." }]);
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] text-white">
      <div className="py-8 text-center border-b border-zinc-800/50">
        <h1 className="font-black text-3xl tracking-tight">DEVCRAFT AI</h1>
        <p className="text-zinc-500 mt-1 text-sm">Your AI Companion</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`px-5 py-3 rounded-2xl max-w-[85%] ${m.role === "user" ? "bg-[#3b82f6] rounded-br-md" : "bg-zinc-800 rounded-bl-md"}`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-5 py-3 rounded-2xl bg-zinc-800 text-zinc-400 text-sm rounded-bl-md">Thinking...</div>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-zinc-800/50">
        <div className="flex gap-3 items-center">
          <div className="flex-1 bg-zinc-900 rounded-full flex items-center px-5 py-1 border border-zinc-800">
            <input className="flex-1 bg-transparent py-3 outline-none placeholder:text-zinc-500" placeholder="Ask DevCraft anything..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} />
            <button onClick={() => fileRef.current?.click()} className="ml-3 text-xl">📎</button>
            <input type="file" ref={fileRef} hidden accept="image/*,.pdf" />
          </div>
          <button onClick={() => sendMessage()} className="bg-white text-black px-7 py-3.5 rounded-full font-bold">Send</button>
        </div>
      </div>
    </div>
  );
}
