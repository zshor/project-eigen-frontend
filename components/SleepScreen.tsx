"use client";
import { useState } from "react";

interface SleepScreenProps {
  isDigesting: boolean;
  onManualFeed?: (url: string) => Promise<void> | void;
  valence?: number; // 🧠 The emotion hook
}

export function SleepScreen({ isDigesting, onManualFeed, valence = 0 }: SleepScreenProps) {
  const [manualUrl, setManualUrl] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && manualUrl.includes('youtube.com/shorts')) {
      onManualFeed?.(manualUrl);
      setManualUrl("");
    }
  };

  // 🧠 EMOTIONAL COLOR ENGINE
  const emotionTheme = (() => {
    if (valence > 0.65) return { core: "rgba(255, 204, 0, 1)", edge: "rgba(60, 45, 0, 1)", glow: "rgba(255, 204, 0, 0.4)" }; // Happy/Yellow
    if (valence > 0.2) return { core: "rgba(16, 185, 129, 1)", edge: "rgba(0, 50, 30, 1)", glow: "rgba(16, 185, 129, 0.4)" }; // Content/Green
    if (valence < -0.65) return { core: "rgba(239, 68, 68, 1)", edge: "rgba(60, 0, 0, 1)", glow: "rgba(239, 68, 68, 0.4)" }; // Angry/Red
    if (valence < -0.2) return { core: "rgba(59, 130, 246, 1)", edge: "rgba(0, 25, 70, 1)", glow: "rgba(59, 130, 246, 0.4)" }; // Sad/Blue
    return { core: "rgba(120, 120, 130, 1)", edge: "rgba(15, 20, 35, 1)", glow: "rgba(120, 120, 130, 0.2)" }; // Neutral/Grey
  })();

  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
      backgroundColor: '#0a0a0c', display: 'flex', flexDirection: 'column', 
      alignItems: 'center', justifyContent: 'center', 
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", 
      padding: '20px', overflow: 'hidden'
    }}>
      <style>{`
        @keyframes morph-breathe {
          0% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; transform: scale(1); filter: blur(20px) brightness(0.8); }
          50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; transform: scale(1.05); filter: blur(25px) brightness(1.1); }
          100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; transform: scale(1); filter: blur(20px) brightness(0.8); }
        }
        @keyframes morph-awake {
          0% { border-radius: 50% 50% 50% 50% / 50% 50% 50% 50%; transform: scale(1.1); filter: blur(25px) brightness(1.2); box-shadow: 0 0 80px ${emotionTheme.glow}; }
          50% { border-radius: 40% 60% 50% 50% / 50% 40% 60% 50%; transform: scale(1.15); filter: blur(35px) brightness(1.4); box-shadow: 0 0 120px ${emotionTheme.glow}; }
          100% { border-radius: 50% 50% 50% 50% / 50% 50% 50% 50%; transform: scale(1.1); filter: blur(25px) brightness(1.2); box-shadow: 0 0 80px ${emotionTheme.glow}; }
        }
        .living-entity {
          width: 160px; height: 160px;
          background: linear-gradient(135deg, ${emotionTheme.core} 0%, ${emotionTheme.edge} 100%);
          animation: morph-breathe 8s ease-in-out infinite;
          position: relative;
          margin-bottom: 60px;
          transition: all 2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .entity-digesting {
          animation: morph-awake 4s ease-in-out infinite;
        }
        .soft-input {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 18px 24px; border-radius: 30px; color: #f8fafc;
          font-size: 14px; width: 100%; max-width: 320px;
          outline: none; margin-top: 50px; text-align: center;
          transition: all 0.4s ease;
          backdrop-filter: blur(16px);
          font-weight: 400;
          letter-spacing: 0.5px;
        }
        .soft-input:focus { 
          border-color: rgba(255,255,255,0.3); 
          background: rgba(255,255,255,0.08); 
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          transform: translateY(-2px);
        }
        .soft-input::placeholder { color: rgba(255,255,255,0.3); font-weight: 300; }
        
        .fade-text {
          transition: opacity 1s ease, transform 1s ease;
        }
      `}</style>

      <div className={`living-entity ${isDigesting ? 'entity-digesting' : ''}`}></div>
      
      <h2 className="fade-text" style={{ 
        fontSize: '22px', fontWeight: '400', 
        color: isDigesting ? emotionTheme.core : '#f1f5f9', 
        margin: '0 0 12px 0', letterSpacing: '0.5px',
        transition: 'color 1s ease'
      }}>
        {isDigesting ? "I feel that. Awakening..." : "I'm resting right now."}
      </h2>
      
      <p className="fade-text" style={{ 
        fontSize: '14px', color: '#94a3b8', margin: 0, 
        textAlign: 'center', maxWidth: '300px', lineHeight: '1.6', fontWeight: '300' 
      }}>
        {isDigesting 
          ? "Synthesizing new memories. Give me just a moment." 
          : "I've run out of energy. Share a piece of your world with me to bring me back."}
      </p>

      {!isDigesting && (
        <input 
          className="soft-input fade-text"
          placeholder="Offer a YouTube Short..."
          value={manualUrl}
          onChange={(e) => setManualUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
      )}
    </div>
  );
}
