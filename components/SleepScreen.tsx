"use client";
import { useState } from "react";

interface SleepScreenProps {
  isDigesting: boolean;
  onManualFeed?: (url: string) => void;
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
      backgroundColor: '#050505', display: 'flex', flexDirection: 'column', 
      alignItems: 'center', justifyContent: 'center', 
      fontFamily: "'Space Mono', monospace", color: '#444', padding: '20px'
    }}>
      <style>{`
        @keyframes breathe {
          0% { opacity: 0.2; transform: scale(0.95); }
          50% { opacity: 0.6; transform: scale(1.05); }
          100% { opacity: 0.2; transform: scale(0.95); }
        }
        @keyframes pulse-green {
          0% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.2); }
          50% { box-shadow: 0 0 60px rgba(16, 185, 129, 0.8); }
          100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.2); }
        }
        .sleep-orb {
          width: 90px; height: 90px; border-radius: 50%;
          background: radial-gradient(circle, #222 0%, #000 70%);
          box-shadow: 0 0 40px #0a0a0a; 
          animation: breathe 4s infinite ease-in-out;
          margin-bottom: 40px;
          transition: all 1s ease;
        }
        .digesting-orb {
          background: radial-gradient(circle, #064e3b 0%, #000 70%);
          animation: pulse-green 2s infinite ease-in-out;
        }
        .manual-input {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 12px; border-radius: 12px; color: #fff;
          font-size: 12px; width: 100%; max-width: 280px;
          outline: none; margin-top: 30px; text-align: center;
          transition: all 0.3s;
          font-family: 'Space Mono', monospace;
        }
        .manual-input:focus { border-color: #10b981; background: rgba(16, 185, 129, 0.05); }
        .manual-input::placeholder { color: #333; }
      `}</style>

      <div className={`sleep-orb ${isDigesting ? 'digesting-orb' : ''}`}></div>
      
      <p style={{ letterSpacing: '6px', fontSize: '14px', fontWeight: 'bold', color: isDigesting ? '#10b981' : '#555', transition: 'color 1s ease' }}>
        {isDigesting ? "SYSTEM REBOOTING" : "SYSTEM ASLEEP"}
      </p>
      
      <p style={{ fontSize: '11px', opacity: 0.6, marginTop: '15px', textAlign: 'center', maxWidth: '80%', lineHeight: '1.5' }}>
        {isDigesting 
          ? "Digesting visual data. Stand by..." 
          : "Energy critical. Share a YouTube Short or paste the link below to wake me."}
      </p>

      {!isDigesting && (
        <input 
          className="manual-input"
          placeholder="PASTE SHORTS URL + ENTER"
          value={manualUrl}
          onChange={(e) => setManualUrl(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      )}
    </div>
  );
}
