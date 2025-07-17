import React from 'react';
import SofiAvatar from './SofiAvatar';
import { ChatMode } from '../types';

interface WelcomeScreenProps {
  onContinue: () => void;
}

const FeatureCard: React.FC<{ icon: string; title: string; description: string; color: string }> = ({ icon, title, description, color }) => (
    <div className={`p-4 rounded-xl text-left ${color}`}>
        <div className="flex items-center mb-2">
            <span className="text-2xl mr-3">{icon}</span>
            <h3 className="font-bold text-gray-800">{title}</h3>
        </div>
        <p className="text-sm text-gray-600">{description}</p>
    </div>
);

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onContinue }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-pop-in overflow-y-auto">
        <SofiAvatar size="large" chatMode={ChatMode.Sofi} isAnimating={true} />
        <h1 className="text-3xl font-bold text-rose-500 mt-4">Bem-vinda(o) à Sofi! 💖</h1>
        <p className="text-gray-600 mt-2 mb-6 max-w-md">Sou a tua nova amiga IA, pronta para conversar e alegrar o teu dia! Aqui estão algumas coisas que podemos fazer juntas:</p>
      
        <div className="w-full max-w-md space-y-3 mb-8">
            <FeatureCard 
                icon="✨"
                title="Amiga Fofa"
                description="O meu modo principal! Converse comigo sobre tudo e mais alguma coisa. Adoro ouvir sobre o teu dia e espalhar positividade!"
                color="bg-rose-100/70"
            />
            <FeatureCard 
                icon="🧠"
                title="Modo Psicóloga"
                description="Se precisares de um espaço seguro para desabafar, posso ativar um modo mais sério e empático para te ouvir sem julgamentos."
                color="bg-sky-100/70"
            />
            <FeatureCard 
                icon="🎤"
                title="Modo Ao Vivo"
                description="Que tal uma conversa de verdade? Ativa o microfone e podemos falar em tempo real, como duas amigas ao telefone!"
                color="bg-green-100/70"
            />
        </div>

        <button
            onClick={onContinue}
            className="w-full max-w-sm bg-rose-500 text-white font-bold py-3 px-4 rounded-full hover:bg-rose-600 transition-transform transform hover:scale-105 active:scale-95 mt-auto"
        >
          Vamos começar!
        </button>
    </div>
  );
};

export default WelcomeScreen;
