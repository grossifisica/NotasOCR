import express, { Request, Response } from 'express';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// High payload limit for high-resolution mobile camera pictures
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Shared Gemini client setup
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Chave GEMINI_API_KEY não configurada no servidor.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Exam scan schema definition
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

// Healthcheck endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', hasKey: !!process.env.GEMINI_API_KEY });
});

const waitMs = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function callGeminiWithFallback(ai: GoogleGenAI, contents: any) {
  const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const isLite = model.includes('lite');
        const config: any = {
          systemInstruction:
            'Você é um leitor óptico e analisador inteligente de provas escolares em português. Seja extremamente rápido e preciso ao ler o nome do aluno e a nota atribuída na prova.',
          responseMimeType: 'application/json',
          responseSchema: examExtractionSchema,
        };

        if (!isLite) {
          config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
        }

        const response = await ai.models.generateContent({
          model,
          contents,
          config,
        });

        if (response.text) {
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = String(err?.message || '');
        const isTemporary =
          errMsg.includes('503') ||
          errMsg.includes('high demand') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('429');

        if (isTemporary && attempt < 2) {
          await waitMs(500);
          continue;
        }
        break;
      }
    }
  }

  throw lastError || new Error('Servidores de IA temporariamente indisponíveis.');
}

// Endpoint to scan a single exam picture
app.post('/api/scan-exam', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', classroomHint, subjectHint, maxScoreDefault = 10 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Nenhuma imagem foi enviada.' });
    }

    // Strip data URL prefix if present
    const base64Data = imageBase64.includes(',') 
      ? imageBase64.split(',')[1] 
      : imageBase64;

    const ai = getGeminiClient();

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

    const contents = {
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
    };

    const text = await callGeminiWithFallback(ai, contents);
    let cleanJson = (text || '').trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }
    const parsed = JSON.parse(cleanJson);
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Erro ao analisar prova com Gemini:', error);
    const errorMessage = error?.message || 'Erro desconhecido ao processar prova';
    const is503 = errorMessage.includes('503') || errorMessage.includes('high demand') || errorMessage.includes('UNAVAILABLE');
    return res.status(is503 ? 503 : 500).json({ 
      error: is503 
        ? 'Os servidores do Gemini estão com alta demanda temporária. O aplicativo tentou reconectar automaticamente. Aguarde alguns instantes e tente novamente.' 
        : errorMessage 
    });
  }
});

// Configure Vite integration or static serving
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve dist folder
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
