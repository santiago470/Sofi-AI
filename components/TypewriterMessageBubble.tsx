import React, { useState, useEffect } from 'react';
import { ChatMode } from '../types';
import type { Message } from '../types';
import SofiAvatar from './SofiAvatar';
import CodeBlock from './CodeBlock';

interface TypewriterMessageBubbleProps {
  message: Message;
  chatMode: ChatMode;
  onAnimationComplete: () => void;
  onEditCode: (code: string) => void;
}

const TypewriterMessageBubbleComponent: React.FC<TypewriterMessageBubbleProps> = ({ message, chatMode, onAnimationComplete, onEditCode }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  const getSofiBubbleClass = () => {
    switch(chatMode) {
      case ChatMode.Psychologist: return 'bg-sky-500 text-white';
      case ChatMode.Coding: return 'bg-purple-600 text-white';
      default: return 'bg-rose-400 text-white';
    }
  }
  
  const bubbleClasses = `rounded-bl-none ${getSofiBubbleClass()}`;

  useEffect(() => {
    if (message.text) {
      let i = 0;
      setDisplayedText('');
      setShowCursor(true);

      const parts = message.text.split(/(```[\s\S]*?```)/g);
      let currentPartIndex = 0;
      let charIndex = 0;

      const typingInterval = setInterval(() => {
        if(currentPartIndex >= parts.length) {
            clearInterval(typingInterval);
            setTimeout(() => {
                setShowCursor(false);
                onAnimationComplete();
            }, 750);
            return;
        }
        
        const currentPart = parts[currentPartIndex];
        // If it's a code block, add it all at once for better UX
        if (currentPart.startsWith('```')) {
            setDisplayedText(prev => prev + currentPart);
            currentPartIndex++;
            charIndex = 0;
            return;
        }

        // Type out normal text character by character
        if (charIndex < currentPart.length) {
            setDisplayedText(prev => prev + currentPart.charAt(charIndex));
            charIndex++;
        } else {
            currentPartIndex++;
            charIndex = 0;
        }

      }, 30); // Typing speed
      return () => clearInterval(typingInterval);
    }
  }, [message.text, onAnimationComplete, message.id]);
  
  const renderContent = () => {
    const parts = displayedText.split(/(```[\s\S]*?```)/g);
      return parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const code = part.slice(3, -3);
          const language = code.match(/^[a-z]+\n/)?.[0].trim() || '';
          const codeContent = language ? code.slice(language.length).trim() : code.trim();
          return (
            <CodeBlock
              key={index}
              language={language}
              code={codeContent}
              onEdit={onEditCode}
            />
          );
        }
        return <span key={index}>{part}</span>;
      });
  }

  return (
    <div className={`flex items-end gap-2 justify-start animate-pop-in`}>
      <div className="flex-shrink-0">
        <SofiAvatar size="small" chatMode={chatMode} />
      </div>
      <div
        className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl whitespace-pre-wrap ${bubbleClasses} min-w-0`}
      >
        <div className="flex items-start min-h-[24px]">
          <div className="min-w-0">{renderContent()}</div>
          {showCursor && <span className="w-0.5 h-5 bg-white/80 ml-1 animate-pulse" style={{ animationDuration: '1s' }}></span>}
        </div>
      </div>
    </div>
  );
};

export default React.memo(TypewriterMessageBubbleComponent);