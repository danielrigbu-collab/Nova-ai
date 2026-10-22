'use client';
import { useState, useRef, useEffect } from 'react';

export default function Page() {
  const [messages, setMessages] = useState<{role:string, text:string, img?:string}[]>(()=>{
    if(typeof window!=='undefined'){ const s=localStorage.getItem('dc_history'); return s?JSON.parse(s):[] } return [];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImg, setSelectedImg] = useState<string|null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(()=>{ localStorage.setItem('dc_history', JSON.stringify(messages)); listRef.current?.scrollTo(0, listRef.current.scrollHeight); }, [messages]);

  function onFile(e:any){
    const file = e.target.files?.[0]; if(!file) return;
    const r = new FileReader(); r.onload=()=>setSelectedImg(r.result as string); r.readAsDataURL(file);
  }

  async function send() {
    if(!input.trim() && !selectedImg) return;
    const userMsg = input; const imgToSend = selectedImg;
    setMessages(m => [...m, {role:'user', text: userMsg || 'Analyze this', img: imgToSend || undefined}]);
    setInput(''); setSelectedImg(null); setLoading(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      const parts:any[] = [{ text: userMsg || "Describe this image" }];
      if(imgToSend){
        parts.push({ inline_data: { mime_type: "image/jpeg", data: imgToSend.split(',')[1] }});
      }
      // USE 3.8-flash as Google told you!
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts }] })
      });
      const data = await res.json();
      if(data.error) throw new Error(data.error.message);
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
      setMessages(m => [...m, {role:'ai', text }]);
    } catch(e:any){ setMessages(m => [...m, {role:'ai', text: "Error: " + e.message}]); }
    setLoading(false);
  }

  return (
    <div style={{display:'flex', flexDirection:'column', height:'100vh', background:'#000', color:'#fff'}}>
      <div style={{padding:'16px', textAlign:'center', borderBottom:'1px solid #222', fontWeight:'bold'}}>DEVCRAFT AI<br/><span style={{fontWeight:'normal', fontSize:'12px', opacity:0.6}}>Your AI Companion</span></div>
      <div ref={listRef} style={{flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:'12px'}}>
        {messages.length===0 && <div style={{background:'#1e1e1e', padding:'12px 16px', borderRadius:'16px', maxWidth:'85%'}}>Hey, I'm DevCraft AI ✨ Your super assistant. What should we build today?</div>}
        {messages.map((m,i)=>(
          <div key={i} style={{alignSelf: m.role==='user'?'flex-end':'flex-start', background: m.role==='user'?'#3b82f6':'#1e1e1e', color:'#fff', padding:'12px 14px', borderRadius:'16px', maxWidth:'88%'}}>
            {m.img && <img src={m.img} style={{maxWidth:'100%', borderRadius:'8px', marginBottom:'6px'}} />}
            {m.text}
          </div>
        ))}
        {loading && <div style={{opacity:0.6}}>Thinking with 3.8 Flash...</div>}
      </div>
      {selectedImg && <div style={{padding:'8px 16px'}}><img src={selectedImg} style={{height:'60px', borderRadius:'8px'}} /><button onClick={()=>setSelectedImg(null)} style={{marginLeft:'8px', background:'#333', color:'#fff', border:'none', borderRadius:'8px', padding:'4px 10px'}}>X</button></div>}
      <div style={{padding:'12px', display:'flex', gap:'8px', borderTop:'1px solid #222', background:'#000', alignItems:'center'}}>
        <div style={{flex:1, position:'relative', display:'flex', alignItems:'center'}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Ask DevCraft anything..." style={{flex:1, width:'100%', background:'#111', border:'1px solid #333', borderRadius:'24px', padding:'14px 48px 14px 16px', color:'#fff', outline:'none'}} />
          <button onClick={()=>fileRef.current?.click()} style={{position:'absolute', right:'8px', background:'transparent', border:'none', fontSize:'20px', cursor:'pointer'}}>📎</button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{display:'none'}} />
        <button onClick={send} style={{background:'#fff', color:'#000', borderRadius:'24px', padding:'12px 20px', fontWeight:'bold', border:'none'}}>Send</button>
      </div>
    </div>
  );
}
