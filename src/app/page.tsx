"use client";
import { useState } from "react";
import { GoogleGenAI } from "@google/genai";

type Msg = { role: "user" | "ai"; text: string };

export default function Home() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "ai", text: "Hey, I'm DevCraft AI ✨ Your super assistant. What should we build today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Msg = { role: "user", text: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    const prompt = input;
    setInput("");
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
      
      // PRO v1 model - gemini-3.8-flash (stable)
      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
        });
      } catch {
        // Fallback if your account has 3.5
        response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
        });
      }

      const aiText = response.text || "No response";
      setMessages([...newMessages, { role: "ai", text: aiText }]);

    } catch (e: any) {
      setMessages([...newMessages, { role: "ai", text: "Error: " + e.message }]);
    }
    setLoading(false);
  };

  return (
    <main className="flex flex-col h-screen bg-[#0a0a0a] text-white">
      {/* Header - EXACT like your screenshot */}
      <div className="text-center py-6 border-b border-zinc-800">
        <h1 className="text-2xl font-bold tracking-wide">DEVCRAFT AI</h1>
        <p className="text-zinc-500 text-sm mt-1">Your AI Companion</p>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`px-4 py-3 rounded-2xl max-w-[85%] text-[15px] leading-relaxed ${m.role === "user" ? "bg-white text-black font-medium" : "bg-zinc-800 text-zinc-100"}`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl bg-zinc-800 text-zinc-400">DevCraft is thinking...</div>
          </div>
        )}
      </div>

      {/* Input - FIXED DOWN like your screenshot */}
      <div className="p-4 flex gap-3 items-center bg-[#0a0a0a] border-t border-zinc-900">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask DevCraft anything..."
          className="flex-1 px-5 py-3.5 rounded-full bg-zinc-900 border border-zinc-800 outline-none text-white placeholder-zinc-500"
        />
        <button onClick={sendMessage} className="bg-white text-black px-7 py-3.5 rounded-full font-bold text-[15px]">
          {loading ? "..." : "Send"}
        </button>
      </div>
    </main>
  );
}
