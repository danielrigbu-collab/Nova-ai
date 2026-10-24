"use client";
import { useState, useRef, useEffect } from "react";
type Message = { role: 'user' | 'assistant'; content: string };
export default function Home() {
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: 'Hi! I am DevCraft AI. Ask me anything!' }]);
  const [input, setInput] = useState(''); const [isThinking, setIsThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return; const userText = text.trim();
    setMessages(prev => [...prev, { role: 'user', content: userText }]); setInput(''); setIsThinking(true);
    const mathRegex = /^[\d\s+\-*/().%]+$/;
    if (mathRegex.test(userText) && /[+\-*/]/.test(userText)) {
      try { const r = Function(`"use strict"; return (${userText})`)(); if (isFinite(r)) { setMessages(prev => [...prev, { role: 'assistant', content: String(r) }]); setIsThinking(false); return; } } catch {}
    }
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY; 
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${apiKey}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: userText }] }] })
      });
      const data = await res.json(); if (data.error) throw new Error(data.error.message);
      const response = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (err: any) { setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]); } finally { setIsThinking(false); }
  };
  return (
    <main className="flex flex-col h-screen bg-black text-white">
      <div className="p-4 border-b border-zinc-800 text-center font-bold">DEVCRAFT AI - FREE EDITION</div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (<div key={i} className={`max-w-[85%] p-3 rounded-2xl ${m.role === 'user' ? 'bg-white text-black ml-auto' : 'bg-zinc-900'}`}>{m.content}</div>))}
        {isThinking && <div className="bg-zinc-900 p-3 rounded-2xl w-fit animate-pulse">Thinking...</div>}<div ref={bottomRef} />
      </div>
      <div className="p-3 border-t border-zinc-800 flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend(input)} placeholder="Ask anything..." className="flex-1 bg-zinc-900 rounded-full px-4 py-3 outline-none" />
        <button onClick={() => handleSend(input)} className="bg-white text-black rounded-full px-6 font-bold">↑</button>
      </div>
    </main>
  );
}
