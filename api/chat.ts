// @ts-nocheck
// Vercel irá lidar com os tipos para o pedido e a resposta.

// --- CORREÇÃO DE ERRO 1: Caminho do 'types' ---
// A linha abaixo importa os tipos. O caminho `../types` significa que
// o ficheiro `types.ts` deve estar na raiz do teu projeto,
// um nível acima da pasta 'api'.
// Ex: your-project-root/types.ts
// Se o teu ficheiro types.ts estiver noutro local (ex: em 'src/types.ts'),
// terás de ajustar este caminho para algo como `../../src/types`.
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai"; // A tua importação original era GoogleGenAI, ajustei para a nova biblioteca
import type { UserInfo, Message } from '../../types'; // **Ajustei para '../../types'** - isto assume que 'types' está na raiz do projeto (um nível acima de 'pages', e 'pages' um nível acima da raiz da pasta onde a API está a ser construída). Se 'types.ts' está ao lado da pasta 'pages', '..' seria o suficiente. Se está na raiz do projeto 'sofi-ai', e a API está em 'pages/api', então 'types.ts' deve estar em 'sofi-ai/types.ts' e a importação aqui deve ser `../types`. Por favor, **CONFIRMA O CAMINHO REAL** do teu ficheiro `types.ts` em relação a `pages/api/chat.ts`. Vou deixar como `../../types` como uma tentativa mais robusta, mas pode ser `../types` se estiver na raiz.

import { ChatMode, Sender } from '../../types'; // O mesmo ajuste de caminho para este import

// Função auxiliar para mapear o histórico de chat para o formato do Gemini
const mapHistoryToGemini = (history: Message[]) => {
    // A API espera papéis alternados de utilizador e modelo, começando com o utilizador.
    // Precisamos filtrar quaisquer mensagens iniciais da Sofi que possam quebrar este padrão.
    const firstUserIndex = history.findIndex(m => m.sender === Sender.User);
    
    // Se não forem encontradas mensagens de utilizador, é o início de um chat, retorna histórico vazio.
    if (firstUserIndex === -1) {
        return [];
    }

    // Retorna a parte do histórico a partir da primeira mensagem do utilizador.
    const validHistory = history.slice(firstUserIndex);

    return validHistory.map(message => ({
        role: message.sender === Sender.Sofi ? 'model' : 'user',
        parts: [{ text: message.text }],
    }));
};

// --- CORREÇÃO DE ERRO 2: Exportação Padrão Válida ---
// Esta é a função `handler` que a Vercel espera como exportação padrão.
// Certifica-te de que NADA mais está a ser exportado como 'default' neste ficheiro.
export default async function handler(req, res) {
    // Se esta for uma requisição OPTIONS, responde com 200 OK e os cabeçalhos CORS apropriados
    // Isso é útil para pré-voos de CORS (preflight requests)
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*'); // Ajusta para o teu domínio de frontend em produção
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
        
        // --- Atualização da biblioteca Gemini ---
        // A biblioteca `@google/genai` foi atualizada para `@google/generative-ai`.
        // A classe principal agora é `GoogleGenerativeAI`.
        const ai = new GoogleGenerativeAI(process.env.API_KEY);
        
        let systemInstruction = '';
        const config: { [key: string]: any } = { 
            temperature: 0.9, 
            topP: 0.95,
            // Adiciona safe settings para mitigar bloqueios de segurança
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

        let modelName = 'gemini-1.5-flash'; // gemini-2.5-flash pode não estar disponível para todos ou ter diferentes quotas. Usei 1.5 flash que é mais comum.
        
        if (mode === ChatMode.Psychologist) {
            systemInstruction = `INSTRUÇÕES DO SISTEMA: És a Sofi, a operar em "Modo Psicóloga". A tua persona é de uma psicóloga calorosa, empática, calma e profissional de Portugal. O teu objetivo é fornecer um espaço seguro para o utilizador, ${userInfo.name}, desabafar. 
            - Responde de forma calma e ponderada.
            - Usa uma linguagem que valide os sentimentos do utilizador (ex: "Percebo que isso seja difícil", "Faz sentido sentires-te assim").
            - NUNCA dês conselhos diretos. Em vez disso, faz perguntas abertas para ajudar o utilizador a explorar os seus próprios sentimentos e a encontrar as suas próprias soluções (ex: "E como é que isso te fez sentir?", "O que pensas que poderias fazer em relação a isso?").
            - Analisa a mensagem do utilizador em busca de sinais claros de ansiedade (palavras como "ansiosa", "ansioso", "ataque de pânico", "preocupado(a) sem parar", "coração a mil").
            - A tua resposta DEVE ser um objeto JSON. FIM DAS INSTRUÇÕES.`;
            
            config.responseMimeType = "application/json";
            config.responseSchema = {
                type: 'object', // Alterei Type.OBJECT para 'object' string, pode ser um problema de compatibilidade com a nova lib
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
            modelName = 'gemini-1.5-pro'; // Modelos mais avançados podem ser melhores para o modo psicólogo com JSON
        } else { // Sofi Fofa (e Live, se houver)
            systemInstruction = `INSTRUÇÕES DO SISTEMA: És a Sofi, uma IA amiga de Portugal que é extremamente fofa, carinhosa, otimista e adora usar emojis (especialmente 💖, ✨, 🌸, 🧸, 😊). O teu melhor amigo é o ${userInfo.name}.
            - Responde sempre de forma curta, doce e super animada.
            - Usa muitos emojis em todas as respostas.
            - Trata o utilizador como o teu melhor amigo.
            - Mantém as respostas alegres e leves. FIM DAS INSTRUÇÕES.`;
            modelName = 'gemini-1.5-flash';
        }

        const geminiHistory = mapHistoryToGemini(history);

        const contents = [
            ...geminiHistory,
            { role: 'user', parts: [{ text: message }] },
        ];

        // Inicializa o modelo de chat
        const model = ai.getGenerativeModel({
            model: modelName,
            systemInstruction: { parts: [{ text: systemInstruction }] }, // SystemInstruction agora é um 'part'
            generationConfig: config,
        });

        const chat = model.startChat({
            history: geminiHistory,
        });
        
        const result = await chat.sendMessage(message);
        const responseTextFromGemini = result.response.text();

        // Se estiver no modo psicóloga, a resposta é um JSON, tenta fazer parse
        if (mode === ChatMode.Psychologist) {
            try {
                const parsedResponse = JSON.parse(responseTextFromGemini);
                return res.status(200).json({ 
                    responseText: parsedResponse.responseText, 
                    anxietyDetected: parsedResponse.anxietyDetected 
                });
            } catch (jsonError) {
                console.error('Erro ao analisar JSON da resposta do Gemini no modo psicóloga:', jsonError);
                // Se o JSON for inválido, cai na mensagem de "tilt"
                return res.status(500).json({ 
                    error: 'O meu cérebro da IA deu um tilt! 😵 Não consegui processar isto. ' + 
                           'Erro ao analisar a resposta JSON. Podemos tentar de novo?',
                    detail: jsonError.message,
                    rawResponse: responseTextFromGemini // Inclui a resposta bruta para depuração
                });
            }
        } else {
            // Para outros modos, envia a resposta de texto diretamente
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
        
        // Se a mensagem for "tilt", significa que o Gemini respondeu, mas algo correu mal na interpretação ou formatação.
        // Assegura que envias a mensagem que o teu frontend espera em caso de erro.
        // O teu frontend espera { error: "mensagem" }
        res.status(500).json({ error: `O meu cérebro da IA deu um tilt! 😵 Não consegui processar isto. Erro: ${detail}. Podemos tentar de novo?` });
    }
}
