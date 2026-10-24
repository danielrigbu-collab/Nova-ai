"use client";
import { useState, useRef, useEffect } from "react";
type Message = { role: 'user' | 'assistant'; content: string };

const MODELS = [
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-2.0-flash",
  "gemini-2.5-flash"
];

const API_KEYS = [
  process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  process.env.NEXT_PUBLIC_GEMINI_KEY_2,
  process.env.NEXT_PUBLIC_GEMINI_KEY_3,
].filter(Boolean) as string[];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: "Hey, I'm DevCraft AI ✨ Your super assistant. What should we build today?" }]);
  const [input, setInput] = useState(''); 
  const [isThinking, setIsThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const getLiveSearch = async (query: string) => {
    try {
      const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
      const data = await res.json();
      if (data.AbstractText) return data.AbstractText;
      if (data.Answer) return data.Answer;
      if (data.RelatedTopics?.[0]?.Text) return data.RelatedTopics[0].Text;
      return "";
    } catch { return ""; }
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return; 
    const userText = text.trim();
    setMessages(prev => [...prev, { role: 'user', content: userText }]); 
    setInput(''); 
    setIsThinking(true);

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

    const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const needsLive = /president|today|current|price|news|score|who is|what is|latest|now|date/i.test(userText);
    let liveInfo = "";
    if (needsLive) liveInfo = await getLiveSearch(userText);

    let answered = false;
    for (const apiKey of API_KEYS) {
      for (const model of MODELS) {
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: "POST", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              systemInstruction: { 
                parts: [{ 
                  text: `You are DevCraft AI ✨ built by DevCraft. You are NOT Gemini.

                  TODAY: ${todayStr}
                  LIVE SEARCH: ${liveInfo || "none"}

                  RULES:
                  1. USA President is Donald J. Trump (47th, since Jan 20, 2025).
                  2. Nigeria President is Bola Ahmed Tinubu.
                  3. If LIVE SEARCH has info, use it.
                  4. Be concise, friendly, helpful.` 
                }] 
              },
              contents: [{ parts: [{ text: userText }] }] 
            })
          });
          const data = await res.json();
          if (data.error) continue;
          const response = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (response) {
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
            answered = true; 
            break;
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
      {/* HEADER - Like your screenshot */}
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

      {/* INPUT - Like your screenshot */}
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
    </main>
  );
}
