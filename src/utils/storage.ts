import { ExamRecord, AppSettings } from '../types';

const STORAGE_KEY_EXAMS = 'gabarito_exam_records_v1';
const STORAGE_KEY_SETTINGS = 'gabarito_settings_v1';

export const defaultSettings: AppSettings = {
  minPassingGrade: 6.0,
  recoveryGrade: 5.0,
  maxScoreDefault: 10.0,
  csvDelimiter: ';',
  defaultClassroom: 'Turma A',
  defaultSubject: 'Geral',
  continuousMode: true,
  soundEnabled: true,
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) {
      return { ...defaultSettings, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Erro ao carregar configurações:', e);
  }
  return defaultSettings;
}

export function saveSettings(settings: AppSettings) {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Erro ao salvar configurações:', e);
  }
}

export function loadExamRecords(): ExamRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EXAMS);
    if (raw) {
      const list: ExamRecord[] = JSON.parse(raw);
      return list.sort((a, b) =>
        a.studentName.localeCompare(b.studentName, 'pt-BR', { sensitivity: 'base' })
      );
    }
  } catch (e) {
    console.warn('Erro ao carregar provas:', e);
  }
  return [];
}

export function saveExamRecords(records: ExamRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY_EXAMS, JSON.stringify(records));
  } catch (e) {
    console.error('Erro ao salvar provas no localStorage:', e);
  }
}

// Compress image to a lightweight thumbnail for saving in localStorage without hitting 5MB quota
export async function createThumbnail(base64Image: string, maxWidth = 320, maxHeight = 400): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
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
      // Return compressed JPEG
      resolve(canvas.toDataURL('image/jpeg', 0.65));
    };
    img.onerror = () => resolve(base64Image);
    img.src = base64Image;
  });
}
