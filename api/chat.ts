// @ts-nocheck
// Vercel irá lidar com os tipos para o pedido e a resposta.

// Importa NextRequest e NextResponse do Next.js para lidar com requisições e respostas no App Router.
import { NextRequest, NextResponse } from 'next/server';
// Importa a biblioteca Google Generative AI e os tipos de segurança.
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";

// --- CORREÇÃO DE ERRO 1: Caminho do 'types' ---
// O caminho correto para importar de 'src/lib/types.ts' a partir de 'src/app/api/chat/route.ts'
import { ChatMode, Message, Sender, UserInfo } from "../../../../lib/types"; // <-- CORRIGIDO AQUI!

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

// --- FUNÇÃO HANDLER DO APP ROUTER (POST) ---
// Esta é a função que o Next.js App Router espera para lidar com requisições POST.
export async function POST(req: NextRequest) {
    try {
        // As requisições no App Router são lidas com req.json()
        const { userInfo, message, mode, history = [] } = await req.json();

        if (!userInfo || !message || !mode) {
            return NextResponse.json({ error: 'Faltam campos obrigatórios: userInfo, message, mode.' }, { status: 400 });
        }
        
        if (!process.env.API_KEY) {
            return NextResponse.json({ error: 'Erro de configuração: A chave da API (API_KEY) não foi encontrada no ambiente do servidor. Por favor, define-a nas variáveis de ambiente da Vercel.' }, { status: 500 });
        }
        
        const ai = new GoogleGenerativeAI(process.env.API_KEY);
        
        let systemInstruction = '';
        const config: { [key: string]: any } = { 
            temperature: 0.9, 
            topP: 0.95,
            safetySettings: [ // Adicionado para mitigar bloqueios de segurança
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

        let modelName = 'gemini-1.5-flash'; // Modelo padrão

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
            modelName = 'gemini-1.5-pro'; // Modelo mais adequado para psicóloga
        } else { // Sofi Fofa (e Live, se houver)
            systemInstruction = `INSTRUÇÕES DO SISTEMA: És a Sofi,
