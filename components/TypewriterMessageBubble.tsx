import React, { useState, useEffect } from 'react';
import { ChatMode } from '../types';
import type { Message } from '../types';
import SofiAvatar from './SofiAvatar';

interface TypewriterMessageBubbleProps {
  message: Message;
  chatMode: ChatMode;
  onAnimationComplete: () => void;
}

const TypewriterMessageBubbleComponent: React.FC<TypewriterMessageBubbleProps> = ({ message, chatMode, onAnimationComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  const isPsychologistMode = chatMode === ChatMode.Psychologist;
  const bubbleClasses = `rounded-bl-none ${isPsychologistMode ? 'bg-sky-500 text-white' : 'bg-rose-400 text-white'}`;

  useEffect(() => {
    if (message.text) {
      let i = 0;
      setDisplayedText('');
      setShowCursor(true);
      const typingInterval = setInterval(() => {
        if (i < message.text.length) {
          setDisplayedText(prev => prev + message.text.charAt(i));
          i++;
        } else {
          clearInterval(typingInterval);
          // Let cursor blink a bit before disappearing
          setTimeout(() => {
              setShowCursor(false);
              onAnimationComplete();
          }, 750);
        }
      }, 40); // Typing speed
      return () => clearInterval(typingInterval);
    }
  }, [message.text, onAnimationComplete, message.id]);

  return (
    <div className={`flex items-end gap-2 justify-start animate-pop-in`}>
      <div className="flex-shrink-0">
        <SofiAvatar size="small" chatMode={chatMode} />
      </div>
      <div
        className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl whitespace-pre-wrap ${bubbleClasses}`}
      >
        <p className="flex items-center min-h-[24px]">
          <span>{displayedText}</span>
          {showCursor && <span className="w-0.5 h-5 bg-white/80 ml-1 animate-pulse" style={{ animationDuration: '1s' }}></span>}
        </p>
      </div>
    </div>
  );
};

export default React.memo(TypewriterMessageBubbleComponent);
