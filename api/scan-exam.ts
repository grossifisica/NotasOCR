import { GoogleGenAI, Type } from '@google/genai';

// Schema for structured exam reading
const examExtractionSchema = {
  type: Type.OBJECT,
  properties: {
    studentName: {
      type: Type.STRING,
      description: 'Nome completo ou legível do aluno identificado na prova ou cabeçalho. Se não encontrar, retorne "Não identificado".',
    },
    score: {
      type: Type.NUMBER,
      description: 'Nota obtida pelo aluno na prova (número decimal, ex: 8.5, 7.0, 10.0, 4.0). Se estiver em pontos (ex: 18/20), converta para a nota final ou registre o valor atribuído.',
    },
    maxScore: {
      type: Type.NUMBER,
      description: 'Nota máxima ou valor total da prova (geralmente 10.0 ou 100). Se não indicado, assuma 10.0.',
    },
    subject: {
      type: Type.STRING,
      description: 'Disciplina ou matéria da prova (ex: Matemática, Português, História, Ciências, Física, etc.). Se não encontrada, "Geral".',
    },
    classroom: {
      type: Type.STRING,
      description: 'Turma, série ou classe do aluno se indicada no cabeçalho (ex: 7º Ano A, 3º B, 9º Ano).',
    },
    examDate: {
      type: Type.STRING,
      description: 'Data da prova caso informada (ex: DD/MM/AAAA).',
    },
    confidence: {
      type: Type.STRING,
      description: 'Nível de confiança da leitura: "alta", "media" ou "baixa".',
    },
    observations: {
      type: Type.STRING,
      description: 'Breve observação sobre a nota, rasuras, ou detalhe importante encontrado na folha.',
    },
  },
  required: ['studentName', 'score', 'maxScore'],
};

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: any, res: any) {
  // Enable CORS if accessed from different origins
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', hasKey: !!process.env.GEMINI_API_KEY });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error:
          'Chave GEMINI_API_KEY não configurada na Vercel! Vá em Project Settings > Environment Variables na Vercel e adicione GEMINI_API_KEY.',
      });
    }

    const { imageBase64, mimeType = 'image/jpeg', classroomHint, subjectHint, maxScoreDefault = 10 } =
      typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

    if (!imageBase64) {
      return res.status(400).json({ error: 'Nenhuma imagem foi enviada.' });
    }

    // Strip data URL prefix
    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const promptText = `
Você é um assistente especialista em leitura e correção de provas e avaliações escolares.
Analise a imagem da prova/folha de respostas e extraia com máxima precisão:
1. O Nome do Aluno (procure por campos como "Aluno:", "Nome:", "Estudante:", cabeçalhos ou assinaturas).
2. A Nota ou Pontuação final do aluno (procure por "Nota:", "Nota Final:", "Pontuação:", carimbos, anotações de caneta vermelha, círculos com número, etc.).
   Se a nota for expressa com vírgula (ex: 8,5), retorne o número 8.5.
   Se a nota não for encontrada diretamente na folha, analise se há contagem de acertos (ex: 7/10 acertos = 7.0).
3. Matéria/Disciplina (ex: Matemática, História) e Turma/Série se visíveis.
${classroomHint ? `Dica da turma informada pelo professor: "${classroomHint}".` : ''}
${subjectHint ? `Dica da disciplina informada pelo professor: "${subjectHint}".` : ''}
${maxScoreDefault ? `Nota máxima padrão: ${maxScoreDefault}.` : ''}

Retorne exclusivamente os dados no formato estruturado solicitado.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: base64Data,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        systemInstruction:
          'Você é um leitor óptico e analisador inteligente de provas escolares em português. Seja extremamente acurado ao ler nomes e números manuscritos ou impressos.',
        responseMimeType: 'application/json',
        responseSchema: examExtractionSchema,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Nenhuma resposta recebida do modelo.');
    }

    const parsed = JSON.parse(text);
    return res.status(200).json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Erro na função serverless da Vercel:', error);
    return res.status(500).json({
      error: error?.message || 'Erro interno ao processar a foto da prova.',
    });
  }
}
