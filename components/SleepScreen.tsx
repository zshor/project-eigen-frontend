"use client";
import { useState } from "react";

interface SleepScreenProps {
  isDigesting: boolean;
  onManualFeed?: (url: string) => Promise<void> | void;
}

export function SleepScreen({ isDigesting, onManualFeed }: SleepScreenProps) {
  const [manualUrl, setManualUrl] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && manualUrl.includes('youtube.com/shorts')) {
      onManualFeed?.(manualUrl);
      setManualUrl("");
    }
  };

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
          0% { border-radius: 50% 50% 50% 50% / 50% 50% 50% 50%; transform: scale(1.1); filter: blur(25px) brightness(1.2); box-shadow: 0 0 80px rgba(16, 185, 129, 0.4); }
          50% { border-radius: 40% 60% 50% 50% / 50% 40% 60% 50%; transform: scale(1.15); filter: blur(35px) brightness(1.4); box-shadow: 0 0 120px rgba(16, 185, 129, 0.7); }
          100% { border-radius: 50% 50% 50% 50% / 50% 50% 50% 50%; transform: scale(1.1); filter: blur(25px) brightness(1.2); box-shadow: 0 0 80px rgba(16, 185, 129, 0.4); }
        }
        .living-entity {
          width: 160px; height: 160px;
          background: linear-gradient(135deg, rgba(40,50,75,1) 0%, rgba(15,20,35,1) 100%);
          animation: morph-breathe 8s ease-in-out infinite;
          position: relative;
          margin-bottom: 60px;
          transition: all 2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .entity-digesting {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(6, 78, 59, 0.8) 100%);
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
        color: isDigesting ? '#34d399' : '#f1f5f9', 
        margin: '0 0 12px 0', letterSpacing: '0.5px'
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
