

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
  isSofiTyping: boolean;
  userInfo: UserInfo;
  chatMode: ChatMode;
  isLiveMode: boolean;
  isListening: boolean;
  isSofiSpeaking: boolean;
  toggleLiveMode: () => void;
  onOpenToolsMenu: () => void;
  isConfirmationPending: boolean;
  showAnxietyTool: boolean;
  onOpenBreathingExercise: () => void;
  onLogout: () => void;
  onEditLastMessage: () => void;
  onStopGeneration: () => void;
  onTypingComplete: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, onSendMessage, isLoading, isSofiTyping, userInfo, chatMode, 
  isLiveMode, isListening, isSofiSpeaking, toggleLiveMode, onOpenToolsMenu, isConfirmationPending,
  showAnxietyTool, onOpenBreathingExercise, onLogout, onEditLastMessage, onStopGeneration, onTypingComplete
}) => {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showSendPulse, setShowSendPulse] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);
  
  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; // Reset before calculating
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [inputText]);

  useEffect(() => {
    if (inputText.trim().length > 0) {
      setShowSendPulse(true);
      const timer = setTimeout(() => setShowSendPulse(false), 500);
      return () => clearTimeout(timer);
    }
    if (inputText.trim().length === 0) setShowSendPulse(false);
  }, [inputText]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend(e);
    }
  };

  const handleEditClick = (text: string) => {
    onEditLastMessage();
    setInputText(text);
    textareaRef.current?.focus();
  };
  
  const getHeaderConfig = () => {
    switch(chatMode) {
      case ChatMode.Live: return { title: 'Sofi (Ao Vivo)', statusColor: 'text-red-500', statusText: 'A gravar...' };
      case ChatMode.Psychologist: return { title: 'Sofi (Modo Psicóloga)', statusColor: 'text-sky-600', statusText: 'Online' };
      case ChatMode.Artist: return { title: 'Sofi (Modo Artista)', statusColor: 'text-purple-500', statusText: 'Online' };
      case ChatMode.Chef: return { title: 'Sofi Chef 🍳', statusColor: 'text-orange-500', statusText: 'Online' };
      case ChatMode.DJ: return { title: 'Sofi DJ 🎶', statusColor: 'text-sky-500', statusText: 'Online' };
      case ChatMode.Coding: return { title: 'Sofi (Modo Coding)', statusColor: 'text-green-400', statusText: 'Online' };
      default: return { title: 'Sofi', statusColor: 'text-green-500', statusText: 'Online' };
    }
  }

  const { title: headerTitle, statusColor: headerStatusColor, statusText: headerStatusText } = getHeaderConfig();

  const getInputPlaceholder = () => {
    if(isConfirmationPending) return 'Responde com "sim" ou "não"...';
    if(isSofiTyping) return 'Podes escrever enquanto a Sofi responde...';
    if(chatMode === ChatMode.Coding) return 'Cola o teu código, faz uma pergunta ou carrega em Shift+Enter para uma nova linha...';
    switch(chatMode) {
      case ChatMode.Psychologist: return 'Descreve como te sentes...';
      case ChatMode.Artist: return 'Descreve a imagem que queres criar... 🎨';
      case ChatMode.Chef: return 'Diz-me que ingredientes tens...';
      case ChatMode.DJ: return 'Que tipo de música queres ouvir...?';
      default: return 'Escreve a tua mensagem fofa...';
    }
  }
  const inputPlaceholder = getInputPlaceholder();
  
  const getThemeStyles = () => {
    const baseInput = 'flex-1 w-full px-4 py-2 border rounded-full focus:ring-2 focus:outline-none transition ';
    const baseButton = 'text-white rounded-full p-3 transition-transform transform hover:scale-110 active:scale-95 disabled:cursor-not-allowed disabled:transform-none ';
    const baseHeaderBorder = 'border-b ';
    const baseChatBg = 'flex-1 p-4 overflow-y-auto ';

    switch(chatMode) {
      case ChatMode.Psychologist: return {
        input: baseInput + 'border-sky-300 focus:ring-sky-400',
        button: baseButton + 'bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300',
        headerBorder: baseHeaderBorder + 'border-sky-100',
        chatBg: baseChatBg + 'bg-sky-50/50',
        headerText: 'text-gray-800',
      };
      case ChatMode.Artist: return {
        input: baseInput + 'border-purple-300 focus:ring-purple-400',
        button: baseButton + 'bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300',
        headerBorder: baseHeaderBorder + 'border-purple-100',
        chatBg: baseChatBg + 'bg-purple-50/50',
        headerText: 'text-gray-800',
      };
      case ChatMode.Chef: return {
        input: baseInput + 'border-orange-300 focus:ring-orange-400',
        button: baseButton + 'bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300',
        headerBorder: baseHeaderBorder + 'border-orange-100',
        chatBg: baseChatBg + 'bg-orange-50/50',
        headerText: 'text-gray-800',
      };
      case ChatMode.DJ: return {
        input: baseInput + 'border-sky-300 focus:ring-sky-400',
        button: baseButton + 'bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300',
        headerBorder: baseHeaderBorder + 'border-sky-100',
        chatBg: baseChatBg + 'bg-sky-50/50',
        headerText: 'text-gray-800',
      };
      case ChatMode.Coding: return {
        input: baseInput + 'bg-slate-700 border-indigo-400/50 focus:ring-indigo-300 text-white placeholder-slate-400 !rounded-xl',
        button: baseButton + 'bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-400/50',
        headerBorder: baseHeaderBorder + 'border-slate-600/50',
        chatBg: baseChatBg + 'bg-transparent',
        headerText: 'text-slate-100',
      };
      default: return {
        input: baseInput + 'border-rose-200 focus:ring-rose-400',
        button: baseButton + 'bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300',
        headerBorder: baseHeaderBorder + 'border-rose-100',
        chatBg: baseChatBg + 'bg-rose-50/50',
        headerText: 'text-gray-800',
      };
    }
  }
  const theme = getThemeStyles();

  const lastUserMessageIndex = messages.map(m => m.sender).lastIndexOf(Sender.User);

  return (
    <div className="flex flex-col h-full">
      <header className={`flex items-center justify-between p-4 ${theme.headerBorder}`}>
        <div className="flex items-center">
            <SofiAvatar size="medium" chatMode={chatMode} />
            <div className="ml-3">
              <h2 className={`text-lg font-bold ${theme.headerText}`}>{headerTitle}</h2>
              <p className={`text-sm ${headerStatusColor} flex items-center`}>
                <span className="relative flex h-2.5 w-2.5 mr-2">
                    {chatMode !== ChatMode.Psychologist && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLiveMode ? 'bg-red-400' : headerStatusColor.replace('text-', 'bg-').replace('-500', '-400').replace('-400', '-300')}`}></span>}
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isLiveMode ? 'bg-red-500' : headerStatusColor.replace('text-', 'bg-')}`}></span>
                </span>
                {headerStatusText}
              </p>
            </div>
        </div>
        <div className="flex items-center space-x-2">
            { chatMode !== ChatMode.Psychologist && (
              <button onClick={toggleLiveMode} title={isLiveMode ? "Desativar Modo Ao Vivo" : "Ativar Modo Ao Vivo"} className={`p-2 rounded-full transition-colors ${isLiveMode ? 'bg-red-100 text-red-500 animate-pulse' : (chatMode === ChatMode.Coding ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mic"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
              </button>
            )}
            <button onClick={onLogout} title="Sair" className={`p-2 rounded-full transition-colors ${chatMode === ChatMode.Coding ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            </button>
        </div>
      </header>
      
      <div className={theme.chatBg}>
        <div className="space-y-4">
          {messages.map((msg, index) => {
             const isLastMessage = index === messages.length - 1;
             const isEditable = !isLoading && msg.sender === Sender.User && index === lastUserMessageIndex;

             const shouldBeTypewriter = isLastMessage && msg.sender === Sender.Sofi && isSofiTyping && !isLiveMode && !msg.imageUrl && !msg.structuredData;

             if (shouldBeTypewriter) {
                return <TypewriterMessageBubble key={msg.id} message={msg} chatMode={chatMode} onAnimationComplete={onTypingComplete} onEditCode={setInputText} />
             }
             return <MessageBubble key={msg.id} message={msg} chatMode={chatMode} onEditCode={setInputText} isEditable={isEditable} onEdit={handleEditClick} />
          })}
          {!isLiveMode && isLoading && <LoadingDots chatMode={chatMode} />}
        </div>
        <div ref={chatEndRef} />
      </div>
      
      {showAnxietyTool && (
        <div className="flex justify-center py-3 px-4 border-t border-sky-100 bg-sky-50/70">
          <button onClick={onOpenBreathingExercise} className="w-full text-center px-5 py-2.5 bg-sky-100 text-sky-800 rounded-full hover:bg-sky-200/80 transition-all duration-300 transform animate-breathing-button flex items-center justify-center gap-2 text-sm md:text-base shadow-sm hover:shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wind flex-shrink-0"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></svg>
            <span>Parece que te sentes com ansiedade. Toca aqui para uma pausa.</span>
          </button>
        </div>
      )}

      <footer className={`p-4 ${!showAnxietyTool && theme.headerBorder}`}>
        {isLiveMode ? (
            <LiveModeIndicator isLoading={isLoading} isListening={isListening} isSofiSpeaking={isSofiSpeaking} onExit={toggleLiveMode} />
        ) : (
            <form onSubmit={handleSend} className="flex items-end space-x-3">
                 <button
                    type="button"
                    onClick={onOpenToolsMenu}
                    className="bg-amber-400 text-white rounded-full p-3 transition-transform transform hover:scale-110 active:scale-95 disabled:cursor-not-allowed disabled:bg-amber-200"
                    disabled={isLoading || isConfirmationPending}
                    title="Abrir Ferramentas"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-grid-3x3"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>
                 </button>
              <textarea 
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={inputPlaceholder}
                className={`${theme.input} resize-none max-h-48`}
                rows={1}
                disabled={isLoading}
               />
              
              {isSofiTyping ? (
                  <button
                      type="button"
                      onClick={onStopGeneration}
                      className={`${theme.button} flex items-center justify-center animate-fade-in`}
                      title="Parar de gerar"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                         <rect x="7" y="7" width="10" height="10" rx="1.5" />
                      </svg>
                  </button>
              ) : (
                <button type="submit" disabled={isLoading || !inputText.trim()} className={`${theme.button} flex items-center justify-center ${showSendPulse ? 'animate-pulse-once' : ''}`}>
                    {isLoading ? ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-heart-pulse"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.7-1 2.12 5.14.7-1.5H18.5"/></svg> ) : ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send-horizontal"><path d="m3 3 3 9-3 9 19-9Z"/><path d="M6 12h16"/></svg> )}
                </button>
              )}

            </form>
        )}
      </footer>
    </div>
  );
};

export default ChatInterface;