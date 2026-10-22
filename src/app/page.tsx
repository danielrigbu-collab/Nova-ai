"use client";
import { useState, useRef } from "react";

export default function Page() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  async function callGemini(text: string, model: string) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text }] }] }),
      }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "API Error");
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userText = input;
    setInput("");
    setMessages(p => [...p, { role: "user", text: userText }]);
    setLoading(true);

    try {
      let botText = "";
      try {
        // 1. TRY 3.8 FLASH FIRST - FAST
        botText = await callGemini(userText, "gemini-3.8-flash");
      } catch (e: any) {
        if (e.message.includes("high demand") || e.message.includes("overloaded")) {
          await new Promise(r => setTimeout(r, 2000)); // wait 2s
          try {
            botText = await callGemini(userText, "gemini-3.8-flash"); // retry
          } catch {
            // 2. FALLBACK TO 2.5 FLASH - INSTANT
            botText = await callGemini(userText, "gemini-2.5-flash");
          }
        } else throw e;
      }
      setMessages(p => [...p, { role: "bot", text: botText }]);
    } catch (err: any) {
      setMessages(p => [...p, { role: "bot", text: `Error: ${err.message}` }]);
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      <div className="p-4 text-center border-b border-zinc-800">
        <h1 className="font-bold text-xl">DEVCRAFT AI</h1>
        <p className="text-xs text-zinc-400">Powered by 3.8 Flash + 2.5 Flash fallback</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m,i)=>(
          <div key={i} className={`flex ${m.role==="user"?"justify-end":"justify-start"}`}>
            <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${m.role==="user"?"bg-blue-500":"bg-zinc-800"}`}>{m.text}</div>
          </div>
        ))}
        {loading && <div className="text-zinc-500 text-sm">Thinking with 3.8 Flash...</div>}
      </div>
      <div className="p-3 border-t border-zinc-800 flex gap-2 items-center">
        <div className="flex-1 bg-zinc-900 rounded-full flex items-center px-4">
          <input className="flex-1 bg-transparent py-3 outline-none" placeholder="Ask anything..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMessage()} />
          <button onClick={()=>fileRef.current?.click()} className="ml-2 text-xl">📎</button>
          <input type="file" ref={fileRef} hidden />
        </div>
        <button onClick={sendMessage} className="bg-white text-black px-5 py-3 rounded-full font-bold">Send</button>
      </div>
    </div>
  );
}
