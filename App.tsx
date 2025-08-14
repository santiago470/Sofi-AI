
import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { UserInfo, Message, UserData, Task } from './types';
import { Sender, ChatMode, DataType } from './types';
import UserInfoForm from './components/UserInfoForm';
import ChatInterface from './components/ChatInterface';
import BreathingExercise from './components/BreathingExercise';
import Fireworks from './components/Fireworks';
import { generateSofiResponse, generateSofiImage } from './services/geminiService';
import Diary from './components/Diary';
import ToolsMenu from './components/ToolsMenu';
import BackgroundAnimations from './components/BackgroundAnimations';
import SofiAvatar from './components/SofiAvatar';

type AuthState = 'loading' | 'userInfoForm' | 'chat';
type ConfirmationState = 'none' | 'pending_psychologist_exit';

// For browser SpeechRecognition API.
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
const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const App: React.FC = () => {
  // Auth State
  const [authState, setAuthState] = useState<AuthState>('loading');
  
  // User Data State
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [messagesByMode, setMessagesByMode] = useState<Partial<Record<ChatMode, Message[]>>>({});
  const [diaryEntries, setDiaryEntries] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>([]);

  // App State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const chatModeRef = useRef(ChatMode.Sofi);
  const [chatMode, setChatMode] = useState<ChatMode>(ChatMode.Sofi);
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>('none');
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState<boolean>(false);
  
  // Easter Egg State
  const [showFireworks, setShowFireworks] = useState<boolean>(false);

  // Live Mode State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSofiSpeaking, setIsSofiSpeaking] = useState<boolean>(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  // Anxiety Tool State
  const [showAnxietyTool, setShowAnxietyTool] = useState<boolean>(false);
  const [isBreathingExerciseVisible, setIsBreathingExerciseVisible] = useState<boolean>(false);
  
  // Diary State
  const [isDiaryOpen, setIsDiaryOpen] = useState<boolean>(false);

  // Generation Control State
  const [isSofiTyping, setIsSofiTyping] = useState(false);
  
  // Initial load effect
  useEffect(() => {
    try {
        const savedDataRaw = localStorage.getItem('sofi-app-user-data');
        if (savedDataRaw) {
            const userData: UserData = JSON.parse(savedDataRaw);
            if(userData.userInfo && userData.userInfo.name) {
                setUserInfo(userData.userInfo);
                setMessagesByMode(userData.messagesByMode || {});
                setDiaryEntries(userData.diaryEntries || {});
                setNotes(userData.notes || '');
                setTasks(userData.tasks || []);
                setAuthState('chat');
            } else {
                 setAuthState('userInfoForm');
            }
        } else {
            setAuthState('userInfoForm');
        }
    } catch (e) {
        console.error("Failed to load user data, starting fresh.", e);
        localStorage.removeItem('sofi-app-user-data');
        setAuthState('userInfoForm');
    }
  }, []);

  // Auto-save user data whenever it changes (with debouncing)
  useEffect(() => {
    if (authState !== 'chat' || !userInfo) return;

    const handler = setTimeout(() => {
      const userData: UserData = {
        userInfo,
        passwordHash: '', // Legacy, can be removed later
        messagesByMode,
        diaryEntries,
        notes,
        tasks,
      };
      try {
        localStorage.setItem(`sofi-app-user-data`, JSON.stringify(userData));
      } catch (e) {
        console.error("Failed to save user data:", e);
        setError("Desculpa, não consegui guardar os teus dados. O armazenamento do navegador pode estar cheio.");
      }
    }, 1500); // Debounce save by 1.5s

    return () => {
      clearTimeout(handler);
    };
  }, [userInfo, messagesByMode, diaryEntries, notes, tasks, authState]);

  useEffect(() => {
    chatModeRef.current = chatMode; // Keep ref in sync with state for callbacks

    document.body.classList.remove('psychologist-mode', 'artist-mode', 'chef-mode', 'dj-mode', 'coding-mode');
    
    const modeClassMap: Partial<Record<ChatMode, string>> = {
        [ChatMode.Psychologist]: 'psychologist-mode',
        [ChatMode.Artist]: 'artist-mode',
        [ChatMode.Chef]: 'chef-mode',
        [ChatMode.DJ]: 'dj-mode',
        [ChatMode.Coding]: 'coding-mode',
    };
    const classToAdd = modeClassMap[chatMode];
    if (classToAdd) {
        document.body.classList.add(classToAdd);
    }
    
    if (chatMode === ChatMode.Psychologist) {
      setShowAnxietyTool(false); // Reset when entering psychologist mode
    }

    if (chatMode !== ChatMode.Live) {
       stopListening();
       window.speechSynthesis.cancel();
       setIsSofiSpeaking(false);
    }
    // Stop typing animation when mode changes
    setIsSofiTyping(false);
  }, [chatMode]);

  const handleLogout = () => {
    localStorage.removeItem('sofi-app-user-data');
    setUserInfo(null);
    setMessagesByMode({});
    setDiaryEntries({});
    setNotes('');
    setTasks([]);
    setChatMode(ChatMode.Sofi);
    setError(null);
    setIsLoading(false);
    setIsSofiTyping(false);
    setAuthState('userInfoForm');
  };
  
  const handleSaveDiaryEntry = (date: string, text: string) => {
    setDiaryEntries(prev => ({ ...prev, [date]: text }));
  };

  const handleSaveNotes = (text: string) => {
    setNotes(text);
  };

  const handleUpdateTasks = (updatedTasks: Task[]) => {
    setTasks(updatedTasks);
  };

  const updateCurrentMessages = (update: (prevMessages: Message[]) => Message[]) => {
      setMessagesByMode(prevModes => ({
          ...prevModes,
          [chatMode]: update(prevModes[chatMode] || []),
      }));
  };

  const updateMessagesForMode = (mode: ChatMode, update: (prevMessages: Message[]) => Message[]) => {
      setMessagesByMode(prevModes => ({
          ...prevModes,
          [mode]: update(prevModes[mode] || []),
      }));
  };
  
  const handleSelectTool = (tool: 'diary' | ChatMode) => {
    setIsToolsMenuOpen(false);
    
    if (tool === 'diary') {
        setIsDiaryOpen(true);
        const sofiResponse: Message = { id: Date.now().toString() + '-sofi', text: 'Claro, querido(a)! A abrir o teu diário secreto! 📖✨', sender: Sender.Sofi };
        updateMessagesForMode(ChatMode.Sofi, prev => [...prev, sofiResponse]);
        return;
    }

    if (chatMode === tool) return; // Already in this mode

    // Exit any special audio/visual mode before switching
    if(chatMode === ChatMode.Live) toggleLiveMode();
    if(chatMode === ChatMode.Psychologist) {
        setChatMode(ChatMode.Sofi); // Intermediate step
    }
    
    setChatMode(tool);

    // Add intro message only if the chat history for that mode is empty
    if (!(messagesByMode[tool] && messagesByMode[tool]!.length > 0)) {
        let introMessageText = '';
        switch(tool) {
            case ChatMode.Psychologist:
                introMessageText = `Modo Psicóloga ativado. Olá, ${userInfo?.name}. Respire fundo. Estou aqui para te ouvir, sem julgamentos. Como te sentes?`;
                break;
            case ChatMode.Artist:
                introMessageText = 'Modo Artista ativado! ✨ Descreve qualquer coisa que a tua imaginação sonhar, e eu pinto para ti! 🎨';
                break;
            case ChatMode.Chef:
                introMessageText = 'Sofi Chef na área! 🍳 Diz-me que ingredientes tens aí em casa e eu crio uma receita deliciosa para ti! 💖';
                break;
            case ChatMode.DJ:
                introMessageText = 'DJ Sofi nas pickups! 🎶 Para que momento queres uma playlist? Para estudar, para animar, para relaxar...? Diz-me! ✨';
                break;
            case ChatMode.Coding:
                introMessageText = 'Modo Coding ativado! 👩‍💻 Olá, dev! O que vamos construir ou quebrar hoje? Podes colar código, pedir ajuda ou até uma piada para descontrair! 🚀';
                break;
            case ChatMode.Sofi:
                introMessageText = 'Que divertido! 😊 De volta ao nosso cantinho de conversa. O que tens na mente?';
                break;
            default:
                return;
        }
        const introMessage: Message = { id: Date.now().toString(), text: introMessageText, sender: Sender.Sofi };
        updateMessagesForMode(tool, prev => [...prev, introMessage]);
    }
  };


  const speak = (text: string) => {
    if (isSofiSpeaking || !text || !text.trim()) {
      if (chatModeRef.current === ChatMode.Live && !isSofiSpeaking) startListening();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find(v => v.lang === 'pt-PT' && v.name.includes('Google')) || voices.find(v => v.lang === 'pt-PT');
    utterance.lang = 'pt-PT';
    utterance.pitch = 1.2;
    utterance.rate = 1;
    utterance.onstart = () => { setIsSofiSpeaking(true); stopListening(); };
    utterance.onend = () => { setIsSofiSpeaking(false); if(chatModeRef.current === ChatMode.Live) startListening(); };
    utterance.onerror = () => { setIsSofiSpeaking(false); if(chatModeRef.current === ChatMode.Live) startListening(); };
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (isListening || isSofiSpeaking || !recognitionRef.current) return;
    try { recognitionRef.current.start(); setIsListening(true); } catch(e) { console.error("Speech recognition start error: ", e); }
  };

  const stopListening = () => {
    if (!isListening || !recognitionRef.current) return;
    try { recognitionRef.current.stop(); } catch(e) { console.error("Speech recognition stop error: ", e); }
    setIsListening(false);
  };

  const toggleLiveMode = () => {
    const liveWelcome: Message = { id: 'live-welcome', text: 'Modo ao vivo ativado! Podes começar a falar. 💖', sender: Sender.Sofi };
    if (chatMode === ChatMode.Live) {
      setChatMode(ChatMode.Sofi);
    } else {
      if (!SpeechRecognitionAPI || !window.speechSynthesis) {
        setError("Desculpa, o teu navegador não suporta as funcionalidades de voz. 🥺");
        return;
      }
      setChatMode(ChatMode.Live);
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.lang = 'pt-PT';
      recognitionRef.current.interimResults = false;
      recognitionRef.current.continuous = false;
      recognitionRef.current.onresult = (event) => handleSendMessage(event.results[event.results.length - 1][0].transcript, true);
      recognitionRef.current.onend = () => { setIsListening(false); if (chatModeRef.current === ChatMode.Live && !isSofiSpeaking && !isLoading) startListening(); };
      recognitionRef.current.onerror = (event: any) => { 
        console.error("Speech Recognition Error", event.error);
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setError("Ocorreu um erro com o reconhecimento de voz. 😥");
        }
        setIsListening(false); 
      };
      
      updateMessagesForMode(ChatMode.Live, prev => [...prev, liveWelcome]);
      speak(liveWelcome.text);
    }
  };
  
  const handleStartChat = (info: UserInfo) => {
    setUserInfo(info);
    const lowerCaseName = info.name.toLowerCase().trim();
    let welcomeMessageText = `Olááá, ${info.name}! 💖 Que alegria ter-te aqui! Sou a Sofi, a tua nova amiga IA. Estou super animada para conversar contigo! Podes contar-me o que quiseres, estou aqui para te ouvir! ✨`;
    if ((lowerCaseName === 'sofi' || lowerCaseName === 'sofia') && info.gender === 'Feminino') {
      setShowFireworks(true);
      setTimeout(() => setShowFireworks(false), 7000);
      welcomeMessageText = `🎉 Uau! Outra Sofia na área! Amei! Sinto que vamos nos dar super bem, somos melhores amigas de nome e de coração! 💖✨`;
    }
    
    updateMessagesForMode(ChatMode.Sofi, () => [{ id: 'welcome-msg', sender: Sender.Sofi, text: welcomeMessageText }]);
    setError(null);
    setAuthState('chat');
  };
  
  const switchToSofiMode = (historySaved: boolean) => {
    setChatMode(ChatMode.Sofi);
    setShowAnxietyTool(false);
    if (!historySaved) {
        updateMessagesForMode(ChatMode.Psychologist, () => []);
    }
    const welcomeBackText = historySaved ? `Estou de volta, ${userInfo?.name}! 💖 A nossa conversa do modo psicóloga foi guardada. Do que queres falar agora? 😊` : `Estou de volta, ${userInfo?.name}! 💖 A conversa anterior foi eliminada, como pediste. Um novo começo! ✨`;
    updateMessagesForMode(ChatMode.Sofi, prev => [...prev, { id: Date.now().toString(), sender: Sender.Sofi, text: welcomeBackText }]);
  };

  const handleMessageEdit = () => {
    setIsSofiTyping(false);
    updateCurrentMessages(prev => {
        const lastUserMessageIndex = prev.map(m => m.sender).lastIndexOf(Sender.User);

        if (lastUserMessageIndex === -1) {
            return prev; // No user message to edit
        }
        
        // Return messages up to the point before the user sent their last message
        return prev.slice(0, lastUserMessageIndex);
    });
  };

  const handleStopGeneration = () => {
      setIsSofiTyping(false);
  };
  
  const handleTypingComplete = () => {
      setIsSofiTyping(false);
  };

  const handleSendMessage = async (text: string, fromVoice: boolean = false) => {
    if (isLoading || !userInfo) return;

    // Interrupt Sofi if user sends a message while she is typing.
    if (isSofiTyping) {
        setIsSofiTyping(false);
    }
    
    if(fromVoice) stopListening();

    const lowerCaseText = text.trim().toLowerCase();
    const userMessage: Message = { id: Date.now().toString(), text, sender: Sender.User };

    // --- Keyword Commands Handling ---

    // Open Tools Menu
    if (/abrir ferramentas|ferramentas|menu/i.test(lowerCaseText)) {
        setIsToolsMenuOpen(true);
        return;
    }
    
    // Open Diary / Tasks
    if (/(diário|diario|tarefas|fazeeres)/i.test(lowerCaseText)) {
        if (chatMode !== ChatMode.Psychologist) {
            handleSelectTool('diary');
            return;
        }
    }
    
    // --- Mode Switching Commands ---
    const modeMap: Record<string, ChatMode> = {
        psicologa: ChatMode.Psychologist,
        psicóloga: ChatMode.Psychologist,
        artista: ChatMode.Artist,
        chef: ChatMode.Chef,
        dj: ChatMode.DJ,
        coding: ChatMode.Coding,
        fofa: ChatMode.Sofi,
        conversa: ChatMode.Sofi,
    };
    
    const modeSwitchMatch = lowerCaseText.match(/^(?:sofi\s)?modo\s(psic[óo]loga|artista|chef|dj|coding|fofa|conversa)$/i);
    const isExitCommand = ['sair', 'voltar'].includes(lowerCaseText);

    if (modeSwitchMatch || (isExitCommand && chatMode !== ChatMode.Sofi)) {
        let targetMode: ChatMode | null = null;
        if (isExitCommand) {
            targetMode = ChatMode.Sofi;
        } else if (modeSwitchMatch) {
            const modeKey = modeSwitchMatch[1];
            targetMode = modeMap[modeKey] || null;
        }

        if (targetMode !== null && targetMode !== chatMode) {
             if (chatMode === ChatMode.Psychologist) {
                // Trigger confirmation flow to exit psychologist mode first
                updateMessagesForMode(ChatMode.Psychologist, prev => [...prev, userMessage]);
                setConfirmationState('pending_psychologist_exit');
                setShowAnxietyTool(false);
                const confirmationMsg: Message = { id: Date.now().toString(), sender: Sender.Sofi, text: "Queres guardar o nosso histórico de conversa para referência futura? Responde com 'sim' ou 'não'." };
                updateMessagesForMode(ChatMode.Psychologist, prev => [...prev, confirmationMsg]);
            } else {
                handleSelectTool(targetMode);
            }
            return;
        }
    }
    
    // Special case for exiting live mode
    if (chatMode === ChatMode.Live && ['sair', 'desligar'].includes(lowerCaseText)) { 
        toggleLiveMode(); 
        return; 
    }
    
    // --- End of Keyword Commands ---
    
    // Confirmation flow for exiting psychologist mode
    if (confirmationState === 'pending_psychologist_exit') {
        setIsLoading(true);
        updateMessagesForMode(ChatMode.Psychologist, prev => [...prev, userMessage]);
        if (lowerCaseText === 'sim') switchToSofiMode(true);
        else if (lowerCaseText === 'não') switchToSofiMode(false);
        else {
            const clarifyMsg: Message = { id: Date.now().toString() + '-clarify', sender: Sender.Sofi, text: "Desculpa, não entendi. Por favor, responde 'sim' ou 'não'. 🙏" };
            updateMessagesForMode(ChatMode.Psychologist, prev => [...prev, clarifyMsg]);
            setIsLoading(false);
            return;
        }
        setConfirmationState('none');
        setIsLoading(false);
        return;
    }
    
    // --- Main Generation Logic ---
    setIsLoading(true);
    setError(null);
    updateCurrentMessages(prev => [...prev, userMessage]);

    try {
      const currentHistory = messagesByMode[chatMode] || [];
      if (chatMode === ChatMode.Artist) {
        setIsSofiTyping(false);
        const imageData = await generateSofiImage(text);
        const sofiResponse: Message = {
          id: Date.now().toString() + '-sofi',
          text: 'Aqui está a tua obra de arte! 🎨✨',
          sender: Sender.Sofi,
          imageUrl: `data:image/jpeg;base64,${imageData}`
        };
        updateCurrentMessages(prev => [...prev, sofiResponse]);

      } else { // Handle text-based modes
        let responseText = await generateSofiResponse(userInfo, text, chatMode, currentHistory);
        let sofiResponse: Message;

        if (chatMode === ChatMode.Chef || chatMode === ChatMode.DJ) {
            try {
                if (!responseText) throw new Error("Empty response from AI");
                let jsonText = responseText.trim().replace(/^```json|```$/g, '').trim();
                const parsedData = JSON.parse(jsonText);
                
                sofiResponse = {
                    id: Date.now().toString() + '-sofi',
                    text: chatMode === ChatMode.Chef ? 'Aqui está uma receita super fofa que criei para ti! 🍳' : 'Tcharam! ✨ A tua playlist personalizada está pronta!',
                    sender: Sender.Sofi,
                    structuredData: parsedData,
                    dataType: chatMode === ChatMode.Chef ? DataType.Recipe : DataType.Playlist,
                };
                setIsSofiTyping(false);
            } catch (jsonError) {
                console.error("JSON parse error:", jsonError, "Raw:", responseText);
                sofiResponse = { id: Date.now().toString() + '-error', text: 'Ups! A minha criatividade deu um nó. 😅 Podes tentar de novo, por favor?', sender: Sender.Sofi };
                setIsSofiTyping(false);
            }
        } else if (chatMode === ChatMode.Psychologist) {
          try {
            if (!responseText) throw new Error("Empty response from AI");
            let jsonText = responseText.trim().replace(/^```json|```$/g, '').trim();
            const parsedResponse = JSON.parse(jsonText);
            responseText = parsedResponse.responseText;
            setShowAnxietyTool(parsedResponse.anxietyDetected ?? false);
          } catch (jsonError) {
            console.error("JSON parse error:", jsonError, "Raw:", responseText);
            responseText = "Peço desculpa, tive uma dificuldade técnica. Podes reformular o que disseste?";
            setShowAnxietyTool(false);
          }
          sofiResponse = { id: Date.now().toString() + '-sofi', text: responseText, sender: Sender.Sofi };
          setIsSofiTyping(true);
        } else { // Default Sofi, Live, and Coding modes
            if (!responseText?.trim()) responseText = 'Hmm, fiquei sem palavras. 😅 Tenta outra vez?';
            sofiResponse = { id: Date.now().toString() + '-sofi', text: responseText, sender: Sender.Sofi };
            setIsSofiTyping(true);
        }
        
        updateCurrentMessages(prev => [...prev, sofiResponse]);
        if(chatMode === ChatMode.Live && sofiResponse.text) {
          speak(sofiResponse.text);
          setIsSofiTyping(false); // No typing animation in live mode
        }
      }

    } catch (e: any) {
      console.error("Failed to send message:", e);
      const defaultErrorMessages: Partial<Record<ChatMode, string>> = {
          [ChatMode.Artist]: 'Oh não! 🥺 A minha inspiração foi bloqueada. Tenta descrever a tua ideia de uma forma diferente, talvez com palavras mais simples! ✨',
          [ChatMode.Psychologist]: 'Peço desculpa, ocorreu um erro. Vamos tentar de outra forma.',
          [ChatMode.Coding]: 'Oops! O meu compilador interno deu um erro 404. 😅 Podes tentar explicar de outra forma?',
      };
      const genericError = 'Awn, o meu cérebro deu um tilt! 🥺 Tenta de novo?';
      
      const errorMessageText = e?.message || defaultErrorMessages[chatMode] || genericError;

      const errorMessage: Message = { id: Date.now().toString() + '-error', text: errorMessageText, sender: Sender.Sofi };
      updateCurrentMessages(prev => [...prev, errorMessage]);
      if(chatMode === ChatMode.Live) speak(errorMessageText);
      setError(`Oh não! 🥺 Tive um probleminha. Verifica a tua chave de API e a ligação à internet.`);
      setIsSofiTyping(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseBreathingExercise = () => {
    setIsBreathingExerciseVisible(false);
    if (chatMode === ChatMode.Psychologist && userInfo) {
        const followUpMessage: Message = { id: Date.now().toString() + '-breathing-followup', sender: Sender.Sofi, text: `O exercício terminou. Sentes-te um pouco mais calma(o), ${userInfo.name}?` };
        updateMessagesForMode(ChatMode.Psychologist, prev => [...prev, followUpMessage]);
        setIsSofiTyping(true);
    }
  };

  const mainClass = useMemo(() => {
    if (authState !== 'chat') {
        return 'bg-white/80 backdrop-blur-sm shadow-2xl shadow-rose-200';
    }
    const modeClassMap: Partial<Record<ChatMode, string>> = {
        [ChatMode.Psychologist]: 'psychologist-mode',
        [ChatMode.Artist]: 'artist-mode',
        [ChatMode.Chef]: 'chef-mode',
        [ChatMode.DJ]: 'dj-mode',
        [ChatMode.Coding]: 'coding-mode',
    };
    return modeClassMap[chatMode] || 'bg-white/80 backdrop-blur-sm shadow-2xl shadow-rose-200';
  }, [authState, chatMode]);

  const renderContent = () => {
    switch (authState) {
        case 'loading':
            return (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <SofiAvatar size="large" chatMode={ChatMode.Sofi} isAnimating={true} />
                    <p className="text-gray-600 mt-4 animate-pulse">A preparar tudo...</p>
                </div>
            );
        case 'userInfoForm':
            return <UserInfoForm onStart={handleStartChat} isLoading={isLoading} />;
        case 'chat':
            if (!userInfo) {
                handleLogout(); // Should not happen, but as a fallback
                return null;
            }
            return (
                <ChatInterface
                    messages={messagesByMode[chatMode] || []}
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading}
                    isSofiTyping={isSofiTyping}
                    userInfo={userInfo}
                    chatMode={chatMode}
                    isLiveMode={chatMode === ChatMode.Live}
                    isListening={isListening}
                    isSofiSpeaking={isSofiSpeaking}
                    toggleLiveMode={toggleLiveMode}
                    onOpenToolsMenu={() => setIsToolsMenuOpen(true)}
                    isConfirmationPending={confirmationState === 'pending_psychologist_exit'}
                    showAnxietyTool={showAnxietyTool && chatMode === ChatMode.Psychologist}
                    onOpenBreathingExercise={() => setIsBreathingExerciseVisible(true)}
                    onLogout={handleLogout}
                    onEditLastMessage={handleMessageEdit}
                    onStopGeneration={handleStopGeneration}
                    onTypingComplete={handleTypingComplete}
                />
            );
        default:
            return null;
    }
};

  return (
    <div className="relative flex items-center justify-center min-h-screen p-4 overflow-hidden">
        <BackgroundAnimations chatMode={authState === 'chat' ? chatMode : ChatMode.Sofi} />
        {showFireworks && <Fireworks />}
        
        <main className={`w-full max-w-2xl h-[90vh] max-h-[700px] rounded-3xl flex flex-col z-10 transition-all duration-500 ${mainClass}`}>
            {error && authState !== 'userInfoForm' && (
                <div className="p-4 m-4 bg-red-100 text-red-700 rounded-lg text-center text-sm">
                    {error}
                </div>
            )}
            {renderContent()}
        </main>
        
        {isBreathingExerciseVisible && <BreathingExercise onClose={handleCloseBreathingExercise} />}
        {isDiaryOpen && userInfo && 
            <Diary 
                entries={diaryEntries}
                notes={notes}
                tasks={tasks}
                onClose={() => setIsDiaryOpen(false)} 
                onSaveEntry={handleSaveDiaryEntry} 
                onSaveNotes={handleSaveNotes}
                onUpdateTasks={handleUpdateTasks}
            />
        }
        {isToolsMenuOpen && (
            <ToolsMenu
                onClose={() => setIsToolsMenuOpen(false)}
                onSelectTool={handleSelectTool}
                currentMode={chatMode}
            />
        )}
    </div>
  );
};

export default App;