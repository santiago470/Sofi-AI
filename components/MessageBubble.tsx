import React from 'react';
import { Sender, ChatMode } from '../types';
import type { Message } from '../types';
import SofiAvatar from './SofiAvatar';

interface MessageBubbleProps {
  message: Message;
  chatMode: ChatMode;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, chatMode }) => {
  const isSofi = message.sender === Sender.Sofi;
  const isPsychologistMode = chatMode === ChatMode.Psychologist;

  const bubbleClasses = isSofi
    ? `rounded-bl-none ${isPsychologistMode ? 'bg-sky-500 text-white' : 'bg-rose-400 text-white'}`
    : `rounded-br-none ${isPsychologistMode ? 'bg-slate-200 text-slate-800' : 'bg-gray-200 text-gray-800'}`;
  
  return (
    <div className={`flex items-end gap-2 ${isSofi ? 'justify-start animate-pop-in' : 'justify-end'}`}>
      {isSofi && (
        <div className="flex-shrink-0">
          <SofiAvatar size="small" chatMode={chatMode} />
        </div>
      )}
      <div
        className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl whitespace-pre-wrap ${bubbleClasses}`}
      >
        <p>{message.text}</p>
      </div>
    </div>
  );
};

export default MessageBubble;