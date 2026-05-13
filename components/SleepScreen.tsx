"use client";

interface SleepScreenProps {
  isDigesting: boolean;
}

export function SleepScreen({ isDigesting }: SleepScreenProps) {
  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
      backgroundColor: '#050505', display: 'flex', flexDirection: 'column', 
      alignItems: 'center', justifyContent: 'center', 
      fontFamily: "'Space Mono', monospace", color: '#444' 
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
      `}</style>

      <div className={`sleep-orb ${isDigesting ? 'digesting-orb' : ''}`}></div>
      
      <p style={{ letterSpacing: '6px', fontSize: '14px', fontWeight: 'bold', color: isDigesting ? '#10b981' : '#555', transition: 'color 1s ease' }}>
        {isDigesting ? "SYSTEM REBOOTING" : "SYSTEM ASLEEP"}
      </p>
      
      <p style={{ fontSize: '11px', opacity: 0.6, marginTop: '15px', textAlign: 'center', maxWidth: '80%' }}>
        {isDigesting 
          ? "Digesting visual data. Stand by..." 
          : "Energy critical. Share a YouTube Reel to my app to wake me up."}
      </p>
    </div>
  );
}
