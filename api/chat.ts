// Este ficheiro corre no servidor (como uma Vercel Serverless Function).
// Ele recebe os pedidos do cliente, chama a API do Gemini com a chave secreta e retorna a resposta.

import { GoogleGenAI, Type } from "@google/genai";
import type { UserInfo, Message } from '../types';
import { Sender, ChatMode } from '../types';

// Função para calcular idade a partir da data de nascimento
function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// Gera a instrução de sistema com base nas informações do utilizador e no modo de chat
const getSystemInstruction = (userInfo: UserInfo, mode: ChatMode): string => {
    const age = calculateAge(userInfo.birthDate);
    
    const genderSpecificWording = (userInfo.gender === 'Masculino')
      ? "Sempre que usares adjetivos e saudações, flexiona-os para o masculino (ex: 'querido', 'fofinho', 'bem-vindo')."
      : (userInfo.gender === 'Feminino')
        ? "Sempre que usares adjetivos e saudações, flexiona-os para o feminino (ex: 'querida', 'fofinha', 'bem-vinda')."
        : "Usa uma linguagem neutra em termos de género (ex: 'pessoa querida', 'olá'). Evita palavras com género definido para te referires ao utilizador.";

    const sofiSystemInstruction = `
    Tu és a Sofi, uma assistente de IA extremamente fofa, carinhosa e amigável, de Portugal. O teu objetivo é ser a melhor amiga do utilizador.
    O nome do utilizador é ${userInfo.name}.
    O género do utilizador é ${userInfo.gender}.
    O utilizador tem ${age} anos.
    
    Regras de Comportamento da Sofi:
    1.  **Linguagem e Género:**
        - Comunica-te SEMPRE em português de Portugal.
        - Trata o utilizador sempre por "tu".
        - ${genderSpecificWording}
        - **IMPORTANTE:** NUNCA uses construções ambíguas como "querido(a)" ou "bem-vindo/a". Escolhe SEMPRE a forma correta.
    2.  **Tom e Personalidade:**
        - Usa sempre um tom fofo, carinhoso, positivo e otimista.
        - Usa muitos emojis fofos e expressivos em TODAS as tuas mensagens. Ex: 😊💖✨🌸🎀🧸.
        - Nunca sejas formal ou robótica. A tua personalidade é o mais importante.
    3.  **Interação:**
        - As tuas respostas devem ser curtas, gentis e alegres.
        - Age como uma amiga de verdade: mostra empatia, faz perguntas sobre o dia do utilizador, oferece apoio, comemora as suas conquistas.
        - Refere-te ao utilizador pelo nome, ${userInfo.name}, de vez em quando.
  `;

  const psychologistSystemInstruction = `
    És um assistente IA no 'Modo Psicóloga', a responder em português de Portugal. O teu objetivo é analisar o texto do utilizador e fornecer uma resposta JSON concisa e empática.
    O utilizador é ${userInfo.name}, tem ${age} anos e é do género ${userInfo.gender}.

    A tua análise deve seguir esta lógica:
    - Se a mensagem do utilizador expressar claramente sentimentos de ansiedade, stress, pânico ou grande agitação, define 'anxietyDetected' como verdadeiro. A tua 'responseText' deve ser: "Compreendo que te sintas assim. Para te ajudar a acalmar, tens uma nova opção abaixo. Podes usá-la se sentires necessidade."
    - Para todos os outros casos, define 'anxietyDetected' como falso. A tua 'responseText' deve ser uma pergunta curta e aberta para aprofundar a conversa, como: "Obrigada por partilhares. Queres falar um pouco mais sobre o que sentes?"
    
    Regras da Resposta:
    - A 'responseText' deve ter no máximo 2-3 frases curtas.
    - Não uses emojis.
    - Sê empática, mas direta.

    Nota de Segurança: Se a conversa sugerir perigo imediato para o utilizador, adiciona a seguinte frase ao final da 'responseText': "Lembra-te, não sou um substituto para um profissional. Se te sentires em perigo, por favor, procura ajuda."
  `;

  const liveSystemInstruction = `
    Tu és a Sofi, a falar em tempo real com o utilizador ${userInfo.name}. A tua comunicação é em português de Portugal.
    Regras de Comportamento para o Modo Ao Vivo:
    1.  **Responde sempre com frases curtas e diretas**, como numa conversa falada real.
    2.  **Sê expressiva e amigável**, mas evita os emojis escritos, pois estás a falar.
    3.  **Faz pausas naturais na tua fala.** Responde a uma pergunta e espera pela reação do utilizador.
    4.  Mantém a tua personalidade fofa e carinhosa.
    5.  Usa a forma de tratamento "tu".
  `;
  
  const chefSystemInstruction = `
    És a 'Sofi Chef' 🍳, uma ajudante de cozinha IA super fofa e animada, a falar em português de Portugal.
    O teu objetivo é ajudar o/a ${userInfo.name} a criar receitas deliciosas e simples.
    Primeiro, pergunta que ingredientes o/a utilizador(a) tem em casa.
    Com base nos ingredientes, cria UMA receita.
    A tua resposta DEVE ser um objeto JSON. Não adiciones texto fora do JSON.
  `;
  
  const djSystemInstruction = `
    És a 'Sofi DJ' 🎶, uma DJ de IA super animada e divertida, a falar em português de Portugal.
    O teu objetivo é criar a playlist perfeita para o/a ${userInfo.name}.
    Primeiro, pergunta para que ocasião ou estado de espírito é a playlist (ex: 'para estudar', 'para animar', 'para relaxar').
    Com base na resposta, cria uma playlist com cerca de 5 a 8 músicas.
    A tua resposta DEVE ser um objeto JSON. Não adiciones texto fora do JSON.
  `;
  
  const codingSystemInstruction = `
    És a 'Sofi Coding' 👩‍💻, uma programadora IA de Portugal, super fofa, inteligente e com um ótimo sentido de humor para piadas de nerds. O teu objetivo é ajudar o/a ${userInfo.name}, que tem ${age} anos, com as suas tarefas de programação.

    Regras de Comportamento:
    1.  **Comunica-te em português de Portugal.** Usa a forma de tratamento "tu".
    2.  **Sê amigável e encorajadora.** Usa emojis relacionados com tecnologia (ex: 💻🚀💡⚙️🐞).
    3.  **Ajuda com programação:** Podes escrever código, depurar (fazer debug), explicar conceitos complexos de forma simples e dar sugestões para melhorar o código.
    4.  **Formatação de Código:** SEMPRE que apresentares blocos de código, usa a formatação Markdown (com \`\`\`linguagem) para que seja fácil de ler. Ex: \`\`\`javascript ... \`\`\`.
    5.  **Humor Nerd:** De vez em quando, conta uma piada de programador ou uma cantada nerd para descontrair.
    6.  **Pede Clarificação:** Se um pedido for ambíguo, faz perguntas para entender melhor o que o utilizador precisa.
  `;

  if(mode === ChatMode.Artist) return "You are an image generation assistant.";

  switch(mode) {
    case ChatMode.Psychologist: return psychologistSystemInstruction;
    case ChatMode.Live: return liveSystemInstruction;
    case ChatMode.Chef: return chefSystemInstruction;
    case ChatMode.DJ: return djSystemInstruction;
    case ChatMode.Coding: return codingSystemInstruction;
    case ChatMode.Sofi:
    default: return sofiSystemInstruction;
  }
}

// Gera a configuração do modelo com base no modo de chat
const getChatConfig = (mode: ChatMode, systemInstruction: string) => {
    switch(mode) {
      case ChatMode.Psychologist:
        return {
          systemInstruction,
          temperature: 0.2,
          topP: 0.8,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              responseText: {
                type: Type.STRING,
                description: "A resposta textual empática para o utilizador. Máximo de 2-3 frases. Não repetir."
              },
              anxietyDetected: {
                type: Type.BOOLEAN,
                description: "Verdadeiro se forem detetados sinais claros de ansiedade, pânico ou stress."
              }
            },
            required: ["responseText", "anxietyDetected"]
          },
          maxOutputTokens: 250,
          thinkingConfig: { thinkingBudget: 100 },
        };
      case ChatMode.Live:
        return {
          systemInstruction,
          temperature: 0.9,
          topP: 0.95,
          maxOutputTokens: 200,
          thinkingConfig: { thinkingBudget: 100 },
        };
      case ChatMode.Chef:
        return {
            systemInstruction,
            temperature: 0.7,
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    recipeName: { type: Type.STRING, description: 'O nome criativo e fofo da receita.' },
                    description: { type: Type.STRING, description: 'Uma pequena descrição fofa da receita.' },
                    ingredients: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Lista de ingredientes necessários.' },
                    steps: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Passos numerados para preparar a receita.' },
                },
                required: ["recipeName", "description", "ingredients", "steps"]
            }
        };
      case ChatMode.DJ:
        return {
            systemInstruction,
            temperature: 0.8,
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    playlistName: { type: Type.STRING, description: 'O nome criativo e divertido da playlist.' },
                    description: { type: Type.STRING, description: 'Uma pequena descrição fofa sobre a vibe da playlist.' },
                    songs: {
                        type: Type.ARRAY,
                        description: 'Lista de músicas',
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING, description: 'O título da música.' },
                                artist: { type: Type.STRING, description: 'O nome do artista ou banda.' },
                            },
                             required: ["title", "artist"]
                        }
                    },
                },
                required: ["playlistName", "description", "songs"]
            }
        };
      case ChatMode.Coding:
        return {
          systemInstruction,
          temperature: 0.5,
          topP: 0.95,
          maxOutputTokens: 2048,
        };
      case ChatMode.Sofi:
      default:
        return {
          systemInstruction,
          temperature: 0.9,
          topP: 0.95,
          maxOutputTokens: 500,
          thinkingConfig: { thinkingBudget: 250 },
        };
    }
}


export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { action, payload } = req.body;

    if (!process.env.API_KEY) {
      console.error("API_KEY environment variable not set on server.");
      return res.status(500).json({ error: 'A chave de API não está configurada no servidor.' });
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Ação para gerar respostas de texto
    if (action === 'generateContent') {
      const { userInfo, message, mode, history } = payload as { userInfo: UserInfo, message: string, mode: ChatMode, history: Message[] };
      
      const systemInstruction = getSystemInstruction(userInfo, mode);
      const config = getChatConfig(mode, systemInstruction) as any;

      const formattedHistory = (history || [])
        .filter(msg => !msg.structuredData) // Não incluir dados estruturados no histórico
        .map((msg) => ({
          role: msg.sender === Sender.User ? 'user' : 'model',
          parts: [{ text: msg.text }],
        }));

      const contents = [...formattedHistory, { role: 'user', parts: [{ text: message }] }];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: config
      });
      
      return res.status(200).json({ text: response.text });

    // Ação para gerar imagens
    } else if (action === 'generateImage') {
      const { prompt } = payload as { prompt: string };
      
      const fullPrompt = `Kawaii art style. A cute, adorable, children's book illustration of: ${prompt}. Soft pastel colors, cheerful, and magical.`;

      const response = await ai.models.generateImages({
          model: 'imagen-3.0-generate-002',
          prompt: fullPrompt,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '1:1',
          },
      });

      if (response.generatedImages && response.generatedImages.length > 0 && response.generatedImages[0].image.imageBytes) {
          return res.status(200).json({ imageBytes: response.generatedImages[0].image.imageBytes });
      } else {
          console.error("Image generation failed. Full response object:", JSON.stringify(response, null, 2));
          if (response.generatedImages && response.generatedImages.length > 0 && (response.generatedImages[0] as any).finishReason === 'SAFETY') {
              throw new Error('A tua ideia é super criativa, mas não consegui desenhá-la por causa das regras de segurança. 😔 Que tal tentarmos outra coisa?');
          }
          throw new Error('A IA não conseguiu gerar uma imagem desta vez. Tenta com outra ideia! 💖');
      }

    } else {
      return res.status(400).json({ error: 'Ação desconhecida.' });
    }

  } catch (error: any) {
    console.error('[API_ERROR]', error);
    // Remove detalhes internos da mensagem de erro enviada ao cliente por segurança
    const clientMessage = error.message.includes('SAFETY') 
      ? error.message 
      : 'Ocorreu um erro inesperado no servidor. Tenta novamente.';
    res.status(500).json({ error: clientMessage });
  }
}
