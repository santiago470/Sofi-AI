import React from 'react';

interface LiveModeIndicatorProps {
  isLoading: boolean;
  isListening: boolean;
  isSofiSpeaking: boolean;
  onExit: () => void;
}

const LiveModeIndicator: React.FC<LiveModeIndicatorProps> = ({
  isLoading,
  isListening,
  isSofiSpeaking,
  onExit,
}) => {

  const getStatus = () => {
    if (isSofiSpeaking) {
      return { 
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-volume-2 animate-pulse"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>, 
        text: 'A Sofi está a falar...' 
      };
    }
    if (isLoading) {
      return { 
        icon: <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>, 
        text: 'A Sofi está a pensar...' 
      };
    }
    if (isListening) {
      return { 
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mic animate-pulse text-red-500"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>, 
        text: 'A ouvir...' 
      };
    }
    return { 
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mic-off"><line x1="16" x2="16" y1="10" y2="10"/><line x1="8" x2="8" y1="10" y2="10"/><line x1="12" x2="12" y1="14" y2="18"/><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>, 
      text: 'Microfone em pausa' 
    };
  };

  const { icon, text } = getStatus();

  return (
    <div className="flex items-center justify-between h-14">
      <div className="flex items-center space-x-3 text-gray-600">
        <div className="w-6 h-6 flex items-center justify-center">{icon}</div>
        <span>{text}</span>
      </div>
      <button
        onClick={onExit}
        className="px-4 py-2 bg-red-500 text-white font-bold rounded-full hover:bg-red-600 transition-transform transform hover:scale-105"
      >
        Terminar Chamada
      </button>
    </div>
  );
};

export default LiveModeIndicator;
