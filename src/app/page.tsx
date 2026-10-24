"use client";
import { useState, useRef, useEffect } from "react";
type Message = { role: 'user' | 'assistant'; content: string };

// WITH GEMINI 3.8 - NEWEST!
const MODELS = [
  "gemini-3.8-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-2.0-flash-lite"
];

const API_KEYS = [
  process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  process.env.NEXT_PUBLIC_GEMINI_KEY_2,
  process.env.NEXT_PUBLIC_GEMINI_KEY_3,
].filter(Boolean) as string[];

const WELCOME = "Hey, I'm DevCraft AI ✨ Your super assistant. What should we build today?";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: WELCOME }]);
  const [input, setInput] = useState(''); 
  const [isThinking, setIsThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isThinking]);

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: WELCOME }]);
    setIsThinking(false);
    localStorage.clear();
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return; 
    const userText = text.trim();
    setMessages(prev => [...prev, { role: 'user', content: userText }]); 
    setInput(''); 
    setIsThinking(true);

    // 1+1 = instant 2, no API
    const mathRegex = /^[\d\s+\-*/().%]+$/;
    if (mathRegex.test(userText) && /[+\-*/]/.test(userText)) {
      try { 
        const r = Function(`"use strict"; return (${userText})`)(); 
        if (isFinite(r)) { 
          setMessages(prev => [...prev, { role: 'assistant', content: String(r) }]); 
          setIsThinking(false); 
          return; 
        } 
      } catch {}
    }

    let answered = false;
    for (const apiKey of API_KEYS) {
      for (const model of MODELS) {
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: "POST", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: userText }] }] })
          });
          const data = await res.json();
          if (data.error) continue;
          const response = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (response) {
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
            answered = true; break;
          }
        } catch { continue; }
      }
      if (answered) break;
    }
    if (!answered) {
      setMessages(prev => [...prev, { role: 'assistant', content: "All 12 tries busy, wait 10s and try again." }]);
    }
    setIsThinking(false);
  };

  return (
    <main className="flex flex-col h-screen bg-black text-white">
      {/* HEADER - EXACTLY LIKE YOUR SCREENSHOT */}
      <div className="py-6 border-b border-zinc-900 text-center">
        <h1 className="text-2xl font-extrabold tracking-wide">DEVCRAFT AI</h1>
        <p className="text-sm text-zinc-500 mt-1">Your AI Companion</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[85%] p-4 rounded-2xl text-[15px] leading-relaxed ${m.role === 'user' ? 'bg-white text-black ml-auto rounded-br-sm' : 'bg-zinc-900 text-white rounded-bl-sm'}`}>
            {m.content}
          </div>
        ))}
        {isThinking && <div className="bg-zinc-900 p-4 rounded-2xl w-fit text-sm animate-pulse">DevCraft is thinking...</div>}
        <div ref={bottomRef} />
      </div>

      {/* INPUT - EXACTLY LIKE YOUR SCREENSHOT */}
      <div className="p-4 border-t border-zinc-900 flex gap-3 bg-black">
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && handleSend(input)} 
          placeholder="Ask DevCraft anything..." 
          className="flex-1 bg-zinc-900 rounded-full px-5 py-3.5 outline-none text-sm placeholder:text-zinc-500" 
        />
        <button onClick={() => handleSend(input)} className="bg-white text-black rounded-full px-7 font-bold text-sm">Send</button>
      </div>

      {/* Hidden: Double tap header to clear */}
      <div onDoubleClick={clearChat} className="absolute top-0 left-0 w-full h-[80px] opacity-0" />
    </main>
  );
}
