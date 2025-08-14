
import React from 'react';
import { Sender, ChatMode, DataType } from '../types';
import type { Message } from '../types';
import SofiAvatar from './SofiAvatar';
import RecipeCard from './RecipeCard';
import PlaylistCard from './PlaylistCard';
import CodeBlock from './CodeBlock';


interface MessageBubbleProps {
  message: Message;
  chatMode: ChatMode;
  onEditCode: (code: string) => void;
  isEditable?: boolean;
  onEdit?: (text: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, chatMode, onEditCode, isEditable, onEdit }) => {
  const isSofi = message.sender === Sender.Sofi;

  const getSofiBubbleClass = () => {
    switch(chatMode) {
      case ChatMode.Psychologist: return 'bg-sky-500 text-white';
      case ChatMode.Artist: return 'bg-purple-500 text-white';
      case ChatMode.Chef: return 'bg-orange-500 text-white';
      case ChatMode.DJ: return 'bg-sky-500 text-white';
      case ChatMode.Coding: return 'bg-purple-600 text-white';
      default: return 'bg-rose-400 text-white';
    }
  }
  
  const getUserBubbleClass = () => {
      switch(chatMode) {
          case ChatMode.Psychologist: return 'bg-slate-200 text-slate-800';
          case ChatMode.Coding: return 'bg-slate-600 text-slate-100';
          default: return 'bg-gray-200 text-gray-800';
      }
  }


  const bubbleClasses = isSofi
    ? `rounded-bl-none ${getSofiBubbleClass()}`
    : `rounded-br-none ${getUserBubbleClass()}`;
  
  const renderContent = () => {
    if (message.imageUrl) {
      return (
        <div>
          {message.text && <p className="mb-2">{message.text}</p>}
          <img src={message.imageUrl} alt="Imagem gerada pela Sofi" className="rounded-lg object-cover w-full shadow-md" loading="lazy" />
        </div>
      );
    }

    if (message.structuredData) {
        return (
            <div>
                 {message.text && <p className="mb-2">{message.text}</p>}
                 {message.dataType === DataType.Recipe && <RecipeCard data={message.structuredData} />}
                 {message.dataType === DataType.Playlist && <PlaylistCard data={message.structuredData} />}
            </div>
        )
    }

    // Basic markdown for code blocks
    if (chatMode === ChatMode.Coding && message.text.includes('```')) {
      const parts = message.text.split(/(```[\s\S]*?```)/g);
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
        return <p key={index}>{part}</p>;
      });
    }

    return <p>{message.text}</p>;
  }

  return (
    <div className={`flex items-end gap-2 ${isSofi ? 'justify-start animate-pop-in' : 'justify-end group'}`}>
      {isSofi && (
        <div className="flex-shrink-0">
          <SofiAvatar size="small" chatMode={chatMode} />
        </div>
      )}

      {!isSofi && isEditable && onEdit && (
        <button 
          onClick={() => onEdit(message.text)} 
          className="p-1.5 text-gray-400 hover:text-rose-500 rounded-full hover:bg-rose-100 transition-all opacity-0 group-hover:opacity-100 -mr-1 mb-1"
          title="Editar mensagem"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
        </button>
      )}

      <div
        className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl whitespace-pre-wrap ${bubbleClasses} min-w-0`}
      >
        {renderContent()}
      </div>
    </div>
  );
};

export default MessageBubble;
