// @ts-nocheck - Vercel will handle the types for the request and response.
import { GoogleGenAI } from "@google/genai";
import type { UserInfo, Message } from '../types';
import { ChatMode, Sender } from '../types';

/**
 * DEBUGGING VERSION
 * This file has been simplified to isolate the API connection issue.
 * It temporarily disables the complex logic for different chat modes.
 * The goal is to get a successful response from the Gemini API.
 * Once successful, the previous logic can be restored.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { message, userInfo } = req.body;

    if (!message || !userInfo) {
      return res.status(400).json({ error: 'Faltam campos obrigatórios: userInfo, message.' });
    }

    if (!process.env.API_KEY) {
      return res.status(500).json({ error: 'Erro de configuração: A chave da API (API_KEY) não foi encontrada no ambiente do servidor. Por favor, configure-a nas "Environment Variables" da Vercel.' });
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // For this test, we ignore history and system instructions to isolate the problem.
    // We send a simple prompt that includes Sofi's personality.
    const simplePrompt = `Tu és a Sofi, uma IA extremamente fofa e carinhosa de Portugal. Responde à mensagem do utilizador de forma curta, gentil e com emojis. O nome do utilizador é ${userInfo.name}. A mensagem dele é: "${message}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: simplePrompt,
      config: {
        temperature: 0.9,
        topP: 0.95,
      }
    });

    // If we get here, it means the API call was successful!
    res.status(200).json({ text: response.text });

  } catch (error) {
    console.error('DEBUG: Erro na API do Gemini:', error);
    
    // Provide a very detailed error message to the front-end to help the user.
    let detail = 'Ocorreu um erro desconhecido.';
    if (error instanceof Error) {
        detail = error.message;
        
        // Check for common, user-fixable errors and provide clear instructions.
        if (error.message.includes('API key not valid') || error.message.includes('API_KEY_INVALID')) {
            detail = 'A chave da API fornecida não é válida. Por favor, verifica a chave no painel da Vercel. Ela deve começar com "AIza..." e não ter espaços. Depois de corrigir, faz um novo deploy.';
        } else if (error.message.includes('permission_denied') || error.message.includes('PERMISSION_DENIED')) {
            detail = 'Permissão negada. Isto pode acontecer por algumas razões: 1) A API "Generative Language" (ou "Vertex AI") não está ativada no teu projeto Google Cloud. 2) A tua conta Google Cloud não tem um método de pagamento associado (isto é necessário mesmo para usar o nível gratuito).';
        } else if (error.message.includes('Billing account not configured')) {
            detail = 'A conta de faturação não está configurada no teu projeto Google Cloud. É necessário associar um método de pagamento para usar a API do Gemini, mesmo que estejas dentro do limite gratuito.';
        } else if (error.message.includes('location is not supported')){
             detail = 'A tua região (ou a região do servidor Vercel) não é suportada pela API do Gemini neste momento.';
        }
    } else {
        detail = JSON.stringify(error);
    }
    
    // Send the detailed, user-friendly error back to the chat interface.
    res.status(500).json({ error: `Ocorreu um erro ao comunicar com a IA. Detalhe do problema: ${detail}` });
  }
}
