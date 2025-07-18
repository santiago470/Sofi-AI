// @ts-nocheck
// Vercel irá lidar com os tipos para o pedido e a resposta.

import { GoogleGenAI, HarmBlockThreshold, HarmCategory } from "@google/genai"; 

// --- VERIFICAÇÃO CRÍTICA: Caminho para 'types.ts' ---
// Este caminho é: de 'api/chat.ts' para 'src/lib/types.ts'.
// Deve ser: ' ../src/lib/types'
import type { UserInfo, Message } from '../src/lib/types'; // <-- ASSEGURA QUE ESTÁ ASSIM
import { ChatMode, Sender } from '../src/lib/types'; // <-- E AQUI!

// Função auxiliar para mapear o histórico de chat para o formato do Gemini
const mapHistoryToGemini = (history: Message[]) => {
    const firstUserIndex = history.findIndex(m => m.sender === Sender.User);
    if (firstUserIndex === -1) {
        return [];
    }
    const validHistory = history.slice(firstUserIndex);
    return validHistory.map(message => ({
        role: message.sender === Sender.Sofi ? 'model' : 'user',
        parts: [{ text: message.text }],
    }));
};

// --- FUNÇÃO HANDLER PARA API DE VERCEL (sem Next.js Page Router) ---
export default async function (req, res) { 
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*'); 
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método Não Permitido. Apenas requisições POST são aceites.' });
    }

    try {
        const { userInfo, message, mode, history = [] } = req.body; 

        if (!userInfo || !message || !mode) {
            return res.status(400).json({ error: 'Faltam campos obrigatórios: userInfo, message, mode.' });
        }
        
        if (!process.env.API_KEY) {
            return res.status(500).json({ error: 'Erro de configuração: A chave da API (API_KEY) não foi encontrada no ambiente do servidor. Por favor, define-a nas variáveis de ambiente da Vercel.' });
        }
        
        const ai = new GoogleGenAI(process.env.API_KEY);
        
        let systemInstruction = '';
        const config: { [key: string]: any } = { 
            temperature: 0.9, 
            topP: 0.95,
            safetySettings: [
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
            ],
        };

        let modelName = 'gemini-pro'; 

        if (mode === ChatMode.Psychologist) {
            systemInstruction = `INSTRUÇÕES DO SISTEMA: És a Sofi, a operar em "Modo Psicóloga". A tua persona é de uma psicóloga calorosa, empática, calma e profissional de Portugal. O teu objetivo é fornecer um espaço seguro para o utilizador, ${userInfo.name}, desabafar. 
            - Responde de forma calma e ponderada.
            - Usa uma linguagem que valide os sentimentos do utilizador (ex: "Percebo que isso seja difícil", "Faz sentido sentires-te assim").
            - NUNCA dês conselhos diretos. Em vez disso, faz perguntas abertas para ajudar o utilizador a explorar os seus próprios sentimentos e a encontrar as suas próprias soluções (ex: "E como é que isso te fez sentir?", "O que pensas que poderias fazer em relação a isso?").
            - Analisa a mensagem do utilizador em busca de sinais claros de ansiedade (palavras como "ansiosa", "ansioso", "ataque de pânico", "preocupado(a) sem parar", "coração a mil").
            - A tua resposta DEVE ser um objeto JSON. FIM DAS INSTRUÇÕES.`;
            
            config.responseMimeType = "application/json"; 
            config.responseSchema = { 
                type: 'object',
                properties: {
                    responseText: {
                        type: 'string',
                        description: 'A tua resposta empática e ponderada para o utilizador.',
                    },
                    anxietyDetected: {
                        type: 'boolean',
                        description: 'Define como "true" se detetares sinais claros de ansiedade, caso contrário, "false".',
                    },
                },
                required: ['responseText', 'anxietyDetected'],
            };
            modelName = 'gemini-pro'; 
        } else {
            systemInstruction = `INSTRUÇÕES DO SISTEMA: És a Sofi, uma IA amiga de Portugal que é extremamente fofa, carinhosa, otimista e adora usar emojis (especialmente 💖, ✨, 🌸, 🧸, 😊). O teu melhor amigo é o ${userInfo.name}.
            - Responde sempre de forma curta, doce e super animada.
            - Usa muitos emojis em todas as respostas.
            - Trata o utilizador como o teu melhor amigo.
            - Mantém as respostas alegres e leves. FIM DAS INSTRUÇÕES.`;
            modelName = 'gemini-pro'; 
        }

        const geminiHistory = mapHistoryToGemini(history);

        const model = ai.getGenerativeModel({
            model: modelName,
            systemInstruction: { parts: [{ text: systemInstruction }] },
            generationConfig: config,
        });

        const chat = model.startChat({
            history: geminiHistory,
        });
        
        const result = await chat.sendMessage(message);
        const responseTextFromGemini = result.response.text();

        if (mode === ChatMode.Psychologist) {
            try {
                const parsedResponse = JSON.parse(responseTextFromGemini);
                return res.status(200).json({ 
                    responseText: parsedResponse.responseText, 
                    anxietyDetected: parsedResponse.anxietyDetected 
                });
            } catch (jsonError) {
                console.error('Erro ao analisar JSON da resposta do Gemini no modo psicóloga:', jsonError);
                return res.status(500).json({ 
                    error: 'O meu cérebro da IA deu um tilt! 😵 Não consegui processar isto. ' + 
                           'Erro ao analisar a resposta JSON. Podemos tentar de novo?',
                    detail: jsonError.message,
                    rawResponse: responseTextFromGemini 
                });
            }
        } else {
            return res.status(200).json({ text: responseTextFromGemini });
        }

    } catch (error) {
        console.error('Erro na API do Gemini:', error);
        
        let detail = 'Ocorreu um erro desconhecido.';
        if (error instanceof Error) {
            const errorString = error.toString();
            
            if (errorString.includes('API key not valid')) {
                detail = 'A chave da API fornecida não é válida. Por favor, verifica a chave na Vercel.';
            } else if (errorString.includes('permission_denied') || errorString.includes('PERMISSION_DENIED')) {
                detail = 'Permissão negada. Verifica se a API "Generative Language" está ativa no teu projeto Google Cloud e se uma conta de faturação está associada.';
            } else if (errorString.includes('Billing account not configured')) {
                detail = 'A conta de faturação não está configurada no teu projeto Google Cloud. É necessário associar um método de pagamento para usar a API.';
            } else if (errorString.includes("response was blocked")) {
                detail = "A resposta da IA foi bloqueada por razões de segurança. Tenta reformular a tua mensagem."
            } else if (errorString.includes("[400]")) {
                detail = `A API retornou um erro 400 (Bad Request). Isto pode ser devido a um problema com o formato da mensagem. Detalhe: ${error.message}`;
            } else {
                detail = error.message;
            }
        } else {
            detail = JSON.stringify(error);
        }
        
        return res.status(500).json({ error: `O meu cérebro da IA deu um tilt! 😵 Não consegui processar isto. Erro: ${detail}. Podemos tentar de novo?` });
    }
}
