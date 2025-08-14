import React from 'react';
import { ChatMode } from '../types';

const SOFI_HEARTS = 15;
const ARTIST_SPLATS = 10;
const CHEF_BUBBLES = 20;
const DJ_CIRCLES = 8;
const CODING_SYMBOLS = 20;
const PSYCHOLOGIST_ORBS = 5;
const SPLAT_COLORS = ['rgba(196, 181, 253, 0.4)', 'rgba(167, 139, 250, 0.4)', 'rgba(139, 92, 246, 0.4)'];
const CODE_ITEMS = ['<>', '{}', '=>', '/>', '()', '[]', '||', '&&', '!=', '=='];


const BackgroundAnimations: React.FC<{ chatMode: ChatMode }> = ({ chatMode }) => {
  const renderAnimations = () => {
    switch (chatMode) {
      case ChatMode.Sofi:
      case ChatMode.Live:
        return (
          <>
            {Array.from({ length: SOFI_HEARTS }).map((_, i) => (
              <span
                key={`heart-${i}`}
                className="heart"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 20}s`,
                  fontSize: `${12 + Math.random() * 16}px`,
                  opacity: Math.random() * 0.4 + 0.1,
                }}
              >
                {Math.random() > 0.5 ? '💖' : '✨'}
              </span>
            ))}
          </>
        );
      
      case ChatMode.Psychologist:
        return (
          <>
            {Array.from({ length: PSYCHOLOGIST_ORBS }).map((_, i) => (
              <div
                key={`orb-${i}`}
                className="soft-orb"
                style={{
                  top: `${10 + Math.random() * 80}%`,
                  left: `${10 + Math.random() * 80}%`,
                  width: `${60 + Math.random() * 120}px`,
                  height: `${60 + Math.random() * 120}px`,
                  animationDelay: `${Math.random() * 10}s`,
                }}
              />
            ))}
          </>
        );

      case ChatMode.Artist:
        return (
           <>
            {Array.from({ length: ARTIST_SPLATS }).map((_, i) => (
                <div
                    key={`splat-${i}`}
                    className="splat"
                    style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        width: `${50 + Math.random() * 100}px`,
                        height: `${50 + Math.random() * 100}px`,
                        background: SPLAT_COLORS[i % SPLAT_COLORS.length],
                        animationDelay: `${Math.random() * 6}s`,
                    }}
                />
            ))}
           </>
        );
    
      case ChatMode.Chef:
        return (
           <>
            {Array.from({ length: CHEF_BUBBLES }).map((_, i) => (
                <div
                    key={`bubble-${i}`}
                    className="bubble"
                    style={{
                        left: `${Math.random() * 100}%`,
                        width: `${5 + Math.random() * 20}px`,
                        height: `${5 + Math.random() * 20}px`,
                        animationDelay: `${Math.random() * 10}s`,
                        animationDuration: `${5 + Math.random() * 8}s`,
                        opacity: Math.random() * 0.3 + 0.1,
                    }}
                />
            ))}
           </>
        );

      case ChatMode.DJ:
        return (
           <>
            {Array.from({ length: DJ_CIRCLES }).map((_, i) => (
                <div
                    key={`pulse-${i}`}
                    className="pulse-circle"
                    style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        width: `${100 + Math.random() * 200}px`,
                        height: `${100 + Math.random() * 200}px`,
                        animationDelay: `${Math.random() * 5}s`,
                    }}
                />
            ))}
           </>
        );
      case ChatMode.Coding:
          return (
            <>
              {Array.from({ length: CODING_SYMBOLS }).map((_, i) => (
                <span
                  key={`code-${i}`}
                  className="code-symbol"
                  style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 10}s`,
                    animationDuration: `${5 + Math.random() * 5}s`,
                    opacity: Math.random() * 0.4 + 0.2,
                  }}
                >
                  {CODE_ITEMS[i % CODE_ITEMS.length]}
                </span>
              ))}
            </>
          );
      
      default:
        return null;
    }
  };

  return (
    <div id="background-animations" className="background-animation-container fixed inset-0 w-full h-full pointer-events-none overflow-hidden z-0">
        {renderAnimations()}
    </div>
  )
};

export default BackgroundAnimations;