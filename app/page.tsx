"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { MoodIndicator } from "@/components/MoodIndicator";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    const loadMemory = async () => {
      const { data } = await supabase.from('interactions').select('message, response, valence').eq('user_id', session.user.id).order('created_at', { ascending: true });
      if (data && data.length > 0) {
        setMessages(data.flatMap(d => [{ text: d.message, sender: "user" }, { text: d.response, sender: "mirror" }]));
        setValence(data[data.length - 1].valence || 0);
      } else {
        setMessages([{ text: "I am the Mirror. I know you.", sender: "mirror" }]);
      }
    };
    loadMemory();
  }, [session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // No manual redirect needed as onAuthStateChange will trigger a re-render
  };

  const subscribeToPush = async () => {
    const PUBLIC_KEY = "BPAtDo1_D6kiCqph9O2F69AhlZf9rUE_sZGYTbis22E029v0CkZKvnysWsfJflkC1rHWfDtqZmvNua466_or5UA";
    if (!('serviceWorker' in navigator) || !session?.user?.id) return;
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY)
      });
      await supabase.from('push_subscriptions').upsert({
        user_id: session.user.id,
        subscription_json: JSON.parse(JSON.stringify(subscription))
      }, { onConflict: 'user_id' });
      alert("The Mirror is now connected.");
    } catch (err) {
      console.error(err);
      alert("Notification setup failed.");
    }
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
      const response = await fetch("https://project-eigen-backend.onrender.com/api/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentInput, user_id: currentUserId }),
      });
      const data = await response.json();
      setMessages((prev) => [...prev, { text: data.engine_response, sender: "mirror" }]);
      if (data.system_state?.valence !== undefined) setValence(data.system_state.valence);
    } catch (error) {
      setMessages((prev) => [...prev, { text: "Connection error.", sender: "mirror", isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  const theme = (() => {
    if (valence > 0.65) return { color: "#ffcc00", bg: "rgba(60, 45, 0, 1)" };
    if (valence > 0.2) return { color: "#10b981", bg: "rgba(0, 50, 30, 1)" }; 
    if (valence < -0.65) return { color: "#ef4444", bg: "rgba(60, 0, 0, 1)" }; 
    if (valence < -0.2) return { color: "#3b82f6", bg: "rgba(0, 25, 70, 1)" };
    return { color: "#888", bg: "rgba(15, 15, 15, 1)" };
  })();

  // --- LOGIN SCREEN (When no session exists) ---
  if (!session) {
    return (
      <div style={{
        height: '100svh', 
        width: '100vw', 
        backgroundColor: '#000', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: "'Space Mono', monospace"
      }}>
        <img src="/icon-512x512.png" style={{ width: '80px', marginBottom: '20px' }} />
        <h1 style={{ color: '#fff', letterSpacing: '8px', fontSize: '18px', marginBottom: '40px' }}>THE MIRROR</h1>
        <button 
          onClick={handleLogin}
          style={{
            background: 'none',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '30px',
            fontSize: '12px',
            letterSpacing: '2px',
            cursor: 'pointer'
          }}
        >
          CONTINUE WITH GOOGLE
        </button>
      </div>
    );
  }

  // --- APP SCREEN (When logged in) ---
  return (
    <>
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body, html { margin: 0; padding: 0; background-color: #000; font-family: 'Space Mono', monospace; height: 100%; overflow: hidden; }
        .app-container { height: 100svh; width: 100vw; display: flex; flex-direction: column; background: #000; }
        .header { flex-shrink: 0; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding: 10px 15px; border-bottom: 1px solid rgba(255,255,255,0.08); background: #000; z-index:10; }
        .brand-container { display: flex; align-items: center; gap: 8px; }
        .brand-logo { width: 22px; height: 22px; border-radius: 4px; }
        .brand-text { font-size: 11px; font-weight: 700; letter-spacing: 2px; color: #fff; text-shadow: 0 0 10px ${theme.color}; transition: text-shadow 2s ease-in-out; }
        .nav-actions { display: flex; gap: 12px; align-items: center; justify-content: flex-end; }
        .notify-btn { font-size: 8px; color: #333; cursor: pointer; letter-spacing: 1px; }
        .logout-btn { background: none; border: none; color: #333; font-size: 8px; cursor: pointer; letter-spacing: 1px; padding: 0; }
        .chat-window { flex-grow: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; padding: 20px; background: ${theme.bg}; transition: background 2s ease-in-out; box-shadow: inset 0 0 40px rgba(0,0,0,0.8); }
        .msg { padding: 12px 16px; border-radius: 18px; font-size: 14px; line-height: 1.5; max-width: 85%; backdrop-filter: blur(12px); }
        .mirror-msg { align-self: flex-start; background: rgba(0, 0, 0, 0.55); color: #e0e0e0; border: 1px solid rgba(255,255,255,0.08); }
        .user-msg { align-self: flex-end; background: rgba(255, 255, 255, 0.15); color: #fff; border: 1px solid rgba(255,255,255,0.2); }
        .input-wrapper { flex-shrink: 0; display: flex; gap: 10px; padding: 12px 15px; background: #000; border-top: 1px solid rgba(255,255,255,0.08); }
        input { flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 12px; border-radius: 15px; color: #fff; outline: none; font-size: 16px; }
        .send-btn { width: 45px; height: 45px; border-radius: 12px; border: none; background: rgba(255,255,255,0.05); color: ${theme.color}; display: flex; align-items: center; justify-content: center; }
      `}</style>
      <div className="app-container">
        <div className="header">
          <div className="brand-container">
            <img src="/icon-512x512.png" alt="Logo" className="brand-logo" />
            <span className="brand-text">THE MIRROR</span>
          </div>
          <div></div>
          <div className="nav-actions">
            <span className="notify-btn" onClick={subscribeToPush}>[NOTIFY]</span>
            <MoodIndicator valence={valence} />
            <button className="logout-btn" onClick={handleLogout}>[EXIT]</button>
          </div>
        </div>
        <div className="chat-window">
          {messages.map((msg, i) => (
            <div key={i} className={`msg ${msg.sender === "user" ? "user-msg" : "mirror-msg"}`}>{msg.text}</div>
          ))}
          {loading && <div className="msg mirror-msg" style={{opacity:0.5}}>...</div>}
          <div ref={messagesEndRef} />
        </div>
        <div className="input-wrapper">
          <input value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={(e)=>e.key==="Enter" && sendMessage()} placeholder="Reflect here..." />
          <button className="send-btn" onClick={sendMessage}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
          </button>
        </div>
      </div>
    </>
  );
}
