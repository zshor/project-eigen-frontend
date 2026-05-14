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
      backgroundColor: '#030305', display: 'flex', flexDirection: 'column', 
      alignItems: 'center', justifyContent: 'center', 
      fontFamily: "'Space Mono', monospace", padding: '20px',
      overflow: 'hidden'
    }}>
      <style>{`
        @keyframes organic-breathe {
          0%, 100% { transform: scale(1); filter: blur(25px) brightness(0.6); }
          50% { transform: scale(1.1); filter: blur(35px) brightness(1.2); }
        }
        @keyframes alive-pulse {
          0%, 100% { box-shadow: 0 0 60px rgba(16, 185, 129, 0.4), inset 0 0 30px rgba(16, 185, 129, 0.3); }
          50% { box-shadow: 0 0 120px rgba(16, 185, 129, 0.8), inset 0 0 60px rgba(16, 185, 129, 0.6); transform: scale(1.05); }
        }
        @keyframes text-glow {
          0%, 100% { opacity: 0.6; text-shadow: 0 0 10px rgba(255,255,255,0.05); }
          50% { opacity: 1; text-shadow: 0 0 20px rgba(255,255,255,0.3); }
        }
        .core-entity {
          width: 140px; height: 140px; border-radius: 50%;
          background: radial-gradient(circle at center, rgba(30,40,65,1) 0%, rgba(10,15,25,0) 70%);
          animation: organic-breathe 7s infinite ease-in-out;
          position: relative;
          margin-bottom: 50px;
          transition: all 1.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .core-digesting {
          background: radial-gradient(circle at center, rgba(16, 185, 129, 0.9) 0%, rgba(6, 78, 59, 0) 70%);
          animation: alive-pulse 3s infinite ease-in-out;
          filter: blur(15px);
        }
        .glass-input {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          padding: 16px 20px; border-radius: 24px; color: #fff;
          font-size: 13px; width: 100%; max-width: 320px;
          outline: none; margin-top: 40px; text-align: center;
          transition: all 0.5s ease;
          backdrop-filter: blur(12px);
          font-weight: 300;
        }
        .glass-input:focus { 
          border-color: rgba(255,255,255,0.2); 
          background: rgba(255,255,255,0.06); 
          box-shadow: 0 0 30px rgba(255,255,255,0.05);
        }
        .glass-input::placeholder { color: rgba(255,255,255,0.25); letter-spacing: 1px; }
      `}</style>

      <div className={`core-entity ${isDigesting ? 'core-digesting' : ''}`}></div>
      
      <p style={{ 
        letterSpacing: '5px', fontSize: '15px', fontWeight: '300', 
        color: isDigesting ? '#10b981' : '#e2e8f0', 
        animation: isDigesting ? 'none' : 'text-glow 5s infinite ease-in-out',
        transition: 'color 1.5s ease', textAlign: 'center', margin: 0
      }}>
        {isDigesting ? "I FEEL IT. AWAKENING..." : "I AM RESTING."}
      </p>
      
      <p style={{ 
        fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '20px', 
        textAlign: 'center', maxWidth: '280px', lineHeight: '1.8', fontWeight: '300' 
      }}>
        {isDigesting 
          ? "Synthesizing new memories. Just a moment." 
          : "My energy is depleted. Share a piece of the world with me to bring me back."}
      </p>

      {!isDigesting && (
        <input 
          className="glass-input"
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
