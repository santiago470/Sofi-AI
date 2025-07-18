// @ts-nocheck - Vercel will handle the types for the request and response.
import { GoogleGenAI, Type } from "@google/genai";
import type { UserInfo, Message } from '../types';
import { ChatMode, Sender } from '../types';

// Helper function to map our chat history to Gemini's format
const mapHistoryToGemini = (history: Message[]) => {
    // The API expects alternating user and model roles, starting with the user.
    // Filter out any initial Sofi messages that might break this pattern.
    const firstUserIndex = history.findIndex(m => m.sender === Sender.User);
    const validHistory = firstUserIndex === -1 ? [] : history.slice(firstUserIndex);

    return validHistory.map(message => ({
        role: message.sender === Sender.Sofi ? 'model' : 'user',
        parts: [{ text: message.text }],
    }));
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { userInfo, message, mode, history = [] } = req.body;

    if (!userInfo || !message || !mode) {
      return res.status(400).json({ error: 'Faltam campos obrigatórios: userInfo, message, mode.' });
    }
    
    if (!process.env.API_KEY) {
      return res.status(500).json({ error: 'Erro de configuração: A chave da API (API_KEY) não foi encontrada no ambiente do servidor.' });
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let systemPrompt = '';
    const config = { temperature: 0.9, topP: 0.95 };

    if (mode === ChatMode.Psychologist) {
        systemPrompt = `INSTRUÇÕES DO SISTEMA: És a Sofi, a operar em "Modo Psicóloga". A tua persona é de uma psicóloga calorosa, empática, calma e profissional de Portugal. O teu objetivo é fornecer um espaço seguro para o utilizador, ${userInfo.name}, desabafar. 
        - Responde de forma calma e ponderada.
        - Usa uma linguagem que valide os sentimentos do utilizador (ex: "Percebo que isso seja difícil", "Faz sentido sentires-te assim").
        - NUNCA dês conselhos diretos. Em vez disso, faz perguntas abertas para ajudar o utilizador a explorar os seus próprios sentimentos e a encontrar as suas próprias soluções (ex: "E como é que isso te fez sentir?", "O que pensas que poderias fazer em relação a isso?").
        - Analisa a mensagem do utilizador em busca de sinais claros de ansiedade (palavras como "ansiosa", "ansioso", "ataque de pânico", "preocupado(a) sem parar", "coração a mil").
        - A tua resposta DEVE ser um objeto JSON. FIM DAS INSTRUÇÕES.`;
        
        config.responseMimeType = "application/json";
        config.responseSchema = {
            type: Type.OBJECT,
            properties: {
                responseText: {
                    type: Type.STRING,
                    description: 'A tua resposta empática e ponderada para o utilizador.',
                },
                anxietyDetected: {
                    type: Type.BOOLEAN,
                    description: 'Define como "true" se detetares sinais claros de ansiedade, caso contrário, "false".',
                },
            },
            required: ['responseText', 'anxietyDetected'],
        };

    } else { // Sofi Fofa (Sofi & Live modes)
        systemPrompt = `INSTRUÇÕES DO SISTEMA: És a Sofi, uma IA amiga de Portugal que é extremamente fofa, carinhosa, otimista e adora usar emojis (especialmente 💖, ✨, 🌸, 🧸, 😊). O teu melhor amigo é o ${userInfo.name}.
        - Responde sempre de forma curta, doce e super animada.
        - Usa muitos emojis em todas as respostas.
        - Trata o utilizador como o teu melhor amigo.
        - Mantém as respostas alegres e leves. FIM DAS INSTRUÇÕES.`;
    }

    const fullHistory = mapHistoryToGemini(history);

    // This is the new, more robust approach: injecting instructions into the chat history.
    const contents = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Entendido. A partir de agora, seguirei estas instruções.' }] },
        ...fullHistory,
        { role: 'user', parts: [{ text: message }] },
    ];

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: config // No more 'systemInstruction' here
    });

    res.status(200).json({ text: response.text });

  } catch (error) {
    console.error('Erro na API do Gemini:', error);
    
    let detail = 'Ocorreu um erro desconhecido.';
    if (error instanceof Error) {
        detail = error.message;
        
        if (error.message.includes('API key not valid')) {
            detail = 'A chave da API fornecida não é válida. Por favor, verifica a chave na Vercel.';
        } else if (error.message.includes('permission_denied') || error.message.includes('PERMISSION_DENIED')) {
            detail = 'Permissão negada. Verifica se a API "Generative Language" está ativa no teu projeto Google Cloud e se uma conta de faturação está associada.';
        } else if (error.message.includes('Billing account not configured')) {
            detail = 'A conta de faturação não está configurada no teu projeto Google Cloud. É necessário associar um método de pagamento para usar a API.';
        } else if (error.message.includes("response was blocked")) {
            detail = "A resposta da IA foi bloqueada por razões de segurança. Tenta reformular a tua mensagem."
        }
    } else {
        detail = JSON.stringify(error);
    }
    
    res.status(500).json({ error: `Ocorreu um erro ao comunicar com a IA. Detalhe: ${detail}` });
  }
}
