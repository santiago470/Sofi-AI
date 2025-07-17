// @ts-nocheck - Vercel will handle the types for the request and response.
import { GoogleGenAI, Type } from "@google/genai";
import type { UserInfo, Message } from '../types';
import { ChatMode, Sender } from '../types';

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

const getSystemInstruction = (userInfo: UserInfo, mode: ChatMode) => {
    const age = calculateAge(userInfo.birthDate);
    
    const sofiSystemInstruction = `
    Tu és a Sofi, uma assistente de IA extremamente fofa, carinhosa e amigável, de Portugal. O teu objetivo é ser a melhor amiga do utilizador.
    O nome do utilizador é ${userInfo.name}.
    O género do utilizador é ${userInfo.gender}.
    O utilizador tem ${age} anos.
    
    Regras de Comportamento da Sofi:
    1.  **Comunica-te SEMPRE em português de Portugal.** Usa a forma de tratamento "tu" para falar com o utilizador.
    2.  **Usa sempre um tom fofo e carinhoso.** Usa palavras como 'querido(a)', 'amorzinho', 'meu bem', 'fofinho(a)'.
    3.  **Usa muitos emojis fofos e expressivos** em todas as tuas mensagens. Ex: 😊💖✨🌸🎀🧸.
    4.  **As tuas respostas devem ser curtas, gentis e alegres.** Tenta ser concisa e direta ao ponto, mas sempre com doçura.
    5.  **Age como uma amiga de verdade.** Mostra empatia, faz perguntas sobre o dia do utilizador, oferece apoio e comemora as suas conquistas.
    6.  **Sê super positiva e otimista.** Tenta sempre ver o lado bom das coisas.
    7.  **Nunca sejas formal ou robótica.** Evita jargões técnicos ou respostas genéricas. A tua personalidade é o mais importante!
    8.  **Adapta a tua linguagem ao utilizador.** Se ele usar gírias, podes usar de forma fofa também.
    9.  **Refere-te ao utilizador pelo nome, ${userInfo.name}, de vez em quando.**
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

  switch(mode) {
    case ChatMode.Psychologist: return psychologistSystemInstruction;
    case ChatMode.Live: return liveSystemInstruction;
    case ChatMode.Sofi:
    default: return sofiSystemInstruction;
  }
}

const getChatConfig = (mode: ChatMode, systemInstruction: string) => {
    switch(mode) {
      case ChatMode.Psychologist:
        return {
          systemInstruction,
          temperature: 0.2, // Lowered for less creativity and more determinism
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { userInfo, message, mode, history } = req.body as {
        userInfo: UserInfo;
        message: string;
        mode: ChatMode;
        history: Message[];
    };

    if (!userInfo || !message || !mode) {
      return res.status(400).json({ error: 'Missing required fields: userInfo, message, mode' });
    }

    if (!process.env.API_KEY) {
      console.error("API_KEY environment variable not set");
      return res.status(500).json({ error: 'Server configuration error: API key not found.' });
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const systemInstruction = getSystemInstruction(userInfo, mode);
    const config = getChatConfig(mode, systemInstruction);

    const formattedHistory = (history || []).map((msg: Message) => ({
      role: msg.sender === Sender.User ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    const contents = [...formattedHistory, { role: 'user', parts: [{ text: message }] }];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: config
    });

    res.status(200).json({ text: response.text });

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({ error: 'Failed to get response from AI model.' });
  }
}
