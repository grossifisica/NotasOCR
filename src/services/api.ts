import { ExamRecord } from '../types';

export interface ScanApiResponse {
  success: boolean;
  data: {
    studentName: string;
    score: number;
    maxScore: number;
    subject?: string;
    classroom?: string;
    examDate?: string;
    confidence?: 'alta' | 'media' | 'baixa';
    observations?: string;
  };
  error?: string;
}

/**
 * Optimizes high-resolution smartphone photos (e.g. 12MP/48MP) to ~1600px max
 * before uploading. This avoids Vercel's strict 4.5MB Serverless Function payload limit
 * and speeds up processing significantly while maintaining crystal-clear OCR text clarity.
 */
export async function optimizeImageForUpload(
  base64Image: string,
  maxDimension = 1600,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve) => {
    // If it's already a small string, don't reprocess
    if (base64Image.length < 500000) {
      resolve(base64Image);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let { width, height } = img;

      if (width <= maxDimension && height <= maxDimension) {
        resolve(base64Image);
        return;
      }

      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Image);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64Image);
    img.src = base64Image;
  });
}

export async function scanExamApi(
  imageBase64: string,
  hints?: { classroom?: string; subject?: string; maxScore?: number }
): Promise<ScanApiResponse['data']> {
  // Pre-optimize image to prevent 413 Payload Too Large on Vercel
  const optimizedImage = await optimizeImageForUpload(imageBase64);

  let response: Response;
  try {
    response = await fetch('/api/scan-exam', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64: optimizedImage,
        classroomHint: hints?.classroom,
        subjectHint: hints?.subject,
        maxScoreDefault: hints?.maxScore || 10,
      }),
    });
  } catch (netErr: any) {
    throw new Error('Falha de conexão com o servidor. Verifique sua internet.');
  }

  // Read response as text first to safely prevent "Unexpected token 'T', The page is not valid JSON"
  const rawText = await response.text();

  let json: any = null;
  try {
    json = JSON.parse(rawText);
  } catch (parseErr) {
    // If Vercel returned an HTML error page (e.g. 404, 413, 500, or timeout)
    if (response.status === 404) {
      throw new Error(
        'Rota /api/scan-exam não encontrada na Vercel (404). Verifique se o arquivo /api/scan-exam.ts foi publicado e se o vercel.json está configurado.'
      );
    }
    if (response.status === 413) {
      throw new Error(
        'A imagem excedeu o limite de envio da Vercel (413 Payload Too Large). Tente enviar fotos menores ou uma por vez.'
      );
    }
    if (response.status === 504) {
      throw new Error('A requisição expirou na Vercel (504 Gateway Timeout).');
    }
    if (rawText.toLowerCase().includes('the page') || rawText.includes('<!DOCTYPE') || rawText.includes('<html')) {
      throw new Error(
        `Erro retornado pela Vercel (${response.status}): Verifique se a variável GEMINI_API_KEY está configurada no painel da Vercel (Settings > Environment Variables).`
      );
    }
    throw new Error(`Resposta inválida do servidor (${response.status}): ${rawText.slice(0, 100)}`);
  }

  if (!response.ok || !json.success) {
    throw new Error(json.error || `Erro HTTP ${response.status} ao analisar prova.`);
  }

  return json.data;
}

// Audio & Haptic feedback utilities for smartphone interactions
export function triggerHaptic(duration = 40) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(duration);
    } catch (e) {
      // Ignore if not permitted
    }
  }
}

let audioCtx: AudioContext | null = null;
export function playShutterSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.09);
  } catch (e) {
    // Ignore
  }
}

export function playSuccessSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08); // A5

    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.26);
  } catch (e) {
    // Ignore
  }
}
