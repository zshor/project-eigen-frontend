"use client";

import React, { useState, useEffect } from 'react';

const MOOD_SETS = {
  ecstatic: ['🌟', '🤩', '🔥', '🚀', '🌈'],
  peaceful: ['😌', '✨', '🍃', '🕯️', '🌊'],
  intense: ['😤', '🧨', '⚡', '🌋', '🌪️'],
  melancholy: ['😶', '🌑', '🥀', '🧊', '☁️'],
  balanced: ['💠', '☯️', '🎐', '🪐', '👁️‍🗨️']
};

export const MoodIndicator = ({ valence }: { valence: number }) => {
  const [emoji, setEmoji] = useState('💠');

  useEffect(() => {
    let currentSet;
    if (valence > 0.4) currentSet = MOOD_SETS.ecstatic;
    else if (valence > 0.1) currentSet = MOOD_SETS.peaceful;
    else if (valence < -0.4) currentSet = MOOD_SETS.intense;
    else if (valence < -0.1) currentSet = MOOD_SETS.melancholy;
    else currentSet = MOOD_SETS.balanced;

    const randomEmoji = currentSet[Math.floor(Math.random() * currentSet.length)];
    setEmoji(randomEmoji);
  }, [valence]);

  return (
    <div className="flex items-center gap-2 group cursor-help transition-all" title={`Mood Score: ${valence.toFixed(2)}`}>
      <span style={{ fontSize: '10px', letterSpacing: '1px', opacity: 0.4, color: '#fff', textTransform: 'uppercase' }}>Vibe</span>
      <span key={emoji} style={{ fontSize: '18px', display: 'inline-block' }}>
        {emoji}
      </span>
    </div>
  );
};
