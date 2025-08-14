
import React from 'react';
import { ChatMode } from '../types';

interface ToolsMenuProps {
  onClose: () => void;
  onSelectTool: (tool: 'diary' | ChatMode) => void;
  currentMode: ChatMode;
}

const ToolsMenu: React.FC<ToolsMenuProps> = ({ onClose, onSelectTool, currentMode }) => {
  const tools = [
    {
      id: 'diary' as 'diary' | ChatMode,
      emoji: '📖',
      title: 'Diário Secreto',
      description: 'Escreve as tuas memórias e pensamentos.',
      color: 'bg-amber-400',
    },
     {
      id: ChatMode.Psychologist,
      emoji: '🧠',
      title: 'Sofi Psicóloga',
      description: 'Um ombro amigo para te ouvir e apoiar.',
      color: 'bg-sky-600',
    },
    {
      id: ChatMode.Coding,
      emoji: '💻',
      title: 'Sofi Coding',
      description: 'Ajuda com código, bugs e piadas nerd.',
      color: 'bg-indigo-500',
    },
    {
      id: ChatMode.Artist,
      emoji: '🎨',
      title: 'Modo Artista',
      description: 'Pede-me para desenhar o que quiseres.',
      color: 'bg-purple-500',
    },
    {
      id: ChatMode.Chef,
      emoji: '🍳',
      title: 'Sofi Chef',
      description: 'Dá-me ingredientes e eu crio uma receita.',
      color: 'bg-orange-500',
    },
    {
      id: ChatMode.DJ,
      emoji: '🎶',
      title: 'Sofi DJ',
      description: 'Crio a playlist perfeita para o teu momento.',
      color: 'bg-sky-500',
    },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl shadow-rose-200/50 p-6 transform transition-all animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors" aria-label="Fechar menu">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-rose-500">Caixa de Ferramentas da Sofi ✨</h2>
          <p className="text-gray-500 mt-1">O que vamos fazer agora?</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tools.map(tool => (
            <button
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className={`p-4 rounded-xl text-white text-left flex flex-col justify-between h-32 transition-transform transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl ${tool.color} ${currentMode === tool.id ? 'ring-4 ring-offset-2 ring-rose-400' : ''}`}
            >
              <div>
                <span className="text-3xl">{tool.emoji}</span>
                <h3 className="font-bold text-lg mt-1">{tool.title}</h3>
              </div>
              <p className="text-xs opacity-90">{tool.description}</p>
            </button>
          ))}
        </div>
         <div className="text-center mt-6">
            <button
              onClick={() => onSelectTool(ChatMode.Sofi)}
              className="text-sm px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-full hover:bg-gray-200 transition-colors"
            >
              Voltar à conversa normal 💬
            </button>
        </div>
      </div>
    </div>
  );
};

export default ToolsMenu;
