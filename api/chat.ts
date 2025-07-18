// @ts-nocheck
// Vercel irá lidar com os tipos para o pedido e a resposta.

import { GoogleGenAI, HarmBlockThreshold, HarmCategory } from "@google/genai"; 

// --- CAMINHOS FINAIS E MAIS FIÁVEIS PARA TIPOS (agora ao lado do chat.ts) ---
// Ambos os ficheiros 'chat.ts' e 'types.ts' estão agora em 'your-project-root/api/'
import type { UserInfo, Message } from './types.js'; // <-- Mudei para './types.js'
import { ChatMode, Sender } from './types.js';       // <-- E aqui!

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

// --- FUNÇÃO HANDLER PARA API DE VERCEL ---
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
            - NUNCA dês conselhos diretos. Em vez disso, faz perguntas abertas para ajudar o utilizador a explorar os seus próprios sentimentos
