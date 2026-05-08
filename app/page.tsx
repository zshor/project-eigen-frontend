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
      const { data } = await supabase.from('interactions').select('message, response, valence').eq('user_id', session.user.id).order('created_at', { ascending: true });
      if (data && data.length > 0) {
        setMessages(data.flatMap(d => [{ text: d.message, sender: "user" }, { text: d.response, sender: "mirror" }]));
        const last = data[data.length - 1];
        if (last.valence !== undefined) setValence(last.valence);
      } else {
        setMessages([{ text: "I am the Mirror. I know you.", sender: "mirror" }]);
      }
    };
    loadMemory();
  }, [session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // --- PUSH NOTIFICATION SUBSCRIPTION LOGIC ---
  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator) || !session?.user?.id) {
      alert("Push notifications are not supported on this browser.");
      return;
    }

    try {
      // 1. Register the listener
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      // 2. Request permission and get the unique address
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      });

      // 3. Save the address to Supabase
      const { error } = await supabase.from('push_subscriptions').insert({
        user_id: session.user.id,
        subscription_json: subscription
      });

      if (error) throw error;
      alert("The Mirror is now connected to your lock screen.");
    } catch (err) {
      console.error("Push Error:", err);
      alert("Failed to connect. Check console for details.");
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

  if (!session) return <div style={{height:'100svh', backgroundColor:'#000'}}></div>;

  return (
    <>
      <style>{`
        body, html { margin: 0; padding: 0; background-color: #000; font-family: 'Space Mono', monospace; height: 100%; overflow: hidden; }
        .app-container { height: 100svh; width: 100vw; display: flex; flex-direction: column; background: #000; }
        .header { flex-shrink: 0; display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; border-bottom: 1px solid rgba(255,255,255,0.08); background: #000; z-index:10; }
        .brand-text { font-size: 13px; font-weight: 700; letter-spacing: 4px; color: #fff; text-shadow: 0 0 15px ${theme.color}; }
        .chat-window { flex-grow: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; padding: 20px; background: ${theme.bg}; transition: background 2s ease-in-out; box-shadow: inset 0 0 40px rgba(0,0,0,0.8); }
        .msg { padding: 12px 16px; border-radius: 18px; font-size: 14px; line-height: 1.5; max-width: 85%; backdrop-filter: blur(12px); }
        .mirror-msg { align-self: flex-start; background: rgba(0, 0, 0, 0.55); color: #e0e0e0; border: 1px solid rgba(255,255,255,0.08); }
        .user-msg { align-self: flex-end; background: rgba(255, 255, 255, 0.15); color: #fff; border: 1px solid rgba(255,255,255,0.2); }
        .input-wrapper { flex-shrink: 0; display: flex; gap: 10px; padding: 12px 15px; background: #000; border-top: 1px solid rgba(255,255,255,0.08); }
        input { flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 12px; border-radius: 15px; color: #fff; outline: none; font-size: 16px; }
        .notify-btn { font-size: 9px; color: #444; cursor: pointer; letter-spacing: 1px; transition: color 0.3s; }
        .notify-btn:hover { color: ${theme.color}; }
      `}</style>
      <div className="app-container">
        <div className="header">
          <span className="brand-text">THE MIRROR</span>
          <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
            <span className="notify-btn" onClick={subscribeToPush}>[ NOTIFY ]</span>
            <MoodIndicator valence={valence} />
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
        </div>
      </div>
    </>
  );
}
