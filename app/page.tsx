"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { MoodIndicator } from "@/components/MoodIndicator";
import { SleepScreen } from "@/components/SleepScreen";

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
  const [gossipMode, setGossipMode] = useState(false);
  
  // Cognitive & Feeding States
  const [battery, setBattery] = useState(100);
  const [isDigesting, setIsDigesting] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  // --- NEURAL LINK: HARDWARE TOKEN SYNC ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("fcm_token");

    if (urlToken) {
      localStorage.setItem("pending_fcm_token", urlToken);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const magicToken = urlToken || localStorage.getItem("pending_fcm_token");

    if (!session?.user?.id || !magicToken) return;

    const syncMagicUrl = async () => {
      try {
        const { error } = await supabase.from('push_subscriptions').upsert({
          user_id: session.user.id,
          subscription_json: { token: magicToken },
          created_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

        if (!error) {
          localStorage.removeItem("pending_fcm_token"); 
        }
      } catch (err) {
        console.error("Sync failure:", err);
      }
    };

    syncMagicUrl();
  }, [session]); 

  // --- NATIVE ANDROID SHARE INTENT CATCHER ---
  useEffect(() => {
    if (!session?.user?.id) return;

    const handleNativeShare = (event: any) => {
      const sharedText = event.detail;
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const extractedUrl = sharedText.match(urlRegex)?.[0];

      if (extractedUrl && extractedUrl.includes("youtube.com/shorts")) {
        console.log("[FEED] Native share detected:", extractedUrl);
        feedTheMirror(extractedUrl);
      } else {
        alert("The Mirror can only digest YouTube Shorts.");
      }
    };

    window.addEventListener("android_share", handleNativeShare);
    return () => window.removeEventListener("android_share", handleNativeShare);
  }, [session]);

  const feedTheMirror = async (youtubeUrl: string) => {
    setIsDigesting(true);
    try {
      await fetch("https://project-eigen-backend.onrender.com/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtube_url: youtubeUrl, user_id: session.user.id }),
      });
    } catch (e) {
      console.error("Failed to feed:", e);
    }
    // UX: Show the 'Digesting' state for 3 seconds minimum
    setTimeout(() => setIsDigesting(false), 3000);
  };

  // --- LOAD MEMORY & STATES ---
  useEffect(() => {
    if (!session?.user?.id) return;
    
    const loadUserData = async () => {
      const { data: chatData } = await supabase.from('interactions').select('message, response, valence').eq('user_id', session.user.id).order('created_at', { ascending: true });
      if (chatData && chatData.length > 0) {
        setMessages(chatData.flatMap(d => [{ text: d.message, sender: "user" }, { text: d.response, sender: "mirror" }]));
        setValence(chatData[chatData.length - 1].valence || 0);
      } else {
        setMessages([{ text: "I am the Mirror. I know you.", sender: "mirror" }]);
      }

      const { data: cogData } = await supabase.from('user_cognitive_state').select('manual_gossip_toggle, user_wants_gossip, battery_level').eq('user_id', session.user.id).single();
      if (cogData) {
        setGossipMode(cogData.manual_gossip_toggle || cogData.user_wants_gossip || false);
        if (cogData.battery_level !== undefined) setBattery(cogData.battery_level);
      }
    };
    
    loadUserData();
  }, [session]);

  // --- REALTIME SYNC: Detect Proactive Changes & Battery ---
  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = supabase
      .channel('cognitive-sync')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'user_cognitive_state', filter: `user_id=eq.${session.user.id}` },
        (payload) => {
          if (payload.new.user_wants_gossip !== undefined) setGossipMode(payload.new.user_wants_gossip);
          if (payload.new.battery_level !== undefined) setBattery(payload.new.battery_level);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session?.user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const toggleGossip = async () => {
    const newState = !gossipMode;
    setGossipMode(newState);
    if (session?.user?.id) {
      await supabase.from('user_cognitive_state').upsert({ user_id: session.user.id, manual_gossip_toggle: newState, user_wants_gossip: newState }, { onConflict: 'user_id' });
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !session?.user?.id || battery < 10) return;
    const userMsg: Message = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("https://project-eigen-backend.onrender.com/api/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentInput, user_id: session.user.id, gossip_mode: gossipMode }),
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

  if (!session) {
    return (
      <div style={{ height: '100svh', width: '100vw', backgroundColor: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Mono', monospace" }}>
        <img src="/icon-512x512.png" style={{ width: '80px', marginBottom: '20px' }} />
        <h1 style={{ color: '#fff', letterSpacing: '8px', fontSize: '18px', marginBottom: '40px' }}>THE MIRROR</h1>
        <button onClick={handleLogin} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '12px 24px', borderRadius: '30px', fontSize: '12px', letterSpacing: '2px', cursor: 'pointer' }}>CONTINUE WITH GOOGLE</button>
      </div>
    );
  }

  // --- THE LOCKDOWN INTERCEPTOR ---
  if (battery < 10) {
    return <SleepScreen isDigesting={isDigesting} />;
  }

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
        
        .gossip-wrapper { display: flex; align-items: center; gap: 6px; cursor: pointer; justify-content: center; }
        .gossip-label { font-size: 9px; letter-spacing: 1.5px; font-weight: bold; transition: color 0.3s; color: ${gossipMode ? '#ff4500' : '#444'}; text-shadow: ${gossipMode ? '0 0 5px #ff4500' : 'none'}; }
        .gossip-track { width: 32px; height: 16px; border-radius: 10px; position: relative; transition: all 0.3s; background: ${gossipMode ? 'rgba(255, 69, 0, 0.15)' : 'rgba(255,255,255,0.05)'}; border: 1px solid ${gossipMode ? 'rgba(255, 69, 0, 0.5)' : 'rgba(255,255,255,0.1)'}; }
        .gossip-thumb { width: 10px; height: 10px; border-radius: 50%; position: absolute; top: 2px; transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1); background: ${gossipMode ? '#ff4500' : '#666'}; left: ${gossipMode ? '18px' : '3px'}; box-shadow: ${gossipMode ? '0 0 8px #ff4500' : 'none'}; }
        .nav-actions { display: flex; gap: 12px; align-items: center; justify-content: flex-end; }
        .logout-btn { background: none; border: none; color: #555; font-size: 8px; cursor: pointer; letter-spacing: 1px; padding: 0; }
        .chat-window { flex-grow: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; padding: 20px; background: ${theme.bg}; transition: background 2s ease-in-out; box-shadow: inset 0 0 40px rgba(0,0,0,0.8); }
        .msg { padding: 12px 16px; border-radius: 18px; font-size: 14px; line-height: 1.5; max-width: 85%; backdrop-filter: blur(12px); }
        .mirror-msg { align-self: flex-start; background: rgba(0, 0, 0, 0.55); color: #e0e0e0; border: 1px solid ${gossipMode ? 'rgba(255, 69, 0, 0.15)' : 'rgba(255,255,255,0.08)'}; }
        .user-msg { align-self: flex-end; background: rgba(255, 255, 255, 0.15); color: #fff; border: 1px solid rgba(255,255,255,0.2); }
        
        .input-wrapper { flex-shrink: 0; display: flex; flex-direction: column; gap: 4px; padding: 12px 15px; background: #000; border-top: 1px solid rgba(255,255,255,0.08); }
        .input-row { display: flex; gap: 10px; }
        .battery-bar { height: 2px; width: 100%; background: #222; border-radius: 2px; overflow: hidden; margin-top: 4px; }
        .battery-fill { height: 100%; background: ${battery > 40 ? '#10b981' : battery > 20 ? '#ffcc00' : '#ef4444'}; width: ${battery}%; transition: width 1s ease-in-out, background 1s ease-in-out; }
        
        input { flex: 1; background: rgba(255,255,255,0.05); border: 1px solid ${gossipMode ? 'rgba(255, 69, 0, 0.4)' : 'rgba(255,255,255,0.1)'}; padding: 12px; border-radius: 15px; color: #fff; outline: none; font-size: 16px; transition: border 0.3s; }
        input:focus { border-color: ${gossipMode ? '#ff4500' : 'rgba(255,255,255,0.3)'}; }
        .send-btn { width: 45px; height: 45px; border-radius: 12px; border: none; background: rgba(255,255,255,0.05); color: ${theme.color}; display: flex; align-items: center; justify-content: center; }
        
        /* Happy UX Overlay when digesting */
        .digest-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(16, 185, 129, 0.1); z-index: 100; display: flex; align-items: center; justify-content: center; pointer-events: none; animation: flash 3s ease-out forwards; }
        @keyframes flash { 0% { opacity: 1; backdrop-filter: blur(4px); } 100% { opacity: 0; backdrop-filter: blur(0px); } }
      `}</style>

      {isDigesting && (
        <div className="digest-overlay">
          <h2 style={{ color: '#10b981', letterSpacing: '4px', textShadow: '0 0 20px #10b981' }}>DATA ABSORBED</h2>
        </div>
      )}

      <div className="app-container">
        <div className="header">
          <div className="brand-container">
            <img src="/icon-512x512.png" alt="Logo" className="brand-logo" />
            <span className="brand-text">THE MIRROR</span>
          </div>
          <div className="gossip-wrapper" onClick={toggleGossip}>
            <span className="gossip-label">GOSSIP</span>
            <div className="gossip-track"><div className="gossip-thumb"></div></div>
          </div>
          <div className="nav-actions">
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
          <div className="input-row">
            <input 
              value={input} onChange={(e)=>setInput(e.target.value)} 
              onKeyDown={(e)=>e.key==="Enter" && sendMessage()} 
              placeholder={gossipMode ? "Search the web..." : "Reflect here..."} 
            />
            <button className="send-btn" onClick={sendMessage}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            </button>
          </div>
          <div className="battery-bar"><div className="battery-fill"></div></div>
        </div>
      </div>
    </>
  );
}
