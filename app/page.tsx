"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { MoodIndicator } from "@/components/MoodIndicator";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

interface Message {
  text: string;
  sender: "user" | "mirror";
  isError?: boolean;
}

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [valence, setValence] = useState(0.0);
  const [appHeight, setAppHeight] = useState("100dvh");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;

    const loadMemory = async () => {
      const { data } = await supabase
        .from('interactions')
        .select('message, response, valence')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true });

      if (data && data.length > 0) {
        const history: Message[] = data.flatMap(d => [
          { text: d.message, sender: "user" },
          { text: d.response, sender: "mirror" }
        ]);
        setMessages(history);
        
        const lastInteraction = data[data.length - 1];
        if (lastInteraction && lastInteraction.valence !== undefined && lastInteraction.valence !== null) {
            setValence(lastInteraction.valence);
        }
      } else {
        setMessages([{ text: "I am the Mirror. I know you.", sender: "mirror" }]);
      }
    };
    loadMemory();

    const updateViewport = () => {
      if (window.visualViewport) {
        setAppHeight(`${window.visualViewport.height}px`);
        window.scrollTo(0, 0); 
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 150);
      }
    };
    
    window.visualViewport?.addEventListener("resize", updateViewport);
    updateViewport();
    return () => window.visualViewport?.removeEventListener("resize", updateViewport);
  }, [session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo: window.location.origin,
        skipBrowserRedirect: false 
      }
    });
    if (error) console.error("Login Error:", error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMessages([]);
    setValence(0.0);
    window.location.reload();
  };

  const sendMessage = async () => {
    if (!input.trim() || !session?.user?.id) return;

    const userMsg: Message = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    const currentUserId = session.user.id;
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("https://oracle-engine-r877.onrender.com/api/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentInput,
          user_id: currentUserId
        }),
      });
      const data = await response.json();
      setMessages((prev) => [...prev, { text: data.engine_response, sender: "mirror" }]);
      
      if (data.system_state?.valence !== undefined) {
        setValence(data.system_state.valence);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { text: "Connection error.", sender: "mirror", isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  const theme = (() => {
    if (valence > 0.65) return { color: "#ffcc00", bg: "rgba(60, 45, 0, 1)" };  // Rich Gold
    if (valence > 0.2) return { color: "#10b981", bg: "rgba(0, 50, 30, 1)" };   // Deep Emerald
    if (valence < -0.65) return { color: "#ef4444", bg: "rgba(60, 0, 0, 1)" };  // Intense Crimson
    if (valence < -0.2) return { color: "#3b82f6", bg: "rgba(0, 25, 70, 1)" };  // Deep Sapphire
    return { color: "#888", bg: "rgba(15, 15, 15, 1)" }; // Crisp Neutral
  })();

  if (!session) {
    return (
      <div style={{ height: '100dvh', width: '100vw', backgroundColor: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Mono', monospace" }}>
        <img 
          src="/icon-512x512.png" 
          alt="Mirror Logo" 
          style={{ width: '80px', height: '80px', marginBottom: '24px', borderRadius: '18px', boxShadow: '0 0 20px rgba(255,255,255,0.05)' }} 
        />
        <h1 style={{ color: '#fff', letterSpacing: '8px', fontSize: '24px', marginBottom: '10px', textAlign: 'center' }}>THE MIRROR</h1>
        <p style={{ color: '#666', fontSize: '12px', marginBottom: '40px', letterSpacing: '2px', textAlign: 'center' }}>AFFECTIVE INTELLIGENCE</p>
        <button onClick={handleGoogleLogin} style={{ padding: '12px 24px', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', cursor: 'pointer', fontFamily: "'Space Mono', monospace", display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Sync with Google
        </button>
      </div>
    );
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body, html { margin: 0; padding: 0; background-color: #000; overflow: hidden; position: fixed; width: 100%; height: 100%; font-family: 'Space Mono', monospace; overscroll-behavior: none; touch-action: pan-y; }
        
        .app-container { height: ${appHeight}; width: 100vw; display: flex; flex-direction: column; background: #000; overflow: hidden; }
        
        .header { flex-shrink: 0; display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; border-bottom: 1px solid rgba(255,255,255,0.08); background: #000; z-index: 10; }
        
        .brand-container { display: flex; align-items: center; gap: 12px; }
        .brand-logo { width: 24px; height: 24px; border-radius: 6px; box-shadow: 0 0 10px rgba(255,255,255,0.1); }
        .brand-text { font-size: 13px; font-weight: 700; letter-spacing: 4px; color: #fff; text-shadow: 0 0 15px ${theme.color}; transition: text-shadow 2s ease-in-out; }
        
        .chat-window { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; padding: 20px; background: ${theme.bg}; transition: background 2s ease-in-out; box-shadow: inset 0 0 40px rgba(0,0,0,0.8); -webkit-overflow-scrolling: touch; }
        .chat-window::-webkit-scrollbar { display: none; }
        
        .msg { padding: 12px 16px; border-radius: 18px; font-size: 14px; line-height: 1.5; max-width: 85%; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
        
        /* UI UPGRADE: Dark obsidian glass for the Mirror */
        .mirror-msg { align-self: flex-start; background: rgba(0, 0, 0, 0.55); color: #e0e0e0; border-bottom-left-radius: 4px; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
        
        /* UI UPGRADE: Brighter frosted glass for the User */
        .user-msg { align-self: flex-end; background: rgba(255, 255, 255, 0.15); color: #fff; border-bottom-right-radius: 4px; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
        
        .input-wrapper { flex-shrink: 0; display: flex; gap: 10px; padding: 12px 15px; background: #000; border-top: 1px solid rgba(255,255,255,0.08); z-index: 10; }
        
        input { flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 12px; border-radius: 15px; color: #fff; font-family: 'Space Mono'; outline: none; font-size: 16px; transition: border 0.3s ease; }
        input:focus { border: 1px solid rgba(255,255,255,0.25); }
        .send-btn { width: 48px; height: 48px; border-radius: 15px; border: none; background: rgba(255,255,255,0.05); color: ${theme.color}; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; }
        .send-btn:active { transform: scale(0.95); background: rgba(255,255,255,0.1); }
        
        .logout-btn { background: none; border: none; color: #444; font-size: 10px; cursor: pointer; letter-spacing: 1px; transition: color 0.3s; }
        .logout-btn:hover { color: #888; }
      `}</style>

      <div className="app-container">
        <div className="header">
          <div className="brand-container">
            <img src="/icon-512x512.png" alt="Logo" className="brand-logo" />
            <span className="brand-text">THE MIRROR</span>
          </div>
          <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
            <MoodIndicator valence={valence} />
            <button className="logout-btn" onClick={handleLogout}>[ EXIT ]</button>
          </div>
        </div>

        <div className="chat-window">
          {messages.map((msg, i) => (
            <div key={i} className={`msg ${msg.sender === "user" ? "user-msg" : "mirror-msg"}`} style={msg.isError ? {color: '#ef4444'} : {}}>
              {msg.text}
            </div>
          ))}
          {loading && (
            <div className="msg mirror-msg" style={{ opacity: 0.5 }}>...</div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-wrapper">
          <input 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={(e) => e.key === "Enter" && sendMessage()} 
            onFocus={() => setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 200)}
            placeholder="Reflect here..." 
          />
          <button className="send-btn" onClick={sendMessage}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
          </button>
        </div>
      </div>
    </>
  );
}
