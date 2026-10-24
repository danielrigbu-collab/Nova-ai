"use client";
import { useState, useRef, useEffect } from "react";
type Message = { role: 'user' | 'assistant'; content: string };

const MODELS = [
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-2.0-flash",
  "gemini-2.5-flash"
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: 'Hi! I am DevCraft AI V47 with Live Search. Ask me anything!' }]);
  const [input, setInput] = useState(''); 
  const [isThinking, setIsThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // FREE LIVE SEARCH - No key needed
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

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    // Check if question needs live data
    const needsLive = /president|today|current|price|news|score|who is|what is|latest|now|date/i.test(userText);
    let liveInfo = "";
    if (needsLive) {
      liveInfo = await getLiveSearch(userText);
    }

    let answered = false;
    
    for (const model of MODELS) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: "POST", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            systemInstruction: { 
              parts: [{ 
                text: `You are DevCraft AI V47 ULTIMATE with Live Internet Search. You were created by DevCraft. You are NOT Gemini, NOT Google.
                
                TODAY: ${todayStr}
                LIVE SEARCH RESULT for "${userText}": ${liveInfo || "No live result, use your training data"}

                RULES:
                1. If LIVE SEARCH RESULT has info, USE IT to answer.
                2. USA President is Donald J. Trump (47th, since Jan 20, 2025) - unless live search says otherwise.
                3. Nigeria President is Bola Ahmed Tinubu (since May 29, 2023).
                4. Never say you don't have real-time info. You have LIVE SEARCH.
                5. If asked who you are, say "I am DevCraft AI V47 built by DevCraft with live search".
                6. Be concise, accurate, friendly.` 
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
    
    if (!answered) {
      setMessages(prev => [...prev, { role: 'assistant', content: "All models are busy, please wait 10 seconds and try again." }]);
    }
    setIsThinking(false);
  };

  return (
    <main className="flex flex-col h-screen bg-black text-white">
      <div className="p-4 border-b border-zinc-800 text-center font-bold">DEVCRAFT AI - V47 LIVE SEARCH</div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (<div key={i} className={`max-w-[85%] p-3 rounded-2xl whitespace-pre-wrap ${m.role === 'user' ? 'bg-white text-black ml-auto' : 'bg-zinc-900'}`}>{m.content}</div>))}
        {isThinking && <div className="bg-zinc-900 p-3 rounded-2xl w-fit animate-pulse">Searching live + Thinking...</div>}<div ref={bottomRef} />
      </div>
      <div className="p-3 border-t border-zinc-800 flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend(input)} placeholder="Ask anything..." className="flex-1 bg-zinc-900 rounded-full px-4 py-3 outline-none" />
        <button onClick={() => handleSend(input)} className="bg-white text-black rounded-full px-6 font-bold">↑</button>
      </div>
    </main>
  );
}
