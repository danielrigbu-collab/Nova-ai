"use client";
import { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

export default function Home() {
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hey, I'm DevCraft AI ✨ Your super assistant. What should we build today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = { role: "user", text: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    const prompt = input;
    setInput("");
    setLoading(true);

    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(prompt);
      const aiText = result.response.text();
      
      setMessages([...newMessages, { role: "ai", text: aiText }]);
    } catch (e: any) {
      setMessages([...newMessages, { role: "ai", text: "Error: " + e.message }]);
    }
    setLoading(false);
  };

  return (
    <main className="flex flex-col h-screen bg-black text-white p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">DevCraft AI ✨</h1>
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.map((m, i) => (
          <div key={i} className={`p-3 rounded-xl max-w-[85%] ${m.role === "user" ? "bg-blue-600 ml-auto" : "bg-zinc-800"}`}>
            {m.text}
          </div>
        ))}
        {loading && <div className="p-3 bg-zinc-800 rounded-xl">DevCraft is thinking...</div>}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask DevCraft..."
          className="flex-1 p-3 rounded-xl bg-zinc-900 border border-zinc-700 outline-none"
        />
        <button onClick={sendMessage} className="bg-blue-600 px-6 rounded-xl font-bold">
          {loading ? "..." : "Send"}
        </button>
      </div>
    </main>
  );
}
