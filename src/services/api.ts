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

export async function scanExamApi(
  imageBase64: string,
  hints?: { classroom?: string; subject?: string; maxScore?: number }
): Promise<ScanApiResponse['data']> {
  const response = await fetch('/api/scan-exam', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageBase64,
      classroomHint: hints?.classroom,
      subjectHint: hints?.subject,
      maxScoreDefault: hints?.maxScore || 10,
    }),
  });

  const json = await response.json();

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

    // Gentle camera snap click
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
    // Audio might be blocked by autoplay policy until interaction
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
