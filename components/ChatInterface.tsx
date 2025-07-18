import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Message, UserInfo } from '../types';
import { Sender, ChatMode } from '../types';
import MessageBubble from './MessageBubble';
import LoadingDots from './LoadingDots';
import SofiAvatar from './SofiAvatar';
import LiveModeIndicator from './LiveModeIndicator';
import TypewriterMessageBubble from './TypewriterMessageBubble';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  userInfo: UserInfo;
  chatMode: ChatMode;
  isLiveMode: boolean;
  isListening: boolean;
  isSofiSpeaking: boolean;
  toggleLiveMode: () => void;
  isConfirmationPending: boolean;
  showAnxietyTool: boolean;
  onOpenBreathingExercise: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, onSendMessage, isLoading, userInfo, chatMode, 
  isLiveMode, isListening, isSofiSpeaking, toggleLiveMode, isConfirmationPending,
  showAnxietyTool, onOpenBreathingExercise
}) => {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showSendPulse, setShowSendPulse] = useState(false);

  const isPsychologistMode = chatMode === ChatMode.Psychologist;

  const onTypewriterComplete = useCallback(() => {
    // This is a stable function reference for the memoized Typewriter component.
    // We don't need it to do anything here.
  }, []);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);
  
  useEffect(() => {
    // Pulse the send button when user starts typing, but not in psychologist mode.
    if (inputText.trim().length === 1 && !isPsychologistMode) {
      setShowSendPulse(true);
      const timer = setTimeout(() => setShowSendPulse(false), 500); // Animation duration
      return () => clearTimeout(timer);
    }
    if (inputText.trim().length === 0) {
      setShowSendPulse(false);
    }
  }, [inputText, isPsychologistMode]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  const headerTitle = isLiveMode ? 'Sofi (Ao Vivo)' : isPsychologistMode ? 'Sofi (Modo Psicóloga)' : 'Sofi';
  const headerStatusColor = isLiveMode ? 'text-red-500' : isPsychologistMode ? 'text-sky-600' : 'text-green-500';
  const headerStatusText = isLiveMode ? 'A gravar...' : 'Online';

  const inputPlaceholder = isConfirmationPending 
    ? 'Responde com "sim" ou "não"...' 
    : (isPsychologistMode ? 'Descreve como te sentes...' : 'Escreve a tua mensagem fofa...');
  
  const inputClasses = `flex-1 w-full px-4 py-2 border rounded-full focus:ring-2 focus:outline-none transition ${isPsychologistMode 
    ? 'border-sky-300 focus:ring-sky-400' 
    : 'border-rose-200 focus:ring-rose-400'
  }`;

  const buttonClasses = `text-white rounded-full p-3 transition-transform transform hover:scale-110 active:scale-95 disabled:cursor-not-allowed disabled:transform-none ${isPsychologistMode
    ? 'bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300'
    : 'bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300'
  }`;

  return (
    <div className="flex flex-col h-full">
      <header className={`flex items-center justify-between p-4 border-b ${isPsychologistMode ? 'border-sky-100' : 'border-rose-100'}`}>
        <div className="flex items-center">
            <SofiAvatar size="medium" chatMode={chatMode} />
            <div className="ml-3">
              <h2 className="text-lg font-bold text-gray-800">{headerTitle}</h2>
              <p className={`text-sm ${headerStatusColor} flex items-center`}>
                <span className="relative flex h-2.5 w-2.5 mr-2">
                    {!isPsychologistMode && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLiveMode ? 'bg-red-400' : 'bg-green-400'}`}></span>}
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isLiveMode ? 'bg-red-500' : isPsychologistMode ? 'bg-sky-500' : 'bg-green-500'}`}></span>
                </span>
                {headerStatusText}
              </p>
            </div>
        </div>
        { chatMode !== ChatMode.Psychologist && (
          <button onClick={toggleLiveMode} className={`p-2 rounded-full transition-colors ${isLiveMode ? 'bg-red-100 text-red-500 animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mic"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
          </button>
        )}
      </header>
      
      <div className={`flex-1 p-4 overflow-y-auto ${isPsychologistMode ? 'bg-sky-50/50' : 'bg-rose-50/50'}`}>
        <div className="space-y-4">
          {messages.map((msg, index) => {
             const isLastMessage = index === messages.length - 1;
             // Animate the last message if it's from Sofi, we are not loading the next one, and not in live mode.
             if (isLastMessage && msg.sender === Sender.Sofi && !isLoading && !isLiveMode) {
                return <TypewriterMessageBubble key={msg.id} message={msg} chatMode={chatMode} onAnimationComplete={onTypewriterComplete} />
             }
             return <MessageBubble key={msg.id} message={msg} chatMode={chatMode} />
          })}
          {!isLiveMode && isLoading && <LoadingDots chatMode={chatMode} />}
        </div>
        <div ref={chatEndRef} />
      </div>
      
      {showAnxietyTool && (
        <div className="flex justify-center py-3 px-4 border-t border-sky-100 bg-sky-50/70">
          <button 
            onClick={onOpenBreathingExercise}
            className="w-full text-center px-5 py-2.5 bg-sky-100 text-sky-800 rounded-full hover:bg-sky-200/80 transition-all duration-300 transform hover:scale-[1.03] animate-pulse-slow flex items-center justify-center gap-2 text-sm md:text-base shadow-sm hover:shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wind flex-shrink-0"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></svg>
            <span>Parece que te sentes com ansiedade. Toca aqui para uma pausa.</span>
          </button>
        </div>
      )}

      <footer className={`p-4 ${!showAnxietyTool && 'border-t'} ${isPsychologistMode ? 'border-sky-100' : 'border-rose-100'}`}>
        { isLiveMode ? (
            <LiveModeIndicator
                isLoading={isLoading}
                isListening={isListening}
                isSofiSpeaking={isSofiSpeaking}
                onExit={toggleLiveMode}
            />
        ) : (
            <form onSubmit={handleSend} className="flex items-center space-x-3">
            <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={inputPlaceholder}
                className={inputClasses}
                disabled={isLoading}
            />
            <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className={`${buttonClasses} ${showSendPulse ? 'animate-pulse-once' : ''}`}
            >
                {isLoading ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-heart-pulse"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.7-1 2.12 5.14.7-1.5H18.5"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send-horizontal"><path d="m3 3 3 9-3 9 19-9Z"/><path d="M6 12h16"/></svg>
                )}
            </button>
          </form>
        )}
      </footer>
    </div>
  );
};

export default ChatInterface;
