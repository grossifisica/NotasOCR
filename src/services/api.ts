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
 * Optimizes high-resolution smartphone photos (e.g. 12MP/48MP) to ~1200px max
 * before uploading. This avoids Vercel's strict 4.5MB Serverless Function payload limit,
 * speeds up upload by 10x, and ensures Gemini Vision processes the exam in 1-3 seconds.
 */
export async function optimizeImageForUpload(
  base64Image: string,
  maxDimension = 1200,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve) => {
    // If it's already a tiny string or not a data URL, resolve immediately
    if (!base64Image || base64Image.length < 300000) {
      resolve(base64Image);
      return;
    }

    // Safety timeout: if image decoding or canvas takes longer than 2.5s, resolve with original
    const timeout = setTimeout(() => {
      resolve(base64Image);
    }, 2500);

    try {
      const img = new Image();
      // DO NOT set crossOrigin on data: URLs as WebKit/Safari can fail or hang silently
      img.onload = () => {
        clearTimeout(timeout);
        try {
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
        } catch (e) {
          resolve(base64Image);
        }
      };

      img.onerror = () => {
        clearTimeout(timeout);
        resolve(base64Image);
      };

      img.src = base64Image;
    } catch (err) {
      clearTimeout(timeout);
      resolve(base64Image);
    }
  });
}

export async function scanExamApi(
  imageBase64: string,
  hints?: { classroom?: string; subject?: string; maxScore?: number }
): Promise<ScanApiResponse['data']> {
  // Pre-optimize image to prevent 413 Payload Too Large and speed up mobile uploads
  const optimizedImage = await optimizeImageForUpload(imageBase64);

  // Detect mime type from data URL prefix
  const detectedMime =
    optimizedImage.match(/^data:([^;]+);base64,/)?.[1] || 'image/jpeg';

  // 45-second AbortController to guarantee fetch never hangs indefinitely
  const controller = new AbortController();
  const fetchTimeout = setTimeout(() => controller.abort(), 45000);

  let response: Response;
  try {
    response = await fetch('/api/scan-exam', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        imageBase64: optimizedImage,
        mimeType: detectedMime,
        classroomHint: hints?.classroom,
        subjectHint: hints?.subject,
        maxScoreDefault: hints?.maxScore || 10,
      }),
    });
  } catch (netErr: any) {
    clearTimeout(fetchTimeout);
    if (netErr.name === 'AbortError') {
      throw new Error('A análise demorou mais de 45 segundos e expirou. Tente reenviar a foto.');
    }
    throw new Error('Falha de conexão com o servidor. Verifique sua conexão com a internet.');
  } finally {
    clearTimeout(fetchTimeout);
  }

  // Read response as text first to safely prevent "Unexpected token 'T', The page is not valid JSON"
  const rawText = await response.text();

  let json: any = null;
  try {
    json = JSON.parse(rawText);
  } catch (parseErr) {
    if (response.status === 404) {
      throw new Error(
        'Rota /api/scan-exam não encontrada na Vercel (404). Verifique se o arquivo /api/scan-exam.ts está no repositório.'
      );
    }
    if (response.status === 413) {
      throw new Error(
        'A imagem excedeu o limite de envio da Vercel (413 Payload Too Large). Envie fotos menores.'
      );
    }
    if (response.status === 504) {
      throw new Error('A Vercel encerrou a requisição por tempo limite (504 Gateway Timeout).');
    }
    if (rawText.toLowerCase().includes('the page') || rawText.includes('<!DOCTYPE') || rawText.includes('<html')) {
      throw new Error(
        `Erro na Vercel (${response.status}): Verifique se a variável GEMINI_API_KEY está configurada no painel da Vercel.`
      );
    }
    throw new Error(`Resposta inesperada do servidor (${response.status}): ${rawText.slice(0, 100)}`);
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
