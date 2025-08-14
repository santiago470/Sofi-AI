
import React from 'react';
import SofiAvatar from './SofiAvatar';
import { ChatMode } from '../types';

interface LoadingDotsProps {
  chatMode: ChatMode;
}

const LoadingDots: React.FC<LoadingDotsProps> = ({ chatMode }) => {
  const getThemeConfig = () => {
    switch(chatMode) {
      case ChatMode.Psychologist:
        return {
          bubble: 'bg-sky-500',
          text: 'text-sky-100/80',
          loadingText: 'A Sofi está a refletir...',
          isPsychologist: true,
          emojis: []
        };
      case ChatMode.Artist:
        return {
          bubble: 'bg-purple-500',
          text: 'text-purple-100/80',
          loadingText: 'A Sofi está a pintar a tua obra-prima...',
          isPsychologist: false,
          emojis: ['🎨', '🖌️', '✨']
        };
      case ChatMode.Chef:
        return {
          bubble: 'bg-orange-500',
          text: 'text-orange-100/80',
          loadingText: 'A Sofi está a cozinhar...',
          isPsychologist: false,
          emojis: ['🍳', '🥕', '💖']
        };
      case ChatMode.DJ:
        return {
          bubble: 'bg-sky-500',
          text: 'text-sky-100/80',
          loadingText: 'A Sofi prepara o som...',
          isPsychologist: false,
          emojis: ['🎶', '🎧', '💃']
        };
      case ChatMode.Coding:
        return {
          bubble: 'bg-indigo-500',
          text: 'text-indigo-100/80',
          loadingText: 'A Sofi está a compilar...',
          isPsychologist: false,
          emojis: ['💻', '⚙️', '💡']
        };
      default:
        return {
          bubble: 'bg-rose-400',
          text: 'text-rose-100/80',
          loadingText: 'A Sofi está a preparar algo fofo...',
          isPsychologist: false,
          emojis: ['💖', '✨', '🌸']
        };
    }
  }

  const { bubble: bubbleColor, text: textColor, loadingText, isPsychologist, emojis } = getThemeConfig();

  return (
    <div className="flex items-end gap-2 justify-start animate-pop-in">
      <div className="flex-shrink-0">
        <SofiAvatar size="small" chatMode={chatMode} />
      </div>
      <div className={`px-4 py-3 rounded-2xl rounded-bl-none text-white ${bubbleColor}`}>
        <div className="flex items-center justify-center space-x-1">
            <span className={`text-xs mr-2 ${textColor}`}>{loadingText}</span>
            {isPsychologist ? (
                <>
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                </>
            ) : (
                <div className="animate-cute-bounce text-lg">
                    <span>{emojis[0]}</span>
                    <span>{emojis[1]}</span>
                    <span>{emojis[2]}</span>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default LoadingDots;