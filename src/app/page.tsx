"use client";
import { useState, useRef, useEffect } from "react";
type Message = { role: 'user' | 'assistant'; content: string };

const MODELS = [
  "gemini-2.0-flash-lite", // FASTEST FIRST!
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-3.8-flash",
];

const API_KEYS = [
  process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  process.env.NEXT_PUBLIC_GEMINI_KEY_2,
  process.env.NEXT_PUBLIC_GEMINI_KEY_3,
].filter(Boolean) as string[];

const WELCOME = "Hey, I'm DevCraft AI ✨ Super fast now!";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: WELCOME }]);
  const [input, setInput] = useState(''); 
  const [isThinking, setIsThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const clearCache = () => {
    setMessages([{ role: 'assistant', content: WELCOME }]);
    setInput('');
    localStorage.clear();
    sessionStorage.clear();
  };

  const streamTry = async (apiKey: string, model: string, history: any, onChunk: (t:string)=>void) => {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`, {
      method: "POST", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        systemInstruction: { parts: [{ text: `You are DevCraft AI. TODAY: ${new Date().toDateString()}. USA: Donald J Trump 47th. Nigeria: Bola Tinubu. Be short, helpful, fast.` }] },
        contents: history
      })
    });
    if (!res.ok) throw new Error("fail");
    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;
      const chunk = decoder.decode(value);
      for (const line of chunk.split("\n")) {
        if (line.startsWith("data: ")) {
          try {
            const json = JSON.parse(line.slice(6));
            const t = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (t) onChunk(t);
          } catch {}
        }
      }
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || isThinking) return; 
    const userText = text.trim();
    setMessages(prev => [...prev, { role: 'user', content: userText }, { role: 'assistant', content: "" }]); 
    setInput(''); 
    setIsThinking(true);

    const todayStr = new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    const chatHistory = [...messages, { role: 'user' as const, content: userText }].slice(-6).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    let fullText = "";
    const update = (t:string) => {
      fullText += t;
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: 'assistant', content: fullText };
        return copy;
      });
    };

    let ok = false;
    // Try fastest model first with each key - SUPER FAST like me!
    for (const key of API_KEYS) {
      for (const model of MODELS) {
        try {
          await streamTry(key, model, chatHistory, update);
          if (fullText) { ok = true; break; }
        } catch {}
      }
      if (ok) break;
    }

    if (!ok) {
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: 'assistant', content: "All busy. Wait 5s and try again." };
        return copy;
      });
    }
    setIsThinking(false);
  };

  return (
    <main style={{display:'flex', flexDirection:'column', height:'100vh', backgroundColor:'black', color:'white'}}>
      <div style={{padding:'16px 20px', borderBottom:'1px solid #18181b', display:'flex', justifyContent:'space-between'}}>
        <h1 style={{fontSize:'22px', fontWeight:'900', margin:0}}>DEVCRAFT AI</h1>
        <button onClick={clearCache} style={{background:'#18181b', color:'#fff', border:'1px solid #27272a', borderRadius:'999px', padding:'8px 16px', fontSize:'12px', fontWeight:'700'}}>Clear 🗑️</button>
      </div>
      <div style={{flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:'12px'}}>
        {messages.map((m, i) => (
          <div key={i} style={{maxWidth:'85%', padding:'14px 16px', borderRadius:'18px', fontSize:'15px', background: m.role === 'user' ? 'white' : '#18181b', color: m.role === 'user' ? 'black' : 'white', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start'}}>{m.content || "▍"}</div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{padding:'16px', borderTop:'1px solid #18181b', display:'flex', gap:'10px'}}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend(input)} placeholder="Ask DevCraft..." style={{flex:1, background:'#18181b', borderRadius:'999px', padding:'14px 20px', border:'none', outline:'none', color:'white'}} />
        <button onClick={() => handleSend(input)} style={{background:'white', color:'black', borderRadius:'999px', padding:'0 24px', fontWeight:'800', border:'none'}}>Send</button>
      </div>
    </main>
  );
}
