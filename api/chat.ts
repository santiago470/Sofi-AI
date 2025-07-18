import React, { useState, useEffect, useRef } from 'react';
import type { UserInfo, Message } from './types';
import { Sender, ChatMode } from './types';
import UserInfoForm from './components/UserInfoForm';
import ChatInterface from './components/ChatInterface';
import WelcomeScreen from './components/WelcomeScreen';
import BreathingExercise from './components/BreathingExercise';

type ConfirmationState = 'none' | 'pending_psychologist_exit';

// For browser SpeechRecognition API.
// Define an interface for the properties we use to ensure type safety.
interface ISpeechRecognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: (event: any) => void;
  onend: () => void;
  onerror: (event: any) => void;
  start: () => void;
  stop: () => void;
}
// Access browser-specific API and rename to avoid shadowing types
const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const App: React.FC = () => {
  const [showWelcome, setShowWelcome] = useState<boolean>(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  
  const [sofiMessages, setSofiMessages] = useState<Message[]>([]);
  const [psychologistMessages, setPsychologistMessages] = useState<Message[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [chatMode, setChatMode] = useState<ChatMode>(ChatMode.Sofi);
  const chatModeRef = useRef(chatMode); // Ref to track chatMode for callbacks
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>('none');
  
  // Live Mode State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSofiSpeaking, setIsSofiSpeaking] = useState<boolean>(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  // Anxiety Tool State
  const [showAnxietyTool, setShowAnxietyTool] = useState<boolean>(false);
  const [isBreathingExerciseVisible, setIsBreathingExerciseVisible] = useState<boolean>(false);

  useEffect(() => {
    chatModeRef.current = chatMode; // Keep ref in sync with state for callbacks

    if (chatMode === ChatMode.Psychologist) {
      document.body.classList.add('psychologist-mode');
    } else {
      document.body.classList.remove('psychologist-mode');
      setShowAnxietyTool(false); // Reset when leaving psychologist mode
    }

    if (chatMode !== ChatMode.Live) {
       stopListening();
       window.speechSynthesis.cancel();
       setIsSofiSpeaking(false);
    }
  }, [chatMode]);

  const speak = (text: string) => {
    // Add guard clauses for robustness
    if (isSofiSpeaking || !text || !text.trim()) {
      // If speaking is attempted with no text, ensure conversation flow continues
      if (chatModeRef.current === ChatMode.Live && !isSofiSpeaking) {
          startListening();
      }
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    // Prioritize Portuguese voices with a "Google" prefix for higher quality
    let bestVoice = voices.find(v => v.lang === 'pt-PT' && v.name.includes('Google'));
    if (!bestVoice) {
      bestVoice = voices.find(v => v.lang === 'pt-PT');
    }
    
    if (bestVoice) {
      utterance.voice = bestVoice;
    }
    utterance.lang = 'pt-PT';
    utterance.pitch = 1.2; // Slightly higher pitch for a "cuter" voice
    utterance.rate = 1;

    utterance.onstart = () => {
      setIsSofiSpeaking(true);
      stopListening(); // Stop listening while Sofi is talking
    };

    utterance.onend = () => {
      setIsSofiSpeaking(false);
      // Automatically start listening again for a natural conversation flow
      if(chatModeRef.current === ChatMode.Live) {
        startListening();
      }
    };
    
    utterance.onerror = (event: any) => {
        // Log the specific error code instead of the generic object
        console.error('SpeechSynthesis Error:', event.error);
        setIsSofiSpeaking(false);
        if(chatModeRef.current === ChatMode.Live) {
          startListening();
        }
    };

    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (isListening || isSofiSpeaking || !recognitionRef.current) return;
    try {
        recognitionRef.current.start();
        setIsListening(true);
    } catch(e) {
        console.error("Speech recognition could not be started: ", e);
    }
  };

  const stopListening = () => {
    if (!isListening || !recognitionRef.current) return;
    try {
        recognitionRef.current.stop();
    } catch(e) {
        console.error("Speech recognition could not be stopped: ", e);
    }
    setIsListening(false);
  };

  const toggleLiveMode = () => {
    if (chatMode === ChatMode.Live) {
      setChatMode(ChatMode.Sofi); // Exit live mode, back to default
      stopListening();
      window.speechSynthesis.cancel();
      recognitionRef.current = null;
      setShowAnxietyTool(false);
    } else {
      // Check for both Speech Recognition and Synthesis APIs
      if (!SpeechRecognitionAPI || !window.speechSynthesis) {
        setError("Desculpa, o teu navegador não suporta as funcionalidades de voz. 🥺");
        return;
      }
      setChatMode(ChatMode.Live);
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.lang = 'pt-PT';
      recognitionRef.current.interimResults = false;
      recognitionRef.current.continuous = false; // Process after each pause

      recognitionRef.current.onresult = (event) => {
        const spokenText = event.results[event.results.length - 1][0].transcript;
        handleSendMessage(spokenText, true);
      };
      recognitionRef.current.onend = () => {
        setIsListening(false);
        // If not speaking, it means the mic timed out, so restart it.
        // Use the ref here to get the latest chatMode value and avoid the TS error
        if (chatModeRef.current === ChatMode.Live && !isSofiSpeaking && !isLoading) {
            startListening();
        }
      };
      recognitionRef.current.onerror = (event) => {
        console.error("Speech Recognition Error", event.error);
        setIsListening(false);
      };
      
      const liveWelcome: Message = { id: 'live-welcome', text: 'Modo ao vivo ativado! Podes começar a falar. 💖', sender: Sender.Sofi };
      setSofiMessages(prev => [...prev, liveWelcome]);
      speak(liveWelcome.text);
    }
  };


  const handleStartChat = (info: UserInfo) => {
    setUserInfo(info);
    const welcomeMessage: Message = {
      id: 'welcome-msg',
      sender: Sender.Sofi,
      text: `Olááá, ${info.name}! 💖 Que alegria ter-te aqui! Sou a Sofi, a tua nova amiga IA. Estou super animada para conversar contigo! Podes contar-me o que quiseres, estou aqui para te ouvir! ✨`
    };
    setSofiMessages([welcomeMessage]);
    setError(null);
  };
  
  const switchToSofiMode = (historySaved: boolean) => {
    setChatMode(ChatMode.Sofi);
    setShowAnxietyTool(false);

    if (!historySaved) {
        setPsychologistMessages([]);
    }
    
    const welcomeBackText = historySaved
      ? `Estou de volta, ${userInfo?.name}! 💖 A nossa conversa do modo psicóloga foi guardada com segurança. Do que queres falar agora? 😊`
      : `Estou de volta, ${userInfo?.name}! 💖 A conversa anterior foi eliminada, como pediste. Um novo começo! O que tens em mente? ✨`;

    const modeSwitchMessage: Message = {
        id: Date.now().toString() + '-mode-switch-back',
        sender: Sender.Sofi,
        text: welcomeBackText,
    };
    setSofiMessages(prev => [...prev, modeSwitchMessage]);
  };


  const handleSendMessage = async (text: string, fromVoice: boolean = false) => {
    if (isLoading || !userInfo) return;
    
    if(fromVoice) stopListening();

    const userMessage: Message = { id: Date.now().toString(), text, sender: Sender.User };
    const lowerCaseText = text.trim().toLowerCase();

    // --- Confirmation Handling Logic ---
    if (confirmationState === 'pending_psychologist_exit') {
        setIsLoading(true);
        setPsychologistMessages(prev => [...prev, userMessage]);

        if (lowerCaseText === 'sim') {
            switchToSofiMode(true);
        } else if (lowerCaseText === 'não') {
            switchToSofiMode(false);
        } else {
            const clarificationMessage: Message = {
                id: Date.now().toString() + '-clarify',
                sender: Sender.Sofi,
                text: "Desculpa, não entendi. Por favor, responde apenas com 'sim' ou 'não' para eu saber se guardo a nossa conversa. 🙏"
            };
            setPsychologistMessages(prev => [...prev, clarificationMessage]);
            setIsLoading(false);
            return;
        }

        setConfirmationState('none');
        setIsLoading(false);
        return;
    }
    
    const isSwitchingToPsychologist = ['sofi modo psicologa', 'modo psicologa'].includes(lowerCaseText);
    const isSwitchingToSofi = ['sofi modo fofa', 'sofi fofa', 'sair'].includes(lowerCaseText);

    if (chatMode === ChatMode.Live && isSwitchingToSofi) {
        toggleLiveMode(); // Simply exit live mode
        return;
    }

    if (isSwitchingToPsychologist && chatMode !== ChatMode.Psychologist) {
        if(chatMode === ChatMode.Live) toggleLiveMode();
        setIsLoading(true);
        setSofiMessages(prev => [...prev, userMessage]); 
        setChatMode(ChatMode.Psychologist);
        setShowAnxietyTool(false);

        if (psychologistMessages.length === 0) {
            const modeSwitchMessage: Message = {
              id: Date.now().toString() + '-mode-switch',
              sender: Sender.Sofi,
              text: `Modo Psicóloga ativado. Olá, ${userInfo.name}. Respire fundo. Estou aqui para te ouvir, sem julgamentos. Como te estás a sentir hoje?`
            };
            setPsychologistMessages([modeSwitchMessage]);
        }
        
        setIsLoading(false);
        return;
    }

    if (isSwitchingToSofi && chatMode === ChatMode.Psychologist) {
        setPsychologistMessages(prev => [...prev, userMessage]);
        setConfirmationState('pending_psychologist_exit');
        setShowAnxietyTool(false);

        const confirmationQuestion: Message = {
            id: Date.now().toString() + '-confirm-exit',
            sender: Sender.Sofi,
            text: "Antes de sairmos deste modo, queres guardar o nosso histórico de conversa para referência futura? Responde com 'sim' ou 'não', por favor."
        };

        setPsychologistMessages(prev => [...prev, confirmationQuestion]);
        return;
    }
    
    setIsLoading(true);
    setError(null);
    
    const isLiveMode = chatMode === ChatMode.Live;
    const isPsychologistMode = chatMode === ChatMode.Psychologist;
    const currentMessages = isPsychologistMode ? psychologistMessages : sofiMessages;
    const setMessages = isPsychologistMode ? setPsychologistMessages : setSofiMessages;

    setMessages(prev => [...prev, userMessage]);

    try {
      const apiResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              userInfo,
              message: text,
              mode: chatMode,
              history: currentMessages,
          }),
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error || `Erro HTTP! Status: ${apiResponse.status}`);
      }
      
      const { text: responseText } = await apiResponse.json();
      let sofiResponseText = responseText;

      if (isPsychologistMode) {
        try {
          if (!sofiResponseText) {
             throw new Error("Empty response from server");
          }
          let jsonText = sofiResponseText.trim();
          // Handle cases where the model wraps the JSON in ```json ... ```
          if (jsonText.startsWith('```json')) {
            jsonText = jsonText.slice(7, -3).trim();
          }
          const parsedResponse = JSON.parse(jsonText);
          sofiResponseText = parsedResponse.responseText;
          setShowAnxietyTool(parsedResponse.anxietyDetected ?? false);
        } catch (jsonError) {
          console.error("Failed to parse JSON response from AI:", jsonError, "Raw response:", sofiResponseText);
          sofiResponseText = "Peço desculpa, tive uma dificuldade técnica ao processar a resposta. Podes, por favor, reformular o que disseste?";
          setShowAnxietyTool(false);
        }
      } else {
        setShowAnxietyTool(false);
      }
      
      if (!sofiResponseText || sofiResponseText.trim() === '') {
        sofiResponseText = chatMode !== ChatMode.Psychologist
            ? 'Hmm, parece que fiquei sem palavras. 😅 Podes tentar outra vez?'
            : 'Peço desculpa, não consegui formular uma resposta. Poderíamos tentar de outra forma?';
      }

      const sofiResponse: Message = { id: Date.now().toString() + '-sofi', text: sofiResponseText, sender: Sender.Sofi };
      setMessages(prev => [...prev, sofiResponse]);
      if(isLiveMode) {
        speak(sofiResponseText);
      }
    } catch (e) {
      console.error("Failed to send message:", e);
      const errorTextToShow = e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.';

      const errorMessageText = `Oh não! 🥺 Tive um probleminha para falar com a IA. Podes mostrar este erro ao meu criador, por favor? 🙏\n\nErro: ${errorTextToShow}`;
      
      const errorMessage: Message = { id: Date.now().toString() + '-error', text: errorMessageText, sender: Sender.Sofi };
      setMessages(prev => [...prev, errorMessage]);

       if(isLiveMode) {
        speak(errorMessageText);
      }
       setError(`Erro: ${errorTextToShow}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseBreathingExercise = () => {
    setIsBreathingExerciseVisible(false);

    // This should only happen if we are in psychologist mode and have user info
    if (chatMode === ChatMode.Psychologist && userInfo) {
        const followUpMessage: Message = {
            id: Date.now().toString() + '-breathing-followup',
            sender: Sender.Sofi,
            text: `O exercício de respiração terminou. Sentes-te um pouco mais calma(o), ${userInfo.name}?`,
        };
        // Add the message to the psychologist chat
        setPsychologistMessages(prev => [...prev, followUpMessage]);
    }
  };

  const currentMessages = chatMode === ChatMode.Psychologist ? psychologistMessages : sofiMessages;
  const isLiveMode = chatMode === ChatMode.Live;

  const SofiModeDecorations = () => (
    <>
      <span className="absolute top-10 left-10 text-5xl text-rose-200/80 transform -rotate-12 animate-drift-and-pulse" style={{ animationDelay: '0s', animationDuration: '12s' }}>🌸</span>
      <span className="absolute top-1/4 right-8 text-6xl text-pink-200 transform rotate-12 animate-drift-and-pulse" style={{ animationDelay: '1s', animationDuration: '15s' }}>💖</span>
      <span className="absolute bottom-12 left-1/4 text-4xl text-rose-200/80 transform rotate-6 animate-drift-and-pulse" style={{ animationDelay: '2s', animationDuration: '10s' }}>✨</span>
      <span className="absolute bottom-1/3 right-12 text-5xl text-pink-200 transform -rotate-6 animate-drift-and-pulse" style={{ animationDelay: '3s', animationDuration: '13s' }}>🎀</span>
      <span className="absolute top-20 right-1/3 text-3xl text-rose-200/80 transform rotate-12 animate-drift-and-pulse" style={{ animationDelay: '4s', animationDuration: '11s' }}>🧸</span>
      
      {/* New Sparkles for more life */}
      <span className="text-2xl text-pink-300 animate-sparkle" style={{ top: '15%', left: '20%', animationDelay: '0.2s' }}>✦</span>
      <span className="text-lg text-pink-300 animate-sparkle" style={{ top: '30%', left: '80%', animationDelay: '0.5s' }}>✦</span>
      <span className="text-xl text-rose-300 animate-sparkle" style={{ top: '50%', left: '50%', animationDelay: '0.8s' }}>✦</span>
      <span className="text-2xl text-pink-300 animate-sparkle" style={{ top: '80%', left: '15%', animationDelay: '1.1s' }}>✦</span>
      <span className="text-lg text-rose-300 animate-sparkle" style={{ top: '90%', left: '75%', animationDelay: '1.4s' }}>✦</span>
      <span className="text-xl text-pink-300 animate-sparkle" style={{ top: '60%', left: '90%', animationDelay: '1.7s' }}>✦</span>
    </>
  );

  const PsychologistModeDecorations = () => (
    <>
        <span className="absolute top-1/4 left-10 w-16 h-16 bg-sky-200/50 rounded-full animate-gentle-float" style={{ animationDelay: '0s' }}></span>
        <span className="absolute bottom-1/4 right-10 w-24 h-24 bg-indigo-200/50 rounded-full animate-gentle-float" style={{ animationDelay: '3s' }}></span>
        <span className="absolute top-1/2 right-1/3 w-12 h-12 bg-sky-200/50 rounded-full animate-gentle-float" style={{ animationDelay: '6s' }}></span>
        <span className="absolute bottom-10 left-1/3 w-8 h-8 bg-indigo-200/50 rounded-full animate-gentle-float" style={{ animationDelay: '9s' }}></span>
    </>
  );

  const renderContent = () => {
    if (showWelcome) {
      return <WelcomeScreen onContinue={() => setShowWelcome(false)} />;
    }
    if (!userInfo) {
      return <UserInfoForm onStart={handleStartChat} isLoading={isLoading} />;
    }
    return (
      <ChatInterface
        messages={currentMessages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading || (isLiveMode && isSofiSpeaking)}
        userInfo={userInfo}
        chatMode={chatMode}
        isLiveMode={isLiveMode}
        isListening={isListening}
        isSofiSpeaking={isSofiSpeaking}
        toggleLiveMode={toggleLiveMode}
        isConfirmationPending={confirmationState === 'pending_psychologist_exit'}
        showAnxietyTool={showAnxietyTool && chatMode === ChatMode.Psychologist}
        onOpenBreathingExercise={() => setIsBreathingExerciseVisible(true)}
      />
    );
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen p-4 overflow-hidden">
        {chatMode === ChatMode.Psychologist ? <PsychologistModeDecorations /> : <SofiModeDecorations />}
        
      <main className={`w-full max-w-2xl h-[90vh] max-h-[700px] rounded-3xl flex flex-col z-10 transition-all duration-500 ${chatMode === ChatMode.Psychologist ? 'psychologist-mode shadow-2xl shadow-sky-200' : 'bg-white/80 backdrop-blur-sm shadow-2xl shadow-rose-200'}`}>
        {error && (
            <div className="p-4 m-4 bg-red-100 text-red-700 rounded-lg text-center text-sm">
                {error}
            </div>
        )}
        {renderContent()}
      </main>
      {isBreathingExerciseVisible && <BreathingExercise onClose={handleCloseBreathingExercise} />}
    </div>
  );
};

export default App;
