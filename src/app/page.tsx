'use client';
import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

export default function Page() {
  const [messages, setMessages] = useState<{role:string, text:string}[]>(()=>{
    if(typeof window!=='undefined'){ const s=localStorage.getItem('dc_history'); return s?JSON.parse(s):[] } return [];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{ localStorage.setItem('dc_history', JSON.stringify(messages)); listRef.current?.scrollTo(0, listRef.current.scrollHeight); }, [messages]);

  async function send() {
    if(!input.trim()) return;
    const userMsg = input;
    setMessages(m => [...m, {role:'user', text: userMsg}]);
    setInput('');
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
      const result = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: userMsg });
      setMessages(m => [...m, {role:'ai', text: result.text || "No response"}]);
    } catch(e:any) {
      setMessages(m => [...m, {role:'ai', text: "Error: " + e.message}]);
    }
    setLoading(false);
  }

  function copyText(t:string){ navigator.clipboard.writeText(t); }

  return (
    <div style={{display:'flex', flexDirection:'column', height:'100vh', background:'#000', color:'#fff'}}>
      <div style={{padding:'14px', display:'flex', justifyContent:'space-between', borderBottom:'1px solid #222'}}>
        <b>DevCraft AI Pro v2</b>
        <button onClick={()=>{if(confirm('Clear history?')){setMessages([]);localStorage.removeItem('dc_history')}}} style={{background:'transparent', color:'#888', border:'none'}}>Clear</button>
      </div>

      <div ref={listRef} style={{flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:'12px'}}>
        {messages.length===0 && <div style={{opacity:0.5, textAlign:'center', marginTop:'40%'}}>Ask anything — text, code, images concept</div>}
        {messages.map((m,i)=>(
          <div key={i} style={{alignSelf: m.role==='user'?'flex-end':'flex-start', background: m.role==='user'?'#fff':'#1e1e1e', color: m.role==='user'?'#000':'#fff', padding:'12px 14px', borderRadius:'16px', maxWidth:'88%', whiteSpace:'pre-wrap', position:'relative'}}>
            {m.text}
            {m.role==='ai' && <button onClick={()=>copyText(m.text)} style={{marginTop:'8px', display:'block', background:'#333', color:'#fff', border:'none', borderRadius:'8px', padding:'4px 10px', fontSize:'12px'}}>Copy</button>}
          </div>
        ))}
        {loading && <div style={{opacity:0.6}}>Thinking with 2.5 Flash...</div>}
      </div>

      <div style={{padding:'12px', display:'flex', gap:'8px', borderTop:'1px solid #222', background:'#000'}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Ask DevCraft AI..." style={{flex:1, background:'#111', border:'1px solid #333', borderRadius:'24px', padding:'12px 16px', color:'#fff', outline:'none'}} />
        <button onClick={send} style={{background:'#fff', color:'#000', borderRadius:'24px', padding:'0 20px', fontWeight:'bold', border:'none'}}>Send</button>
      </div>
    </div>
  );
}
