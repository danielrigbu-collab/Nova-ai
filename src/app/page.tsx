"use client";
import { useState, useRef, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

type Message = { role: 'user' | 'assistant'; content: string };

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I am DevCraft AI. Ask me anything - math, code, or questions!' }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    const userText = text.trim();
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setInput('');
    setIsThinking(true);

    // 1. INSTANT MATH - 0.05s, NO API CALL
    const mathRegex = /^[\d\s+\-*/().%]+$/;
    if (mathRegex.test(userText) && /[+\-*/]/.test(userText)) {
      try {
        // Safe eval
        const result = Function(`"use strict"; return (${userText})`)();
        if (typeof result === 'number' && isFinite(result)) {
          setMessages(prev => [...prev, { role: 'assistant', content: String(result) }]);
          setIsThinking(false);
          return;
        }
      } catch {}
    }

    // 2. INSTANT DATE - 0.05s, NO API CALL
    const lower = userText.toLowerCase();
    if (lower.includes("today") && lower.includes("date") || lower === "date" || lower.includes("what day is it")) {
      const today = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      });
      setMessages(prev => [...prev, { role: 'assistant', content: `Today's date is ${today}.` }]);
      setIsThinking(false);
      return;
    }

    // 3. REAL AI - Call Gemini
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key missing");
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const systemPrompt = `You are DevCraft AI, a helpful AI built by DevCraft. Today's date is ${todayStr}. Be concise, friendly, and helpful. Answer directly.`;

      const result = await model.generateContent(`${systemPrompt}\n\nUser: ${userText}\nAssistant:`);
      const response = result.response.text();
      
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}. Check your API key in GitHub Secrets.` }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <main className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 text-center font-bold text-lg tracking-widest">
        DEVCRAFT AI
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[85%] p-3 rounded-2xl text-[15px] leading-relaxed ${m.role === 'user' ? 'bg-white text-black ml-auto' : 'bg-zinc-900 text-zinc-100'}`}>
            {m.content}
          </div>
        ))}
        {isThinking && <div className="bg-zinc-900 p-3 rounded-2xl w-fit text-sm animate-pulse">Thinking...</div>}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-zinc-800 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend(input)}
          placeholder="Ask anything..."
          className="flex-1 bg-zinc-900 rounded-full px-4 py-3 text-[15px] outline-none"
        />
        <button
          onClick={() => handleSend(input)}
          className="bg-white text-black rounded-full px-6 font-bold"
        >
          ↑
        </button>
      </div>
    </main>
  );
}
