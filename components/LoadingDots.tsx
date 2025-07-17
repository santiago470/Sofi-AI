import React from 'react';
import SofiAvatar from './SofiAvatar';
import { ChatMode } from '../types';

interface LoadingDotsProps {
  chatMode: ChatMode;
}

const LoadingDots: React.FC<LoadingDotsProps> = ({ chatMode }) => {
  const isPsychologistMode = chatMode === ChatMode.Psychologist;
  
  const bubbleColor = isPsychologistMode ? 'bg-sky-500' : 'bg-rose-400';
  const textColor = isPsychologistMode ? 'text-sky-100/80' : 'text-rose-100/80';
  const loadingText = isPsychologistMode ? 'A Sofi está a refletir...' : 'A Sofi está a preparar algo fofo...';

  return (
    <div className="flex items-end gap-2 justify-start animate-pop-in">
      <div className="flex-shrink-0">
        <SofiAvatar size="small" chatMode={chatMode} />
      </div>
      <div className={`px-4 py-3 rounded-2xl rounded-bl-none text-white ${bubbleColor}`}>
        <div className="flex items-center justify-center space-x-1">
            <span className={`text-xs mr-2 ${textColor}`}>{loadingText}</span>
            {isPsychologistMode ? (
                <>
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                </>
            ) : (
                <div className="animate-cute-bounce text-lg">
                    <span>💖</span>
                    <span>✨</span>
                    <span>🌸</span>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default LoadingDots;