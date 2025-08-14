import type { UserInfo, Message } from '../types';
import { ChatMode } from '../types';

/**
 * Função auxiliar para lidar com as respostas da API.
 * Verifica se a resposta foi bem-sucedida e, em caso de erro, tenta extrair uma mensagem de erro do corpo da resposta.
 * @param response A resposta do fetch.
 * @returns Os dados JSON da resposta.
 */
async function handleApiResponse(response: Response) {
    const contentType = response.headers.get("content-type");
    if (!response.ok) {
        let errorData = { error: `Erro ${response.status}: ${response.statusText}` };
        if (contentType && contentType.includes("application/json")) {
            // Tenta ler o corpo do erro como JSON
            const errorJson = await response.json().catch(() => null);
            if (errorJson && errorJson.error) {
                errorData.error = errorJson.error;
            }
        }
        throw new Error(errorData.error);
    }
    // Se a resposta for OK, mas não tiver corpo (ex: 204 No Content), retorna um objeto vazio.
    if (response.status === 204 || !contentType || !contentType.includes("application/json")) {
        return {};
    }
    return response.json();
}

/**
 * Envia uma mensagem para o backend para obter uma resposta da IA.
 * @param userInfo Informações do utilizador.
 * @param message A mensagem do utilizador.
 * @param mode O modo de chat atual.
 * @param history O histórico da conversa.
 * @returns A resposta de texto da IA.
 */
export const generateSofiResponse = async (
    userInfo: UserInfo, 
    message: string, 
    mode: ChatMode, 
    history: Message[]
): Promise<string> => {
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'generateContent',
            payload: { userInfo, message, mode, history }
        }),
    });

    const data = await handleApiResponse(response);
    if (typeof data.text !== 'string') {
        throw new Error("A resposta do servidor foi inválida.");
    }
    return data.text;
}

/**
 * Envia um prompt para o backend para gerar uma imagem.
 * @param prompt O prompt de texto para a imagem.
 * @returns A string base64 da imagem gerada.
 */
export const generateSofiImage = async (prompt: string): Promise<string> => {
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'generateImage',
            payload: { prompt }
        }),
    });

    const data = await handleApiResponse(response);
    if (typeof data.imageBytes !== 'string') {
        throw new Error("A resposta do servidor não continha a imagem.");
    }
    return data.imageBytes;
}
