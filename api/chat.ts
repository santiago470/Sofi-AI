// @ts-nocheck
// Importa os tipos necessários da tua pasta 'types'
// Certifica-te de que o caminho está correto consoante a tua estrutura de ficheiros.
import { ChatMode, Message, Sender, UserInfo } from './types'; 

// O endpoint da tua API na Vercel. 
// Geralmente é '/api/nome_do_teu_ficheiro_da_api' se estiver em 'pages/api/' ou 'app/api/'.
const API_ENDPOINT = '/api/chat'; 

/**
 * Envia uma mensagem do utilizador para a API da Sofi e recebe a resposta da IA.
 * Esta função trata a comunicação HTTP e a formatação dos dados.
 *
 * @param {string} newMessageText - O texto da mensagem que o utilizador acabou de enviar.
 * @param {ChatMode} currentMode - O modo de chat atual da Sofi (ex: 'cute' para fofa, 'psychologist' para psicóloga).
 * @param {UserInfo} userInfo - Um objeto com as informações do utilizador (p.ex., { name: "João" }).
 * @param {Message[]} chatHistory - Um array com todas as mensagens anteriores do chat (tanto do utilizador como da Sofi).
 * @returns {Promise<Message>} Uma Promise que resolve para um objeto Message contendo a resposta da Sofi.
 * @throws {Error} Lança um erro se houver falha na comunicação com a API ou se a resposta for inválida.
 */
export const sendMessageToSofi = async (
  newMessageText: string,
  currentMode: ChatMode,
  userInfo: UserInfo,
  chatHistory: Message[]
): Promise<Message> => {
  try {
    // Realiza a requisição POST para o endpoint da tua API
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Converte os dados para JSON e envia no corpo da requisição
      body: JSON.stringify({
        message: newMessageText,
        mode: currentMode,
        userInfo: userInfo,
        history: chatHistory, // Passa o histórico completo para a API manter o contexto
      }),
    });

    // Verifica se a resposta da rede foi bem-sucedida (status 2xx)
